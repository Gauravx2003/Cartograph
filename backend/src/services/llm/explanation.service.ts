import { prisma } from '../../db/client.js';
import { Project, SyntaxKind } from 'ts-morph';
import * as path from 'path';
import { GoogleGenAI } from '@google/genai';
import type { FileScore } from '../../generated/prisma/client.js'

const EXPLANATION_LIMIT = 5;

function extractAstSignals(repoPath: string, relativeFilePath: string): string {
  try {
    const project = new Project();
    const absolutePath = path.join(repoPath, relativeFilePath);
    const sourceFile = project.addSourceFileAtPathIfExists(absolutePath);
    
    if (!sourceFile) {
      return 'AST signals unavailable (file could not be parsed).';
    }

    let signals = '';

    // 1. Imports
    const imports = sourceFile.getImportDeclarations().map(i => i.getModuleSpecifierValue());
    if (imports.length > 0) {
      signals += `Imports: ${imports.join(', ')}\n`;
    }

    // 2. Exports
    const exports: string[] = [];
    for (const [name, declarations] of sourceFile.getExportedDeclarations()) {
      exports.push(name);
    }
    if (exports.length > 0) {
      signals += `Exports: ${exports.join(', ')}\n`;
    }

    // 3. Top-level JSDoc/Comments
    const comments = sourceFile.getStatements().flatMap(stmt => 
      stmt.getLeadingCommentRanges().map(c => c.getText())
    );
    // Dedup and take first few to avoid exploding the prompt size
    const uniqueComments = [...new Set(comments)].slice(0, 3).join('\n');
    if (uniqueComments) {
      signals += `Top-level Comments:\n${uniqueComments}\n`;
    }

    return signals || 'No notable structural signals found (no imports, exports, or comments).';
  } catch (error) {
    console.error(`Failed to extract AST signals for ${relativeFilePath}:`, error);
    return 'AST signals unavailable due to parsing error.';
  }
}

export function buildPrompt(fileScore: FileScore, astSignals: string): string {
  return `You are an expert technical lead reviewing a codebase for risk. 
A file has been flagged as high-risk based on structural metrics and churn.
Do NOT output code review or fix suggestions.

File Path: ${fileScore.filePath}
Metrics:
- Churn Count (recent commits): ${fileScore.churnCount}
- Cyclomatic Complexity: ${fileScore.complexityCyclomatic}
- Max Nesting Depth: ${fileScore.complexityMaxNesting}
- Top Contributor Share: ${(fileScore.topContributorPct * 100).toFixed(0)}% (Unique Contributors: ${fileScore.uniqueContributors})

Structural Signals:
${astSignals}

Output exactly three sentences (no markdown formatting, no bullet points):
1. One sentence explaining what the file appears to do, inferred ONLY from the structural signals provided (never invent business logic).
2. One to two sentences explaining why the specific COMBINATION of its metrics (e.g. high churn + high complexity, or high complexity + single author) makes it risky.
3. (Optional) One sentence caution about reviewing or modifying this file.`;
}

export async function generateExplanationsForScan(scanId: string, repoPath: string) {
  const scan = await prisma.scan.findUnique({ where: { id: scanId } });
  if (!scan) throw new Error('Scan not found');
  
 if (scan.isAnonymous) {
  console.error(`generateExplanationsForScan called for anonymous scan ${scanId} — this should be unreachable and indicates a caller bug.`);
  return;
}

  if (!scan.explanationsRequested) {
    return; // Not requested
  }

  // Fetch top N riskiest files
  const topFiles = await prisma.fileScore.findMany({
    where: { scanId },
    orderBy: { riskScore: 'desc' },
    take: EXPLANATION_LIMIT
  });

  if (topFiles.length === 0) return;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY not set. Skipping explanations.');
    return;
  }

  const ai = new GoogleGenAI({ apiKey });

  console.log(`Generating LLM explanations for top ${topFiles.length} files of scan ${scanId}...`);

  let failedExplanations = 0;

 let index = 0;
for (const fileScore of topFiles) {
  if (index > 0) {
    await new Promise(resolve => setTimeout(resolve, 13000));
  }

  let attempt = 0;
  let success = false;
  let retryDelay = 0;

  while (attempt < 2 && !success) {
    try {
      if (retryDelay > 0) {
        console.log(`Waiting ${retryDelay}s before retrying ${fileScore.filePath}...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay * 1000));
      }

      const astSignals = extractAstSignals(repoPath, fileScore.filePath);
      const prompt = buildPrompt(fileScore, astSignals);

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: { thinkingConfig: { thinkingBudget: 1024 } }
      });
      
      console.log("Response: ", response);
      const explanation = response.text?.trim() || null;


      if (explanation) {
        await prisma.fileScore.update({
          where: { id: fileScore.id },
          data: { explanation }
        });
      }
      success = true;
    } catch (error: unknown) {
      attempt++;
      const err = error as { status?: number; message?: string };
      const is429 = err.status === 429 || (err.message?.includes('429') ?? false);

      if (attempt === 1 && is429) {
        const match = err.message?.match(/retry in (\d+)s/i);
retryDelay = match?.[1] ? parseInt(match[1], 10) : 60;
        console.warn(`Rate limited (429) on ${fileScore.filePath}. Retrying in ${retryDelay}s...`);
      } else {
        console.error(`Failed to generate explanation for file ${fileScore.filePath}:`, error);
        failedExplanations++;
        break;
      }
    }
  }

  index++;
}

  if (failedExplanations > 0) {
    console.log(`${failedExplanations}/${topFiles.length} explanations unavailable after retry`);
  }
}
