// Import publisher JSON3 subtitle drafts without changing video media or reading data.
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./lib.mjs";

const textOf = (s) => String(s || "").replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
export function parseJSON3(data, duration, automatic = false) {
  if (!Array.isArray(data.events) || !Number.isFinite(duration) || duration <= 0) throw new Error("Invalid JSON3 or duration");
  let captions;
  if (!automatic) {
    captions = data.events.filter((e) => e.segs && Number.isFinite(e.tStartMs) && e.dDurationMs > 0)
      .map((e) => ({ start: e.tStartMs / 1000, end: (e.tStartMs + e.dDurationMs) / 1000, text: textOf(e.segs.map((s) => s.utf8 || "").join("")) }));
  } else {
    // ASR rolling display windows overlap. Word timestamps belong to speech, not the window duration.
    const tokens = new Map();
    for (const e of data.events) {
      if (!e.segs || !Number.isFinite(e.tStartMs)) continue;
      for (const s of e.segs) {
        const text = textOf(s.utf8);
        if (!text) continue;
        const at = (e.tStartMs + (s.tOffsetMs || 0)) / 1000;
        const key = at.toFixed(3) + "|" + text;
        if (!tokens.has(key)) tokens.set(key, { at, text });
      }
    }
    const words = [...tokens.values()].filter((w) => w.at >= 0 && w.at < duration).sort((a, b) => a.at - b.at);
    captions = [];
    let group = [];
    function flush(nextAt) {
      if (!group.length) return;
      const start = group[0].at, last = group.at(-1).at;
      captions.push({ start, end: Math.min(duration, nextAt, last + 1.4), text: group.map((w) => w.text).join(" ") });
      group = [];
    }
    words.forEach((w, i) => {
      if (group.length && (group.length >= 12 || w.at - group[0].at > 5 || w.at - group.at(-1).at > 1.2)) flush(w.at);
      group.push(w);
      if (/[.!?]$/.test(w.text) && group.length >= 4) flush(words[i + 1]?.at ?? duration);
    });
    flush(duration);
  }
  captions = captions.filter((c) => c.text && c.start >= 0 && c.start < duration).sort((a, b) => a.start - b.start);
  const merged = [];
  for (const c of captions) {
    c.end = Math.min(c.end, duration);
    const previous = merged.at(-1);
    if (previous && c.start === previous.start) {
      if (previous.text !== c.text) previous.text += " " + c.text;
      previous.end = Math.max(previous.end, c.end);
    } else merged.push(c);
  }
  return merged.map((c, i) => ({ ...c, end: Math.min(c.end, merged[i + 1]?.start ?? duration) })).filter((c) => c.end > c.start);
}

export function parseSRT(source, duration) {
  const seconds = (s) => {
    const [h, m, rest] = s.replace(",", ".").split(":");
    return Number(h) * 3600 + Number(m) * 60 + Number(rest);
  };
  const events = [];
  for (const block of source.replace(/^\uFEFF/, "").replace(/\r/g, "").split(/\n\s*\n/)) {
    const lines = block.split("\n");
    const i = lines.findIndex((l) => /\d+:\d+:\d+[,.]\d+\s*-->/.test(l));
    if (i < 0) continue;
    const m = lines[i].match(/(\d+:\d+:\d+[,.]\d+)\s*-->\s*(\d+:\d+:\d+[,.]\d+)/);
    if (!m) continue;
    const start = seconds(m[1]), end = seconds(m[2]);
    events.push({ tStartMs: start * 1000, dDurationMs: (end - start) * 1000, segs: [{ utf8: lines.slice(i + 1).join(" ") }] });
  }
  return parseJSON3({ events }, duration);
}

if (process.argv.includes("--audit")) {
  for (const file of fs.readdirSync(path.join(ROOT, "drafts/video-caption-import")).filter(f=>f.endsWith('.json3'))) {
    const d = JSON.parse(fs.readFileSync(path.join(ROOT, "drafts/video-caption-import", file), "utf8"));
    console.log(file, JSON.stringify(d.events.filter((e) => e.segs).slice(0, 5)));
  }
} else if (process.argv.includes("--import")) {
  const draftDir = path.join(ROOT, "drafts/video-caption-import");
  const files = fs.readdirSync(draftDir);
  for (const name of fs.readdirSync(path.join(ROOT, "content/videos"))) {
    const file = path.join(ROOT, "content/videos", name);
    const v = JSON.parse(fs.readFileSync(file, "utf8"));
    if (v.provider !== "youtube") continue;
    const draft = v.id === "other-side-of-the-box" ? "other-side-of-the-box/OTHER_SIDE_OF_THE_BOX_(2018).srt" : files.find((f) => f.startsWith(v.youtubeId + "."));
    if (!draft) { console.log(v.id + ": no subtitle draft"); continue; }
    const automatic = draft.includes("en-orig");
    const raw = fs.readFileSync(path.join(draftDir, draft), "utf8");
    const captions = draft.endsWith(".srt") ? parseSRT(raw, v.durationSeconds) : parseJSON3(JSON.parse(raw), v.durationSeconds, automatic);
    if (!captions.length) throw new Error(v.id + ": empty captions");
    v.captions = captions;
    v.captionKind = automatic ? "automatic" : draft.endsWith(".srt") ? "community" : "publisher";
    v.subtitleSource = {
      name: draft.endsWith(".srt") ? "Chris_Flynn1 — İngilizce altyazı" : v.source.name + (automatic ? " — otomatik İngilizce altyazı" : " — İngilizce altyazı"),
      url: draft.endsWith(".srt") ? "https://subf2m.co/subtitles/other-side-of-the-box/english/3088113" : v.source.watchUrl || v.source.url,
      license: "Altyazı hakları kaynak hak sahiplerine aittir",
      credit: draft.endsWith(".srt") ? "Chris_Flynn1; kaynak kaydında zamanları düzeltilmiş altyazı olarak belirtilmiştir." : v.source.credit,
      changeNoteTr: automatic ? "Otomatik altyazı; sözcük veya zaman hataları olabilir. Tekrarlanan gösterim pencereleri kelime zamanlarına göre birleştirilmiştir." : "Yayıncının zamanlı İngilizce altyazısı aktarılmıştır. Biçim etiketleri kaldırılmış, çakışan gösterimlerin bitişleri sonraki altyazıya göre sınırlandırılmıştır. Video süresinden sonraki bölümler gösterilmez."
    };
    fs.writeFileSync(file, JSON.stringify(v, null, 2) + "\n");
    console.log(`${v.id}: ${captions.length} ${v.captionKind} cues`);
  }
}
