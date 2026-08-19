export interface ParsedPaymentLink {
  contractAddress: string;
  id: bigint;
}

export const PAY_ROUTE = "#/pay";

/**
 * Build a Rowan payment link for an invoice.
 * Pass `baseUrl` (e.g. "https://azeru548.github.io/fxrp/") to get an absolute
 * link; otherwise a relative link is returned.
 */
export function buildPaymentLink(
  contractAddress: string,
  id: bigint | number | string,
  baseUrl?: string
): string {
  const base = baseUrl ? baseUrl.replace(/\/$/, "") : "";
  return `${base}${PAY_ROUTE}?c=${contractAddress}&id=${id}`;
}

/** Parse "#/pay?c=0x...&id=..." back into its parts. Returns null if invalid. */
export function parsePaymentLink(link: string): ParsedPaymentLink | null {
  const hashIndex = link.indexOf(PAY_ROUTE);
  if (hashIndex === -1) return null;
  const query = link.slice(hashIndex + PAY_ROUTE.length).replace(/^\?/, "");
  const params = new URLSearchParams(query);
  const contractAddress = params.get("c");
  const id = params.get("id");
  if (!contractAddress || id === null || !/^\d+$/.test(id)) return null;
  return { contractAddress, id: BigInt(id) };
}
