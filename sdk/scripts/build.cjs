const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const scriptsDir = __dirname;
const sdkDir = path.join(scriptsDir, "..");
const rootDir = path.join(sdkDir, "..");
const tsc = path.join(rootDir, "node_modules", "typescript", "bin", "tsc");

for (const config of ["tsconfig.esm.json", "tsconfig.cjs.json"]) {
  execSync(`node "${tsc}" -p "${path.join(sdkDir, config)}"`, { stdio: "inherit", cwd: sdkDir });
}

const distEsm = path.join(sdkDir, "dist", "esm");
const distCjs = path.join(sdkDir, "dist", "cjs");
fs.writeFileSync(path.join(distEsm, "package.json"), JSON.stringify({ type: "module" }, null, 2));
fs.writeFileSync(path.join(distCjs, "package.json"), JSON.stringify({ type: "commonjs" }, null, 2));

console.log("sdk: built dist/esm and dist/cjs");
