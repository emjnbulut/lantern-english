# Interactive video captions — local implementation complete

## YouTube temporarily unpublished (latest user request)
The user asked to remove YouTube videos from the live site for now. All 10 YouTube source records now carry `published: false`; build excludes them entirely from the visitor video bundle. Their content and caption drafts are retained privately for restoration on request. The intended current live catalog has 21 native-player videos. Direct URLs for unpublished IDs show Video bulunamadı and do not create a player. Previous 31-video release notes below are historical.

## Published release (current status)
The latest explicit user request was to save to GitHub and add the changes to the live site. The public release is `333ac9713e68e111ef68cbff82464f556badf9bd`, built from clean source application `4b9d6530fdd22a0290d32fa89b39e154d9ac851f`. Pages run `38572915196` succeeded; service worker `a8bd3e2574`. All nine core live file SHA-256 values match the release package (library succeeded on a separate retry after a network timeout). See HOSTING.md for the complete validation record. All prior local-only/deferral statements below are historical. No existing raw-subtitle license was converted into a newly certified reuse license.

The release work also added `tools/verify-live-site.mjs EXPECTED_PACKAGE [FILES...]` to compare live bytes, a `--live` option for isolated caption UI checks, and clearer CDP timeout diagnostics. The final source documentation commit records these release tools; it does not change the deployed application files.

Final live UI result: `node tools/smoke.mjs --captions --live` passed 159 checks against the deployed site, with isolated mocked external playback/translation. Screenshots: `C:\Users\emin\AppData\Local\Temp\lantern-smoke-Wtrip6`. Private source main and fix/video-caption-meanings have both been pushed. Initial live attempts hit page-load waits; the successful run is recorded without claiming those earlier attempts passed.

## Publication requested
The user now explicitly requested saving the completed changes to GitHub and updating the live site. The prior deferral statements below are historical. Release follows HOSTING.md and preserves both repository histories. `tools/make-site.mjs` was corrected to replace an existing stamped service-worker version as well as `dev`, ensuring installed clients receive the new caption/player bundle. No new subtitle-reuse license is claimed.

Updated: 2026-10-14. The user resumed work and asked to save to GitHub later. The resumed changes are local and uncommitted on `fix/video-caption-meanings`; last pushed checkpoint is `18addf6`. No new push or deployment was performed. The public website remains at `34d0a22`.

## Current implementation

- All 31 source records now have non-empty timed captions. The 10 formerly captionless YouTube videos received 1,884 cues. `tools/import-video-captions.mjs --import` imports raw JSON3/SRT drafts, deduplicates rolling ASR windows, and clips overlaps and video-duration overflow.
- Eight manual English YouTube tracks and The Chair's automatic track were imported. Other Side of the Box was resolved with Chris_Flynn1's resynced SRT from https://subf2m.co/subtitles/other-side-of-the-box/english/3088113 (community attribution). The Chair is visibly labeled automatic. R’ha events after the configured 360-second video duration were omitted. No video media was downloaded.
- YouTube captions sit immediately below the publisher iframe in the app's fullscreen container. Pointerdown/click pauses; dictionary/context meanings, keyboard activation, long-press sentence translation, notebook saving, cue selection/seeking and resume work. Native captions pause before long press too.
- YouTube API/iframe loading has bounded timeouts, retry, stale-attempt guards, navigation cleanup and autoplay-blocked guidance to use the video’s play button. Native and in-page fullscreen preserve captions, tooltip and body scrolling.
- Missing video words use MyMemory with an automatic-translation label, normalized queries and existing translation caching. If the top result repeats English, a high-scoring match for EXACTLY the same source word can supply the Turkish alternative. This fixed carnival → Karnaval. Unchanged English is not accepted or permanently cached as a Turkish meaning. First missing-word lookup needs internet; names/source errors/service failures retain honest fallback messages. Zero missing offline vocabulary is not claimed.
- Source schema now requires non-empty captions for ALL videos, validates captionKind (`publisher`, `community`, `automatic`), and retains HTTPS/source/timecode validation. Published removal of numeric badges/counters was preserved.

## Verification completed after resuming

