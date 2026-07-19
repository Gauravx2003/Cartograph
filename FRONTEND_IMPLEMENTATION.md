# FRONTEND_IMPLEMENTATION.md — Cartograph

This file gives AI coding agents (Antigravity, etc.) step-by-step build
guidance for the frontend. Read `AGENTS.md` (backend/product context) and
`CARTOGRAPH_DESIGN.md` (visual system) first — this file assumes both and
does not repeat their content.

## What the user actually experiences

1. Lands on the home page: Cartograph banner, one-sentence description of
   what it does, treemap glyph, heatmap-preview-card.
2. **Not logged in:** sees a repo-URL paste input (works immediately, no
   auth) and a "Connect with GitHub" action.
3. **After connecting GitHub:** sees an "Import from GitHub" searchable
   repo picker (their own repos, private ones marked) — the paste-URL
   input stays visible too, unchanged.
4. However the repo was chosen (paste or import), the user confirms and
   triggers a scan.
5. Scan runs async — user sees real pipeline stages, not a blank spinner.
6. On completion, user is taken to the report (treemap / ranked list / file
   detail — built separately, out of scope for this doc except the handoff
   point).

## State map

```
                          ┌────────────────────┐
                          │   App bootstrap     │
                          │ (check session)     │
                          └─────────┬────────────┘
                                    │
                     ┌──────────────┴──────────────┐
                     │                              │
               anonymous                      authenticated
                     │                              │
          ┌──────────▼──────────┐        ┌──────────▼───────────┐
          │  Guest hero          │        │  Authenticated hero  │
          │  - paste URL input   │        │  - paste URL input   │
          │  - Connect w/ GitHub │        │  - Import from GitHub│
          └──────────┬───────────┘        └──────────┬───────────┘
                     │                                │
                     └───────────────┬────────────────┘
                                      │
                            ┌─────────▼─────────┐
                            │ Repo confirmed     │
                            │ (owner/name, ⌗)    │
                            └─────────┬─────────┘
                                      │
                            ┌─────────▼─────────┐
                            │ Scan in progress   │
                            │ (staged status)    │
                            └─────────┬─────────┘
                              success │ failure
                     ┌────────────────┴───────────────┐
                     ▼                                ▼
              Report view                     Failure state
                                        (rate-limited / too-large /
                                         private-needs-auth / error)
```

## Build order (do not reorder without asking)

### 1. App shell + session bootstrap

- Root layout, routing skeleton, global styles from `CARTOGRAPH_DESIGN.md`
  tokens (fonts, colors, spacing — wire these into Tailwind config /
  CSS variables before building any screen).
- `useAuth()` hook: on app load, call the session-check endpoint once,
  resolve to `{ user: User | null, loading: boolean }`. Every screen below
  gates on `loading` first — **never render the guest hero and then swap
  to the authenticated hero after a flash; hold a loading state until the
  session check resolves.**
- No screen-level code should read cookies/tokens directly — everything
  goes through `useAuth()`.

### 2. Landing hero (static content first, no logic)

- Banner + one-sentence description (see copy note in `CARTOGRAPH_DESIGN.md`
  review — plain language, no unexplained jargon).
- `heatmap-preview-card` with a static sample treemap (hardcoded fixture
  data is fine here — this is marketing surface, not a live scan).
