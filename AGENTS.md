# AGENTS.md — handoff guide for AI assistants

Lantern is a static, dependency-free website that teaches English to Turkish speakers through
graded stories. Read this file and `CONTENT_SPEC.md` before changing anything.

## Product brief (the owner's vision)
- Dark, calm UI — neither bare nor busy. UI language is **Turkish**; content is **English**.
- Stories in many genres (comedy, mystery, horror, adventure, romance, sci-fi, fable, drama),
  three lengths (short / medium / long) and CEFR levels A1–C2.
- Hovering (desktop) or tapping (mobile) **any** word shows its Turkish meaning in a tooltip,
  so pages don't need separate keyword lists. Clicking pins the tooltip: pronounce, save to
  "Kelime Defterim" (vocabulary notebook), open in Tureng.
- Advanced levels (B2–C2) get one original article per genre.
- Classics come only from public-domain sources (Project Gutenberg); lower levels use
  original "Lantern Original" stories.
- Extras: comprehension quiz, phrase list, reading progress/resume, read-aloud (Web Speech API),
  spaced-repetition flashcards (Leitner boxes), font size control.

## Layout
```
index.html              app shell (loads the scripts below)
assets/css/style.css    all styles; colour/type tokens at the top of :root
assets/js/lemmatize.js  shared lemmatizer (browser + node tools)
assets/js/app.js        the single-page app (hash routing: #home #library #articles #words #about #s.<id>)
content/stories/*.json  story sources        ┐ edit THESE
content/articles/*.json article sources      │ (format: CONTENT_SPEC.md)
content/dict/*.json     EN→TR dictionary     ┘
data/                   GENERATED bundles — never edit by hand
tools/validate.mjs      validate content (must print OK)
tools/build.mjs         validate + generate data/library.js and data/dict.js
tools/vocab.mjs         list words in content that the dictionary can't resolve
```

## Workflow
1. Add or edit JSON in `content/`.
2. `node tools/validate.mjs` → fix until `OK`.
3. `node tools/vocab.mjs` → add dictionary entries (lemmas, Turkish) for any missing words
   into a `content/dict/*.json` file. Aim for zero missing forms.
4. `node tools/build.mjs` → regenerates `data/`. Commit `content/` and `data/` together.
5. Open `index.html` directly in a browser (works from `file://`, no server needed).

## Conventions
- No frameworks, no build step beyond `tools/build.mjs`, no npm dependencies. Node ≥ 18 for tools.
- User state lives in `localStorage` under the `lantern.` prefix (saved words, progress, prefs);
  always wrap storage access in try/catch.
- Public-domain texts are reproduced exactly (no abridging/modernising); record the source URL.
- Turkish copy uses proper characters (ç ğ ı İ ö ş ü) and a friendly, plain tone.

## Ideas backlog
- More stories per level (especially C2 and A1), more dictionary coverage of rare words.
- Optional Turkish sentence translation on demand.
- Export/import of the vocabulary notebook (JSON).
- GitHub Pages deploy (Settings → Pages → branch `main`, root).
