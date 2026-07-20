import { SCORING_CONFIG } from '../../config/scoring.js';

export interface FileRiskInput {
  filePath: string;
  churnCount: number;
  churnHistory?: { date: string; commits: number }[];
  cyclomaticComplexity: number;
  maxNestingDepth: number;
  fileLengthLines: number;
  uniqueContributors: number;
  topContributorPct: number;
  contributors: {
    authorName: string;
    authorEmail: string;
    commits: number;
    contributionPct: number;
  }[];
}

export interface FileRiskScore extends FileRiskInput {
  normalizedChurn: number;
  normalizedComplexity: number;
  busFactorPenalty: number;
  contributors: {
    authorName: string;
    authorEmail: string;
    commits: number;
    contributionPct: number;
  }[];
  riskScore: number;
}

export function computeRiskScores(inputs: FileRiskInput[]): FileRiskScore[] {
  if (inputs.length === 0) return [];

  const maxChurn = Math.max(...inputs.map(i => i.churnCount));
  const minChurn = Math.min(...inputs.map(i => i.churnCount));
  
  const maxComplexity = Math.max(...inputs.map(i => i.cyclomaticComplexity));
  const minComplexity = Math.min(...inputs.map(i => i.cyclomaticComplexity));

  const maxTopContributorPct = Math.max(...inputs.map(i => i.topContributorPct));
  const minTopContributorPct = Math.min(...inputs.map(i => i.topContributorPct));

  return inputs.map(input => {
    const normalizedChurn = maxChurn === minChurn 
      ? 0 
      : (input.churnCount - minChurn) / (maxChurn - minChurn);
      
    const normalizedComplexity = maxComplexity === minComplexity 
      ? 0 
      : (input.cyclomaticComplexity - minComplexity) / (maxComplexity - minComplexity);

    const busFactorPenalty = maxTopContributorPct === minTopContributorPct
      ? 0
      : (input.topContributorPct - minTopContributorPct) / (maxTopContributorPct - minTopContributorPct);

    const riskScore = 
      (normalizedChurn * SCORING_CONFIG.WEIGHTS.CHURN) +
      (normalizedComplexity * SCORING_CONFIG.WEIGHTS.COMPLEXITY) +
      (busFactorPenalty * SCORING_CONFIG.WEIGHTS.OWNERSHIP);

    return {
      ...input,
      normalizedChurn,
      normalizedComplexity,
      busFactorPenalty,
      riskScore,
      contributors: input.contributors
    };
  });
}
