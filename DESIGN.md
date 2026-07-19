---
version: alpha
name: Cartograph-design
description: |
  A documentation-first, restrained system in the spirit of Ollama's
  minimal home page — paper-white canvas, pill-geometry interactive
  elements, hairline-bordered flat cards, one inverted dark moment per
  page — but reskinned around Cartograph's own subject: mapping risk in a
  codebase. Where Ollama has no color beyond black/white/gray, Cartograph
  earns exactly one signature accent system: a muted risk gradient
  (moss → ochre → brick) used ONLY to encode actual risk data (treemap
  cells, score badges, churn bars) — never as decoration. A single deep
  "blueprint blue" carries links, focus, and the one brand accent outside
  the data gradient. The llama mascot is replaced by a small treemap glyph
  — a 2×3 grid of risk-colored tiles — used as logo, favicon, and loading
  state. The terminal-card "product preview" becomes a heatmap-preview-card:
  a static sample treemap that explains the product before anyone scrolls.

colors:
  primary: "#000000"
  on-primary: "#ffffff"
  ink: "#000000"
  ink-deep: "#090909"
  charcoal: "#525252"
  body: "#737373"
  mute: "#a3a3a3"
  canvas: "#ffffff"
  surface-soft: "#fafafa"
  surface-card: "#ffffff"
  hairline: "#e5e5e5"
  hairline-strong: "#d4d4d4"
  on-dark: "#ffffff"
  on-dark-mute: "rgba(255,255,255,0.7)"
  surface-dark: "#14181f"
  focus-ring: "rgba(31,58,95,0.35)"
  link: "#1f3a5f"
  link-mute: "#737373"
  # --- Cartograph signature: the risk gradient. Used exclusively to encode
  # real churn/complexity/bus-factor data — treemap cells, score badges,
  # churn bars. Never used as a background wash or arbitrary decoration.
  risk-low: "#3f7d5c"
  risk-low-soft: "#e7f0ea"
  risk-mid: "#c9922f"
  risk-mid-soft: "#f8ecd8"
  risk-high: "#a8402f"
  risk-high-soft: "#f6e1dd"
  # --- Cartograph signature: the one brand accent outside the data gradient.
  # A deep survey/blueprint blue — ties to cartography rather than being an
  # arbitrary brand color. Carries links, focus rings, and the treemap glyph.
  accent: "#1f3a5f"
  accent-soft: "#e9edf2"

typography:
  display-xl:
    fontFamily: Space Grotesk
    fontSize: 36px
    fontWeight: 500
    lineHeight: 1.11
    letterSpacing: -0.01em
  display-lg:
    fontFamily: Space Grotesk
    fontSize: 30px
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: -0.01em
  heading-lg:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: 500
    lineHeight: 1.33
    letterSpacing: 0
  heading-md:
    fontFamily: ui-sans-serif
    fontSize: 20px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0
  heading-sm:
    fontFamily: ui-sans-serif
    fontSize: 18px
    fontWeight: 500
    lineHeight: 1.56
    letterSpacing: 0
  body-md:
    fontFamily: ui-sans-serif
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  body-strong:
    fontFamily: ui-sans-serif
    fontSize: 16px
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: 0
  body-sm:
    fontFamily: ui-sans-serif
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.43
    letterSpacing: 0
  body-sm-strong:
    fontFamily: ui-sans-serif
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.43
    letterSpacing: 0
  caption-sm:
    fontFamily: ui-sans-serif
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.33
    letterSpacing: 0
  # --- Cartograph signature: monospace is load-bearing, not decorative.
  # File paths, scores, commit counts, and contributor stats appear
  # constantly — code type gets its own real hierarchy, unlike Ollama's
  # single curl-snippet use of `ui-monospace`.
  code-lg:
    fontFamily: JetBrains Mono
    fontSize: 18px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.43
    letterSpacing: 0
  button-md:
    fontFamily: ui-sans-serif
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1
    letterSpacing: 0

rounded:
  none: 0px
  sm: 6px
  md: 8px
  lg: 12px
  full: 9999px

spacing:
  xxs: 2px
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  xxl: 32px
  section: 88px

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.full}"
    padding: 8px 20px
    height: 36px
  button-primary-active:
    backgroundColor: "{colors.ink-deep}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.full}"
  button-secondary:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.button-md}"
    rounded: "{rounded.full}"
    padding: 8px 20px
    height: 36px
    border: 1px solid {colors.hairline-strong}
  button-disabled:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.mute}"
    rounded: "{rounded.full}"
  repo-input-pill:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.code-md}"
    rounded: "{rounded.full}"
    padding: 12px 20px
    height: 48px
    border: 1px solid {colors.hairline}
  risk-badge:
    typography: "{typography.body-sm-strong}"
    rounded: "{rounded.full}"
    padding: 2px 10px
    # backgroundColor/textColor resolved per severity, e.g.:
    # low  -> bg {colors.risk-low-soft}  / text {colors.risk-low}
    # mid  -> bg {colors.risk-mid-soft}  / text {colors.risk-mid}
    # high -> bg {colors.risk-high-soft} / text {colors.risk-high}
  treemap-glyph:
    rounded: "{rounded.sm}"
    size: 4px-tile grid, 2 cols x 3 rows
    # fixed reference palette for the glyph specifically (not data-bound):
    # tile colors cycle {colors.risk-low}, {colors.risk-mid}, {colors.risk-high},
    # {colors.accent}, {colors.charcoal}, {colors.risk-low} — a still-life of
    # what a real heatmap looks like, not a literal live score
  heatmap-preview-card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: 16px
    border: 1px solid {colors.hairline}
  file-row:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.none}"
    padding: 12px 0px
    border-bottom: 1px solid {colors.hairline}
  scan-summary-strip:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.on-dark}"
    typography: "{typography.heading-lg}"
    rounded: "{rounded.lg}"
    padding: 24px 32px
  primary-nav:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm-strong}"
    rounded: "{rounded.none}"
    height: 56px
  footer-section:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.body}"
    typography: "{typography.caption-sm}"
    rounded: "{rounded.none}"
    padding: 32px 24px
