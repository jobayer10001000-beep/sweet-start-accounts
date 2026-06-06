#!/usr/bin/env node
// Transform dist/ (Nitro vercel preset output) into Vercel Build Output API v3 layout under .vercel/output/.
import { existsSync, mkdirSync, rmSync, cpSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const root = process.cwd();
const dist = resolve(root, "dist");
const outDir = resolve(root, ".vercel/output");

if (!existsSync(dist)) {
  console.error("[vercel-postbuild] dist/ not found. Did `vite build` succeed?");
  process.exit(1);
}

// Reset .vercel/output
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

// 1) config.json
const config = {
  version: 3,
  routes: [
    { handle: "filesystem" },
    { src: "/(.*)", dest: "/__server" },
  ],
};
writeFileSync(join(outDir, "config.json"), JSON.stringify(config, null, 2));

// 2) static assets: dist/client/* -> .vercel/output/static/
const staticDir = join(outDir, "static");
mkdirSync(staticDir, { recursive: true });
const clientDir = join(dist, "client");
if (existsSync(clientDir)) {
  for (const entry of readdirSync(clientDir)) {
    cpSync(join(clientDir, entry), join(staticDir, entry), { recursive: true });
  }
} else {
  console.warn("[vercel-postbuild] dist/client not found — skipping static copy");
}

// 3) server function: dist/server/* -> .vercel/output/functions/__server.func/
const fnDir = join(outDir, "functions", "__server.func");
mkdirSync(fnDir, { recursive: true });
const serverDir = join(dist, "server");
if (!existsSync(serverDir)) {
  console.error("[vercel-postbuild] dist/server not found — Nitro vercel preset did not emit server output.");
  process.exit(1);
}
for (const entry of readdirSync(serverDir)) {
  cpSync(join(serverDir, entry), join(fnDir, entry), { recursive: true });
}

// Ensure an index.mjs handler exists at the function root.
const indexMjs = join(fnDir, "index.mjs");
if (!existsSync(indexMjs)) {
  // Nitro vercel preset typically emits index.mjs; if it produced a different entry, try common fallbacks.
  const candidates = ["server.mjs", "handler.mjs", "index.js"];
  let found = null;
  for (const c of candidates) {
    if (existsSync(join(fnDir, c))) { found = c; break; }
  }
  if (found) {
    // Re-export to standardize handler name.
    writeFileSync(indexMjs, `export { default } from "./${found}";\n`);
  } else {
    console.warn("[vercel-postbuild] No index.mjs detected in server output; Vercel may fail to invoke the function.");
  }
}

const vcConfig = {
  runtime: "nodejs22.x",
  handler: "index.mjs",
  launcherType: "Nodejs",
  supportsResponseStreaming: true,
};
writeFileSync(join(fnDir, ".vc-config.json"), JSON.stringify(vcConfig, null, 2));

// Helpful summary
const summarize = (p) => {
  if (!existsSync(p)) return "(missing)";
  const s = statSync(p);
  return s.isDirectory() ? `dir(${readdirSync(p).length} entries)` : `file(${s.size}b)`;
};
console.log("[vercel-postbuild] done");
console.log("  config.json:", summarize(join(outDir, "config.json")));
console.log("  static/    :", summarize(staticDir));
console.log("  function/  :", summarize(fnDir));
