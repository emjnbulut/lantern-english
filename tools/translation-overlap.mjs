// Checks how much of an English story re-uses word sequences of a reference text (e.g. a copyrighted translation).
// Usage: node tools/translation-overlap.mjs <story.json> <reference.txt> [N=5]
// Put the reference text OUTSIDE the repo (never commit copyrighted translations). Retellings of foreign-language
// classics must be re-rendered from the original; target 0 overlaps of 5+ words.
import fs from "node:fs";
const [storyFile, refFile, nArg] = process.argv.slice(2);
if (!storyFile || !refFile) { console.error("Usage: node tools/translation-overlap.mjs <story.json> <reference.txt> [N]"); process.exit(1); }
const N = Number(nArg || 5);
const norm = (s) => s.toLowerCase().replace(/[\u2018\u2019]/g, "'").replace(/[^a-z' ]+/g, " ").split(/\s+/).filter(Boolean);
const ref = norm(fs.readFileSync(refFile, "utf8"));
const grams = new Set();
for (let i = 0; i + N <= ref.length; i++) grams.add(ref.slice(i, i + N).join(" "));
const story = JSON.parse(fs.readFileSync(storyFile, "utf8"));
let total = 0, covered = 0; const rows = [];
story.paragraphs.forEach((p, idx) => {
  if (p.startsWith("## ")) return;
  const w = norm(p); total += w.length;
  const mark = new Array(w.length).fill(false);
  for (let i = 0; i + N <= w.length; i++) if (grams.has(w.slice(i, i + N).join(" "))) for (let j = i; j < i + N; j++) mark[j] = true;
  const c = mark.filter(Boolean).length; covered += c;
  if (c) rows.push({ idx, c, text: p.slice(0, 140) });
});
console.log(`${story.id}: ${N}-gram overlap ${covered}/${total} words = ${(covered / total * 100).toFixed(2)}% in ${rows.length} paragraphs`);
rows.sort((a, b) => b.c - a.c).slice(0, 25).forEach((r) => console.log(`  ¶${r.idx} (${r.c}): ${r.text}`));
