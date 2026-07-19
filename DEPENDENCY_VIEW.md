# DEPENDENCY_VIEW.md — Cartograph

Build guidance for a per-file dependency ("blast radius") feature. Read
`AGENTS.md` and `CORE_VISUALIZATION.md` first.

## Scope guardrail — read this before building anything

This is **not** a whole-repo dependency graph explorer. A force-directed
graph of an entire codebase becomes unreadable past a few dozen nodes, and
a general "explore how everything connects" tool is close to the
"repo explainer" product PRD §4 explicitly separates from Cartograph.

What this actually is: a **per-file** view, living inside the existing
file detail drawer, answering one bounded question — *"what does this
file depend on, and what depends on it."* Nothing here renders more than
one file's immediate (1-hop) neighborhood at a time.

## Why this is worth building

It surfaces a real risk dimension the current formula can't see: a file
with low complexity but many dependents is still dangerous to touch — its
blast radius is large even if its own metrics look clean. This pass only
*visualizes* that; it does not change the risk score formula (that's a
separate, bigger decision — not in scope here).

## Data model

New Prisma model — edges are computed once per scan, alongside file
scoring, not on demand:

```prisma
model FileDependency {
  id           String   @id @default(cuid())
  scanId       String
  scan         Scan     @relation(fields: [scanId], references: [id])
  fromPath     String   // the file containing the import
  toPath       String   // the file being imported (repo-relative, resolved)
  createdAt    DateTime @default(now())

  @@index([scanId, fromPath])
  @@index([scanId, toPath])
  @@map("file_dependencies")
}
```

Add the reverse relation (`dependencies FileDependency[]`) to `Scan`.
Only internal, resolvable imports become edges — skip `node_modules`/
external package imports entirely; they're not part of "what in this repo
depends on what."

## Build order

### 1. Backend — extend the existing AST pass, don't add a new one
- In `services/analysis/complexity.service.ts` (or a new sibling
  `services/analysis/dependency-graph.service.ts` called from the same
  pipeline stage), while each file's `SourceFile` is already open for
  complexity analysis, also collect its import declarations.
- Resolve each relative import specifier (`./foo`, `../bar/baz`) to an
  actual repo-relative file path. Skip anything that doesn't resolve to a
  file inside the repo (external packages, path aliases you're not
  ready to resolve yet — log and skip rather than guessing).
- Write all edges for the scan in one batch (`prisma.fileDependency.createMany`),
  same pattern as `FileScore` writes in `scan-repo.job.ts`.
- This runs during the existing `ANALYZING` stage — no new `ScanStatus`
  value needed.

### 2. API
- Extend whatever endpoint already returns `FileScore[]` for a scan to
  also return the full `FileDependency[]` list once, alongside it — don't
  add a per-file endpoint that gets called every time a drawer opens.
  Compute "imports" vs. "imported by" client-side from the one edge list,
  same principle as `CORE_VISUALIZATION.md`'s "no component fetches its
  own copy of data" rule.

### 3. Shared store
- Add `dependencies: FileDependency[]` to the scan store alongside
  `fileScores`.
- Derived selectors: `getDependenciesFor(path)` → `{ imports: string[],
  importedBy: string[] }`, memoized, computed from the edge list — this
  is cheap even for 500 files since it's a simple filter, not a graph
  traversal.

### 4. File detail panel — new "Connections" section
- Add below the existing contributor list (per `CORE_VISUALIZATION.md`
  step 4's content order): two labeled lists, "Imports (N)" and
  "Imported by (N)."
- Each row is a file path (monospace) that's clickable — clicking calls
  `setSelectedFilePath`, jumping the same drawer to that file, exactly
  like clicking a row in the ranked list. No navigation, no new drawer
  instance.
- Cap each list to a reasonable number shown by default (e.g. top 8,
  sorted by that neighbor's own risk score if there are more) with a
  "+N more" that expands the full list — this is what keeps a
  high-fan-in file (say, a shared `utils.ts` with 40 dependents) from
  turning the drawer into a wall of text.
- Optional small visual: a tiny 1-hop radial diagram (selected file in
  the center, up to ~8 neighbors around it, direction shown by arrow) —
  bounded node count keeps this readable where a full graph wouldn't be.
  A lightweight SVG layout is enough here; this doesn't need a real
  force-simulation library given the node count is always small.

### 5. Cross-linking (optional, do last)
- When "Connections" is open for a file, lightly highlight its
  direct neighbors in the treemap/ranked list (a different visual weight
  than the search-dim behavior already built, so the two don't look
  identical and confuse what's being shown).

## Non-goals for this pass

- No whole-repo graph view/explorer.
- No multi-hop traversal UI ("show me everything 3 levels out").
- No changes to the risk-score formula based on dependency count — that's
  a separate, deliberate decision if it happens at all, not a side effect
  of shipping this visualization.
- Circular-dependency detection is a near-free byproduct of having the
  edge table (a cycle is trivial to detect once edges are stored), but
  it's a distinct feature with its own UI — worth flagging as a cheap
  future add-on, not building here.

## When in doubt

- If a design choice would require rendering more than ~10-15 nodes at
  once, that's a sign the feature is drifting toward the graph-explorer
  shape this doc explicitly avoids — pull back to the capped/paginated
  list instead.
