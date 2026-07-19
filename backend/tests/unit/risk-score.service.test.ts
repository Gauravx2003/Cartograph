import { describe, it, expect } from 'vitest';
import { computeRiskScores, type FileRiskInput } from '../../src/services/scoring/risk-score.service.js';

describe('Risk Score Service', () => {
  it('should compute and normalize risk scores correctly', () => {
    const inputs: FileRiskInput[] = [
      {
        filePath: 'low.ts',
        churnCount: 1,
        cyclomaticComplexity: 1,
        maxNestingDepth: 1,
        fileLengthLines: 10,
        uniqueContributors: 2,
        topContributorPct: 0.5,
      },
      {
        filePath: 'high.ts',
        churnCount: 10,
        cyclomaticComplexity: 21,
        maxNestingDepth: 5,
        fileLengthLines: 200,
        uniqueContributors: 1,
        topContributorPct: 1.0,
      }
    ];

    const results = computeRiskScores(inputs);

    const low = results.find(r => r.filePath === 'low.ts');
    const high = results.find(r => r.filePath === 'high.ts');

    expect(low).toBeDefined();
    expect(high).toBeDefined();

    // Normalization check
    expect(low!.normalizedChurn).toBe(0);
    expect(high!.normalizedChurn).toBe(1);
    
    expect(low!.normalizedComplexity).toBe(0);
    expect(high!.normalizedComplexity).toBe(1);

    expect(low!.busFactorPenalty).toBe(0);
    expect(high!.busFactorPenalty).toBe(1);

    expect(low!.riskScore).toBe(0);
    expect(high!.riskScore).toBeCloseTo(0.4 * 1 + 0.4 * 1 + 0.2 * 1);
  });

  it('should default busFactorPenalty to 0 for solo-committer repos to preserve score spread', () => {
    const soloInputs: FileRiskInput[] = [
      {
        filePath: 'low.ts',
        churnCount: 1,
        cyclomaticComplexity: 1,
        maxNestingDepth: 1,
        fileLengthLines: 10,
        uniqueContributors: 1,
        topContributorPct: 1.0, // Solo committer
      },
      {
        filePath: 'high.ts',
        churnCount: 10,
        cyclomaticComplexity: 10,
        maxNestingDepth: 5,
        fileLengthLines: 200,
        uniqueContributors: 1,
        topContributorPct: 1.0, // Solo committer
      }
    ];

    const results = computeRiskScores(soloInputs);
    const low = results.find(r => r.filePath === 'low.ts')!;
    const high = results.find(r => r.filePath === 'high.ts')!;

    // Bus factor penalty should be neutralized (0) since there's no ownership variance
    expect(low.busFactorPenalty).toBe(0);
    expect(high.busFactorPenalty).toBe(0);

    // Churn and complexity should still drive the score spread
    expect(low.riskScore).toBe(0);
    expect(high.riskScore).toBe(0.4 + 0.4); // 0.8 instead of 1.0
  });
});
