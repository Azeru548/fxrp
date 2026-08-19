# Rowan

**Pay with XRP, settle on Flare.**

Rowan lets any merchant create a payment link — priced in **USD** (converted
on-chain by the Flare **FTSOv2** XRP/USD price feed) or in a fixed amount of
**FXRP** (the FAsset-wrapped XRP) — and lets any wallet pay it in one click.
Funds settle as FXRP on Flare and the merchant withdraws when ready.

Built for the **Flare Summer Signal** hackathon, Bounty 1 (Interoperable Asset
Products).

---

## Why it matters

XRP is the largest asset without native smart contracts, and FXRP brings it
into EVM DeFi via Flare FAssets. But there is no easy way for an XRP/FXRP holder
to *pay a merchant* in a stable, USD-denominated amount. Rowan turns Flare
into a real payment rail:

- Merchants price in **USD** (what customers understand), settlement happens in
  **FXRP** (the interoperable asset on Flare).
- The USD→FXRP conversion happens **on-chain via FTSOv2** — no off-chain
  exchange rate, no trusted price source.
- Works with any EVM wallet on Coston2 today; the same contract deploys to
  Songbird and Flare Mainnet unchanged.

## How it uses Flare

| Flare primitive | Where it's used |
| --- | --- |
| **FAssets (FXRP)** | Invoices are paid in FXRP, the FAsset that makes XRP usable on Flare. The contract accepts any ERC-20 (default FXRP), so it settles the underlying interoperable asset natively. |
| **FTSOv2** | `getFeedByIdInWei(XRP/USD)` converts USD invoice amounts to FXRP at payment time. The oracle fee is paid in FLR and any excess is refunded to the payer atomically. |
| **Flare networks** | Deployed on Coston2 (testnet) for the demo; single constructor arg (FTSOv2 address) makes it portable to Songbird/Mainnet. |

## Live deployment (Coston2)

