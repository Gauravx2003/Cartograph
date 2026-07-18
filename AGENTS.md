# AGENTS.md — Cartograph

This file gives AI coding agents (Antigravity, etc.) working context for this repo.
Read `PRD_TechDebtHeatmap.md` first for full product intent — this file is the
condensed, agent-facing operating manual.

## What this project is

Cartograph connects to a GitHub repo, computes a per-file **risk score** from
churn + complexity + ownership data (pure static analysis, no LLM), visualizes
it as a treemap/ranked list, and optionally generates a short LLM explanation
for the top-N riskiest files only.

## Build order (do not reorder without asking)

1. **Churn + Complexity + Ownership engine** (`backend/src/services/git`,
   `backend/src/services/analysis`, `backend/src/services/scoring`) — this is
   the core IP per the PRD. Get this correct and tested against real repos
   before touching UI or LLM code.
2. Risk score combination (`scoring/risk-score.service.ts`) using the formula
   in PRD §10. Treat the weights as constants pulled from one config location,
   not hardcoded in multiple places — they will be tuned.
3. Job/queue plumbing (BullMQ) to run analysis async.
4. API layer (routes/controllers) exposing scan results.
5. Frontend treemap + ranked list + file detail views.
6. LLM explanation layer — last, and only for top-N flagged files.
7. Report export.

## Hard constraints (from PRD — do not silently violate)

- **JS/TypeScript repos only** in v1. Don't add multi-language AST parsing.
- **No LLM calls inside the core scoring engine.** Churn, complexity, and
  ownership scores must be fully deterministic and computable without any
  network/API call. LLM usage is isolated to `services/llm/` and only fires
  for the top N files after scoring is complete.
- **Not a CI/CD gate.** Don't build PR-blocking or webhook-triggered
  auto-scan behavior — analysis is on-demand/scheduled only in v1.
- **Not real-time.** No live-updating-on-every-commit logic.
- Full analysis of a ~500-file repo must complete in **under 2 minutes**.
  Keep this in mind when choosing sync vs. async operations, and don't
  introduce per-file LLM calls in the scoring path.
- Risk scores are **repo-relative** (min-max normalized within the scanned
  repo), not benchmarked against some absolute/global scale. Don't invent
  cross-repo comparisons.

## Tech stack (see PRD §9 for full rationale)

| Layer           | Choice                                                                |
| --------------- | --------------------------------------------------------------------- |
| Frontend        | React + TypeScript + Vite + Tailwind, `@nivo/treemap` for the heatmap |
| Backend         | Node.js + Express + TypeScript                                        |
| Git ops         | `simple-git` (shell out to system `git` for log/blame data)           |
| Static analysis | `ts-morph` for AST walking, complexity via `escomplex`-style walker   |
| Queue           | BullMQ + Redis (analysis jobs are slow, always async)                 |
| DB              | PostgreSQL via Prisma                                                 |
| LLM             | Gemini API (`@google/genai`), small scoped prompts only               |
| Auth            | GitHub OAuth                                                          |

## Conventions

- **TypeScript everywhere**, strict mode on. No `any` in `services/` — these
  are the modules that get unit-tested against fixture repos.
- Backend service files are named `<thing>.service.ts` and should be pure
  functions where possible (input: repo path / file list → output: scores).
  Keep them independent of Express req/res so they're testable in isolation.
- One risk-relevant computation per service file. Don't merge churn and
  complexity logic into one file even if it's tempting for a quick win.
- API responses return raw scores + the inputs that produced them (churn
  count, complexity number, contributor %) — never just a final risk score
  with no breakdown. The PRD's #1 user story is "why is this risky," so the
  "why" data must always be available downstream of scoring.
- Frontend fetches go through `lib/api-client.ts` — no ad-hoc `fetch()` calls
  scattered in components.
- Tests for scoring logic use small fixture repos in
  `backend/tests/fixtures/`, not live GitHub clones — keep test runs fast and
  offline.

## Non-goals — do not build these unless explicitly asked

- Multi-language support (Python/Java/Go)
- Historical trend storage across multiple scans
- GitHub App / auto re-scan on push
- Test coverage integration
- Slack/Teams notifications
- Multi-repo / org-level dashboards

These are explicitly deferred in PRD §8. If a task seems to require one of
these, flag it rather than quietly adding it.

## Environment variables

See `.env.example` at repo root and `backend/.env.example`. Required for any
backend work: `DATABASE_URL`, `REDIS_URL`, `GITHUB_CLIENT_ID`,
`GITHUB_CLIENT_SECRET`, `GEMINI_API_KEY`.

## When in doubt

- Prefer the interpretation that keeps the scoring engine LLM-free and
  synchronous/fast.
- Prefer repo-relative, explainable metrics over clever/opaque ones — the
  PRD's success metric is that senior devs' gut sense agrees with the tool's
  output. Interpretability beats sophistication here.
- If a change would affect the risk formula (PRD §10), don't hardcode new
  magic numbers — surface them as named, commented constants so they're easy
  to find and tune later.
