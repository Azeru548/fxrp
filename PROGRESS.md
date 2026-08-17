# Rowan — Session Progress

Last updated: Aug 14, 2026. Scratch notes to resume work quickly.

## Status: READY FOR SUBMISSION

- Demo recorded (video being edited), README + SUBMISSION.md updated with live
  on-chain evidence, repo pushed to `github.com/Azeru548/fxrp`.
- Landing page added: single page, landing first, app below the fold (`#launch`),
  with hero + settled-invoice card, How it works, Why Flare, Live on Coston2
  evidence, For developers, footer. Deep links unchanged.
- Remaining: paste demo video link into SUBMISSION.md §5, then submit.

## Deployed contracts (Coston2)

- **FxrpPay** (CURRENT, correct oracle): `0x29A63685474814fdaE2396251E1190aAF44aff72`
- **FxrpPay** (obsolete, stale oracle): `0x9D23bd20Ba9aFECB12181B7C8368CB26Ba9C296D` — DO NOT use
- **MockFXRP** (test FXRP token): `0x40bE15A4469DCF86d4CB07059A137f2611867739`
- FTSOv2 (constructor arg): `0xC4e9c78EA53db782E28f28Fdf80BaF59336B304d` (RESOLVED from on-chain ContractRegistry — the previously used `0x3d893C...Df726` is STALE and makes `calculateFeeById` revert)
- Feed: XRP/USD `0x015852502f55534400000000000000000000000000`

## Wallet / account

- MetaMask Account 1: `0x9b69143c90cfbed463556c73f8495e4ed9efbced`
- Test FXRP minted multiple times; current balance ~130 T-FXRP (mint tx
  `0xeaf237c1cc88242a3db904ab214a516ae57f52006a51e424567b95fc97cb3494`).

## Frontend changes made this session

- Vendored ethers locally: `frontend/ethers.umd.min.js` (CDN was DNS-blocked).
- Added wallet-selector **modal** (EIP-6963 + legacy detection) in `frontend/index.html` / `app.js`.
- Fixed `connectWith` bug (provider stored as map key, not in value).
- Chain-switch now tries `wallet_switchEthereumChain` then `wallet_addEthereumChain`, with manual fallback error.
- Errors show inside the modal (`renderWalletError`).
- Full UI revamp (impeccable skill): **light natural theme** (white/beige, nature
  green, light orange) with a **quiet-brutalist** pass (chunky 2px borders, hard
  offset shadows), segmented Create/Pay tabs, USD↔FXRP input with live hint,
  invoice card with status pill (`data-state`), copy-link block, wallet modal
  restyle. Brand renamed **FXRP Pay → Rowan**. See `DESIGN.md` / `PRODUCT.md`.
- Stuck MetaMask tx resolved (Settings → Advanced → "Clear activity and nonce data").
- Contract + token addresses now **pre-filled by default** and the app overwrites
  a stale `localStorage` contract — fixes "Enter the FxrpPay contract address"
  and paying into the obsolete contract.

## Demo state (CURRENT, verified on-chain)

- Invoice #4: $50.00 USD → **49.943 FXRP** paid, closed. Pay tx
  `0x8890dcb5bc8e77cb9cdb04951f0c0a01bc68f2390e18bf92fbaf88135418e7ce`.
- Invoice #0: $20.00 USD → **19.81 FXRP** paid, closed
  (`19814477051368041032` wei).
- Bugs fixed: stale FTSOv2 address (redeploy) + BigInt `pricing === 1` compare
  (now `Number(inv.pricing) === 1`).

## Next steps

1. Paste demo video link into `SUBMISSION.md` §5, then submit.
2. Optional: withdraw paid invoice #4 via Remix to show the merchant step.