# Product Requirements Document

## Product Name: **Cartograph**

*(Alt names considered: CodeHeat, RiskMap, Debtwise, Terra Codex, Faultline — going with Cartograph: it maps unknown territory, which is exactly the pitch. "Cartograph your codebase.")*

---

## 1. Summary

Cartograph is a tool that connects to a GitHub repository and automatically generates a visual "risk heatmap" of the codebase — combining code churn, complexity, and ownership data to show engineering teams exactly which files are the most fragile, poorly understood, and dangerous to touch.

## 2. Problem Statement

Every growing codebase accumulates technical debt, but teams have no objective way to see where it lives. Knowledge about "risky" files is tribal — passed down verbally, forgotten when people leave, and invisible to new hires. This leads to:

- Refactoring decisions driven by gut feeling or whoever complains loudest, not data
- New engineers unknowingly introducing bugs in fragile, poorly-owned code
- No way to track whether a codebase's health is improving or degrading over time
- Bus-factor risk (single points of failure in ownership) going undetected until someone leaves

## 3. Goals

| Goal | Success Metric |
|---|---|
| Surface the riskiest files in a repo automatically | Top 10 list correlates with what senior devs on that team already "know" to be risky (validate via user testing) |
| Make risk visible and explorable, not just a static report | Users can click into any file and see why it's risky |
| Keep it cheap and fast to run | Full analysis of a mid-size repo (~500 files) completes in under 2 minutes, without heavy LLM cost |
| Make it useful for both new hires and eng managers | Two distinct value props ship in v1 (see User Stories) |

## 4. Non-Goals (v1)

- Not a full onboarding/documentation tool (that's the earlier "repo explainer" idea — separate product)
- Not a CI/CD gate or PR blocker (v1 is descriptive, not prescriptive/enforcing)
- Not multi-language in v1 — JavaScript/TypeScript repos only
- Not real-time/live-updating — analysis runs on-demand or on a schedule, not on every commit (v2 consideration)

## 5. Target Users

1. **New hires** — want to know "what should I be careful touching" in week one.
2. **Engineering managers / tech leads** — want data to justify refactoring sprints and prioritize technical debt work.
3. **Solo devs / OSS maintainers** — want a health check on their own project.

## 6. User Stories

- *As a new hire*, I want to see a visual map of the codebase so I can quickly identify which files are complex and risky before I start making changes.
- *As an eng manager*, I want a ranked list of the riskiest files so I can propose a data-backed refactoring plan to leadership.
- *As a tech lead*, I want to see which files only one person has ever touched, so I can address bus-factor risk before that person leaves or goes on leave.
- *As any user*, I want a plain-English explanation of *why* a file is flagged as risky, not just a number.

## 7. Core Features (v1 Scope)

### 7.1 Repo Ingestion
- Connect via GitHub OAuth, select a repo (public or private with permission)
- Clone repo server-side, pull full git history

### 7.2 Risk Scoring Engine (the core IP — no LLM needed here)
Three signals, computed per file:

1. **Churn** — commit frequency over a configurable time window (default: last 6 months), from `git log`
2. **Complexity** — cyclomatic complexity, file length, max nesting depth, computed via static analysis (`ts-morph` / `escomplex`-style AST walk)
3. **Ownership** — number of unique contributors, and % of changes made by the top contributor (bus-factor proxy), from `git blame` / `git log`

Combined into a single **Risk Score** per file (weighted formula, tunable) — the churn × complexity intersection is the primary driver, ownership is a secondary flag.

### 7.3 Visualization
- **Treemap view**: file size = box size, risk score = color (green → red)
- **Ranked list view**: sortable table — file, risk score, churn, complexity, owners, last changed
- **File detail panel**: click any file → churn graph over time, complexity breakdown, contributor list

### 7.4 AI-Generated Explanations (LLM layer — small, grounded, optional)
- For top N flagged files only (not the whole repo — cost control)
- Prompt is grounded in real computed metrics, not open-ended: "This file has cyclomatic complexity of X, was changed Y times in the last 6 months by Z different people — summarize what it does and why it might be risky"
- Output: 2-3 sentence plain-English risk explanation per flagged file

### 7.5 Reports
- Exportable summary (top 10 risky files, trend if repeat scan) — PDF or shareable link, useful for eng managers presenting to leadership

## 8. Out of Scope for v1 (Future Considerations)

- Multi-language support (Python, Java, Go)
- Historical trend tracking across multiple scans (requires storing scan snapshots over time)
- GitHub App with automatic re-scans on push
- Test coverage integration (requires parsing coverage reports — coverage tools vary too much to standardize on for v1)
- Slack/Teams notifications when risk crosses a threshold
- Team/org-level dashboards across multiple repos

## 9. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | React + Tailwind | Treemap via `@nivo/treemap` or D3 directly |
| Backend | Node.js + Express | Handles repo cloning, orchestrates analysis jobs |
| Git operations | `simple-git` or shelling out to system `git` | Churn + blame data |
| Static analysis | `ts-morph` (TS/JS AST) + `escomplex` or custom complexity walker | Complexity scoring |
| Queue | Redis + BullMQ | Repo analysis is slow — run as async background job |
| Database | PostgreSQL | Store repos, scan results, file-level scores |
| LLM | Anthropic API, small scoped prompts only | Explanations for top-N flagged files only |
| Auth | GitHub OAuth | Repo access |
| Hosting | Render/Railway (backend + Postgres + Redis), Vercel (frontend) | Cheap for MVP/demo purposes |

## 10. Risk Scoring Formula (v1 Draft)

```
risk_score = (normalized_churn * 0.4) + (normalized_complexity * 0.4) + (bus_factor_penalty * 0.2)
```

- `normalized_churn` and `normalized_complexity`: min-max scaled 0-1 across all files in the repo (relative risk, not absolute)
- `bus_factor_penalty`: higher if one contributor owns >80% of a file's changes
- Weights are configurable — expose as a settings panel later, hardcode for MVP

*(This formula is a starting hypothesis — expect to tune it after testing against 2-3 real repos with known "problem files" to validate it matches reality.)*

## 11. Success Criteria for MVP Demo

- Successfully analyze at least 2 real open-source repos (e.g., a mid-size popular OSS project) end-to-end
- Risk heatmap renders correctly and is genuinely readable/useful at a glance
- Top-flagged files, when checked against that project's actual GitHub issues/commit history, plausibly correlate with known pain points
- Full analysis pipeline (clone → score → visualize) runs in under 2 minutes for a ~500 file repo
- At least one LLM-generated explanation reads as genuinely useful, not generic

## 12. Open Questions

- How to handle very large repos (10k+ files) — sampling strategy, or explicitly out of scope for v1?
- Should risk score be repo-relative (percentile within this repo) or have some absolute benchmark? (Leaning relative for v1 — simpler, avoids false precision.)
- Private repo handling — how much do we need to think about security/code-never-leaves-server for this to be enterprise-credible later? (Not a v1 blocker, but worth designing around.)

---

**Next step:** scope the 2-3 week MVP build plan — starting with the churn + complexity engine before touching any UI or LLM layer, since that's the actual core value.
