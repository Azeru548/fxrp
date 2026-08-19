import type { InterfaceAbi } from "ethers";

/**
 * Human-readable ABI for FxrpPay. Mirrors contracts/FxrpPay.sol and the
 * generated artifact in sdk/abi/FxrpPay.json (verified by the smoke test).
 */
export const FxrpPayAbi: InterfaceAbi = [
  "function createInvoice(address payee,address token,uint8 pricing,uint256 amount,string memo) returns (uint256 id)",
  "function pay(uint256 id) payable",
  "function withdraw(uint256 id)",
  "function cancelInvoice(uint256 id)",
  "function getDue(uint256 id) view returns (uint256)",
  "function isPaid(uint256 id) view returns (bool)",
  "function oracleFee() view returns (uint256)",
  "function getXrpUsdPriceWei() view returns (uint256 value,uint64 timestamp)",
  "function invoices(uint256) view returns (address payee,address token,uint8 pricing,uint256 amount,uint256 paid,bool open,string memo)",
  "function PRICING_FIXED() view returns (uint8)",
  "function PRICING_USD() view returns (uint8)",
  "function XRP_USD_FEED() view returns (bytes21)",
  "function ftsoV2() view returns (address)",
  "event InvoiceCreated(uint256 indexed id,address indexed payee,address token,uint8 pricing,uint256 amount,string memo)",
  "event PaymentReceived(uint256 indexed id,address indexed payer,uint256 amount,uint256 totalPaid)",
  "event Withdrawn(uint256 indexed id,address indexed payee,uint256 amount)",
  "event InvoiceClosed(uint256 indexed id)",
  "event InvoiceCancelled(uint256 indexed id)",
];

/** Minimal ERC-20 ABI for the payment token (FXRP / MockFXRP). */
export const Erc20Abi: InterfaceAbi = [
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner,address spender) view returns (uint256)",
  "function approve(address spender,uint256 amount) returns (bool)",
];
