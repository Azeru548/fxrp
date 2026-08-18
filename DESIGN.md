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

- **Single page, product first, sections spaced** (no redirects, no build):
  the `.page` shell (max-width **920px**) carries the landing. A **split hero** —
  left-aligned headline + one-liner + two CTAs + a live proof line, with the
  **settled-invoice card** (real Coston2 data) right — is followed by a
  full-width **proof band** (LIVE pulse + live stats: invoices settled, FXRP
  settled, custody, explorer link) separated by 2px rules. The working app
  follows in the `.app` shell (max-width **520px**) with `id="launch"`; deep
  links (`#/pay?c=..&id=..`) still land in the app panel.
- Landing (Persuade surface, same visual world): four clearly separated sections
  — How it works (unboxed editorial flow, three steps with thin top rules),
  Why Flare (one prose paragraph + a three-fact row: FAssets / FTSOv2 /
  Portable), Live on Coston2 (evidence line + a bordered address card), For
  developers (one code block + link format). Each section opens with a mono
  kicker and its own 2px top rule for rhythm; cards only where they earn it (the
  hero invoice card, the address block, the code block). No card-on-card
  stacking, no section numbers.
- Header: brand mark (16px `X` in a green rounded square with two orange dots)
  + wordmark/tagline left; connection pill right (`conn-icon` + `#connect`),
  shared by landing and app.
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

- Landing display: hero 36–60px/800 with `-0.03em`, left-aligned in a split
  column; section titles 28px/800; amounts on the invoice card 26px/800,
  `letter-spacing -0.02em`; body 14px; labels 12.5px semibold; hints 12px
  muted; mono for all addresses, links, code, and section kickers.
- `font-variant-numeric: tabular-nums` on all inputs, amounts, and the connect
  pill so balances and addresses align.
- Status/messages: success green (`.ok`), danger red (`.err`), in-progress
  secondary (`.run`).

## Motion

- One authored entrance: hero copy children stagger in (headline → lede → CTAs →
  proof line, `hero-in` 620ms cubic-bezier(.16,1,.3,1)) and the invoice card
  settles in on the right; the card's FXRP amount **counts up** on load
  (respects reduced motion); LIVE dots pulse (2.4s); paper grain drifts over
  the card (`14s`). Panel `rise` (8px → 0, 320ms) for app state changes; wallet
  sheet repeats it lighter. Landing scroll is native smooth (`scrollIntoView`
  on the hero CTAs / footer anchors). Button `:active` scale .99; loading
  spinner on `.btn .spin`. `prefers-reduced-motion: reduce` kills all motion.

## States

- Focus-visible ring (2px green + offset) on buttons, inputs, chips, nav,
  wallet rows.
- Button hover `--green-hi`; chips hover fill; copy button flips to "Copied ✓"
  for 1.8s then reverts.
- Invoice states driven by `#invoiceInfo[data-state]` → pill dot color:
  paid green, open orange, closed muted.

## Responsive

- Landing hero is a split grid that collapses to one column ≤820px (copy
  centered); the proof band wraps its stats; `.page` and `.app` shells scale by
  max-width. Media query ≥720px bumps top padding.
- Touch-friendly hit targets (≥40px). Works offline; vendor ethers locally.

## Non-Negotiables

- All functionality and deployed addresses preserved; every functional ID the
  app.js references is present and reachable (verified: 33/33).
- No gradient text, no glass-as-decoration, no emoji as icons (SVG inline
  system only). Landing claims are backed by real on-chain evidence, linked to
  the explorer.