- Treemap glyph as a small mark near the wordmark.
- Build this with placeholder actions (buttons that don't do anything yet)
  before wiring state — get the visual right first.

### 3. Guest flow — paste-a-repo input

- `repo-input-pill` (per design tokens) accepting a GitHub URL or
  `owner/name` shorthand.
- Client-side validation: must resolve to a plausible GitHub repo
  reference before enabling the confirm action. Don't hit the backend on
  every keystroke.
- "Connect with GitHub" as a secondary action next to/below the input —
  redirects to the OAuth endpoint. On return, session bootstrap (step 1)
  picks up the new logged-in state; don't build separate callback-page UI
  beyond a brief loading state.

### 4. Authenticated flow — Import from GitHub

- Searchable repo picker, not a plain `<select>`. Fetch the user's repos
  once on entering this state, filter client-side as they type for
  reasonable list sizes; if the account has enough repos that client-side
  filtering is impractical, debounce a server-side search instead — check
  which the backend actually supports before assuming.
- Each row shows repo name, and a lock icon for private repos.
- The paste-URL input from step 3 remains visible and functional alongside
  the picker — don't hide it once the user is authenticated.

### 5. Repo confirmation state

- After a repo is chosen (either path), show a small confirmation summary
  before triggering the actual scan: repo name, public/private badge,
  default branch. This is also the natural place to surface a client-side
  warning if the user is anonymous and about to scan something likely to
  exceed the anonymous file-size cap — better to warn here than fail later.
- Single primary action: "Generate report" (`button-primary`, black pill).

### 6. Scan-in-progress state

- Poll (or subscribe, if the backend exposes a socket/SSE — confirm which
  before building) the scan status endpoint.
- Render the actual pipeline stages from `Scan.status`
  (`QUEUED → CLONING → ANALYZING → SCORING → GENERATING_EXPLANATIONS →
COMPLETED`) as a simple staged list in `code-sm` monospace — this is
  the moment to lean on the design system's "documentation as interface"
  feel rather than a generic spinner.
- `GENERATING_EXPLANATIONS` only appears for authenticated scans — don't
  show this stage at all for anonymous scans, since that step never runs
  for them (per `AGENTS.md` LLM-gating rule).

### 7. Failure states (build these as real screens, not toasts-only)

- **Anonymous rate limit hit:** explain what happened in plain terms, and
  offer "Connect with GitHub" as the way to continue — this is a
  conversion moment, not just an error.
- **Anonymous file-size cap exceeded:** same pattern — explain the cap
  exists for anonymous scans specifically, and that logging in raises it.
- **Private repo without auth:** shouldn't normally be reachable if step 5
  warns correctly, but handle it defensively — same "connect to continue"
  pattern.
- **Generic scan failure:** plain-language explanation, no stack traces,
  offer retry.
- None of these states borrow `{colors.risk-high}` from the design system
  — that color means "risky file," not "something broke." Use ordinary
  ink/body copy for all error states, per `CARTOGRAPH_DESIGN.md`.

### 8. Handoff to report view

- On `COMPLETED`, navigate to the report view (treemap / ranked list /
  file detail). Building that view is a separate effort — this doc's scope
  ends at the handoff; just make sure the scan ID is passed cleanly.

## Hard constraints

- Never assume the user is logged in when rendering the hero — always
  gate on the resolved `useAuth()` state.
- Never hide the paste-URL path once a user connects GitHub.
- Never render `GENERATING_EXPLANATIONS` as a stage for an anonymous scan.
- Never call the LLM-explanation-gated endpoints from anonymous state, even
  speculatively — this should be structurally impossible in the anonymous
  branch of the UI, not just hidden.
- All auth state lives in memory/React state via `useAuth()`, resolved from
  a real session check on load — no `localStorage`/`sessionStorage` use for
  session/token data (browser storage restrictions apply to artifacts, and
  it's also just the wrong place to keep session state in the real app).
- Repo-picker and paste-input both go through the same downstream
  "repo confirmed" state (step 5) — don't build two divergent code paths
  for how a scan gets triggered depending on which input method was used.

## Conventions

- Every screen in the state map above is its own component under
  `frontend/src/pages/` or `frontend/src/components/`, matching the
  structure already in `PROJECT_SETUP.md` — extend that tree, don't
  restructure it.
- Scan-status polling logic belongs in a hook (`hooks/useScanStatus.ts`),
  not inlined in the progress-screen component.
- All requests go through `lib/api-client.ts`, per `AGENTS.md` conventions
  — this now includes attaching auth state where `useAuth()` indicates a
  session exists, and omitting it cleanly for anonymous requests.

## Non-goals for this pass

- The report view itself (treemap/ranked-list/file-detail) — separate
  build effort per `AGENTS.md` build order step 6.
- Any account/settings/billing screens.
- Real-time collaborative or multi-user viewing of a scan in progress.

## When in doubt

- Prefer showing real pipeline state over a generic loading spinner —
  it's cheap, on-brand, and reduces "is this stuck?" uncertainty during a
  multi-second async job.
- Prefer treating rate-limit/size-cap failures as a nudge toward login
  rather than a dead-end error — it's honest (it's true a login raises the
  limit) and better for the product.
- If unsure whether the backend supports a given repo-search or
  status-polling mechanism, check the existing routes/controllers before
  building against an assumed API shape.
