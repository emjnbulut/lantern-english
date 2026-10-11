// Lists word forms used in content that the dictionary cannot resolve.
// Usage: node tools/vocab.mjs [--json out.json]   (sorted by frequency, proper nouns excluded)
import fs from "node:fs";
import { loadAll, Lemma } from "./lib.mjs";

const { stories, articles, dict } = loadAll();
const freq = new Map();
const lowerSeen = new Set();
const capOnly = new Map();
for (const t of [...stories, ...articles]) {
  for (const p of t.paragraphs || []) {
    const words = p.match(Lemma.WORD_RE) || [];
    for (const raw of words) {
      const n = Lemma.normalize(raw);
      if (raw[0] === raw[0].toLowerCase()) lowerSeen.add(n);
      else capOnly.set(n, (capOnly.get(n) || 0) + 1);
      if (Lemma.lookup(raw, dict)) continue;
      freq.set(n, (freq.get(n) || 0) + 1);
    }
  }
}
// A word that only ever appears capitalized (mid-sentence too) is most likely a proper noun;
// keep it only if it is frequent as a sentence-initial word we also see in lowercase.
const missing = [...freq.entries()]
  .filter(([w]) => lowerSeen.has(w) || ["i"].includes(w))
  .sort((a, b) => b[1] - a[1]);
const proper = [...freq.keys()].filter((w) => !lowerSeen.has(w));

if (process.argv[2] === "--json") {
  fs.writeFileSync(process.argv[3], JSON.stringify(missing.map(([w]) => w)));
  console.log(`wrote ${missing.length} missing forms to ${process.argv[3]} (${proper.length} capitalized-only skipped)`);
} else {
  console.log(missing.map(([w, n]) => `${w}\t${n}`).join("\n"));
  console.log(`\n${missing.length} missing forms; ${proper.length} capitalized-only (likely proper nouns) skipped`);
}
