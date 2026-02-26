import fs from "fs/promises";
import path from "path";
import vm from "vm";

const INPUT_PATH = path.resolve("src/data/mapledb/drops.js");

function looksLikeNameTable(value) {
  if (!value || typeof value !== "object") return false;
  const keys = Object.keys(value);
  if (keys.length < 100) return false;
  const sampleKey = keys.find((key) => String(Number(key)) === key);
  if (!sampleKey) return false;
  const sample = value[sampleKey];
  return Boolean(sample && typeof sample === "object" && typeof sample.name === "string");
}

async function main() {
  const code = await fs.readFile(INPUT_PATH, "utf8");
  const chunks = [];
  const sandbox = {
    window: {
      webpackJsonp: [],
    },
  };

  sandbox.window.webpackJsonp.push = (chunk) => {
    chunks.push(chunk);
  };

  vm.runInNewContext(code, sandbox, { timeout: 10000 });
  const modules = Object.assign({}, ...chunks.map((chunk) => chunk[1]));

  const hits = [];
  for (const modId of Object.keys(modules)) {
    const modFn = modules[modId];
    if (typeof modFn !== "function") continue;
    const module = { exports: {} };
    const requireStub = () => ({});
    try {
      modFn(module, module.exports, requireStub);
      if (looksLikeNameTable(module.exports)) {
        hits.push(modId);
      }
    } catch {
      // ignore
    }
  }

  console.log("nameTableModules", hits);
  if (hits.length) {
    const modFn = modules[hits[0]];
    const module = { exports: {} };
    const requireStub = () => ({});
    modFn(module, module.exports, requireStub);
    const keys = Object.keys(module.exports);
    console.log("sample", keys.slice(0, 10).map((k) => ({ id: k, name: module.exports[k]?.name })));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