---

## Overview

Cartograph keeps Ollama's core discipline — a paper-white canvas, pill
geometry for everything interactive, hairline-bordered flat cards, and
exactly one inverted dark moment per page — because that discipline is a
genuinely good fit for a developer tool: it gets out of the way of the data.
What it does not keep is Ollama's *personality*. A rounded, friendly display
face and zero color exist because Ollama is a consumer install page; a
repo-risk tool has a different job, and its restraint should look
deliberate and technical rather than soft.

Cartograph earns exactly one real color system beyond ink/white/gray: the
**risk gradient** (moss `{colors.risk-low}` → ochre `{colors.risk-mid}` →
brick `{colors.risk-high}`). It is used only where it means something —
treemap cells, risk badges, churn bars — never as a background wash, a
button color, or a decorative accent. Everywhere else, the palette stays as
disciplined as Ollama's. A single additional accent, a deep "blueprint
blue" (`{colors.accent}`), carries links and focus states — a nod to
cartography and survey drawings rather than an arbitrary brand color.

The mascot is gone; in its place is a small **treemap glyph** — a 2×3 grid
of risk-colored rounded tiles — used as the logo mark, favicon, and loading
state. It is not decorative illustration, it is a miniature of the actual
product output, the same way Ollama's terminal-mockup card previewed its
actual CLI. That card is replaced here by the **heatmap-preview-card**: a
static sample treemap sitting where Ollama put its curl snippet — the one
thing on the page that explains what Cartograph does without reading a
word of copy.

**Key characteristics:**
- Paper-white canvas end-to-end, hairline borders only, no shadows — inherited from the base system
- `{rounded.full}` for every button and input, `{rounded.lg}` for cards — same two-value shape vocabulary as the base system
- Space Grotesk for display type instead of SF Pro Rounded — geometric and a little technical rather than soft/consumer
- JetBrains Mono given real hierarchy (`code-lg/md/sm`) rather than one decorative use — file paths and scores are core content, not a flourish
- The risk gradient is the only color in the system, and it is data-bound, never decorative
- One inverted dark surface per page (`{component.scan-summary-strip}`), repurposed from Ollama's pricing tier into a post-scan stat callout ("14 files flagged · 3 bus-factor risks")
- Treemap glyph replaces the llama as the system's one recurring illustrative mark

## Do's and Don'ts

### Do
- Use `{component.button-primary}` (black pill) for the primary action, same as the base system — no risk-gradient color ever appears on a button.
- Reserve the risk gradient strictly for real computed data: treemap cells, `{component.risk-badge}`, churn bars, complexity indicators. If a color in the UI doesn't correspond to an actual score, it isn't from this palette.
- Keep monospace (`code-lg/md/sm`) for anything that is literally data from the repo: file paths, commit counts, percentages, scores. Keep `ui-sans-serif` for everything that is prose.
- Use the treemap glyph anywhere Ollama would reach for the llama — logo, favicon, empty states, loading spinners — at fixed pixel sizes, not scaled like a hero image.
- Keep exactly one `{component.scan-summary-strip}` (dark, inverted) per page. It's the "look here" cue — using it twice cancels its own effect.

### Don't
- Don't let the risk gradient leak into chrome — nav, footer, buttons, and links stay ink/white/blueprint-blue only.
- Don't reintroduce SF Pro Rounded or any soft/rounded display face — the geometric grotesk is what separates this from reading as an Ollama reskin.
- Don't add drop shadows or gradients-as-background. The only "gradient" concept in this system is the three discrete risk steps, applied as flat fills, never blended.
- Don't use `{colors.risk-high}` (brick) as a generic error/danger color for form validation or system errors — it means "risky file," not "something broke." Use plain `{colors.ink}`/`{colors.body}` copy for actual error states, per the base system's minimal semantic-color philosophy.

## Inherited, Unchanged from Base System

Unless noted above, the following carry over directly from the base Ollama
system and should be treated as already-decided: spacing scale and the
88px section rhythm, border-radius scale, elevation rules (hairline border
or dark-invert only, never shadow), responsive breakpoints and collapsing
strategy, touch-target sizing, and the overall "page as a single Markdown
reading column" layout philosophy.