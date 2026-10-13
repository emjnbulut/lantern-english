# Video caption work — paused at the user's request

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
