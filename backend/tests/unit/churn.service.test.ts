import { describe, it, expect } from 'vitest';
import * as path from 'path';
import { getChurnCounts } from '../../src/services/git/churn.service.js';

describe('Churn Service', () => {
  const repoPath = path.resolve(__dirname, '../fixtures/sample-repo');

  it('should return churn counts for files in the repository', async () => {
    const results = await getChurnCounts(repoPath);
    
    expect(results).toBeInstanceOf(Array);
    expect(results.length).toBeGreaterThan(0);
    
    const simple = results.find(r => r.filePath === 'simple.ts');
    expect(simple).toBeDefined();
    expect(simple?.commitCount).toBe(2);

    const complex = results.find(r => r.filePath === 'complex.ts');
    expect(complex).toBeDefined();
    expect(complex?.commitCount).toBe(1);

    const shared = results.find(r => r.filePath === 'shared.ts');
    expect(shared).toBeDefined();
    expect(shared?.commitCount).toBe(3);
  });
});
