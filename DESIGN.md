# Design — Rowan (frontend)

<!-- impeccable:design-schema 1 -->

## Visual World

**Quiet-brutalist light natural fintech** at Coinbase/Rainbow craft. Warm
white / beige canvas, nature green as the primary action accent, light orange
as a secondary warmth accent, **chunky 2px borders + hard offset shadows**,
tabular numerals for money. Grounded, direct, honest; expression never obscures
the task (Operate mode).

- Chosen by user (standing decision, Aug 13 2026), replacing the rejected dark
  canon: see the direction contract in `frontend/index.html` body comment and
  `PRODUCT.md` → Brand Commitments.

## Tokens

- Background: `--bg #f7f5ef` warm cream, flat (no gradients).
- Surface / panel: `--bg1 #ffffff`, input fill `--bg2 #fbfaf6`, hover `--bg3 #efede4`.
- Lines: `--line #e7e4d9`, `--line2 #dad6c9`; structural borders are **2px solid
  ink** (`var(--text)`) with hard offset shadows (`3–6px`).
- Text: `--text #1f2a23` deep green-ink, secondary `--text2 #4c5a50`, muted
  `--muted #7c887e`, placeholder `#a3aca3`.
- Nature green (primary action): `--green #2e6b4e`, hover `--green-hi #245a40`.
- Light orange (warmth accent): `--orange #e08b3c` for tints/favicon, deeper text
  variant `--orange-deep #a8621f` for any orange on white (prefix, Open pill) to
  hold 4.5:1 contrast, soft tint `--orange-soft #f5ecdd`.
- State: success `--ok #2f8f5b`, warning `= --warn var(--orange)`, danger
  `--danger #c4523f`, focus ring `rgba(46,107,78,.45)`.
- Panel & key blocks carry a hard offset shadow (`6px 6px`); buttons/chips use
  `3px 3px` that **presses flat on `:active`** (`translate(2px,2px)`).
- Radius scale is tight (`4–10px`) — sharp, structural, never pill-soft.
- Fonts: system sans stack (`ui-sans-serif`, -apple-system, Segoe UI, Roboto)
  + monospace stack (`--mono`: SF Mono, Cascadia, Segoe UI Mono, Consolas, Menlo)
  for addresses and the payment link. No webfont dependency (offline/locally
  served app).

## Composition & Layout

- Max-width **520px** single-column shell centered; generous vertical rhythm
  on desktop (34px top padding), mobile-first 20px.
- Header: brand mark (16px `X` in a green rounded square with two orange dots)
  + wordmark/tagline left; connection pill right (`conn-icon` + `#connect`).
- Segmented tab control (Create invoice / Pay invoice) as a 2-column grid in a
  recessed cream strip with an ink border; active tab fills green with white
  text and a 2px offset shadow.
- Form fields: label + optional hint on one row (`.field-head`), inputs with
  11px padding, 11px radius, cream fill, green focus ring.
- Amount field: affixed prefix (`$` or `FXRP`) in orange with live USD hint
  (`#amountHint` recomputes $ from cents as you type).
- Invoice card (pay view): status pill (colored dot per state via
  `data-state`), memo, `INVOICE #n · USD xx.xx` meta line, large tabular
  "NN.NN FXRP due" amount with green FXRP word, mono merchant address,
  primary green pay button.
- Payment-link result block: mono link in green + "Copy link" action in a
  recessed cream tray with a footer row.
- Wallet modal: centered white sheet, green icon + title header, vertical
  wallet rows with icon/name/chevron, error box styled as a red-tinted alert.

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

- Focus-visible ring (2px green + offset) on buttons, inputs, chips, nav,
  wallet rows.
- Button hover `--green-hi`; chips hover fill; copy button flips to "Copied ✓"
  for 1.8s then reverts.
- Invoice states driven by `#invoiceInfo[data-state]` → pill dot color:
  paid green, open orange, closed muted.

## Responsive

- Single column scales by max-width + media query (≥640px bumps top padding).
- Touch-friendly hit targets (≥40px). Works offline; vendor ethers locally.

## Non-Negotiables

- All functionality and deployed addresses preserved; every functional ID the
  app.js references is present and reachable.
- No gradient text, no glass-as-decoration, no hard offset shadows, no emoji
  as icons (SVG inline system only).
