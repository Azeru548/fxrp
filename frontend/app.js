const NETWORK = {
  chainId: "0x72",
  name: "Flare Testnet Coston2",
  rpc: "https://coston2-api.flare.network/ext/C/rpc",
  currency: "C2FLR",
  explorer: "https://coston2-explorer.flare.network",
  explorerUrl: (txOrAddr) => "https://coston2-explorer.flare.network/tx/" + txOrAddr,
};

const FCONTRACT = "0x29A63685474814fdaE2396251E1190aAF44aff72";
const FTOKEN = "0x40bE15A4469DCF86d4CB07059A137f2611867739";

const ABI = [
  "function createInvoice(address payee,address token,uint8 pricing,uint256 amount,string memo) returns (uint256)",
  "function pay(uint256 id) payable",
  "function withdraw(uint256 id)",
  "function cancelInvoice(uint256 id)",
  "function getDue(uint256 id) view returns (uint256)",
  "function isPaid(uint256 id) view returns (bool)",
  "function oracleFee() view returns (uint256)",
  "function getXrpUsdPriceWei() view returns (uint256,uint64)",
  "function invoices(uint256) view returns (address payee,address token,uint8 pricing,uint256 amount,uint256 paid,bool open,string memo)",
  "event InvoiceCreated(uint256 indexed id,address indexed payee,address token,uint8 pricing,uint256 amount,string memo)",
  "event PaymentReceived(uint256 indexed id,address indexed payer,uint256 amount,uint256 totalPaid)",
];

const TOKEN_ABI = [
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
  "function allowance(address,address) view returns (uint256)",
];

let provider, signer, account;

function shortAddr(a) {
  return a ? a.slice(0, 6) + "\u2026" + a.slice(-4) : "";
}
function setStatus(msg, ok) {
  const el = $("status");
  el.textContent = msg;
  el.className = ok === true ? "ok" : ok === false ? "err" : "run";
}
function setPayStatus(msg, ok) {
  const el = $("payStatus");
  el.textContent = msg;
  el.className = ok === true ? "ok" : ok === false ? "err" : "run";
}

// --- Wallet detection: EIP-6963 (modern) + legacy injected providers ---
const walletMap = new Map(); // providerObj -> { name, icon }

function detectName(p) {
  if (p.isMetaMask) return "MetaMask";
  if (p.isRabby) return "Rabby";
  if (p.isTrust) return "Trust Wallet";
  if (p.isCoinbaseWallet) return "Coinbase Wallet";
  if (p.isBraveWallet) return "Brave Wallet";
  if (p.isTalisman) return "Talisman";
  if (p.isOKXWallet) return "OKX Wallet";
  if (p.isExodus) return "Exodus";
  if (p.isTokenPocket) return "TokenPocket";
  if (p.isPhantom) return "Phantom";
  if (p.isEnkrypt) return "Enkrypt";
  return "EVM Wallet";
}

function addWallet(name, icon, p) {
  if (!p) return;
  if (!walletMap.has(p)) walletMap.set(p, { name: name || "EVM Wallet", icon: icon || "" });
}

window.addEventListener("eip6963:announceProvider", (e) => {
  const { info, provider: p } = e.detail;
  addWallet(info.name, info.icon, p);
  if (document.getElementById("walletModal").style.display === "flex") renderWalletList();
});
window.dispatchEvent(new Event("eip6963:requestProvider"));

function discoverLegacy() {
  if (window.ethereum) {
    if (Array.isArray(window.ethereum.providers)) {
      window.ethereum.providers.forEach((p) => addWallet(detectName(p), "", p));
    } else {
      addWallet(detectName(window.ethereum), "", window.ethereum);
    }
  }
  addWallet("OKX Wallet", "", window.okxwallet);
  addWallet("Rabby", "", window.rabby);
  addWallet("Coinbase Wallet", "", window.coinbaseWalletExtension);
  addWallet("Talisman", "", window.talismanEth);
  addWallet("Trust Wallet", "", window.trustwallet && window.trustwallet.ethereum);
  addWallet("TokenPocket", "", window.tokenpocket && window.tokenpocket.ethereum);
  addWallet("Phantom", "", window.phantom && window.phantom.ethereum);
  addWallet("Enkrypt", "", window.enkrypt && window.enkrypt.providers && window.enkrypt.providers.ethereum);
}

const $ = (id) => document.getElementById(id);

function openWalletModal() {
  discoverLegacy();
  renderWalletList();
  document.getElementById("walletModal").style.display = "flex";
}
function closeWalletModal() {
  document.getElementById("walletModal").style.display = "none";
}
function renderWalletList() {
  const list = $("walletList");
  list.innerHTML = "";
  const wallets = [...walletMap.entries()].map(([provider, w]) => ({ provider, name: w.name, icon: w.icon }));
  if (wallets.length === 0) {
    list.innerHTML = '<div class="no-wallets">No wallet extensions detected. Install <a href="https://metamask.io" target="_blank" rel="noopener">MetaMask</a> or another EVM wallet, then reload the page.</div>';
    return;
  }
  for (const w of wallets) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "wallet-btn";
    btn.innerHTML = (w.icon ? '<img class="wallet-icon" src="' + w.icon + '" alt="" />' : "") +
      "<span>" + w.name + "</span>" +
      '<span class="go"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg></span>';
    btn.onclick = () => connectWith(w.provider);
    list.appendChild(btn);
  }
}

