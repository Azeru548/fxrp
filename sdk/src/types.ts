import type { Provider, Signer, TransactionReceipt } from "ethers";

/** Invoice pricing modes, matching the contract's PRICING_* constants. */
export type Pricing = 0 | 1;

/** An on-chain invoice as read from the contract, plus derived fields. */
export interface InvoiceView {
  id: bigint;
  payee: string;
  token: string;
  /** 0 = fixed amount in token units, 1 = USD cents. */
  pricing: Pricing;
  /** Fixed pricing: token units. USD pricing: USD cents. */
  amount: bigint;
  /** Token units collected so far. */
  paid: bigint;
  /** Token units still required to close the invoice. */
  due: bigint;
  /** Still accepting payments. */
  open: boolean;
  /** Fully paid (open === false after reaching the target). */
  isPaid: boolean;
  memo: string;
}

export interface CreateInvoiceParams {
  /** Invoice recipient. Defaults to the connected signer address. */
  payee?: string;
  /** Payment token (defaults to the Coston2 MockFXRP). */
  token?: string;
  /** PRICING_USD (1, default) or PRICING_FIXED (0). */
  pricing?: Pricing;
  /** USD cents (pricing = 1) or raw token units (pricing = 0). */
  amount: bigint | string;
  /** Merchant memo shown to the payer. */
  memo?: string;
}

export interface CreateInvoiceResult {
  id: bigint;
  /** Relative payment link (#/pay?c=...&id=...) for this invoice. */
  link: string;
  txHash: string;
  receipt: TransactionReceipt | null;
}

export interface PayOptions {
  /** Auto-approve the token if allowance is insufficient (default true). */
  approve?: boolean;
  /** Explicit msg.value in wei. Defaults to the FTSOv2 fee for USD invoices. */
  value?: bigint;
}

export interface PayResult {
  id: bigint;
  payer: string;
  amount: bigint;
  totalPaid: bigint;
  tokenDecimals: number;
  txHash: string;
  receipt: TransactionReceipt | null;
}

export interface WithdrawResult {
  id: bigint;
  amount: bigint;
  txHash: string;
  receipt: TransactionReceipt | null;
}

export interface FxrpPayClientOptions {
  /** Read/estimate via any provider. */
  provider?: Provider;
  /** Signer for createInvoice / pay / withdraw. */
  signer?: Signer;
  /** FxrpPay contract address. Defaults to Coston2 deployment. */
  contractAddress?: string;
}

export interface NetworkConfig {
  chainId: number;
  chainIdHex: string;
  name: string;
  rpc: string;
  currency: string;
  explorer: string;
  token: string;
}
