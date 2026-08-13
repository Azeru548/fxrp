# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Existing static, no-build frontend: `frontend/index.html` + `frontend/app.js` (vanilla JS, ethers from vendored `ethers.umd.min.js`). No build step on purpose — must stay static and runnable from a local server (served via `python -m http.server` or VS Code Live Server at `http://localhost:8080`).

## Users

- **Merchants** who want to accept XRP/FXRP payments without running infrastructure or trusting a custodian.
- **XRP/FXRP holders** who currently cannot spend XRP in DeFi; they pay merchants directly in the interoperable asset.
- **Hackathon judges** evaluating the demo (Bounty 1: Interoperable Asset Products). The interface doubles as a demo surface: it must teach the Flare/FXRP/FTSOv2 story fast and let a one-shot demo flow work.

## Product Purpose

FXRP Pay lets a merchant create a payment link priced in USD (converted on-chain by Flare FTSOv2 XRP/USD feed) or in a fixed FXRP amount, and lets any wallet pay it in one click. Funds settle as FXRP (the FAsset-wrapped XRP) on Flare; the merchant withdraws on demand.

## Positioning

The USD→FXRP conversion happens on-chain via the FTSOv2 price feed — no off-chain exchange rate, no trusted price source. Same contract deploys to Coston2, Songbird, and Flare Mainnet unchanged.

## Operating Context

Two things to do inside the app, plus a merchant settlement step in Remix:
1. **Create invoice** — choose USD (cents) or fixed FXRP, merchant address (defaults to connected wallet), payment token address (FXRP/MockFXRP), memo → produces a shareable deep link (`#/pay?c=<contract>&id=<n>`).
2. **Pay invoice** — open the link or enter contract + id, load, approve token, pay (FLR oracle fee currently 0 on Coston2 for XRP/USD).
3. **Withdraw / cancel** — currently done in Remix via the contract; not in the UI yet.

Presentation also carries the hackathon framing: an explainer of why it uses Flare (FXRP + FTSOv2) is part of the demo.

## Capabilities and Constraints

- Static, no build step; vanilla JS + ethers v6 (BrowserProvider). Must keep working from a local server.
- Wallet connection via EIP-6963 wallet-selector modal + legacy injected-provider fallback; network auto-switch to Coston2 (chain 114).
- USD invoices convert on-chain via FTSOv2; fixed-FXRP invoices need no oracle fee.
- Deployed contracts (Coston2): `FxrpPay` = `0x29A63685474814fdaE2396251E1190aAF44aff72`, MockFXRP = `0x40bE15A4469DCF86d4CB07059A137f2611867739`.
- All existing functionality and addresses must keep working in the revamp. Copy labels/helpers may be clarified but core flows, field semantics, and the deep-link format stay intact.

## Brand Commitments

Name: **FXRP Pay** — tagline **Pay with XRP, settle on Flare.** No other visual commitment exists; the current dark-purple theme is an incumbent look, not a binding brand.

**Standing decision (canon, selected by user Aug 12 2026):** execute the category standard — a polished **dark fintech app** — at full fidelity without irony. Craft benchmark: **Rainbow / Coinbase**-grade web3 wallet/payment UX (audible, precise, premium). This is a binding brand commitment for the revamp.

## Evidence on Hand

- Deployed and verified on Coston2; a real invoice (#0) was created and paid successfully (19.81 FXRP settled, invoice closed).
- Mint transaction confirms 50 test FXRP mint works.
- Explorer links and contract addresses recorded in README/SUBMISSION/PROGRESS.

## Product Principles

1. Price in USD, settle on-chain — the FXRP/FTSOv2 story is the whole point; the UI should make it visible, not hide it.
2. One-click flow for anyone; the demo (create → pay → withdraw) must be operable under judging pressure.
3. Static, dependency-frugal, local-server friendly; no build step bloat.
4. Clear, honest state: open/paid/closed, due amounts, contract addresses always visible.
5. Trust through transparency: show the on-chain details (contract, oracle, feed) rather than hiding them.

## Accessibility & Inclusion

No product-specific standard established. Revamp should keep accessible inputs/labels, sufficient contrast, and keyboard operability as a baseline.