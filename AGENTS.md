# AGENTS.md — handoff guide for AI assistants

Lantern English is a static, dependency-free website that teaches English to Turkish speakers through
graded stories. Read this file, `HANDOFF.md`, `BOOK_SUMMARIES_HANDOFF.md` and `CONTENT_SPEC.md` before changing anything.

## Product brief (the owner's vision)
- Dark, calm UI — neither bare nor busy. UI language is **Turkish**; content is **English**.
- Stories in many genres (comedy, mystery, horror, adventure, romance, sci-fi, fable, drama),
  three lengths (short / medium / long) and CEFR levels A1–C2.
- Hovering (desktop) or tapping (mobile) **any** word shows its Turkish meaning in a tooltip,
  so pages don't need separate keyword lists. Clicking pins the tooltip: pronounce, save to
  "Kelime Defterim" (vocabulary notebook), open in Tureng.
- Advanced levels (B2–C2) get original articles per genre in their own collection.
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
content/summaries/*.json original book summaries and reading guides
content/dict/*.json     EN→TR dictionary     ┘
drafts/                unfinished content; NOT included in browser bundles
data/                   GENERATED bundles — never edit by hand
tools/validate.mjs      validate content (must print OK)
tools/build.mjs         validate + generate data/library.js and data/dict.js
tools/vocab.mjs         list words in content that the dictionary can't resolve
tools/review-content.mjs editorial checks for changed extended original texts
tools/smoke.mjs         optional headless Edge/Chrome browser checks (Node ≥ 22)
```

## Workflow
1. Add or edit JSON in `content/`.
2. `node tools/validate.mjs` → fix until `OK`.
3. `node tools/vocab.mjs` → add dictionary entries (lemmas, Turkish) for any missing words
   into a `content/dict/*.json` file. Aim for zero missing forms.
4. `node tools/build.mjs` → regenerates `data/`. Commit `content/` and `data/` together.
5. Open `index.html` directly in a browser (works from `file://`, no server needed).
6. For extended original additions, `node tools/review-content.mjs` checks length, exact phrase matches, quizzes and sections before committing. For collection/reader changes, `node tools/smoke.mjs` checks desktop/mobile behavior in an isolated temporary browser profile.

## Conventions
- No frameworks, no build step beyond `tools/build.mjs`, no npm dependencies. Node ≥ 18 for tools.
- User state lives in `localStorage` under the `lantern.` prefix (saved words, progress, prefs);
  always wrap storage access in try/catch.
- Stories, articles and book summaries have separate routes (`#library`, `#articles`, `#summaries`), filter state (`filters` / `articleFilters` / `summaryFilters`), results and reader recommendations. Home level counts include stories only. Three book summaries are saved but not yet published; Animal Farm and final QA are pending (BOOK_SUMMARIES_HANDOFF.md).
- Public-domain texts are reproduced exactly (no abridging/modernising); record the source URL.
- Turkish copy uses proper characters (ç ğ ı İ ö ş ü) and a friendly, plain tone.

## Content status (2026-10-11)
- Latest stopped task: three ready book summaries (Dracula B2, Frankenstein C1, The Metamorphosis C1); Animal Farm not written. Current generated dictionary has 6,852 entries. Editorial review/build passed for the three summaries; new browser QA and publication are pending. The following numbers describe the preceding live checkpoint; see BOOK_SUMMARIES_HANDOFF.md first.
- Saved checkpoint: 27 complete stories: A1 ×3, A2 ×6 (incl. Aesop), B1 ×6, B2 ×6, C1 ×5, C2 ×1 — 10 public-domain classics + 17 originals.
- 16 articles (two per genre, B2–C2). This update adds 8 complete stories and 8 articles written by Astra.
- Dictionary: 6,687 entries. `node tools/vocab.mjs` reports 451 unresolved forms and skips 249 capitalized-only forms; additional translations are pending. Do not reuse the previous coverage percentage.
- `drafts/last-crossing-of-greyhaven.json` is an unfinished C1 adventure (3,697 words); it must not be included in `content/stories/` until its ending and quiz are reviewed. An additional C2 drama is planned but has no file yet. See `HANDOFF.md` for continuation details.
- Editorial deviations from Gutenberg sources: a racial slur was replaced in "The Ransom of Red Chief"
  ("A rock the size of an egg") and in "To Build a Fire" ("a wide flat of tussocks"); obvious
  Gutenberg typos were fixed. "The Star" keeps period ethnic terms; their dictionary entries note
  they are archaic/offensive.
- Repository: `emjnbulut/lantern-english`, private, branch `main`. Owner-private Sites deployment: `https://lantern-english.copperlion512.chatgpt.site`. No custom domain was bought or configured. GitHub Pages is not configured. Read `HOSTING.md` before publishing or changing access; reuse the project_id in `.openai/hosting.json`.
- Verification at checkpoint: content validation and editorial review passed; headless browser checks passed (21 checks, desktop and mobile). Generated `data/` bundles match the complete source content.

## Ideas backlog
- More stories per level (especially C2 and A1), more dictionary coverage of rare words.
- Optional Turkish sentence translation on demand.
- Export/import of the vocabulary notebook (JSON).
- GitHub Pages deploy (Settings → Pages → branch `main`, root).