- `node --check assets/js/app.js` and `node tools/build.mjs`: passed. Build: 38 stories, 16 articles, 7,838 dictionary entries, 31 videos; video bundle about 740 KB.
- `node tools/test-caption-import.mjs`: passed (source timecodes, overlaps, duration limits, ASR duplicates, SRT).
- `node tools/smoke.mjs`: final general run passed 634 checks. Old tests were updated for the owner's already-published counter removal while retaining bookmark/storage/collection assertions. The unbounded animation-frame settle wait became bounded timer polling; browser background throttling is disabled and the test page is brought to front. An earlier repeat had a CDP touch-event timeout; the final run passed.
- `node tools/smoke.mjs --captions`: 159 checks passed, including all 31 routes, lazy loading, tap/long press/keyboard, pause/resume/seek, translation fallback/negative cache, saving, delayed results, readiness timeout/retry, stale callbacks, 375/390px tooltip bounds and fullscreen cleanup, landscape and native pointerdown.
- `node tools/smoke.mjs --captions-online`: one real The Expert run passed three checks; actual time advanced to 8.269s, cue changed to 1, and a word click paused and showed a meaning. Other bounded attempts encountered autoplay gating or iframe readiness timeout. Do not claim all online attempts or all external movies passed.
- `node tools/smoke.mjs --caption-word-online`: three checks passed with REAL MyMemory: CARNIVAL → Karnaval, labeled automatic and saveable. An initial failure exposed the unchanged-first-match issue, which was corrected.
- Screenshots visually reviewed for 390px/landscape captions and real YouTube. Final general screenshots: `C:\Users\emin\AppData\Local\Temp\lantern-smoke-6Qa79y`; caption screenshots: `...\lantern-smoke-Wh8gpa`; real translation: `...\lantern-smoke-iISR7W`.

## Deferred GitHub/release steps

The user requested saving to GitHub later. When requested, inspect diff, commit source and generated data together, and normal-push the private source branch. The fetched source origin/main is `18af243`; public origin/main is `34d0a22`. Public `work/learning-upgrade-checkpoint` also exists; inspect its purpose before merging anything. No release package was made in this resumed work.

Downloading or attributing subtitles does not establish public redistribution permission. These copied tracks are NOT claimed to be Creative Commons; the license fields identify source rights holders, not a rights grant. Review source-specific reuse permission before public distribution. Follow HOSTING.md and use a separate clean public worktree, preserving the pre-existing user CSS edit in `lantern-english-public-release`. Bundle visitor files only; no drafts, tools, content sources or handoff documents. Stamp sw.js, normal-push preserving history, then verify Pages/live hashes.

## Historical paused checkpoint (superseded by the status above)

Date: 2026-10-14. Branch: `fix/video-caption-meanings`.
Workspace: `C:\Users\emin\lantern-english-caption-fix`.
The user explicitly requested a pause because their usage limit is running out, and asked to save the work to GitHub. Do not resume without a new request. This is an unfinished checkpoint, NOT a release. Nothing from this branch has been deployed.

## Request and findings

The user wants tapping English subtitles to show Turkish meanings on all videos. They asked for the simplest approach using existing subtitles. The public site's `34d0a224066ac347386cd161f93e6d5a8fb87886` contains 31 videos, but source `origin/main` (`18af243`) was behind the published additions. There are 21 native videos with captions and 10 YouTube videos with empty caption arrays. The existing YouTube route only offered a vocabulary list.

## Changes in this checkpoint

- Restored published visitor code and all 31 video records into source JSON so the latest public changes are preserved. Source dictionaries already cover the public dictionary; the only pre-existing difference is `whoa` (source meaning kept). Reading content was not changed.
- Video schema now accepts YouTube records, the horror shelf, WebM/M4V media, and optional advisory text. YouTube records still permit empty captions for this intermediate checkpoint.
- Fixed a 0.001-second overlapping cue in The Little Shop of Horrors and disclosed it in subtitle attribution.
- Native captions pause on primary pointerdown, before a long press can lose its current cue.
- Missing video words request a Turkish meaning via the existing MyMemory translation helper. Results are marked automatic, cached through the existing translation cache, and can be saved. Known dictionary/glossary meanings remain local. Failures/unchanged translations have honest fallback messages. Async results are guarded against navigation and sentence-tooltip replacement.
- Reworked the YouTube route to use the IFrame Player API, timed interactive captions BELOW the player, pause-on-word, cue selection, resume, and a fullscreen container/in-page fallback that keeps the caption panel visible. The API loads only on a play action. This code has NOT yet been browser-tested.

