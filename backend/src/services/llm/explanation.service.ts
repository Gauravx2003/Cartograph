import { prisma } from '../../db/client.js';

export async function generateExplanationsForScan(scanId: string) {
  const scan = await prisma.scan.findUnique({ where: { id: scanId } });
  if (!scan) throw new Error('Scan not found');
  
  if (scan.isAnonymous) {
    throw new Error('Unauthorized: LLM explanations are not available for anonymous scans.');
  }

  if (!scan.explanationsRequested) {
    return; // Not requested
  }
  
  // TODO: Actual LLM generation logic using @google/genai
  console.log(`Generating LLM explanations for scan ${scanId}...`);
}
