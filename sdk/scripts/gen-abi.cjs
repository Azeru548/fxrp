const solc = require("solc");
const fs = require("node:fs");
const path = require("node:path");

const scriptsDir = __dirname;
const sdkDir = path.join(scriptsDir, "..");
const contractPath = path.join(sdkDir, "..", "contracts", "FxrpPay.sol");

const source = fs.readFileSync(contractPath, "utf8");
const input = {
  language: "Solidity",
  sources: { "FxrpPay.sol": { content: source } },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: { "*": { "*": ["abi"] } },
  },
};
const output = JSON.parse(solc.compile(JSON.stringify(input)));
const abi = output.contracts["FxrpPay.sol"].FxrpPay.abi;

const outDir = path.join(sdkDir, "abi");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "FxrpPay.json"), JSON.stringify(abi, null, 2) + "\n");

console.log(`sdk: wrote abi/FxrpPay.json (${abi.length} entries)`);