import { describe, it, expect } from 'vitest';
import * as path from 'path';
import { getOwnership } from '../../src/services/git/ownership.service.js';

describe('Ownership Service', () => {
  const repoPath = path.resolve(__dirname, '../fixtures/sample-repo');

  it('should return ownership metrics for files in the repository', async () => {
    const results = await getOwnership(repoPath);
    
    expect(results).toBeInstanceOf(Array);
    expect(results.length).toBeGreaterThan(0);
    
    const simple = results.find(r => r.filePath === 'simple.ts');
    expect(simple).toBeDefined();
    expect(simple?.uniqueContributors).toBe(2);
    expect(simple?.topContributorPercent).toBe(0.5);

    const complex = results.find(r => r.filePath === 'complex.ts');
    expect(complex).toBeDefined();
    expect(complex?.uniqueContributors).toBe(1);
    expect(complex?.topContributorPercent).toBe(1.0);

    const shared = results.find(r => r.filePath === 'shared.ts');
    expect(shared).toBeDefined();
    expect(shared?.uniqueContributors).toBe(2); // Alice 2, Charlie 1
    expect(shared?.topContributorPercent).toBeCloseTo(2 / 3);
  });
});
