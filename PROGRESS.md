# FXRP Pay — Session Progress

Last updated: Aug 12, 2026. Scratch notes to resume work quickly.

## Deployed contracts (Coston2)

- **FxrpPay**: `0x9D23bd20Ba9aFECB12181B7C8368CB26Ba9C296D`
- **MockFXRP** (test FXRP token): `0x40bE15A4469DCF86d4CB07059A137f2611867739`
- FTSOv2 (constructor arg): `0x3d893C53D9e8056135C26C8c638B76C8b60Df726`
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

## CURRENT BLOCKER — stuck MetaMask tx

- Pending "Interaction in progress" on Coston2 since **Aug 12, 12:19 PM** — blocks all new MetaMask transactions (error: "A previous transaction is still being signed or submitted").
- **Fix A:** MetaMask → Activity → that tx → Cancel (confirm cancel tx).
- **Fix B (bypass):** connect via a different wallet extension in the app's wallet modal (they have clean tx queues).

## Next steps after unblocking

1. Clean the stuck tx (A or B above).
2. Test full flow in `frontend/index.html` (serve via Live Server / http.server on :8080):
   - Create invoice: USD 5000 ($50), token `0x40bE...7739`, merchant blank.
   - Pay: FxrpPay `0x9D23...296D`, id `0`, Load → Approve & pay (needs C2FLR for oracle fee + USD pricing is on-chain via FTSOv2).
   - Withdraw: Remix → FxrpPay → At Address `0x9D23...296D` → `withdraw(0)`.
3. Fill `SUBMISSION.md` blanks: contract addresses, GitHub repo URL, demo video link, explorer txn links, traction signals.