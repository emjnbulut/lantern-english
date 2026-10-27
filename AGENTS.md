# AGENTS.md — handoff guide for AI assistants

## Visual refresh published (2026-10-27)
The PDF-guided homepage refresh is live at https://lantern-english.github.io/. Source commit `470eb99`, public commit `a5e9711`, service-worker version `7e0c4b5310`. Only CSS, app.js and sw.js changed in the public release. Source smoke passed 634 checks; all nine visitor files match the live site after CRLF/LF normalization. See HOSTING.md. A fresh source build removes 61 legacy dictionary keys from the tracked bundle; inspect that mismatch before the next content release.

## YouTube videos temporarily unpublished (2026-10-14)
The user requested removing the 10 YouTube videos from the live site for now. Their source JSON and captions are retained with `published: false`; tools/build.mjs excludes unpublished videos from data/videos.js. The removal release was public `a848853`, from source application `40bc66c`, worker `877a5b875c`; 21 native-player videos and all 10 removed direct routes were checked live (100 checks). Do not restore the YouTube catalog entries without a new user request. Direct links to unpublished video IDs must not load the YouTube player. See HOSTING.md for release verification.

## Video-caption fix (2026-10-14)
The user resumed `fix/video-caption-meanings` and subsequently authorized saving to GitHub and updating the public site. The live release is public `333ac97`, from source application `4b9d653`, service-worker version `a8bd3e2574`; Pages succeeded and all nine core live files match the package. Read `VIDEO_CAPTIONS_HANDOFF.md` and HOSTING.md for tests/release details. All 31 videos now have timed captions in source. Raw subtitle drafts in `drafts/video-caption-import/` are not bundled.

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
tools/translation-overlap.mjs  n-gram overlap of a story vs a reference translation (keep the reference outside the repo)
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
- `#my-library` (Kitaplığım) lists all saved stories and articles without a count limit. Store their IDs as an array in `lantern.bookmarks`; these records belong to the current browser/device. Cards use save buttons; every reader has a native "Kitaplığıma ekle" checkbox, checked only for an already-saved text. Opening, reading or completing a text must never add a bookmark automatically. Search/type filters reset to all/empty on each library visit, sorting may persist, and the result count shows displayed/total when filtered. Reading progress/resume is independent of bookmarks.
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

