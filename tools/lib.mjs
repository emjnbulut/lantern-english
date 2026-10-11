import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
export const GENRES = ["comedy", "mystery", "horror", "adventure", "romance", "scifi", "fable", "drama"];

vm.runInThisContext(fs.readFileSync(path.join(ROOT, "assets/js/lemmatize.js"), "utf8"));
export const Lemma = globalThis.LanternLemma;

function readJsonDir(dir) {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full).filter((f) => f.endsWith(".json")).sort().map((f) => {
    const file = path.join(dir, f);
    try {
      return { file, data: JSON.parse(fs.readFileSync(path.join(ROOT, file), "utf8").replace(/^﻿/, "")) };
    } catch (e) {
      return { file, error: `invalid JSON: ${e.message}` };
    }
  });
}

export function wordCount(paragraphs) {
  return paragraphs.filter((p) => !p.startsWith("## ")).join(" ").match(Lemma.WORD_RE)?.length ?? 0;
}

export function lengthOf(words) {
  return words < 1200 ? "short" : words <= 3500 ? "medium" : "long";
}

function validateText(item, kind, file, errors) {
  const e = (m) => errors.push(`${file}: ${m}`);
  const d = item;
  if (!d.id || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(d.id)) e("id must be kebab-case");
  if (path.basename(file, ".json") !== d.id) e(`file name must equal id (${d.id})`);
  if (d.type !== kind) e(`type must be "${kind}"`);
  for (const k of ["title", "author", "summaryTr"]) if (typeof d[k] !== "string" || !d[k].trim()) e(`missing ${k}`);
  if (!LEVELS.includes(d.level)) e(`level must be one of ${LEVELS}`);
  if (kind === "article" && !["B2", "C1", "C2"].includes(d.level)) e("article level must be B2/C1/C2");
  if (!GENRES.includes(d.genre)) e(`genre must be one of ${GENRES}`);
  if (!Array.isArray(d.paragraphs) || d.paragraphs.length < 3) e("paragraphs must be an array (>=3)");
  else d.paragraphs.forEach((p, i) => {
    if (typeof p !== "string" || !p.trim()) e(`paragraph ${i} empty or not a string`);
    else if (/<[a-z][^>]*>|\[Illustration|_[A-Za-z][^_]*_/.test(p)) e(`paragraph ${i} contains markup/illustration/underscore italics`);
  });
  if (d.author !== "Lantern Original" && d.author !== "Lantern Editorial") {
    if (!d.source || !d.source.url || !d.source.license) e("public-domain text needs source {name,url,license}");
  }
  if (d.glossary !== undefined && (typeof d.glossary !== "object" || Array.isArray(d.glossary))) e("glossary must be an object");
  if (!Array.isArray(d.phrases) || d.phrases.length < 3) e("phrases: need >= 3");
  else d.phrases.forEach((p, i) => { if (!p.en || !p.tr) e(`phrase ${i} needs en+tr`); });
  if (!Array.isArray(d.quiz) || d.quiz.length < 3) e("quiz: need >= 3 questions");
  else d.quiz.forEach((q, i) => {
    if (!q.q || !Array.isArray(q.options) || q.options.length < 2) e(`quiz ${i} malformed`);
    else if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) e(`quiz ${i} answer index out of range`);
  });
}

export function loadAll() {
  const errors = [];
  const stories = [], articles = [];
  for (const [dir, kind, list] of [["content/stories", "story", stories], ["content/articles", "article", articles]]) {
    for (const { file, data, error } of readJsonDir(dir)) {
      if (error) { errors.push(`${file}: ${error}`); continue; }
      validateText(data, kind, file, errors);
      list.push(data);
    }
  }
  const dict = {};
  for (const { file, data, error } of readJsonDir("content/dict")) {
    if (error) { errors.push(`${file}: ${error}`); continue; }
    for (const [k, v] of Object.entries(data)) {
      if (k !== k.toLowerCase()) errors.push(`${file}: key "${k}" must be lowercase`);
      if (!v || typeof v.tr !== "string" || !v.tr.trim()) { errors.push(`${file}: "${k}" missing tr`); continue; }
      const key = k.toLowerCase().replace(/’/g, "'");
      if (!dict[key]) dict[key] = { pos: v.pos || "", tr: v.tr.trim() };
    }
  }
  const ids = new Set();
  for (const t of [...stories, ...articles]) {
    if (ids.has(t.id)) errors.push(`duplicate id ${t.id}`);
    ids.add(t.id);
  }
  return { stories, articles, dict, errors };
}