## Downloaded subtitle drafts

`drafts/video-caption-import/` contains raw JSON3 files downloaded with yt-dlp from the existing publishers' YouTube uploads. They are research/import drafts, NOT included in site bundles. Do not describe them as integrated or verified. Preserve attribution and review reuse permissions before publishing; no Creative Commons license has been established for these files.

Manual English tracks downloaded for: R’ha (`Sgm_4WRcGRo`, en-ehkg1hFWq8A), Rakka (`VjQ2t_yNHQs`, en), The Gunfighter (`cWs4WA--eKU`, en), The Expert (`BKorP55Aqvg`, en-GB), Alternative Math (`Zh3Yz3PiXZw`, en), Six (`za2fY2ZFelo`, en-US), Laboratory Conditions (`1N25e4Ss34Q`, en-US), The Shaman (`80EQZaYV9TA`, en).

The Chair (`mhazCS14Tas`) has an `en-orig` automatic-caption draft; it needs text/timing review and an explicit automatic-caption label. Other Side of the Box (`OrOYvVf6tIM`) returned no manual or automatic subtitles. That video's missing transcript is unresolved. No video media was downloaded.

The direct timedtext request returned an empty body; yt-dlp succeeded for the files above. Installed `yt-dlp` using `py -m pip install yt-dlp`. Example command: `py -m yt_dlp --skip-download --write-subs --sub-langs 'en.*' --sub-format json3 --no-playlist --socket-timeout 20 --retries 1 --no-progress --js-runtimes node -o 'C:/Users/emin/lantern-caption-%(id)s.%(ext)s' URL`. Use `--write-auto-subs --sub-langs en-orig` only when automatic captions are intended.

## Validation actually completed

- `node --check assets/js/app.js` passed after the YouTube rewrite.
- `node tools/build.mjs` passed before the final YouTube UI/CSS rewrite: 38 stories, 16 articles, 7,838 dictionary entries, 31 videos. It regenerated data/videos.js from source, still with empty YouTube captions.
- No browser checks, screenshot review, real YouTube playback, translation-service verification, or release checks have been completed for the new code.
- Audit of existing native captions found 938 distinct unresolved normalized word/name forms. The online fallback is intended to help these; zero missing offline vocabulary is NOT achieved.

## Remaining work when the user resumes

1. Review subtitle-source permissions and import approved JSON3 drafts to the corresponding `content/videos/*.json`, with source attribution. JSON3 manual cues use tStartMs/dDurationMs and segs[].utf8. Normalize overlaps carefully; ASR append/rolling events need a proper parser, not blind concatenation. Validate exact video duration and timing. Resolve Other Side of the Box without inventing dialogue or silently removing the video.
2. Review YouTube player loading timeout/retry: API-script timeout exists, but iframe onReady still needs a bounded timeout and stale-attempt guards. Check native and fallback fullscreen, including short landscape screens and navigation while the API loads.
3. Fix catalog copy: it still distinguishes 'YouTube oynatıcısı' from interactive captions, and the collection help still tells YouTube viewers to open CC. Update this only as caption imports become functional.
4. Test taps, long press, keyboard, seek/cue boundaries, pause/resume, delayed translation races, failed/offline translations, saving/caching, HTML escaping, fullscreen and 375/390px layouts. Use deterministic mocked YT API tests plus a bounded real playback check. Existing tools/smoke.mjs has assertions for removed counters/badges and assumptions about the older native-only catalog; do not claim it passes or remove meaningful tests just to green it.
5. Complete vocabulary/typo review as appropriate, then validate/build and commit source + generated data together. Update this handoff with actual results.
6. Follow HOSTING.md for a verified release from a clean checkout, normal history-preserving push to the public repo, service-worker version stamping and live verification. Do NOT publish this checkpoint.

Other working directories were not edited. `C:\Users\emin\lantern-english-public-release` had a pre-existing unstaged CSS change; preserve it. The source main checkout remains at its old local commit while fetched origin/main is newer; use this dedicated branch/worktree.
