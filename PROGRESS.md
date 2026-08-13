# FXRP Pay — Session Progress

Last updated: Aug 12, 2026. Scratch notes to resume work quickly.

## Deployed contracts (Coston2)

- **FxrpPay** (CURRENT, correct oracle): `0x29A63685474814fdaE2396251E1190aAF44aff72`
- **FxrpPay** (obsolete, stale oracle): `0x9D23bd20Ba9aFECB12181B7C8368CB26Ba9C296D` — DO NOT use
- **MockFXRP** (test FXRP token): `0x40bE15A4469DCF86d4CB07059A137f2611867739`
- FTSOv2 (constructor arg): `0xC4e9c78EA53db782E28f28Fdf80BaF59336B304d` (RESOLVED from on-chain ContractRegistry — the previously used `0x3d893C...Df726` is STALE and makes `calculateFeeById` revert)
- Feed: XRP/USD `0x015852502f55534400000000000000000000000000`

## Wallet / account

- MetaMask Account 1: `0x9b69143c90cfbed463556c73f8495e4ed9efbced`
- Has **50 test FXRP** minted (confirmed on-chain, tx `0xeaf237c1cc88242a3db904ab214a516ae57f52006a51e424567b95fc97cb3494`).

## Frontend changes made this session

- Vendored ethers locally: `frontend/ethers.umd.min.js` (CDN was DNS-blocked).
- Added wallet-selector **modal** (EIP-6963 + legacy detection) in `frontend/index.html` / `app.js`.
- Fixed `connectWith` bug (provider stored as map key, not in value).
- Chain-switch now tries `wallet_switchEthereumChain` then `wallet_addEthereumChain`, with manual fallback error.
- Errors show inside the modal (`renderWalletError`).
- Full UI revamp (impeccable skill): dark fintech canon, segmented Create/Pay tabs, USD↔FXRP input with live hint, invoice card with status pill (`data-state`), copy-link block, wallet modal restyle. See `DESIGN.md` / `PRODUCT.md`.
- Stuck MetaMask tx resolved (Settings → Advanced → "Clear activity and nonce data"). The stuck tx was never mined; on-chain nonce 2 is the mint.

## Demo state (CURRENT, verified on-chain)

- Invoice #0 on the **new** contract `0x29A636...aff72` = $20.00 USD pricing, **paid** 19.81 FXRP (`19814477051368041032` wei), `open=false`. Good demo evidence.
- Bugs fixed: stale FTSOv2 address (redeploy) + BigInt `pricing === 1` compare (now `Number(inv.pricing) === 1`).

## Next steps

1. Re-test full flow in `frontend/index.html` (serve via http.server on :8080):
   - Create invoice: USD 5000 ($50), token `0x40bE...7739`, merchant blank.
   - Pay: FxrpPay `0x29A6...aff72`, id `0`, Load → Approve & pay (needs C2FLR for oracle fee).
   - Withdraw: Remix → FxrpPay → At Address `0x29A6...aff72` → `withdraw(0)` / `withdraw(1)`.
2. Fill `SUBMISSION.md` blanks: demo video link, explorer txn links, traction signals.