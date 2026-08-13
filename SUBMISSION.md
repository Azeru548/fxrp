# Flare Summer Signal — Submission

> Fill in the `[ ]` blanks and remove this note. Keep answers tight but specific.

## 1. Project name
**Rowan** — *Pay with XRP, settle on Flare.*

## 2. Selected bounty
**Bounty 1 — Interoperable Asset Products** (FXRP, FAssets)

## 3. Short product description
Merchants create payment links priced in **USD**, and any wallet pays them in
**FXRP** (the FAsset-wrapped XRP). The USD→FXRP conversion happens **on-chain
via the FTSOv2 XRP/USD price feed** — no off-chain rate, no trusted price
source. Funds settle as FXRP on Flare and the merchant withdraws on demand.

## 4. Target user
- **Merchants** who want to accept XRP/FXRP payments without running
  infrastructure or trusting a custodian.
- **XRP/FXRP holders** who currently cannot spend XRP in DeFi; here they pay
  merchants directly in the interoperable asset.

## 5. Demo link / video / working app
- Frontend (no build step; run `python -m http.server 8080` or VS Code Live
  Server, then open `http://localhost:8080`, connect a wallet, and pay the link):
  `frontend/index.html`
- Demo video: [ ] (record a 2–3 min Loom screen capture: create invoice → pay → withdraw)
- Deployed on: **Coston2** (Flare Testnet)

## 6. GitHub repo / technical materials
https://github.com/Azeru548/fxrp

## 7. How the project uses Flare
- **FAssets (FXRP)**: invoices are settled in FXRP, the FAsset that makes XRP
  usable on Flare — the hackathon's headline interoperable asset.
- **FTSOv2**: `getFeedByIdInWei(XRP/USD)` converts USD-denominated invoices to
  FXRP at payment time, pays the oracle fee in FLR, and refunds excess
  atomically.
- **Portability**: one constructor arg (FTSOv2 address) → runs on Coston2,
  Songbird, or Flare Mainnet.

## 8. What was newly built / ported / integrated / improved during the program
- **New:** `FxrpPay` invoice contract (fixed-FXRP and USD-priced modes), static
  payment-link frontend, test token `MockFXRP`.
- **New integration:** on-chain USD→FXRP settlement via FTSOv2 with FLR fee
  handling and atomic refund of excess.
- **New UX:** wallet-selector modal (EIP-6963) so the demo works with any EVM
  wallet extension, not just MetaMask.
- **Tested:** deployed on Coston2, create → pay → withdraw flow. [ ] link to
  explorer txns

## 9. Smart contract addresses / deployment details
- `FxrpPay`:
  `0x29A63685474814fdaE2396251E1190aAF44aff72`
  ([Coston2](https://coston2-explorer.flare.network/address/0x29A63685474814fdaE2396251E1190aAF44aff72))
- `MockFXRP`:
  `0x40bE15A4469DCF86d4CB07059A137f2611867739`
  ([Coston2](https://coston2-explorer.flare.network/address/0x40bE15A4469DCF86d4CB07059A137f2611867739))
- FTSOv2 used: `0xC4e9c78EA53db782E28f28Fdf80BaF59336B304d` (Coston2)
- Feed: XRP/USD `0x015852502f55534400000000000000000000000000`
- Test FXRP mint tx:
  [0xeaf237c...](https://coston2-explorer.flare.network/tx/0xeaf237c1cc88242a3db904ab214a516ae57f52006a51e424567b95fc97cb3494)

## 10. Roadmap / next steps
1. Flare Smart Accounts — pay from an XRPL wallet directly (XRP → FXRP → pay).
2. Auto-withdraw on full payment + webhooks for shop backends.
3. Recurring/subscription invoices.
4. Deploy to Songbird then Flare Mainnet with the real FXRP token.

---

## Optional signals (help judges a lot — fill what you can)
- **Network:** Coston2 ✔ (Songbird/Mainnet planned).
- **User acquisition / testing / feedback:** [ ] e.g. X XRP holders tested, N
  demo invoices, merchant feedback.
- **Traction:** [ ] pilot users, community interest, partner conversations.
