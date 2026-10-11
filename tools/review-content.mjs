// Editorial checks for new/changed content, in addition to schema validation.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { ROOT, loadAll, wordCount, Lemma } from "./lib.mjs";

const dirs = ["content/stories", "content/articles", "content/summaries"];
const gitLines = (args) => execFileSync("git", args, { cwd: ROOT, encoding: "utf8", windowsHide: true }).trim().split(/\r?\n/).filter(Boolean);
const paths = [...new Set([...gitLines(["diff", "--name-only", "HEAD", "--", ...dirs]), ...gitLines(["ls-files", "--others", "--exclude-standard", "--", ...dirs])])].filter((p) => p.endsWith(".json") && fs.existsSync(path.join(ROOT, p)));
const { errors: schemaErrors } = loadAll();
const errors = [...schemaErrors];
const floors = { A1: 1600, A2: 2200, B1: 4500, B2: 4500, C1: 4500, C2: 5000 };
const tokens = (s) => (s.match(Lemma.WORD_RE) || []).map(Lemma.normalize);
const hasSequence = (haystack, needle) => haystack.some((_, i) => needle.every((w, j) => haystack[i + j] === w));

for (const file of paths) {
  const raw = fs.readFileSync(path.join(ROOT, file), "utf8");
  const t = JSON.parse(raw.replace(/^\uFEFF/, ""));
  if (!["Lantern Original", "Lantern Editorial"].includes(t.author)) continue;
  const fail = (message) => errors.push(`${file}: ${message}`);
  const count = wordCount(t.paragraphs);
  const summaryWpm = { A1: 70, A2: 90, B1: 110, B2: 130, C1: 150, C2: 170 }[t.level];
  const floor = t.type === "summary" ? 30 * summaryWpm : t.type === "article" ? 1700 : floors[t.level];
  if (count < floor) fail(`needs at least ${floor} words; found ${count}`);
  if (t.type === "summary") {
    if (count > 40 * summaryWpm) fail(`book summary exceeds 40 minutes at ${summaryWpm} words/minute`);
    const headings = t.paragraphs.filter((p) => p.startsWith("## ")).length;
    if (headings < 8 || headings > 12) fail("book summary needs eight to twelve sections");
  }
  if (raw.includes("\uFFFD")) fail("contains a broken UTF-8 replacement character");
  if (t.phrases.length < 6) fail("needs at least six useful expressions");
  const paragraphTokens = t.paragraphs.filter((p) => !p.startsWith("## ")).map(tokens);
  for (const ph of t.phrases) {
    const needle = tokens(ph.en);
    if (needle.length < 2 || !paragraphTokens.some((p) => hasSequence(p, needle))) fail(`phrase is not present in the text: ${ph.en}`);
  }
  if (t.quiz.length !== 5) fail("needs five comprehension questions");
  for (const [i, q] of t.quiz.entries()) {
    if (q.options.length !== 4 || new Set(q.options.map((o) => o.trim().toLowerCase())).size !== 4) fail(`quiz ${i + 1} needs four distinct choices`);
    if (!q.explainTr?.trim()) fail(`quiz ${i + 1} needs a Turkish explanation`);
  }
  if (t.type === "article") {
    const headings = t.paragraphs.filter((p) => p.startsWith("## ")).length;
    if (headings < 3 || headings > 6) fail("article needs three to six sections");
  }
  const developed = t.paragraphs.filter((p) => !p.startsWith("## ") && tokens(p).length >= 30).map((p) => p.trim().toLowerCase());
  if (new Set(developed).size !== developed.length) fail("has a repeated developed paragraph");
  console.log(`${t.type} ${t.level} ${count}w ${t.id}`);
}
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log(`OK: ${paths.length} changed content files reviewed.`);
