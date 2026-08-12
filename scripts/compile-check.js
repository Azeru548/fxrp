const solc = require("solc");
const fs = require("fs");
const path = require("path");

const contractsDir = path.join(__dirname, "..", "contracts");
const sources = {};
for (const file of ["FxrpPay.sol", "MockFXRP.sol"]) {
  sources[file] = { content: fs.readFileSync(path.join(contractsDir, file), "utf8") };
}

const input = {
  language: "Solidity",
  sources,
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: {
      "*": { "*": ["abi", "evm.bytecode"] },
    },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));

let failed = false;
for (const err of output.errors || []) {
  const isError = err.severity === "error";
  if (isError) failed = true;
  console.log(`[${err.severity.toUpperCase()}] ${err.formattedMessage}`);
}

if (!failed) {
  for (const file of Object.keys(sources)) {
    const contracts = output.contracts[file];
    for (const name of Object.keys(contracts)) {
      const c = contracts[name];
      const abi = c.abi.filter((i) => i.type === "function");
      console.log(
        `OK ${file}:${name} — bytecode ${c.evm.bytecode.object.length / 2} bytes, ${abi.length} functions`
      );
    }
  }
} else {
  process.exit(1);
}