## Video shelves and non-Blender videos (2026-10-12, later)
- `#videos` is grouped into four shelves via the required `category` field (`fun`, `adventure`, `scifi`, `real`; labels in `VIDEO_CATEGORIES` in app.js, ids validated in tools/video-content.mjs). Chips at the top filter one shelf; within a shelf videos sort by level, then length.
- Added (owner request): Pepper & Carrot ep. 6 and Morevna ep. 3 (Morevna Project, CC BY-SA 4.0, MP4 from peertube.touhoppai.moe; English SRT from github.com/morevnaproject/subtitles-translation, CC BY 4.0) and NASA "How Big Is Space?" and "Astronauts Reading Fan Mail #3" (public domain, NASA's own SRT). Fan Mail captions were converted from ALL CAPS to sentence case and merged into readable cues; words unchanged.
- Offline downloads (owner request, 13 Oct 2026): every video page has an "İndir" row under the player (progress, cancel, delete). Files go to Cache Storage `offline-videos-v1` (no "lantern-" prefix, so sw.js version cleanup keeps them); `lantern.downloads` stores `{id: {url, label, bytes, at}}`, checked against the cache on load. sw.js answers `.mp4` requests for downloaded URLs from that cache with 206 range responses and leaves other video requests alone. `#videos` has a small "İndirilenler" tab in the top-right corner with the saved list, total size and delete buttons; downloaded cards get an "İndirildi" badge. Hosts must send CORS headers (Blender, NASA, Morevna PeerTube and VOA do; nps.gov does not, so that video shows a "server does not allow downloads" note after a failed attempt).
- Rejected sources: archive.org licence tags (unreliable), files whose captions are ASR-only, Commons WebM-only files, NASA caption files that are "[Captions Unavailable]" placeholders or in another language.

## Current video additions (2026-10-12)
- The owner authorized three NEW videos: Elephants Dream (B1 with subtitle support), Cosmos Laundromat: First Cycle (B2), Sprite Fright (B2). Five videos total; preserve Sintel and Tears of Steel. Levels are editorial listening estimates, not certifications.
- Official complete Blender MP4 files include end credits and default to 720p. Sprite Fright uses the official English VTT; the other two use Wikimedia Commons contributor captions under CC BY-SA 4.0, credited and linked separately from the film licenses. Caption formatting is stripped; three Elephants Dream overlaps are clipped by 3–9 ms and disclosed.
- Validate new caption vocabulary with node tools/video-vocab.mjs elephants-dream cosmos-laundromat sprite-fright; do not alter unrelated content or undo the other AI’s player/fullscreen/network-first service-worker changes. Build from a clean committed worktree and follow HOSTING.md.

## Current change (2026-10-11)
- The owner then authorized exactly one trial video, Sintel (B1 with English subtitle support, an editorial estimate). `#videos` and `#v.sintel` are separate from reading collections and bookmarks. Its verified official CC BY 3.0 English SRT has 26 timed cues; the complete external film includes credits. `content/videos/` builds into `data/videos.js`. Do not add further videos without a new request. Words in the separate subtitle area use the existing dictionary; tapping pauses playback. Video media loads only after a play action and requires internet.
- The owner requested the final bookshelf correction: all records must remain available beyond three, and every story needs an explicit "Kitaplığıma ekle" checkbox instead of automatic saving on entry. Keep the existing card save buttons; reader check/uncheck adds/removes only that text. Verify more than three records across reloads and that entering an unsaved story does not save it. No new content is part of this interface task.
- The three book-summary source files and their build/schema support were removed at the owner's request. The site has story and article collections only.
- Preserve the published Dracula and Frankenstein abridged stories and dictionaries. They are story sources, not the removed summaries. The Kafka retelling (`content/stories/the-metamorphosis-abridged.json`, C1) was first parked in drafts/ because 18.9% of its words overlapped (5-grams) a copyrighted English translation; it was then re-rendered from the German original and now measures 0 overlaps of 5+ words (`tools/translation-overlap.mjs`). Re-check any new retelling of a foreign-language classic the same way. Build the release from a clean committed checkout.
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
- Source repo: `emjnbulut/lantern-english` (public since 2026-10-27; code MIT, content CC BY-NC 4.0, see LICENSE). **Public site: https://lantern-english.github.io/** (repo `lantern-english/lantern-english.github.io`, built output only). Follow HOSTING.md: copy a verified clean package into the normal public checkout, then commit and push while preserving history. Do not use the force-pushing `tools/publish-site.mjs`. Old owner-private ChatGPT Sites copy is outdated.

- Video captions are an overlay inside `#video-stage` (clickable words → tooltip, video pauses). The stage, not the `<video>`, goes fullscreen so captions and the dictionary tooltip stay visible; the tooltip element is moved into the stage while fullscreen. Native fullscreen/PiP are disabled for that reason (iPhone Safari keeps its native player).

- Video player: own control bar; one **Ayarlar** (gear) panel holds picture quality (from `qualities`), subtitle on/off, size and background opacity; choices live in `lantern.prefs` (`vq`, `cap`). Phones get the panel as a bottom sheet. Videos so far: Sintel and Tears of Steel (both CC BY 3.0, official English SRT, 720p default).

- Service worker is **network-first** (fresh code on every online visit, cached copy only when offline or after a 4 s timeout); when a new worker takes over the page reloads once (after a playing video pauses / on the next navigation). Don't go back to stale-while-revalidate: installed phones kept showing old versions.

- Video fullscreen model: real Fullscreen API on #video-stage (Android/desktop) → in-page fullscreen (class pseudo-fs) when the API is missing or silently ignored (iPhone Safari, in-app browsers). Touch devices default to "Ekranı kapla" (class video-fill, object-fit: cover, no side bars); portrait without a landscape lock rotates the frame 90° (class rot90, tooltip lives inside #video-frame, Tip.rotFrame). The old centre tap-to-pause zone was removed on purpose (it blocked subtitle taps). Shortcuts: ArrowLeft/Right ±5 s, Space play/pause; touch: double tap left/right half ±5 s. iPhone's native player is opt-in (Ayarlar → "Cihazın kendi oynatıcısı") because its subtitles cannot be tapped.

- Adapted classics (12 Oct 2026): The Currycomb, The Haunted Mansion, The Pink Pearl Kaftan (Ömer Seyfettin), Boghach Khan, Bamsi Beyrek, Basat and the One-Eyed Giant (Book of Dede Korkut) are written from the Turkish originals (no English translations used). **Pinocchio (A2)** was added the same day as `content/stories/pinocchio-retold.json`, written from the Italian original (Gutenberg #52484); dictionary additions are in `content/dict/adapt-pinocchio.json`. Source now builds 38 stories, 16 articles, 7,802 dictionary entries; `node tools/smoke.mjs` passed 634 checks. Clarity pass (12 Oct 2026): 14 stories got local fixes for meaning gaps (Pink Pearl Kaftan, Bamsi Beyrek, Room Between Entries, What the Mass Remembers, Voice on the Wrong Tape, Greyhaven, Table by the Window, Last Repair Ticket, Currycomb, Haunted Mansion, Dracula, Other Way to the Island, Bridge with Two Ends; A Photo for the New Café moved A1→A2). Nine exact-text classics (The Star, Open Window, Necklace, Red-Headed League, To Build a Fire, Ransom of Red Chief, Monkey's Paw, Tell-Tale Heart, Gift of the Magi) keep their original long sentences by the exact-reproduction rule. Lemmatizer fix: silent-e stems (rides→ride, hated→hate) via a CVC rule in assets/js/lemmatize.js.

## Ideas backlog
- User-selected seven planned English adaptations (three Ömer Seyfettin, three Dede Korkut, Pinocchio): see [README — Eklenecek hikâyeler](README.md#eklenecek-hikâyeler) for titles, proposed A2/B1 levels and source references. This request added a GitHub backlog only; no story text was written or published.
- More stories per level (especially C2 and A1), more dictionary coverage of rare words.
- Optional Turkish sentence translation on demand.
- Export/import of the vocabulary notebook (JSON).
- Public hosting: see HOSTING.md (separate public site repo + Pages).
