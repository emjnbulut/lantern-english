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

## Book summaries — `content/summaries/<id>.json`

Use the same content shape, with `type: "summary"` and `author: "Lantern Editorial"`. Summaries are original English summaries and literary reading guides, not reproductions of the author's original prose. They live in their own `#summaries` collection.

- `work` is required: `{ "title": "Dracula", "titleTr": "Drakula", "author": "Bram Stoker", "year": 1897 }`. An optional `editionYear` distinguishes the edition used. `work.author` credits the original author; `author` credits the summary writer.
- `source: {name, url, license}` is required and points to a verified original work or reliable bibliographic source. Describe the source and the original summary accurately; do not label all source works public domain indiscriminately.
- Target **30–40 minutes** at the app's level-specific reading speeds: A1 70, A2 90, B1 110, B2 130, C1 150, C2 170 words/minute. Current additions target B2 4,500–5,000 words or C1 4,800–5,400 words.
- Use 8–12 `## ` sections, five comprehension questions with four distinct options and Turkish explanations, and eight useful expressions that actually occur in the text.
- Keep source events and original interpretation distinguishable. Check names, endings, and edition differences; do not import film details or quote modern translations. Avoid padding and invented scenes.
- Spoilers are expected and disclosed in the UI. `summaryTr` remains a short introductory blurb.
- For a source that remains copyrighted, use a brief high-level plot overview and original critical discussion/reading guidance rather than recreating the book scene by scene.

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