- `FxrpPay`: [`0x29A63685474814fdaE2396251E1190aAF44aff72`](https://coston2-explorer.flare.network/address/0x29A63685474814fdaE2396251E1190aAF44aff72)
- `MockFXRP`: [`0x40bE15A4469DCF86d4CB07059A137f2611867739`](https://coston2-explorer.flare.network/address/0x40bE15A4469DCF86d4CB07059A137f2611867739)
- FTSOv2 (CONSTRUCTOR ARG): `0xC4e9c78EA53db782E28f28Fdf80BaF59336B304d` (Coston2, XRP/USD feed fee = 0)
- MockFXRP mint tx: [`0xeaf237c...`](https://coston2-explorer.flare.network/tx/0xeaf237c1cc88242a3db904ab214a516ae57f52006a51e424567b95fc97cb3494)

### Demo evidence

The full create → pay → withdraw flow has been run live on Coston2 during the program:

- Invoice #4: $50.00 USD → settled **49.943 FXRP** on-chain, closed
  ([pay tx](https://coston2-explorer.flare.network/tx/0x8890dcb5bc8e77cb9cdb04951f0c0a01bc68f2390e18bf92fbaf88135418e7ce))
- Invoice #0: $20.00 USD → settled **19.81 FXRP** on-chain, closed
- Both bugs found through live testing (stale oracle address, frontend BigInt
  comparison) fixed and shipped.

## Repo layout

```
contracts/
  FxrpPay.sol    # Single-file invoice contract, no imports — compiles in Remix
  MockFXRP.sol   # Test ERC-20 standing in for FXRP on testnets
frontend/
  index.html     # Static payment-link app (no build step)
  app.js
sdk/
  src/           # @rowan/fxrp-pay-sdk — typed TypeScript SDK (see sdk/README.md)
  abi/           # Generated machine-readable ABI (FxrpPay.json)
  scripts/       # build (ESM+CJS), gen-abi, live smoke test
scripts/
  compile-check.js  # Local syntax/compile verification via solc
```

## Contract

`FxrpPay.sol` (Solidity 0.8.20+, dependency-free):

- `createInvoice(payee, token, pricing, amount, memo)` — merchant creates a
  link. `pricing=0` fixed FXRP amount, `pricing=1` USD cents.
- `pay(id)` — payer approves the token, then pays the exact remaining due.
  USD invoices fetch the FTSOv2 XRP/USD price on-chain, pay the oracle fee from
  `msg.value`, and refund the excess.
- `withdraw(id)` / `cancelInvoice(id)` — merchant pulls collected FXRP or closes
  the link. Invoices auto-close when fully paid.
- `getDue(id)`, `isPaid(id)`, `oracleFee()`, `getXrpUsdPriceWei()` — read helpers.

## Deploy (Remix IDE — no local toolchain needed)

1. Open https://remix.ethereum.org → `contracts/FxrpPay.sol` → compile with
   **0.8.20+** (optimizer on).
2. Add **Flare Testnet Coston2** to MetaMask:
   - RPC `https://coston2-api.flare.network/ext/C/rpc`
   - Chain ID `114`, currency `C2FLR`
3. Get free gas: https://faucet.flare.network/coston2
4. Deploy `FxrpPay` with constructor arg `0xC4e9c78EA53db782E28f28Fdf80BaF59336B304d`
   (FTSOv2 on Coston2). Note the deployed address.
5. Deploy `MockFXRP.sol`, then `mint` test FXRP to your wallet.

Verify locally anytime with: `npm install && npm run check`

## Use the app

Serve the folder locally (wallet extensions need a real origin, not `file://`):

```
cd frontend
python -m http.server 8080        # or "py -m http.server 8080"
```

Open `http://localhost:8080` in a browser. The deployed contract and test token
addresses are pre-filled, so you only need to connect a wallet.

1. **Connect wallet** → a modal lists your installed wallet extensions
   (EIP-6963); pick one and approve. Getting prompted to switch to Coston2 is
   normal.
2. **Create invoice** → pick USD or fixed FXRP, paste the MockFXRP token address
   (`0x40bE15A4469DCF86d4CB07059A137f2611867739` on Coston2), click *Create
   payment link*, copy the link.
3. **Pay** → open the link (or the *Pay invoice* tab), enter the FxrpPay
   contract (`0x29A63685474814fdaE2396251E1190aAF44aff72`) + invoice id, *Load
   invoice*, then *Approve & pay*. The wallet prompts for the FXRP transfer
   (the XRP/USD oracle fee is 0 on Coston2).
4. Merchant → `withdraw(id)` on Remix to pull collected FXRP.

## Integrate into your app

There are two integration paths — a **typed SDK** (recommended) or the raw
contract.

### Typed SDK (`sdk/`)

`@rowan/fxrp-pay-sdk` wraps the contract with TypeScript types, auto-approval,
oracle-fee handling, and payment-link helpers. ESM + CJS, ethers v6 peer dep.
See [`sdk/README.md`](sdk/README.md).

```bash
npm install @rowan/fxrp-pay-sdk ethers
```

```ts
import { FxrpPayClient, PRICING_USD } from "@rowan/fxrp-pay-sdk";

// Merchant: create a $49.99 invoice and get its payment link
const client = await FxrpPayClient.fromBrowserProvider(window.ethereum);
const { id, link } = await client.createInvoice({
  pricing: PRICING_USD,
  amount: "4999",
  memo: "Order #1234",
}); // link === "#/pay?c=0x29A6...&id=7"

// Payer: pay it in one click (auto-approves, sends oracle fee)
const result = await client.pay(id);
console.log("Paid!", result.totalPaid, "tx:", result.txHash);

// Merchant: withdraw collected FXRP
await client.withdraw(id);
```

### Raw contract

Everything is one public contract with three calls, so any EVM app can accept
FXRP payments without running infrastructure:

- `createInvoice(payee, token, pricing, amount, memo)` — merchant creates a link
  and gets an invoice id.
- `pay(id)` — any wallet approves the token and pays the exact due.
- `withdraw(id)` — merchant pulls the settled FXRP.

The **payment link is the integration point**: link format
`#/pay?c=<FxrpPay address>&id=<invoice id>`. Drop it into any checkout, email,
or QR code — the payer lands in Rowan with the invoice pre-loaded and pays in
one click. Machine-readable ABI: `sdk/abi/FxrpPay.json`. No server or API to
run.

## Next steps / roadmap

- **Flare Smart Accounts**: let payers authorize directly from an XRPL wallet
  (XRP → FXRP mint → pay) in one flow, removing the EVM wallet requirement.
- **Auto-withdraw + webhooks**: settle to the merchant on full payment, notify
  shop backends.
- **Recurring / subscription invoices** and fiat-denominated refunds.
- Deploy to **Songbird** and **Flare Mainnet** with the real FXRP token address.
- Merchant dashboard (invoice list, payment history, CSV export).
