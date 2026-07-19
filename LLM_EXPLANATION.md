# LLM_EXPLANATION.md — Cartograph

Build guidance for the AI-generated risk explanation layer (PRD §7.4).
Read `AGENTS.md` first — this doc assumes its LLM-gating hard constraints
(top-N only, never for anonymous scans, enforced in the service function).

## What this feature is for

Not a code reviewer, not a chat interface, not a general "explain this
file" tool. It's a short, grounded note that turns a risk score into a
reason a human can act on. The test for whether an explanation is good:
would a tech lead nod and say "yeah, that's why," or does it just restate
numbers already visible in the metric cards next to it? If it's the
latter, the prompt isn't grounded in enough real signal.

## Scope: top-N only, and this is a UX decision as much as a cost one

- Default N = 10 (configurable constant, not hardcoded inline — same
  pattern as the risk formula weights).
- Applying this to every file dilutes the signal: an AI blurb on a trivial
  low-risk file reads as filler, and filler next to the few explanations
  that matter makes all of them feel less credible. Top-N keeps the
  feature feeling like a spotlight, not a checklist.
- Reaffirming from `AGENTS.md`: this only runs for authenticated,
  non-anonymous scans. The check lives in
  `services/llm/explanation.service.ts` itself, not just the calling
  route — don't weaken this while building the actual prompt logic.

## What gets sent to the LLM — grounding, not just metrics

Sending only the four computed numbers (churn, complexity, nesting,
contributor %) produces prose that just restates the metric cards — not
useful. Include structural signals your complexity engine (`ts-morph` AST
walk) already extracted, at no extra compute cost:

- Exported function/component/class names
- Import list (what this file depends on)
- Top-level comments/JSDoc if present
- The four computed metrics, as in PRD §7.4's original prompt sketch

**Do not send full raw file source.** Two reasons: cost (PRD explicitly
wants small scoped prompts), and — more importantly for private repos — a
real data-handling question. Structural signals (names, imports, comments)
reveal much less than full source and are a defensible default; full
source is not, without explicit user consent. If full-source explanations
are wanted later, that's a deliberate opt-in feature, not a default.

## Prompt output shape

Constrain the model to produce, not an open-ended paragraph:
1. One sentence: what the file appears to do, inferred only from the
   structural signals provided — never invent business logic beyond what's
   visible in names/imports/comments.
2. One to two sentences: why the *combination* of its metrics is risky —
   the intersection is the story, not each number restated in isolation.
3. Optional one-sentence caution (e.g. "changes here likely need review
   from more than one person") — never a fix suggestion or code review;
   that's out of scope.

Hard rule for the prompt: the model must not make claims it can't ground in
the provided signals. No speculating about bugs, no inventing what the
"real" purpose of the file is beyond what imports/exports/comments show.

## Build order

### 1. Prompt + service (`services/llm/explanation.service.ts`)
- Pure function: `(fileScore, astSignals) => Promise<string>`.
- Uses `@google/genai` (per updated stack decision) with a small, scoped
  prompt built from the template above.
- Gating check (authenticated + non-anonymous + file is in this scan's
  top-N) lives at the top of this function, not assumed to have already
  been checked by the caller.
- On any API failure or timeout, return `null` rather than throwing —
  `FileScore.explanation` is already nullable in the schema specifically
  so a failed/skipped explanation degrades to "show metrics only," never
  blocks the rest of the scan.

### 2. Pipeline integration
- Runs as a distinct stage after scoring completes:
  `SCORING → GENERATING_EXPLANATIONS → COMPLETED` (matches the `ScanStatus`
  enum already in the schema).
- Only enters this stage at all if the scan is non-anonymous — anonymous
  scans go straight from `SCORING` to `COMPLETED`. The frontend's
  `CORE_VISUALIZATION.md` step 6 already expects this distinction; keep it
  consistent here on the backend side.
- Select top-N by `riskScore` once scoring is final, call the service per
  file, write results to `FileScore.explanation`.
- Generate once per scan, not per view — `FileScore.explanation` is
  persisted, so opening the file detail drawer never triggers a fresh LLM
  call. This was already a hard constraint in `CORE_VISUALIZATION.md` step
  4; this is the backend half of making that true.

### 3. Frontend wiring
- The file detail drawer's explanation section (already speced in
  `CORE_VISUALIZATION.md` step 4) reads `FileScore.explanation` directly —
  no new fetch needed, it's already in the scan data loaded into the
  store.
- Three states to render, not just present/absent:
  - Present → show it.
  - `null` because the file wasn't in top-N → show nothing extra, just the
    metric cards (this is the common case for most files, not an error).
  - `null` because the scan was anonymous → show the "sign in for an AI
    explanation" locked-state prompt already speced.
  - Distinguish these on the frontend using the scan's `isAnonymous` flag
    plus the file's rank, not by trying to infer intent from a null value
    alone.

### 4. Tests
- Unit test the prompt-building function separately from the API call —
  assert it never includes raw file source, only the intended structural
  signals + metrics.
- Test the gating check rejects anonymous scans even if called directly
  with a crafted input, not just via the normal pipeline path.
- Test failure handling: a mocked API failure should result in
  `explanation: null`, not a thrown error that halts the scan.

## Non-goals

- No follow-up chat/Q&A about a file — one-shot explanation only.
- No code review, no fix suggestions, no "here's how to refactor this."
- No full-source-grounded explanations in this pass — structural signals
  only, per the data-handling reasoning above.
- No explanation regeneration on re-scan unless explicitly requested —
  matches the "generate once, persist" rule in step 2.

## When in doubt

- If an explanation would require inventing something not visible in the
  structural signals provided, the prompt is under-grounded — fix the
  input, don't let the model guess.
- If cost or latency becomes a concern, reduce N before considering
  sending less structural context — the grounding is what makes this
  feature worth having at all.