async function connectWith(ep) {
  console.log("[connectWith] clicked wallet, requesting accounts\u2026");
  try {
    await ep.request({ method: "eth_requestAccounts" });
  } catch (e) {
    console.error("[connectWith] account request failed", e);
    renderWalletError("Connection failed: " + (e.shortMessage || e.message || JSON.stringify(e) || e));
    return;
  }
  provider = new ethers.BrowserProvider(ep);
  try {
    signer = await provider.getSigner();
    account = (await signer.getAddress()).toLowerCase();
  } catch (e) {
    console.error("[connectWith] signer failed", e);
    renderWalletError("Signer failed: " + (e.message || e));
    return;
  }

  const net = await provider.getNetwork();
  if (Number(net.chainId) !== 114) {
    try {
      try {
        await ep.request({ method: "wallet_switchEthereumChain", params: [{ chainId: NETWORK.chainId }] });
      } catch (sw) {
        if (sw && (sw.code === 4902 || /not been added|not added/i.test(sw.message || ""))) {
          await ep.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: NETWORK.chainId,
              chainName: NETWORK.name,
              rpcUrls: [NETWORK.rpc],
              nativeCurrency: { name: "C2FLR", symbol: "C2FLR", decimals: 18 },
              blockExplorerUrls: [NETWORK.explorer],
            }],
          });
        } else {
          throw sw;
        }
      }
      provider = new ethers.BrowserProvider(ep);
      signer = await provider.getSigner();
    } catch (e2) {
      console.error("[connectWith] chain switch failed", e2);
      renderWalletError(
        "Please switch your wallet to Coston2 manually, then click the wallet again.\n" +
        "Add/switch network: RPC https://coston2-api.flare.network/ext/C/rpc - Chain ID 114 - currency C2FLR"
      );
      return;
    }
  }
  $("connect").textContent = shortAddr(account);
  $("app").style.display = "block";
  $("payee").placeholder = account;
  $("footnote").style.display = "block";
  setStatus("Connected: " + account, true);
  closeWalletModal();
}
function renderWalletError(msg) {
  const list = $("walletList");
  const div = document.createElement("div");
  div.className = "wallet-error";
  div.textContent = msg;
  list.prepend(div);
}
$("connect").onclick = openWalletModal;

$("pricing").onchange = () => {
  $("amountPrefix").textContent = $("pricing").value === "1" ? "$" : "FXRP";
  if ($("pricing").value === "1") {
    $("amount").value = "5000";
    $("amountLabel").textContent = "Amount in USD";
  } else {
    $("amount").value = "50000000000000000000";
    $("amountLabel").textContent = "Amount in FXRP";
  }
  updateAmountHint();
};

function updateAmountHint() {
  const p = $("pricing").value;
  const raw = $("amount").value.trim();
  if (p === "1") {
    $("amountHint").textContent = pctHint(raw);
  } else {
    $("amountHint").textContent = "";
  }
}
function pctHint(cents) {
  const n = Number(cents || "0");
  return Number.isNaN(n) ? "$0.00" : "$" + (n / 100).toFixed(2);
}
$("amount").addEventListener("input", updateAmountHint);

function setTestToken() {
  $("token").value = "0x40bE15A4469DCF86d4CB07059A137f2611867739";
  setStatus("Test FXRP token pre-filled (Coston2).", true);
}

async function copyLink() {
  const text = $("paylink").title || "";
  const base = location.origin + location.pathname;
  const full = text.startsWith("http") ? text : text ? base + text : "";
  if (!full.includes("#/pay")) return setStatus("No link to copy yet.", false);
  try {
    await navigator.clipboard.writeText(full);
    $("copyBtn").textContent = "Copied ✓";
    setTimeout(() => { $("copyBtn").textContent = "Copy link"; }, 1800);
  } catch {
    setStatus("Could not copy automatically — select the link above.", false);
  }
}

