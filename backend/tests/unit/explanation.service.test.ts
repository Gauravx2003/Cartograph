import { describe, it, expect, vi } from 'vitest';
import { buildPrompt } from '../../src/services/llm/explanation.service.js';

describe('Explanation Service Prompt Builder', () => {
  it('builds a prompt strictly containing structural signals and not raw source', () => {
    const fileScore = {
      filePath: 'src/utils/auth.ts',
      churnCount: 15,
      complexityCyclomatic: 12,
      complexityMaxNesting: 4,
      topContributorPct: 0.9,
      uniqueContributors: 2,
    } as any;

    const astSignals = `Imports: react, lodash
Exports: loginUser, logoutUser, SessionContext
Top-level Comments:
/** Handles JWT authentication and session management. */`;

    const prompt = buildPrompt(fileScore, astSignals);

    // Verify it includes the metrics
    expect(prompt).toContain('Churn Count (recent commits): 15');
    expect(prompt).toContain('Cyclomatic Complexity: 12');
    expect(prompt).toContain('Max Nesting Depth: 4');
    expect(prompt).toContain('90% (Unique Contributors: 2)');

    // Verify it includes the AST signals
    expect(prompt).toContain('Imports: react, lodash');
    expect(prompt).toContain('Exports: loginUser, logoutUser, SessionContext');
    expect(prompt).toContain('/** Handles JWT authentication and session management. */');

    // Verify it instructs the LLM correctly per LLM_EXPLANATION.md
    expect(prompt).toContain('Output exactly three sentences');
    expect(prompt).toContain('inferred ONLY from the structural signals provided');
    expect(prompt).toContain('why the specific COMBINATION of its metrics');
  });
});
