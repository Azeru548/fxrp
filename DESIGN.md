# Design — FXRP Pay (frontend)

<!-- impeccable:design-schema 1 -->

## Visual World

**Canon dark fintech** at Coinbase/Rainbow craft. Near-black indigo-tinted
canvas, one blue action accent, hairline borders, tabular numerals for money.
Calm, precise, trustworthy; expression never obscures the task (Operate mode).

- Chosen by user (standing decision), over the seed's assigned boarding-pass
  direction: see the direction contract in `frontend/index.html` body comment
  and `PRODUCT.md` → Brand Commitments.

## Tokens

- Background: `#0b0d13` with two soft radial indigo glows (top-left, top-right).
- Surface / panel: `--bg1 #11141d`, input fill `--bg2 #161a26`, hover `--bg3 #1c2130`.
- Lines: `--line #222837`, `--line2 #2d3547`.
- Text: `--text #edf1fa`, secondary `--text2 #c3c9d9`, muted `--muted #8b93a7`.
- Accent/primary action: `--btn #3a63f5`, hover `--btn-hi #4f74ff`, accent text `--accent #8ea5ff`.
- State: success `#34d399`, warning `#fbbf24`, danger `#f87171`, focus ring `rgba(74,106,255,.55)`.
- Fonts: system sans stack (`ui-sans-serif`, -apple-system, Segoe UI, Roboto)
  + monospace stack (`--mono`: SF Mono, Cascadia, Segoe UI Mono, Consolas, Menlo)
  for addresses and the payment link. No webfont dependency (offline/locally
  served app).

## Composition & Layout

- Max-width **520px** single-column shell centered; generous vertical rhythm
  on desktop (34px top padding), mobile-first 20px.
- Header: brand mark (16px `X` in a blue rounded square) + wordmark/tagline
  left; connection pill right (`conn-icon` + `#connect`).
- Segmented tab control (Create invoice / Pay invoice) as a 2-column grid in a
  recessed strip: compact, first-class navigation mirroring app.js routing.
- Form fields: label + optional hint on one row (`.field-head`), inputs with
  11px padding, 11px radius, filled dark, accent focus ring.
- Amount field: affixed prefix (`$` or `FXRP`) with live USD hint
  (`#amountHint` recomputes $ from cents as you type).
- Invoice card (pay view): status pill (colored dot per state via
  `data-state`), memo, `INVOICE #n · USD xx.xx` meta line, large tabular
  "NN.NN FXRP due" amount, mono merchant address, primary pay button.
- Payment-link result block: mono link + "Copy link" action in a recessed
  tray with a footer row.
- Wallet modal: centered sheet, icon + title header, vertical wallet rows with
  icon/name/chevron, error box styled as a red-tinted alert.

## Type & Numbers

- Display amounts: 27px/800, `letter-spacing -0.02em`; body 14px; labels 12.5px
  semibold; hints 12px muted.
- `font-variant-numeric: tabular-nums` on all inputs, amounts, and the connect
  pill so balances and addresses align.
- Status/messages: success green (`.ok`), danger red (`.err`), in-progress
  secondary (`.run`).

## Motion

- One authored entrance: panel `rise` (8px → 0, 320ms cubic-bezier(.2,.7,.2,1));
  wallet sheet repeats it lighter. Button `:active` scale .99; loading spinner
  on `.btn .spin`. `prefers-reduced-motion: reduce` kills all motion.

## States

- Focus-visible ring (2px accent + offset) on buttons, inputs, chips, nav,
  wallet rows.
- Button hover `--btn-hi`; chips hover fill; copy button flips to "Copied ✓"
  for 1.8s then reverts.
- Invoice states driven by `#invoiceInfo[data-state]` → pill dot color.

## Responsive

- Single column scales by max-width + media query (≥640px bumps top padding).
- Touch-friendly hit targets (≥40px). Works offline; vendor ethers locally.

## Non-Negotiables

- All functionality and deployed addresses preserved; every functional ID the
  app.js references is present and reachable.
- No gradient text, no glass-as-decoration, no hard offset shadows, no emoji
  as icons (SVG inline system only).