async function createInvoice() {
  const pricing = Number($("pricing").value);
  const amount = $("amount").value.trim();
  const memo = $("memo").value.trim();
  const payee = $("payee").value.trim() || account;
  const token = $("token").value.trim();
  if (!amount || !token) return setStatus("Fill in amount and token address.", false);
  if (!ethers.isAddress(token) || !ethers.isAddress(payee)) {
    return setStatus("Invalid address.", false);
  }

  setStatus("Creating invoice\u2026");
  const c = new ethers.Contract(token, TOKEN_ABI, signer);
  const decimals = await c.decimals();
  const units = pricing === 1 ? BigInt(amount) : ethers.parseUnits(amount, decimals);

  try {
    const contract = promptContract();
    const tx = await contract.createInvoice(payee, token, pricing, units, memo);
    const receipt = await tx.wait();
    const ev = receipt.logs
      .map((l) => {
        try { return contract.interface.parseLog(l); } catch { return null; }
      })
      .find((p) => p && p.name === "InvoiceCreated");
    const id = ev ? ev.args.id.toString() : "?";
    const link = location.href.split("#")[0] + "#/pay?c=" + contract.target + "&id=" + id;
    $("linkBlock").style.display = "block";
    $("paylink").textContent = "Payment link: " + link;
    $("paylink").title = link;
    setStatus("Invoice #" + id + " created. Tx: " + receipt.hash, true);
  } catch (e) {
    setStatus("Error: " + (e.shortMessage || e.message || e), false);
  }
}
$("createBtn").onclick = createInvoice;

function promptContract() {
  const addr = $("pContract").value.trim() || localStorage.getItem("fxrp_contract") || FCONTRACT;
  if (!addr) throw new Error("Enter the FxrpPay contract address.");
  localStorage.setItem("fxrp_contract", addr);
  return new ethers.Contract(addr, ABI, signer);
}

async function loadInvoice() {
  setPayStatus("Loading\u2026");
  try {
    const contract = promptContract();
    const id = $("pId").value.trim();
    if (id === "") return setPayStatus("Enter an invoice id.", false);
    const inv = await contract.invoices(id);
    const due = await contract.getDue(id);
    const paid = await contract.isPaid(id);
    const token = inv.token;
    const dec = await new ethers.Contract(token, TOKEN_ABI, provider).decimals();

    $("iStatus").textContent = paid
      ? "Paid"
      : inv.open
        ? "Open — accepting payments"
        : "Closed";
    $("invoiceInfo").dataset.state = paid ? "paid" : inv.open ? "open" : "closed";
    $("iMemo").textContent = inv.memo || "Invoice #" + id;
    $("iUsd").textContent =
      Number(inv.pricing) === 1
        ? "INVOICE #" + id + " · USD " + (Number(inv.amount) / 100).toFixed(2)
        : "INVOICE #" + id;
    $("iAmount").innerHTML =
      ethers.formatUnits(due, dec) + ' <span class="wd">FXRP due</span>';
    $("iPayee").innerHTML = "Merchant <b>" + inv.payee + "</b>";
    $("payBtn").style.display = inv.open && !paid ? "block" : "none";
    $("invoiceInfo").style.display = "block";
    $("payBtn").dataset.id = id;
    setPayStatus("");
  } catch (e) {
    setPayStatus("Error: " + (e.shortMessage || e.message || e), false);
  }
}
$("loadBtn").onclick = loadInvoice;

async function payInvoice() {
  const id = $("payBtn").dataset.id;
  try {
    const contract = promptContract();
    const inv = await contract.invoices(id);
    const due = await contract.getDue(id);
    const token = inv.token;
    const tok = new ethers.Contract(token, TOKEN_ABI, signer);

    setPayStatus("Approving token\u2026");
    const allowance = await tok.allowance(account, contract.target);
    if (allowance < due) {
      const ap = await tok.approve(contract.target, ethers.MaxUint256);
      await ap.wait();
    }

    const fee = Number(inv.pricing) === 1 ? await contract.oracleFee() : 0n;
    setPayStatus(
      "Paying " + ethers.formatUnits(due, 18) + " FXRP" +
      (fee > 0n ? " + oracle fee " + ethers.formatEther(fee) + " C2FLR" : "") +
      "\u2026"
    );
    const tx = await contract.pay(id, { value: fee });
    const receipt = await tx.wait();
    setPayStatus("Paid! Tx: " + receipt.hash, true);
    loadInvoice();
  } catch (e) {
    setPayStatus("Error: " + (e.shortMessage || e.message || e), false);
  }
}
$("payBtn").onclick = payInvoice;

function route() {
  const h = location.hash;
  const isPay = h.startsWith("#/pay");
  $("view-create").style.display = isPay ? "none" : "block";
  $("view-pay").style.display = isPay ? "block" : "none";
  document.querySelectorAll(".nav a").forEach((a) =>
    a.classList.toggle("active", (isPay ? a.dataset.view === "pay" : a.dataset.view === "create"))
  );
  if (isPay) {
    const q = new URLSearchParams(h.split("?")[1] || "");
    if (q.get("c")) $("pContract").value = q.get("c");
    if (q.get("id")) $("pId").value = q.get("id");
  }
}
window.addEventListener("hashchange", route);
route();

$("pContract").value = FCONTRACT;
$("token").value = FTOKEN;
localStorage.setItem("fxrp_contract", FCONTRACT);
