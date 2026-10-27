// Verify the deployed visitor files against an already-built, reviewed release package.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const expected = path.resolve(process.argv[2] || "site");
const base = "https://lantern-english.github.io/";
const allFiles = ["index.html", "assets/js/app.js", "assets/css/style.css", "data/videos.js", "data/dict.js", "data/library.js", "sw.js", "manifest.webmanifest", "LICENSE"];
const requested = process.argv.slice(3);
if (requested.some(f => !allFiles.includes(f))) throw new Error("Unknown visitor file");
const files = requested.length ? requested : allFiles;
const hash = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");
let failures = 0;
// Keep traffic small and bounded; a mismatch is a failure, not a successful deployment.
for (let i = 0; i < files.length; i += 3) {
  await Promise.all(files.slice(i, i + 3).map(async (file) => {
    const wanted = fs.readFileSync(path.join(expected, file));
    try {
      const response = await fetch(base + file + "?release-check=" + Date.now(), { cache: "no-store", signal: AbortSignal.timeout(60000) });
      if (!response.ok) throw new Error("HTTP " + response.status);
      const live = Buffer.from(await response.arrayBuffer());
      if (hash(live) !== hash(wanted)) throw new Error("SHA-256 does not match the release package");
      console.log("OK " + file + " " + hash(live).slice(0, 12));
    } catch (error) { failures++; console.error("FAIL " + file + ": " + error.message); }
  }));
}
if (failures) process.exitCode = 1;
else console.log(`OK: all ${files.length} checked visitor files exactly match the reviewed release package.`);
