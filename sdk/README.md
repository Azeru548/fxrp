# @rowan/fxrp-pay-sdk

Typed TypeScript SDK for **Rowan** — pay with XRP, settle on Flare.

Rowan turns Flare into a payment rail: a merchant creates an invoice priced in
**USD** (converted on-chain by FTSOv2 at payment time) or in a fixed amount of
**FXRP**, and any wallet pays it in one click. Funds settle as FXRP on Flare and
the merchant withdraws when ready.

This SDK wraps the single `FxrpPay` contract so any EVM app can accept FXRP
payments without running infrastructure. It ships with both ESM and CJS builds
and full TypeScript types.

## Install

```bash
npm install @rowan/fxrp-pay-sdk ethers
```

`ethers` v6 is a peer dependency.

## Quick start

### 1. Create an invoice (merchant side)

```ts
import { FxrpPayClient, PRICING_USD } from "@rowan/fxrp-pay-sdk";

// Connect the merchant wallet (MetaMask / Rabby / any EIP-1193 provider).
const client = await FxrpPayClient.fromBrowserProvider(window.ethereum);

const { id, link } = await client.createInvoice({
  pricing: PRICING_USD,          // price in USD cents
  amount: "4999",                // $49.99
  memo: "Order #1234",
});

// link === "#/pay?c=0x29A6...aff72&id=7"
// Drop it into a checkout, email, or QR code. The payer lands in Rowan
// with the invoice pre-loaded and pays in one click.
```

### 2. Pay an invoice (payer side)

```ts
import { FxrpPayClient } from "@rowan/fxrp-pay-sdk";

const client = await FxrpPayClient.fromBrowserProvider(window.ethereum);

// Parse the link from the URL hash, then load what you'll pay.
const { contractAddress, id } = parsePaymentLink(location.href);
const estimate = await client.getInvoice(id);
console.log("Due:", estimate.due, "Open:", estimate.open);

const result = await client.pay(id, { approve: true });
console.log("Paid!", result.totalPaid, "tx:", result.txHash);
```

`pay` automatically approves the token when needed and sends the FTSOv2 oracle
fee (`msg.value`) for USD invoices — the wallet prompts you through both.

### 3. Withdraw (merchant side)

```ts
await client.withdraw(id); // pulls all collected FXRP to the payee address
```

## API

### `FxrpPayClient`

| Method | Requires | Description |
| --- | --- | --- |
| `createInvoice({ payee?, token?, pricing?, amount, memo? })` | signer | Create an invoice, returns `{ id, link, txHash, receipt }` |
| `pay(id, { approve?, value? })` | signer | Pay the exact remaining due; auto-approves and sends oracle fee |
| `withdraw(id)` | signer (payee only) | Pull collected FXRP to the payee |
| `cancelInvoice(id)` | signer (payee only) | Close an open invoice |
| `getInvoice(id)` | any | `InvoiceView` with `paid`, `due`, `open`, `isPaid`, pricing |
| `getDue(id)` | any | Token units still required |
| `isPaid(id)` | any | Fully paid and closed |
| `oracleFee()` | any | FTSOv2 fee in wei to include as `msg.value` for USD invoices |
| `getXrpUsdPriceWei()` / `getXrpUsdPriceUsd()` | any | Current on-chain XRP/USD price |
| `tokenDecimals(address?)` | any | Payment token decimals |

Constructor: `new FxrpPayClient({ provider?, signer?, contractAddress? })`.

- No args → read-only against the live Coston2 deployment.
- `FxrpPayClient.fromBrowserProvider(window.ethereum)` → full signer client.

Defaults: contract `0x29A63685474814fdaE2396251E1190aAF44aff72`, token
`0x40bE15A4469DCF86d4CB07059A137f2611867739` (MockFXRP), chain Coston2 (114).

### Pricing helpers

| Helper | Description |
| --- | --- |
| `parseUsdToCents("$49.99")` → `4999n` | Human USD string to cents |
| `formatUsdCents(4999n)` → `"$49.99"` | Cents to display string |
| `usdCentsToTokens(cents, priceWei)` | Mirror the contract's on-chain conversion |
| `tokensToUsdCents(tokens, priceWei)` | Inverse |
| `formatTokenUnits(units)` | Raw units → "49.94" (18 decimals) |

### Payment links

```ts
import { buildPaymentLink, parsePaymentLink } from "@rowan/fxrp-pay-sdk";

const link = buildPaymentLink("0x29A6...aff72", 7, "https://azeru548.github.io/fxrp/");
// "https://azeru548.github.io/fxrp/#/pay?c=0x29A6...aff72&id=7"

const { contractAddress, id } = parsePaymentLink(link); // id is a bigint
```

### Networks

```ts
import { COSTON2 } from "@rowan/fxrp-pay-sdk";
// { chainId: 114, chainIdHex: "0x72", rpc, explorer, ... }
```

## Reference app

The live payment link app ([`frontend/`](../frontend)) is the reference
implementation — wallet connection, create/pay/withdraw UI, and deep-link
routing (`#/pay?c=...&id=...`). The contract source lives in
[`contracts/FxrpPay.sol`](../contracts/FxrpPay.sol).

## Development

```bash
npm run build   # tsc -> dist/esm + dist/cjs
npm run smoke   # live read-only tests against Coston2 (no gas needed)
npm run gen:abi # regenerate sdk/abi/FxrpPay.json from the contract
```