# CORE_VISUALIZATION.md — Cartograph

Build guidance for the treemap, ranked list, and file detail panel — the
three views that constitute the actual product (PRD §7.3/7.4). Read
`AGENTS.md`, `CARTOGRAPH_DESIGN.md`, and `FRONTEND_IMPLEMENTATION.md` first.

## The core idea

These are not three separate components that happen to share a page. They
are three views over **one shared selection/filter state**. Building each
in isolation is what produces a "basic" result — the payoff comes from
coordination: hovering a ranked-list row highlights the matching treemap
cell; searching a filename dims everything else in both views; clicking a
file anywhere opens the same detail drawer without navigating away from
either view.

Build them one at a time as planned, but each one should be written from
the start to read from and write to the shared store in step 1 — don't
build three components with local state and try to unify them at the end.

## New dependencies needed

```bash
cd frontend
npm install @tanstack/react-table @tanstack/react-virtual
npm install react-router-dom   # only if not already present — needed for
                                # deep-linkable file detail state (?file=path)
```

`@nivo/treemap` (already installed) supports hierarchical `data` with
`children` natively — no new treemap library needed, just a data-shaping
step (flat file list → nested-by-directory tree) done client-side.

## Build order

### 1. Shared scan-result store (build this first, before any view)
Extend `frontend/src/store/scan-store.ts`:
- `fileScores: FileScore[]` — the flat list as returned by the API (source
  of truth; don't duplicate this data into each component).
- `selectedFilePath: string | null`
- `hoveredFilePath: string | null`
- `searchQuery: string`
- `activeFilters: { minRisk?: number; directory?: string; busFactorOnly?: boolean }`
- Derived/computed (memoized selectors, not stored redundantly):
  - `visibleFileScores` — `fileScores` after `searchQuery` + `activeFilters`
    applied. **All three views read from this, never from raw
    `fileScores` directly**, so filtering/search always stays in sync
    across treemap, list, and drawer.
  - `directoryTree` — `fileScores` reshaped into a nested tree by path
    segments, each node aggregating child risk (e.g. max or weighted-avg
    of descendants) for the treemap's hierarchical view.
- Every view sets `hoveredFilePath`/`selectedFilePath` on interaction;
  every view also reads them to render its own highlight state. This one
  piece of shared state is what makes the three views feel like one
  system — get this right before moving on.

### 2. Treemap
- Build the flat version first (file = leaf box, size = file size, color =
  risk score via `{colors.risk-low/mid/high}`), confirm it renders
  correctly against real scan data.
- Then add hierarchy: group leaves by directory using `directoryTree` from
  the store, render nested `ResponsiveTreeMap`, support click-to-zoom into
  a directory with a breadcrumb to zoom back out.
- Add a size-metric toggle (file size / churn / complexity) — changes what
  `value` is passed per node, not a new data fetch.
- Wire hover → `setHoveredFilePath`, click → `setSelectedFilePath` (opens
  the detail drawer, step 4).
- When `searchQuery` is active, cells not in `visibleFileScores` render at
  reduced opacity rather than being removed — removing nodes reflows the
  whole layout and is disorienting; dimming keeps spatial memory intact.
- Loading/empty states use the design system's card/skeleton treatment,
  not a bare spinner.

### 3. Ranked list
- `@tanstack/react-table` for column sorting/filtering logic +
  `@tanstack/react-virtual` for row virtualization — required once repos
  approach the PRD's 500-file scale, not optional polish.
- Columns: file path (monospace, `code-sm`), risk badge (`risk-badge`
  component, not a bare number — but show the precise number in a tooltip
  or secondary column for users who want to cite an exact figure), churn,
  complexity, unique contributors, top-contributor %, last changed.
- Filter controls above the table read/write `activeFilters` in the store
  — a risk-threshold slider or preset buttons, a bus-factor-only toggle,
  directory filter synced with treemap zoom state where practical.
- Row hover → `setHoveredFilePath`; row click → `setSelectedFilePath`
  (opens detail drawer, doesn't navigate to a new page).
- Table reads from `visibleFileScores`, sorts/paginates that — search and
  filters applied once, upstream, not re-implemented per view.

### 4. File detail panel (drawer, not a route change)
- Renders as a slide-over when `selectedFilePath` is set; closing clears
  it. Treemap and list stay mounted and visible behind/beside it.
- Sync `selectedFilePath` to a URL search param (`?file=<path>`) via
  `react-router-dom` so a specific file's detail view is shareable/
  deep-linkable — directly serves the PRD's "eng manager wants to show
  leadership a specific risky file" story.
- Content, top to bottom:
  1. File path + risk badge.
  2. LLM explanation, if present. If the scan is anonymous or this file
     wasn't in the top-N explained set, show a quiet locked-state prompt
     ("Sign in to get an AI explanation for this file") rather than
     omitting the section entirely — ties into the auth model from
     `AGENTS.md` and doubles as a login nudge.
  3. Metric cards: cyclomatic complexity, max nesting depth, file length —
     each with both the raw number and a plain-English relative framing
     ("higher than 90% of files in this repo"), computed client-side
     against the scan's own distribution, not a hardcoded threshold.
  4. Churn graph over time (recharts) — commits bucketed by week/month
     across the configured churn window.
  5. Contributor list — name, commit count, % share, with the
     bus-factor flag stated in plain English when top contributor > 80%
     ("one person has made most of the recent changes to this file").
  6. Footer actions: link to the file on GitHub, link to GitHub blame —
     an escape hatch to the real code, not something the drawer tries to
     replace.
- Never fetch anything extra on open if the data is already in
  `fileScores` — the drawer should render instantly from store data,
  with only the LLM explanation (if not already loaded) as a possible
  async fetch.

### 5. Cross-linking pass (after all three exist independently)
- Verify: hovering a list row highlights the correct treemap cell even
  while zoomed into a subdirectory.
- Verify: typing in search dims the same files in both treemap and list
  simultaneously, with no lag between them (they're reading the same
  memoized selector, so this should be automatic if step 1 was built
  correctly — if it's not automatic, that's a sign state got duplicated
  somewhere and should be fixed at the source, not patched per-view).
- Verify: opening the detail drawer from either view, then closing it,
  returns focus/scroll position in the underlying view rather than
  resetting it.

## Hard constraints

- No component fetches its own copy of scan data — everything reads from
  the shared store populated once per scan view.
- No component filters/searches independently — all three read from
  `visibleFileScores`, never from raw `fileScores`.
- The LLM explanation section must check auth/top-N gating client-side for
  *display* purposes only — the actual gating enforcement lives in the
  backend service per `AGENTS.md`; the frontend's job is to show the right
  state, not to be the source of truth for whether explanations are
  allowed.
- Risk-gradient colors (`risk-low/mid/high`) are used only for actual risk
  data in these views — not for UI chrome, not for the search/filter
  controls themselves.
- Treemap and list must both perform acceptably at ~500 files (PRD's
  stated scale) — virtualize the list, and if the treemap has performance
  issues at that scale, address it via the hierarchy/collapsing behavior
  (collapse deep directories by default) rather than by capping how much
  data gets shown.

## Non-goals for this pass

- Cross-scan diffing/trend view — out of scope per PRD §8; the schema's
  `previousScanId` field exists for later, not now.
- Multi-repo/org dashboard view.
- Editing anything — these views are read-only exploration surfaces.

## When in doubt

- If a UX choice trades off spatial/visual continuity (e.g., dimming vs.
  removing filtered nodes) against implementation simplicity, prefer
  continuity — these views exist to build spatial intuition about the
  codebase, and losing that on every filter change undermines the whole
  point of a heatmap.
- If unsure whether a metric needs plain-English framing or just the raw
  number, default to including both — PRD's explicit user story is "why is
  this risky," not just "what's the number."
