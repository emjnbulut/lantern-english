# AGENTS.md — handoff guide for AI assistants

Lantern English is a static, dependency-free website that teaches English to Turkish speakers through
graded stories. Read this file, `HANDOFF.md` and `CONTENT_SPEC.md` before changing anything.
`BOOK_SUMMARIES_HANDOFF.md` is an archived record of a removed feature, not an active task list.

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
assets/js/app.js        the single-page app (hash routing: #home #library #articles #my-library #words #about #s.<id>)
content/stories/*.json  story sources        ┐ edit THESE
content/articles/*.json article sources      │ (format: CONTENT_SPEC.md)
content/featured.json  editorial "Önerilenler" picks per level (ids + short Turkish why)
content/dict/*.json     EN→TR dictionary     ┘
drafts/                unfinished content; NOT included in browser bundles
data/                   GENERATED bundles — never edit by hand
tools/validate.mjs      validate content (must print OK)
tools/build.mjs         validate + generate data/library.js and data/dict.js
tools/vocab.mjs         list words in content that the dictionary can't resolve
tools/review-content.mjs editorial checks for changed extended original texts
tools/smoke.mjs         optional headless Edge/Chrome browser checks (Node ≥ 22)
tools/make-site.mjs     writes ./site: only the visitor-facing files (no content/, drafts/, notes)
tools/publish-site.mjs  legacy publisher; uses --force, so do not use for site updates (see HOSTING.md)
manifest.webmanifest, sw.js, assets/icons/  installable mobile app (PWA) + offline cache
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
- User state lives in `localStorage` under the `lantern.` prefix (saved words, bookmarks, progress, prefs);
  always wrap storage access in try/catch.
- `#my-library` (Kitaplığım) lists saved stories and articles. Store their IDs as an array in `lantern.bookmarks`; these records belong to the current browser/device. Card and reader save controls share this state. The list supports search, content type and sorting, with the same reading progress/resume as the regular collections.
- Story recommendations obey all active filters and show at most three cards in total, including when multiple levels are selected. Abridged classics take priority among eligible featured picks; Dracula is featured at B1 and Frankenstein at B2. Picks not displayed in that section remain in the normal results.
- Stories and articles have separate routes (`#library`, `#articles`), filter state (`filters` / `articleFilters`), results and reader recommendations. Home level counts include stories only. The owner requested removal of the three book summaries and their collection on 2026-10-11; do not restore `#summaries` or summary source files. Existing abridged stories in `content/stories/` are a separate collection and remain in place.
- Stories are divided into pages of approximately 450 words without splitting paragraphs or leaving section headings behind. Reader controls provide previous/next and page selection, restore the current page, and show phrases/quiz on the final page. Articles remain continuous. The top-left back control uses internal navigation history with a fallback for direct entry.
- Public-domain texts are reproduced exactly (no abridging/modernising); record the source URL.
- Turkish copy uses proper characters (ç ğ ı İ ö ş ü) and a friendly, plain tone.

## Mobile app / WebView rules
- Keep JS syntax conservative for old WebViews: no regex lookbehind, no top-level await; add plain fallbacks before `color-mix()` / `backdrop-filter`.
- Respect safe areas (`env(safe-area-inset-*)`), keep inputs ≥16 px, keep paths relative (the site is served from sub-paths and `file://`).
- `sw.js` is stamped by `tools/make-site.mjs`; registration is skipped on `file://`.
- Footer credit "created by emjn" and `LICENSE` are owner requirements; keep them.

## Current change (2026-10-11)
- The owner requested a Kitaplığım tab. Add `#my-library` to the top navigation, Kaydet/Kaydedildi controls to story and article cards, and Kitaplığıma ekle/Kitaplığımdan çıkar in the reader. No new content is part of this interface task; run browser checks before publication.
- The three book-summary source files and their build/schema support were removed at the owner's request. The site has story and article collections only.
- Preserve the published Dracula and Frankenstein abridged stories and dictionaries. They are story sources, not the removed summaries. Commit `8960ce3` completed the other AI's Frankenstein edits/dictionary and moved the Kafka retelling to `drafts/the-metamorphosis-abridged.json` pending an overlap fix; this draft is excluded from the website. Build the release from a clean committed checkout.
- The seven planned adaptations in README remain a backlog; this interface task does not authorize writing them.
- Run the build and browser checks after the bookshelf changes; previous check counts describe an older snapshot.

## Historical content status (2026-10-11, Claude session)
- At that checkpoint: 28 stories (A1 ×3, A2 ×6, B1 ×6, B2 ×6, C1 ×6, C2 ×1): 10 public-domain classics + 18 originals. 16 articles (two per genre, B2–C2). The three book guides from that checkpoint have since been removed.
- Dictionary: 7,533 entries; run `node tools/vocab.mjs` for the current gap list (remaining forms are character names, initials and fragments).
- `content/featured.json` holds the editorial "Önerilenler" picks (2–3 per level, C2 has none because it has one story); `tools/validate.mjs` checks ids/levels.
- `last-crossing-of-greyhaven` (C1 adventure) was finished and moved from drafts/ into content/stories/.
- Animal Farm was REMOVED (owner decision, 2026-10-11): still under US copyright until 2040, so neither the guide nor a retelling is published. Do not re-add it without clearance.
- NOT done on purpose: the second C2 drama proposed in HANDOFF.md and the seven planned adaptations in README "Eklenecek hikâyeler" (the owner said not to touch the planned stories).
- Known editorial notes (not fixed): `fables-from-aesop` is labelled A2 but uses Victorian vocabulary (C1-ish); `the-piano-at-two-oclock` has an unexplained pipe-smoke clue; `where-the-river-sleeps` leaves how the instruments reached Cappadocia unexplained; "The Star" keeps period ethnic terms (see dictionary notes).
- Editorial deviations from Gutenberg sources: a racial slur was replaced in "The Ransom of Red Chief" ("A rock the size of an egg") and in "To Build a Fire" ("a wide flat of tussocks"); obvious Gutenberg typos were fixed.
- Verification: `node tools/validate.mjs` OK; `node tools/smoke.mjs` 45 browser checks OK; 390 px mobile QA (overflow, tooltips, Önerilenler, PWA wiring) OK.
- Source repo: `emjnbulut/lantern-english` (private). **Public site: https://lantern-english.github.io/** (repo `lantern-english/lantern-english.github.io`, built output only). Follow HOSTING.md: copy a verified clean package into the normal public checkout, then commit and push while preserving history. Do not use the force-pushing `tools/publish-site.mjs`. Old owner-private ChatGPT Sites copy is outdated.

## Ideas backlog
- User-selected seven planned English adaptations (three Ömer Seyfettin, three Dede Korkut, Pinocchio): see [README — Eklenecek hikâyeler](README.md#eklenecek-hikâyeler) for titles, proposed A2/B1 levels and source references. This request added a GitHub backlog only; no story text was written or published.
- More stories per level (especially C2 and A1), more dictionary coverage of rare words.
- Optional Turkish sentence translation on demand.
- Export/import of the vocabulary notebook (JSON).
- Public hosting: see HOSTING.md (separate public site repo + Pages).
