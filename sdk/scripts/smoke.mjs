import { FxrpPayClient } from "../dist/esm/index.js";
import {
  buildPaymentLink,
  parsePaymentLink,
  parseUsdToCents,
  formatUsdCents,
  usdCentsToTokens,
  tokensToUsdCents,
  FXRP_PAY_COSTON2,
  FXRP_TOKEN_COSTON2,
  PRICING_USD,
} from "../dist/esm/index.js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const abiJson = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "abi", "FxrpPay.json"), "utf8")
);
const abiFns = abiJson.filter((i) => i.type === "function").map((f) => `${f.name}(${f.inputs.map((i) => i.type).join(",")})`);
const abiEvents = abiJson.filter((i) => i.type === "event").map((e) => e.name);

let pass = 0;
let fail = 0;
function check(name, cond) {
  if (cond) {
    pass++;
    console.log("  ok  " + name);
  } else {
    fail++;
    console.log("  FAIL " + name);
  }
}

async function main() {
  console.log("== ABI consistency ==");
  const expectedFns = [
    "createInvoice(address,address,uint8,uint256,string)",
    "pay(uint256)",
    "withdraw(uint256)",
    "cancelInvoice(uint256)",
    "getDue(uint256)",
    "isPaid(uint256)",
    "oracleFee()",
    "getXrpUsdPriceWei()",
    "invoices(uint256)",
    "PRICING_FIXED()",
    "PRICING_USD()",
    "XRP_USD_FEED()",
    "ftsoV2()",
  ];
  for (const fn of expectedFns) {
    check("abi/FxrpPay.json has " + fn, abiFns.includes(fn));
  }
  for (const ev of ["InvoiceCreated", "PaymentReceived", "Withdrawn", "InvoiceClosed", "InvoiceCancelled"]) {
    check("abi/FxrpPay.json has event " + ev, abiEvents.includes(ev));
  }
  const hasPayablePay = abiJson.some((i) => i.type === "function" && i.name === "pay" && i.stateMutability === "payable");
  check("pay is payable (oracle fee)", hasPayablePay);

  console.log("== pricing / link helpers (pure) ==");
  check("parseUsdToCents('49.99') = 4999n", parseUsdToCents("49.99") === 4999n);
  check("parseUsdToCents('$20.00') = 2000n", parseUsdToCents("$20.00") === 2000n);
  check("formatUsdCents(4999n) = '$49.99'", formatUsdCents(4999n) === "$49.99");
  check("formatUsdCents(2000n) = '$20.00'", formatUsdCents(2000n) === "$20.00");
  // $20 at XRP/USD = 1.00 (1e18 wei) => 20 * 1e18 token units
  check("usdCentsToTokens(2000n, 1e18) = 20e18", usdCentsToTokens(2000n, 10n ** 18n) === 20n * 10n ** 18n);
  // ceiling rounding: $20 at price 1.99/XRP => 10.0502... => rounds up to 10.050251 tokens
  const high = usdCentsToTokens(2000n, 199n * 10n ** 16n);
  check("usdCentsToTokens ceiling rounds up", high === 10050251256281407036n, high);
  check("tokensToUsdCents inverse", tokensToUsdCents(20n * 10n ** 18n, 10n ** 18n) === 2000n);

  const link = buildPaymentLink(FXRP_PAY_COSTON2, 4);
  const parsed = parsePaymentLink(link);
  check("buildPaymentLink -> #/pay?c=...&id=...", link.startsWith("#/pay?c=") && link.includes("&id=4"));
  check("parsePaymentLink round-trips contract", parsed?.contractAddress === FXRP_PAY_COSTON2);
  check("parsePaymentLink round-trips id", parsed?.id === 4n);
  check("parsePaymentLink ignores absolute base", parsePaymentLink("https://x.test/fxrp/" + link)?.id === 4n);
  check("parsePaymentLink rejects junk", parsePaymentLink("#/pay?c=zzz") === null);

  console.log("== live Coston2 reads ==");
  const client = new FxrpPayClient({ contractAddress: FXRP_PAY_COSTON2 });

  const inv4 = await client.getInvoice(4);
  check("invoice #4 pricing is USD", inv4.pricing === PRICING_USD);
  check("invoice #4 amount is $50.00 (5000 cents)", inv4.amount === 5000n);
  check("invoice #4 paid (demo evidence)", inv4.paid > 0n);
  check("invoice #4 closed", !inv4.open);
  check("invoice #4 isPaid", inv4.isPaid);

  const inv0 = await client.getInvoice(0);
  check("invoice #0 amount is $20.00 (2000 cents)", inv0.amount === 2000n);
  check("invoice #0 paid (demo evidence)", inv0.paid > 0n);

  const price = await client.getXrpUsdPriceUsd();
  check("XRP/USD price is positive (" + price.toFixed(4) + ")", price > 0 && price < 100);

  const fee = await client.oracleFee();
  check("oracleFee() is 0 on Coston2", fee === 0n);

  const due4 = await client.getDue(4);
  check("getDue(4) is 0 (paid)", due4 === 0n);

  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error("smoke test crashed:", e);
  process.exit(1);
});