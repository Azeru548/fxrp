import {
  BrowserProvider,
  Contract,
  ContractTransactionResponse,
  JsonRpcProvider,
  MaxUint256,
  Provider,
  Signer,
  getAddress,
} from "ethers";

import { Erc20Abi, FxrpPayAbi } from "./abi.js";
import {
  COSTON2,
  FXRP_PAY_COSTON2,
  FXRP_TOKEN_COSTON2,
  PRICING_USD,
  TOKEN_DECIMALS,
} from "./constants.js";
import { buildPaymentLink } from "./links.js";
import type {
  CreateInvoiceParams,
  CreateInvoiceResult,
  FxrpPayClientOptions,
  InvoiceView,
  PayOptions,
  PayResult,
  Pricing,
  WithdrawResult,
} from "./types.js";

interface InvoiceStruct {
  payee: string;
  token: string;
  pricing: bigint | number;
  amount: bigint;
  paid: bigint;
  open: boolean;
  memo: string;
}

/**
 * Typed client for the FxrpPay contract.
 *
 * Reads work with a bare provider (or no provider — Coston2 RPC is used by
 * default). Writes (createInvoice / pay / withdraw) need a signer.
 */
export class FxrpPayClient {
  readonly contractAddress: string;
  readonly provider: Provider;
  readonly signer?: Signer;
  private readonly contract: Contract;

  constructor(options: FxrpPayClientOptions = {}) {
    this.contractAddress = getAddress(options.contractAddress ?? FXRP_PAY_COSTON2);
    this.signer = options.signer;
    this.provider = options.provider ?? this.signer?.provider ?? new JsonRpcProvider(COSTON2.rpc);
    this.contract = new Contract(this.contractAddress, FxrpPayAbi, this.signer ?? this.provider);
  }

  /** @internal Require a signer for write calls. */
  private requireSigner(): Signer {
    if (!this.signer) {
      throw new Error("FxrpPayClient: a signer is required for write calls (pass { signer })");
    }
    return this.signer;
  }

  private async invoice(id: bigint): Promise<InvoiceStruct> {
    const inv = (await this.contract.invoices(id)) as InvoiceStruct;
    return inv;
  }

  /** Read an invoice plus its derived state. */
  async getInvoice(id: bigint | number | string): Promise<InvoiceView> {
    const bid = BigInt(id);
    const inv = await this.invoice(bid);
    const [due, isPaid] = await Promise.all([
      this.contract.getDue(bid),
      this.contract.isPaid(bid),
    ]);
    return {
      id: bid,
      payee: inv.payee,
      token: inv.token,
      pricing: Number(inv.pricing) as Pricing,
      amount: inv.amount,
      paid: inv.paid,
      due,
      open: inv.open,
      isPaid: !!isPaid,
      memo: inv.memo,
    };
  }

  /** Token units still required to close the invoice. */
  async getDue(id: bigint | number | string): Promise<bigint> {
    return (await this.contract.getDue(BigInt(id))) as bigint;
  }

  /** True when the invoice is fully paid and closed. */
  async isPaid(id: bigint | number | string): Promise<boolean> {
    return !!(await this.contract.isPaid(BigInt(id)));
  }

  /** FTSOv2 fee in wei (C2FLR) to include as msg.value for a USD invoice. */
  async oracleFee(): Promise<bigint> {
    return (await this.contract.oracleFee()) as bigint;
  }

  /** Current on-chain XRP/USD price in wei (18 decimals). */
  async getXrpUsdPriceWei(): Promise<bigint> {
    const [value] = (await this.contract.getXrpUsdPriceWei()) as [bigint, bigint];
    return value;
  }

  /** Current on-chain XRP/USD price as a JS number (e.g. 0.5). */
  async getXrpUsdPriceUsd(): Promise<number> {
    const wei = await this.getXrpUsdPriceWei();
    return Number(wei) / 10 ** 18;
  }

  /**
   * Create an invoice. Returns the invoice id and its payment link.
   * Requires a signer.
   */
  async createInvoice(params: CreateInvoiceParams): Promise<CreateInvoiceResult> {
    const signer = this.requireSigner();
    const sender = await signer.getAddress();
    const payee = getAddress(params.payee ?? sender);
    const token = getAddress(params.token ?? FXRP_TOKEN_COSTON2);
    const pricing: Pricing = params.pricing ?? PRICING_USD;
    const amount = typeof params.amount === "bigint" ? params.amount : BigInt(params.amount);
    const memo = params.memo ?? "";
    if (amount <= 0n) throw new Error("amount must be > 0");

    const tx = (await this.contract.createInvoice(payee, token, pricing, amount, memo)) as ContractTransactionResponse;
    const receipt = await tx.wait();
    const id = this.parseCreatedId(receipt);

    return {
      id,
      link: buildPaymentLink(this.contractAddress, id),
      txHash: receipt?.hash ?? tx.hash,
      receipt,
    };
  }

