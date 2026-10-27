// Builds the clean, publishable website folder (default ./site): only what visitors need.
// Usage: node tools/make-site.mjs [outDir]
// Excludes content/, drafts/, tools/ and the handoff docs. Stamps sw.js with a content hash
// so installed copies pick up new versions.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { ROOT } from "./lib.mjs";

const out = path.resolve(process.argv[2] || path.join(ROOT, "site"));
if (out === ROOT || ROOT.startsWith(out + path.sep)) throw new Error("outDir must not contain the project root");
// Check bundles before replacing a previous package. External movie files stay at their source.
for (const bundle of ["data/library.js", "data/dict.js", "data/videos.js"]) {
  if (!fs.existsSync(path.join(ROOT, bundle))) throw new Error(`${bundle} is missing; run node tools/build.mjs first`);
}
fs.rmSync(out, { recursive: true, force: true });

const FILES = ["index.html", "manifest.webmanifest", "sw.js", "LICENSE"];
const DIRS = ["assets", "data"];
const copy = (rel) => {
  const from = path.join(ROOT, rel), to = path.join(out, rel);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  if (fs.statSync(from).isDirectory()) {
    for (const f of fs.readdirSync(from)) copy(path.join(rel, f));
  } else fs.copyFileSync(from, to);
};
FILES.forEach(copy);
DIRS.forEach(copy);

const hash = crypto.createHash("sha1");
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))
  .forEach((e) => { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name !== "sw.js") hash.update(e.name).update(fs.readFileSync(p)); });
walk(out);
const version = hash.digest("hex").slice(0, 10);

const swPath = path.join(out, "sw.js");
const worker = fs.readFileSync(swPath, "utf8");
if (!/const VERSION = "[^"]*";/.test(worker)) throw new Error("sw.js has no version marker");
fs.writeFileSync(swPath, worker.replace(/const VERSION = "[^"]*";/, `const VERSION = "${version}";`));
fs.writeFileSync(path.join(out, ".nojekyll"), "");

const size = (d) => fs.readdirSync(d, { withFileTypes: true }).reduce((n, e) => n + (e.isDirectory() ? size(path.join(d, e.name)) : fs.statSync(path.join(d, e.name)).size), 0);
console.log(`site → ${out}  (${(size(out) / 1024).toFixed(0)} KB, version ${version})`);
