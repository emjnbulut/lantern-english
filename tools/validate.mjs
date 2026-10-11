import { loadAll, wordCount, lengthOf } from "./lib.mjs";

const { stories, articles, summaries, dict, errors } = loadAll();
for (const t of [...stories, ...articles, ...summaries]) {
  if (!Array.isArray(t.paragraphs)) continue;
  const w = wordCount(t.paragraphs);
  console.log(`${t.type.padEnd(7)} ${t.level} ${t.genre.padEnd(9)} ${String(w).padStart(5)}w ${lengthOf(w).padEnd(6)} ${t.id}`);
}
console.log(`dictionary entries: ${Object.keys(dict).length}`);
if (errors.length) {
  console.log("\nERRORS:\n" + errors.map((e) => " - " + e).join("\n"));
  process.exit(1);
}
console.log("OK");
