// Videos are a separate collection: never add them to reading/bookmark bundles.
import fs from "node:fs";
import path from "node:path";
import { ROOT, LEVELS } from "./lib.mjs";

const VIDEO_GENRES = ["comedy", "mystery", "horror", "adventure", "romance", "scifi", "fable", "drama", "fantasy", "documentary", "education"];
// Viewer-facing shelves on #videos; keep in sync with VIDEO_CATEGORIES in assets/js/app.js.
export const VIDEO_CATEGORIES = ["fun", "adventure", "scifi", "real", "horror"];
const object = (v) => !!v && typeof v === "object" && !Array.isArray(v);
const plainText = (v) => typeof v === "string" && !!v.trim() && !/<[^>]*>/.test(v);
const httpsUrl = (v) => {
  if (typeof v !== "string") return false;
  try {
    const u = new URL(v);
    return u.protocol === "https:" && !!u.hostname && !u.username && !u.password;
  } catch { return false; }
};

export function validateVideo(d, file, errors) {
  const e = (m) => errors.push(`${file}: ${m}`);
  if (!object(d)) { e("video must be an object"); return; }
  if (typeof d.id !== "string" || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(d.id)) e("id must be kebab-case");
  if (path.basename(file, ".json") !== d.id) e(`file name must equal id (${d.id})`);
  if (d.type !== "video") e('type must be "video"');
  for (const key of ["title", "creator", "summaryTr", "levelNoteTr"]) {
    if (!plainText(d[key])) e(`${key} must be non-empty plain text`);
  }
  if (!LEVELS.includes(d.level)) e(`level must be one of ${LEVELS}`);
  if (!VIDEO_GENRES.includes(d.genre)) e(`genre must be one of ${VIDEO_GENRES}`);
  if (!VIDEO_CATEGORIES.includes(d.category)) e(`category must be one of ${VIDEO_CATEGORIES}`);
  if (!Number.isInteger(d.year) || d.year < 1) e("year must be a positive integer");
  const durationValid = Number.isFinite(d.durationSeconds) && d.durationSeconds > 0;
  if (!durationValid) e("durationSeconds must be a finite positive number");
  const youtube = d.provider === "youtube";
  if (d.provider !== undefined && !youtube) e("unknown video provider");
  if (youtube) {
    if (!/^[A-Za-z0-9_-]{11}$/.test(d.youtubeId || "")) e("youtubeId must be a valid video ID");
  } else if (!httpsUrl(d.videoUrl)) e("videoUrl must be an HTTPS URL without credentials");
  else if (!/\.(mp4|webm|m4v)$/i.test(new URL(d.videoUrl).pathname)) e("videoUrl must point to a supported video file");

  if (d.qualities !== undefined) {
    if (!Array.isArray(d.qualities) || d.qualities.length < 2) e("qualities must list at least two options");
    else {
      const labels = new Set();
      d.qualities.forEach((q, i) => {
        if (!object(q) || !plainText(q.label) || !httpsUrl(q.url) || !/\.(mp4|webm|m4v)$/i.test(new URL(q.url).pathname)) { e(`quality ${i} needs a label and a supported HTTPS video url`); return; }
        if (labels.has(q.label)) e(`quality ${i} repeats label ${q.label}`);
        labels.add(q.label);
        if (q.sizeMB !== undefined && !(Number.isFinite(q.sizeMB) && q.sizeMB > 0)) e(`quality ${i} sizeMB must be a positive number`);
      });
      if (!d.qualities.some((q) => object(q) && q.url === d.videoUrl)) e("videoUrl must be one of the qualities");
    }
  }

  for (const [key, texts, urls] of [
    ["source", ["name", "license", "credit"], ["url", "licenseUrl"]],
    ["subtitleSource", ["name", "license"], ["url"]],
  ]) {
    if (key === "subtitleSource" && youtube && !d.captions?.length) continue;
    if (!object(d[key])) { e(`${key} must be an attribution object`); continue; }
    for (const field of texts) if (!plainText(d[key][field])) e(`${key}.${field} must be non-empty plain text`);
    for (const field of urls) if (!httpsUrl(d[key][field])) e(`${key}.${field} must be an HTTPS URL without credentials`);
  }
  if (object(d.subtitleSource) && d.subtitleSource.licenseUrl !== undefined && !httpsUrl(d.subtitleSource.licenseUrl)) {
    e("subtitleSource.licenseUrl must be an HTTPS URL without credentials");
  }

  if (!Array.isArray(d.captions) || (!youtube && !d.captions.length)) e("captions must be a non-empty array for native videos");
  else {
    let previousStart = -1, previousEnd = 0;
    d.captions.forEach((cue, i) => {
      if (!object(cue)) { e(`caption ${i} must be an object`); return; }
      const timesValid = Number.isFinite(cue.start) && cue.start >= 0 && Number.isFinite(cue.end) && cue.end > cue.start;
      if (!timesValid) e(`caption ${i} needs finite times with 0 <= start < end`);
      else {
        if (cue.start <= previousStart || cue.start < previousEnd) e(`caption ${i} must follow the previous cue without overlap`);
        if (durationValid && cue.end > d.durationSeconds + 1) e(`caption ${i} exceeds the video duration`);
        previousStart = cue.start;
        previousEnd = cue.end;
      }
      if (!plainText(cue.text)) e(`caption ${i} text must be non-empty plain text (strip SRT/HTML tags)`);
    });
  }
  if (d.glossary !== undefined) {
    if (!object(d.glossary)) e("glossary must be an object");
    else for (const [word, meaning] of Object.entries(d.glossary)) {
      if (!plainText(word) || word !== word.toLowerCase()) e(`glossary key "${word}" must be lowercase plain text`);
      if (!plainText(meaning)) e(`glossary "${word}" must have a plain-text meaning`);
    }
  }
}

export function loadVideos(root = ROOT) {
  const dir = path.join(root, "content/videos");
  const videos = [], errors = [], ids = new Set();
  if (!fs.existsSync(dir)) return { videos, errors };
  for (const name of fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
    const file = path.join("content/videos", name);
    let data;
    try { data = JSON.parse(fs.readFileSync(path.join(dir, name), "utf8").replace(/^\uFEFF/, "")); }
    catch (err) { errors.push(`${file}: invalid JSON: ${err.message}`); continue; }
    validateVideo(data, file, errors);
    if (!object(data)) continue;
    if (ids.has(data.id)) errors.push(`${file}: duplicate video id ${data.id}`);
    ids.add(data.id);
    videos.push(data);
  }
  return { videos, errors };
}
