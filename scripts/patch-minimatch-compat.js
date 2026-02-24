/* eslint-disable no-console */
"use strict";

const fs = require("fs");
const path = require("path");

const target = path.join(
  __dirname,
  "..",
  "node_modules",
  "minimatch",
  "dist",
  "commonjs",
  "index.js"
);

const marker = "minimatch-v10-cjs-compat";
const anchor = "exports.minimatch.unescape = unescape_js_1.unescape;";

if (!fs.existsSync(target)) {
  console.warn(`[postinstall] minimatch file not found at ${target}; skipping patch`);
  process.exit(0);
}

try {
  const source = fs.readFileSync(target, "utf8");
  if (source.includes(marker)) {
    console.log("[postinstall] minimatch compat patch already applied");
    process.exit(0);
  }

  if (!source.includes(anchor)) {
    console.warn("[postinstall] minimatch file format changed; skipping compat patch");
    process.exit(0);
  }

  const patch = `
/* ${marker}: make CommonJS require('minimatch') callable for legacy deps */
if (typeof module !== "undefined" && module.exports && typeof exports.minimatch === "function") {
  module.exports = Object.assign(exports.minimatch, module.exports);
}
`;

  fs.writeFileSync(target, `${source}${patch}`, "utf8");
  console.log("[postinstall] applied minimatch CommonJS compatibility patch");
} catch (err) {
  const message = err && err.message ? err.message : String(err);
  console.warn(`[postinstall] unable to patch minimatch compatibility: ${message}`);
  process.exit(0);
}
