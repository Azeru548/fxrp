import { formatUnits } from "ethers";

/**
 * Convert USD cents to token units (18 decimals), ceiling-rounded.
 * Mirrors the contract's on-chain conversion for USD invoices.
 */
export function usdCentsToTokens(usdCents: bigint | number, xrpUsdPriceWei: bigint): bigint {
  const cents = BigInt(usdCents);
  const price = BigInt(xrpUsdPriceWei);
  if (price <= 0n) throw new Error("XRP/USD price must be > 0");
  const usdWei = cents * 10n ** 16n; // cents -> USD wei (18 decimals)
  return (usdWei * 10n ** 18n + price - 1n) / price;
}

/** Convert token units (18 decimals) to USD cents (floor-rounded). */
export function tokensToUsdCents(tokens: bigint, xrpUsdPriceWei: bigint): bigint {
  const t = BigInt(tokens);
  const price = BigInt(xrpUsdPriceWei);
  if (price <= 0n) throw new Error("XRP/USD price must be > 0");
  return (t * price) / 10n ** 34n;
}

/** Parse "49.99" or "$49.99" to USD cents (49.99 -> 4999n). */
export function parseUsdToCents(input: string | number): bigint {
  const s = String(input).trim().replace(/[$,]/g, "");
  const m = /^(\d+)(?:\.(\d{1,2}))?$/.exec(s);
  if (!m) throw new Error("Invalid USD amount: " + input);
  const whole = BigInt(m[1]);
  const frac = (m[2] ?? "").padEnd(2, "0");
  return whole * 100n + BigInt(frac);
}

/** Format USD cents as "$49.99". */
export function formatUsdCents(cents: bigint | number): string {
  const c = BigInt(cents);
  const sign = c < 0n ? "-" : "";
  const abs = c < 0n ? -c : c;
  return `${sign}$${(abs / 100n).toString()}.${(abs % 100n).toString().padStart(2, "0")}`;
}

/** Format raw token units with 18 decimals ("49.94"). */
export function formatTokenUnits(units: bigint | number, decimals = 18): string {
  return formatUnits(BigInt(units), decimals);
}
