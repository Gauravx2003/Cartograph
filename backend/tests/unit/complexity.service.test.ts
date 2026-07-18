import { describe, it, expect } from 'vitest';
import * as path from 'path';
import { analyzeComplexity } from '../../src/services/analysis/complexity.service.js';

describe('Complexity Service', () => {
  const repoPath = path.resolve(__dirname, '../fixtures/sample-repo');

  it('should return complexity metrics for files in the repository', () => {
    const results = analyzeComplexity(repoPath);
    
    expect(results).toBeInstanceOf(Array);
    expect(results.length).toBeGreaterThan(0);
    
    const simple = results.find(r => r.filePath === 'simple.ts');
    expect(simple).toBeDefined();
    expect(simple?.cyclomaticComplexity).toBeGreaterThanOrEqual(1);

    const complex = results.find(r => r.filePath === 'complex.ts');
    expect(complex).toBeDefined();
    expect(complex?.cyclomaticComplexity).toBeGreaterThan(1);
    expect(complex?.maxNestingDepth).toBeGreaterThan(1);
    expect(complex?.fileLength).toBeGreaterThan(5);

    const shared = results.find(r => r.filePath === 'shared.ts');
    expect(shared).toBeDefined();
    expect(shared?.cyclomaticComplexity).toBe(1);
    expect(shared?.maxNestingDepth).toBeGreaterThanOrEqual(0);
  });
});
