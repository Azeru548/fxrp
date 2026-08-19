import type { NetworkConfig, Pricing } from "./types.js";

/** Flare Testnet Coston2 (chain id 114). */
export const COSTON2: NetworkConfig = {
  chainId: 114,
  chainIdHex: "0x72",
  name: "Flare Testnet Coston2",
  rpc: "https://coston2-api.flare.network/ext/C/rpc",
  currency: "C2FLR",
  explorer: "https://coston2-explorer.flare.network",
  token: "FXRP",
};

/** Live FxrpPay deployment on Coston2. */
export const FXRP_PAY_COSTON2 = "0x29A63685474814fdaE2396251E1190aAF44aff72";

/** MockFXRP test token on Coston2. */
export const FXRP_TOKEN_COSTON2 = "0x40bE15A4469DCF86d4CB07059A137f2611867739";

/** FTSOv2 on Coston2 (XRP/USD feed fee is 0). */
export const FTSO_V2_COSTON2 = "0xC4e9c78EA53db782E28f28Fdf80BaF59336B304d";

export const PRICING_FIXED: Pricing = 0;
export const PRICING_USD: Pricing = 1;

/** Standard FXRP / token decimals. */
export const TOKEN_DECIMALS = 18;

/** FTSOv2 XRP/USD feed id (bytes21). */
export const XRP_USD_FEED = "0x015852502f55534400000000000000000000000000";
