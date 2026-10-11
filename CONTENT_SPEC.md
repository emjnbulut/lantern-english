# Lantern English — Content Spec

All content lives in `content/` as **JSON** (UTF-8). `node tools/build.mjs` validates it and
generates the browser bundles in `data/` (never edit `data/` by hand).

Run `node tools/validate.mjs` after writing any content file; it must print `OK`.

## Stories — `content/stories/<id>.json`

```json
{
  "id": "gift-of-the-magi",             // kebab-case, same as file name
  "type": "story",
  "title": "The Gift of the Magi",
  "author": "O. Henry",                 // "Lantern Original" for stories we wrote
  "year": 1905,                         // optional for originals
  "level": "B2",                        // A1 | A2 | B1 | B2 | C1 | C2
  "genre": "romance",                   // comedy | mystery | horror | adventure | romance | scifi | fable | drama
  "source": {                           // required for public-domain texts; omit for originals
    "name": "Project Gutenberg #7256",
    "url": "https://www.gutenberg.org/ebooks/7256",
    "license": "Public domain"
  },
  "summaryTr": "Türkçe 1-2 cümlelik spoilersız tanıtım.",
  "paragraphs": [
    "Plain text paragraph. Dialogue uses normal quotes.",
    "## Optional section heading (paragraph starting with '## ')"
  ],
  "glossary": {                         // OPTIONAL context overrides: lowercase word form -> meaning in THIS story
    "flat": "daire, apartman dairesi"
  },
  "phrases": [                          // 4-10 idioms / multi-word expressions worth learning
    { "en": "make ends meet", "tr": "geçinmek, iki yakayı bir araya getirmek" }
  ],
  "quiz": [                             // 3-5 multiple-choice comprehension questions IN ENGLISH, level-appropriate
    { "q": "What does Della sell?", "options": ["Her watch", "Her hair", "Her ring", "Her coat"], "answer": 1, "explainTr": "Della saçını satar." }
  ]
}
```

Rules
- `paragraphs`: one array item per paragraph. No HTML, no markdown except the `## ` heading prefix. Use straight ASCII quotes or curly quotes – either is fine; JSON escaping must be valid.
- Strip Gutenberg headers/footers, illustrations tags, footnote markers and `_underscore_` italics markers.
- Length category is computed automatically from word count: short < 1200, medium 1200–3500, long > 3500.
- Turkish text must use proper Turkish characters (ç ğ ı İ ö ş ü).

## Articles — `content/articles/<id>.json`

Same shape as a story, with these differences:
- `"type": "article"`, `"author": "Lantern Editorial"`.
- `level` is B2, C1 or C2.
- `genre` = the literary genre the article is about (used by the article topic filters). Article cards stay in the article collection, not the story results.
- Use `## ` headings to structure the article (3–6 sections). Existing articles are 700–1400 words; new extended original articles target 1700–2100 words. Add developed arguments and concrete examples rather than padding.
- `quiz` and `phrases` are required as for stories (phrases = academic collocations / useful expressions).

## Reader pagination

Story pages are computed from `paragraphs` in the browser at approximately 450 words per page. Do not split source files or insert artificial page markers. Whole paragraphs and their section headings stay together; the last page includes phrases and the quiz. Articles are not paginated.

## Removed book-summary collection

The owner requested removal of the three book summaries and the separate collection on 2026-10-11.
`type: "summary"` and `content/summaries/` are no longer supported by the content tools. Do not add new summary files or restore the collection from the historical handoff.
Existing abridged stories use `type: "story"` in `content/stories/` and remain available.

For any adaptation, verify the original work and the specific source edition. Attribute the source and identify the English text as our own adaptation; do not copy protected modern translations or assume that every free online edition is public domain. Preserve source events and avoid importing film details.

## Videos — `content/videos/<id>.json`

Videos are a separate collection, bundled as `window.LANTERN_VIDEOS` in `data/videos.js`.
They do not enter the story/article library, reading counts, recommendations or `lantern.bookmarks`.
The initial trial contains one video; the schema does not impose a permanent one-video limit.
If `content/videos/` is absent, the build emits an empty video array.

```json
{
  "id": "sintel",
  "type": "video",
  "title": "Sintel",
  "creator": "Blender Foundation",
  "year": 2010,
  "level": "B1",
  "durationSeconds": 888,
  "genre": "fantasy",
  "summaryTr": "Kısa, Türkçe ve spoilersız tanıtım.",
  "levelNoteTr": "B1, Lantern English'in dinleme için tahmini seviyesidir.",
  "advisoryTr": "Fantastik şiddet ve üzücü sahneler içerir.",
  "videoUrl": "https://example.org/official-video.mp4",
  "source": {
    "name": "Official film source",
    "url": "https://example.org/film/",
    "license": "Verified reuse license",
    "licenseUrl": "https://example.org/license/",
    "credit": "Required creator attribution"
  },
  "subtitleSource": {
    "name": "Official English subtitles",
    "url": "https://example.org/subtitles/en.srt",
    "license": "Verified subtitle reuse license"
  },
  "captions": [
    { "start": 15, "end": 18.5, "text": "Plain English caption text." }
  ],
  "glossary": { "dragon": "ejderha" }
}
```

Rules:
- Replace example URLs with verified official sources. All source/media URLs must use HTTPS; direct media must be an MP4 file. Keep external video files out of the repository and release package.
- Verify the film and subtitle reuse permissions separately and retain required attribution/license information. A freely viewable video does not by itself grant permission to copy its subtitles.
- Level is A1/A2/B1/B2/C1/C2 and must include a Turkish editorial explanation; it is not an official CEFR certification. Genres also allow fantasy/documentary/education alongside the story genres.
- `captions` contains English plain text and numeric seconds from the start of the complete video. Strip SRT markup and formatting tags. Cues must be non-empty, chronological and non-overlapping, with `0 <= start < end`; they may not exceed `durationSeconds` by more than one second.
- `source` fields shown above are required. `subtitleSource.licenseUrl` is optional. `glossary` is optional and uses lowercase word keys with Turkish meanings.
- Caption words use the existing English–Turkish dictionary/tooltip behavior. Site-owned timed captions are separate from native player captions, allowing taps and dictionary lookup.
- The service worker caches the app and caption bundle for revisits. Playback still needs access to the external video host; no offline movie download is provided.

## Dictionary — `content/dict/<chunk>.json`

```json
{
  "abandon": { "pos": "fiil", "tr": "terk etmek, bırakmak" },
  "able":    { "pos": "sıfat", "tr": "yapabilen, muktedir" }
}
```
- Keys are lowercase **lemmas** (base forms): `run`, not `ran`/`running`; `child`, not `children`.
  The site lemmatizes automatically (regular + irregular forms).
- `pos` in Turkish: isim, fiil, sıfat, zarf, zamir, edat, bağlaç, ünlem, belirteç, sayı, kısaltma.
  If a word has two common parts of speech, use e.g. `"isim/fiil"` and give both meanings.
- `tr`: 1–3 most common meanings, comma separated, short (max ~60 chars). Most common meaning first.
- Contractions/function words get entries too (`don't`, `i'm`, `the`, `of`).