  /** @internal Extract the invoice id from the InvoiceCreated event. */
  private parseCreatedId(receipt: Awaited<ReturnType<ContractTransactionResponse["wait"]>>): bigint {
    for (const log of receipt?.logs ?? []) {
      try {
        const parsed = this.contract.interface.parseLog(log);
        if (parsed?.name === "InvoiceCreated") {
          return BigInt(parsed.args.id);
        }
      } catch {
        // not one of our events
      }
    }
    throw new Error("Could not determine new invoice id from receipt");
  }

  /**
   * Pay an invoice. Approves the token first if needed, sends the oracle fee
   * for USD invoices, and waits for confirmation. Requires a signer.
   */
  async pay(id: bigint | number | string, options: PayOptions = {}): Promise<PayResult> {
    const signer = this.requireSigner();
    const sender = await signer.getAddress();
    const bid = BigInt(id);

    const inv = await this.invoice(bid);
    if (!inv.open) throw new Error("Invoice is not open");
    const due = (await this.contract.getDue(bid)) as bigint;
    if (due <= 0n) throw new Error("Invoice is already paid");

    const tokenContract = new Contract(inv.token, Erc20Abi, signer);

    if (options.approve !== false) {
      const allowance = (await tokenContract.allowance(sender, this.contractAddress)) as bigint;
      if (allowance < due) {
        const approveTx = (await tokenContract.approve(this.contractAddress, MaxUint256)) as ContractTransactionResponse;
        await approveTx.wait();
      }
    }

    let value = options.value;
    if (value === undefined) {
      value = Number(inv.pricing) === PRICING_USD ? await this.oracleFee() : 0n;
    }

    const tx = (await this.contract.pay(bid, { value })) as ContractTransactionResponse;
    const receipt = await tx.wait();

    const decimals = await this.tokenDecimals(inv.token);
    let payer = sender;
    let amount = due;
    let totalPaid = inv.paid + due;
    for (const log of receipt?.logs ?? []) {
      try {
        const parsed = this.contract.interface.parseLog(log);
        if (parsed?.name === "PaymentReceived") {
          payer = parsed.args.payer as string;
          amount = parsed.args.amount as bigint;
          totalPaid = parsed.args.totalPaid as bigint;
          break;
        }
      } catch {
        // ignore
      }
    }

    return { id: bid, payer, amount, totalPaid, tokenDecimals: decimals, txHash: receipt?.hash ?? tx.hash, receipt };
  }

  /** Withdraw collected tokens for an invoice. Only the payee may call. */
  async withdraw(id: bigint | number | string): Promise<WithdrawResult> {
    this.requireSigner();
    const bid = BigInt(id);
    const tx = (await this.contract.withdraw(bid)) as ContractTransactionResponse;
    const receipt = await tx.wait();
    let amount = 0n;
    for (const log of receipt?.logs ?? []) {
      try {
        const parsed = this.contract.interface.parseLog(log);
        if (parsed?.name === "Withdrawn") {
          amount = parsed.args.amount as bigint;
          break;
        }
      } catch {
        // ignore
      }
    }
    return { id: bid, amount, txHash: receipt?.hash ?? tx.hash, receipt };
  }

  /** Cancel an open invoice (payee only). */
  async cancelInvoice(id: bigint | number | string): Promise<string> {
    this.requireSigner();
    const tx = (await this.contract.cancelInvoice(BigInt(id))) as ContractTransactionResponse;
    const receipt = await tx.wait();
    return receipt?.hash ?? tx.hash;
  }

  /** Read the payment token's decimals. */
  async tokenDecimals(tokenAddress?: string): Promise<number> {
    const address = tokenAddress ?? FXRP_TOKEN_COSTON2;
    const token = new Contract(address, Erc20Abi, this.provider);
    try {
      const d = (await token.decimals()) as number;
      return Number(d);
    } catch {
      return TOKEN_DECIMALS;
    }
  }

  /** Convenience: new FxrpPayClient from a browser-injected provider. */
  static async fromBrowserProvider(
    ethereum: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> },
    contractAddress?: string
  ): Promise<FxrpPayClient> {
    const provider = new BrowserProvider(ethereum as never);
    const signer = await provider.getSigner();
    return new FxrpPayClient({ provider, signer, contractAddress });
  }
}
