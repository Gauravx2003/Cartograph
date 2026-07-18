import { Project, Node, SyntaxKind } from 'ts-morph';
import * as path from 'path';

export interface ComplexityResult {
  filePath: string;
  cyclomaticComplexity: number;
  fileLength: number;
  maxNestingDepth: number;
}

function calculateCyclomaticComplexity(node: Node): number {
  let complexity = 1;
  node.forEachDescendant(descendant => {
    switch (descendant.getKind()) {
      case SyntaxKind.IfStatement:
      case SyntaxKind.WhileStatement:
      case SyntaxKind.DoStatement:
      case SyntaxKind.ForStatement:
      case SyntaxKind.ForInStatement:
      case SyntaxKind.ForOfStatement:
      case SyntaxKind.CaseClause:
      case SyntaxKind.CatchClause:
      case SyntaxKind.ConditionalExpression:
      case SyntaxKind.AmpersandAmpersandToken:
      case SyntaxKind.BarBarToken:
      case SyntaxKind.QuestionQuestionToken:
        complexity++;
        break;
    }
  });
  return complexity;
}

function calculateMaxNestingDepth(node: Node): number {
  let maxDepth = 0;

  function walk(n: Node, currentDepth: number) {
    let depth = currentDepth;
    const kind = n.getKind();
    const increasesDepth = [
      SyntaxKind.Block,
    ].includes(kind);

    if (increasesDepth) {
      depth++;
      if (depth > maxDepth) {
        maxDepth = depth;
      }
    }

    n.forEachChild(child => {
      walk(child, depth);
    });
  }

  walk(node, 0);
  return maxDepth > 0 ? maxDepth - 1 : 0;
}

export function analyzeComplexity(repoPath: string): ComplexityResult[] {
  const project = new Project();
  project.addSourceFilesAtPaths([
    path.join(repoPath, '**/*.ts').replace(/\\/g, '/'),
    path.join(repoPath, '**/*.tsx').replace(/\\/g, '/'),
    path.join(repoPath, '**/*.js').replace(/\\/g, '/'),
    path.join(repoPath, '**/*.jsx').replace(/\\/g, '/'),
  ]);

  const results: ComplexityResult[] = [];

  for (const sourceFile of project.getSourceFiles()) {
    if (sourceFile.getFilePath().includes('node_modules')) {
      continue;
    }

    const cyclomaticComplexity = calculateCyclomaticComplexity(sourceFile);
    const maxNestingDepth = calculateMaxNestingDepth(sourceFile);
    const fileLength = sourceFile.getEndLineNumber();
    
    // get relative path and use forward slashes
    let relativePath = path.relative(repoPath, sourceFile.getFilePath());
    relativePath = relativePath.replace(/\\/g, '/');
    
    // ts-morph uses absolute paths natively, if repoPath is C:/... and sourceFile is C:/...
    // path.relative handles it, but let's make sure it handles both Windows and Posix separators correctly.

    results.push({
      filePath: relativePath,
      cyclomaticComplexity,
      fileLength,
      maxNestingDepth
    });
  }

  return results;
}
