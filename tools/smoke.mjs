// Browser checks for collections, reader pages and navigation. No npm dependencies.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import http from "node:http";
import { spawn } from "node:child_process";
import { ROOT, loadAll } from "./lib.mjs";

const { stories, articles, errors } = loadAll();
if (errors.length) throw new Error(errors.join("\n"));
const binaries = [
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
];
const binary = binaries.find((p) => fs.existsSync(p));
if (!binary) throw new Error("Install Edge or Chrome to run these browser checks.");
if (process.argv.includes("--probe")) {
  console.log(`Browser available: ${binary}`);
  process.exit(0);
}

const runDir = fs.mkdtempSync(path.join(os.tmpdir(), "lantern-smoke-"));
const profile = path.join(runDir, "browser-profile");
const mime = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8" };
const server = http.createServer((req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    const file = path.resolve(ROOT, "." + (pathname === "/" ? "/index.html" : pathname));
    if (!file.startsWith(ROOT + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      res.writeHead(404); res.end(); return;
    }
    res.writeHead(200, { "Content-Type": mime[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
    fs.createReadStream(file).pipe(res);
  } catch { res.writeHead(400); res.end(); }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = spawn(binary, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--remote-debugging-port=0", "--remote-debugging-address=127.0.0.1", `--user-data-dir=${profile}`, "about:blank"], { windowsHide: true, stdio: "ignore" });
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let socket;
let send;
let passed = 0;
const assert = (value, message) => { if (!value) throw new Error(message); passed++; };
// Typography is intentionally prettified by the reader; paragraph text and order must stay intact.
const plainTypography = (s) => s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/—/g, "--");

try {
  const portFile = path.join(profile, "DevToolsActivePort");
  for (let i = 0; i < 100 && !fs.existsSync(portFile); i++) await pause(100);
  if (!fs.existsSync(portFile)) throw new Error("Headless browser did not expose its test connection.");
  const [port, wsPath] = fs.readFileSync(portFile, "utf8").trim().split(/\r?\n/);
  socket = new WebSocket(`ws://127.0.0.1:${port}${wsPath}`);
  await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once: true }); socket.addEventListener("error", reject, { once: true }); });
  let serial = 0;
  const pending = new Map();
  const browserErrors = [];
  const externalRequests = [];
  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(String(data));
    if (message.method === "Runtime.exceptionThrown") browserErrors.push(message.params.exceptionDetails.text + ": " + (message.params.exceptionDetails.exception?.description || ""));
    if (message.method === "Network.requestWillBeSent") {
      const url = message.params.request.url;
      if (/^https?:\/\//.test(url) && !url.startsWith(origin + "/")) externalRequests.push(url);
    }
    if (message.id && pending.has(message.id)) {
      const { resolve, reject, timer } = pending.get(message.id);
      pending.delete(message.id); clearTimeout(timer);
      if (message.error) reject(new Error(message.error.message)); else resolve(message.result);
    }
  });
  send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const id = ++serial;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`Timed out: ${method}`)); }, 15000);
    pending.set(id, { resolve, reject, timer });
    socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
  const { targetId } = await send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
  const page = (method, params) => send(method, params, sessionId);
  await page("Runtime.enable"); await page("Page.enable");
  const evaluate = async (expression, options = {}) => {
    const result = await page("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true, ...options });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  };
  const waitFor = async (expression) => {
    for (let i = 0; i < 100; i++) { if (await evaluate(expression)) return; await pause(100); }
    throw new Error(`Page condition failed: ${expression}`);
  };
  const reload = async (condition) => {
    const timeOrigin = await evaluate("performance.timeOrigin");
    await page("Page.reload");
    await waitFor(`performance.timeOrigin !== ${timeOrigin} && (${condition})`);
  };
  const navigate = async (hash, condition) => {
    await page("Page.navigate", { url: origin + "/index.html#" + hash });
    const text = hash.startsWith("s.") && [...stories, ...articles].find((t) => t.id === hash.slice(2));
    if (text) await waitFor(`document.querySelector('.reader-head h1')?.textContent === ${JSON.stringify(text.title)}`);
    await waitFor(condition);
  };
  const screenshot = async (name) => {
    const { data } = await page("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    fs.writeFileSync(path.join(runDir, name + ".png"), Buffer.from(data, "base64"));
  };
  const ids = async () => evaluate(`Array.from(document.querySelectorAll('#results .card')).map(a => a.hash.slice(3))`);
  const recommendedIds = async () => evaluate("Array.from(document.querySelectorAll('#results .recs .card')).map(a => a.hash.slice(3))");
  const storyIds = new Set(stories.map((s) => s.id));
  const articleIds = new Set(articles.map((a) => a.id));
  const myLibraryReady = "document.querySelector('main h1')?.textContent === 'Kitaplığım'";
  const videoCollectionReady = "location.hash === '#videos' && !!window.LANTERN_VIDEOS && window.LANTERN_VIDEOS.length > 0 && document.querySelectorAll('a.video-card').length === window.LANTERN_VIDEOS.length";
  const videoReady = "document.getElementById('video-view')?.dataset.id === 'sintel' && !!document.getElementById('video-player')";
  const bookmarkIds = async () => evaluate("JSON.parse(localStorage.getItem('lantern.bookmarks') || '[]')");
  const clickBookmark = async (id, scope = "") => evaluate(`document.querySelector(${JSON.stringify(scope + '[data-bookmark="' + id + '"]')}).click()`);
  const clickReaderBookmark = async () => evaluate("document.getElementById('reader-bookmark').click()");
  const readerReady = "!!document.querySelector('#text .w')";
  const pageState = async () => evaluate("({ page: Number(document.getElementById('text').dataset.page), pages: Number(document.getElementById('text').dataset.pages) })");
  const readerParagraphs = async () => evaluate("Array.from(document.querySelectorAll('#text p, #text h2')).map(e => e.textContent)");
  const isVisible = async (selector) => evaluate(`!!document.querySelector(${JSON.stringify(selector)})?.getClientRects().length`);
  const selectPage = async (number) => {
    await evaluate(`(() => { const select = document.querySelector('[data-page-select]'); select.selectedIndex = ${number - 1}; select.dispatchEvent(new Event('change', { bubbles: true })); })()`);
    await waitFor(`document.getElementById('text')?.dataset.page === '${number}'`);
  };

  await page("Emulation.setDeviceMetricsOverride", { width: 1360, height: 900, deviceScaleFactor: 1, mobile: false });
  await navigate("home", "!!document.querySelector('.collection-grid')");
  const counts = await evaluate(`Array.from(document.querySelectorAll('.step .count')).map(e => parseInt(e.textContent, 10))`);
  assert(counts.every((n, i) => n === stories.filter((s) => s.level === ["A1", "A2", "B1", "B2", "C1", "C2"][i]).length), "Home level counts must count only stories.");
  assert(await evaluate("window.LANTERN_LIBRARY.every(t => t.type !== 'summary') && !document.querySelector('a[href=\"#summaries\"], [data-nav=\"summaries\"], #classic-summaries')"), "Removed book summaries must not appear in data, home cards or navigation.");
  assert(await evaluate("document.getElementById('nav-back').disabled"), "The global back button must be disabled at the initial home route.");
  assert(await evaluate("(() => { const b = document.getElementById('nav-back').getBoundingClientRect(); const h = document.querySelector('header').getBoundingClientRect(); return b.width > 0 && b.left < innerWidth / 2 && b.top >= h.top && b.bottom <= h.bottom + 1; })()"), "The back button must be visible in the upper-left header.");
  assert(await evaluate("!!document.getElementById('advanced-stories')"), "Advanced original stories must be discoverable from home.");
  await screenshot("home-desktop");
  assert(await evaluate("document.querySelector('[data-nav=\"my-library\"]')?.hash === '#my-library' && !!document.getElementById('library-badge')"), "Kitaplığım must be accessible from the main navigation with a saved-item badge.");
  await evaluate("document.querySelector('[data-nav=\"my-library\"]').click()");
  await waitFor(myLibraryReady);
  assert((await ids()).length === 0 && await evaluate("!!document.querySelector('.empty a[href=\"#library\"]') && !!document.querySelector('.empty a[href=\"#articles\"]')"), "An empty personal library must offer both story and article collections.");
  assert(await evaluate("document.querySelector('[data-nav=\"my-library\"]').getAttribute('aria-current') === 'page'"), "The personal library navigation must show the active route.");
  await navigate("home", "!!document.querySelector('.collection-grid')");
  await evaluate("document.getElementById('advanced-stories').click()");
  await waitFor("document.querySelector('.lib-head h1')?.textContent === 'Hikâyeler'");
  assert((await ids()).every((id) => stories.find((s) => s.id === id && ["B2", "C1", "C2"].includes(s.level))), "Advanced shortcut must show only B2–C2 stories.");
  await evaluate("document.getElementById('clear').click()");
  assert((await ids()).length === stories.length && (await ids()).every((id) => storyIds.has(id)), "Story collection must include all stories and no articles.");
  const defaultRecommendations = await recommendedIds();
  assert(defaultRecommendations.length <= 3 && ["dracula-abridged", "frankenstein-abridged"].every((id) => defaultRecommendations.includes(id)), "Unfiltered story recommendations must prioritize Dracula and Frankenstein within three picks.");
  assert(new Set(await ids()).size === stories.length, "Default recommendations must not duplicate stories in the remaining collection.");
  await evaluate(`document.querySelector('.chip[data-f="level"][data-v="C2"]').click()`);
  assert((await ids()).length === stories.filter((s) => s.level === "C2").length && (await ids()).length >= 1, "C2 story filter must include the new advanced stories.");
  await evaluate("document.getElementById('clear').click()");
  for (const [level, classicId] of [["B1", "dracula-abridged"], ["B2", "frankenstein-abridged"]]) {
    await evaluate(`document.querySelector('.chip[data-f="level"][data-v="${level}"]').click()`);
    const picks = await recommendedIds();
    const filteredIds = await ids();
    assert(picks.includes(classicId) && picks.length <= 3, `${classicId} must appear among at most three ${level} recommendations.`);
    assert(filteredIds.length === stories.filter((s) => s.level === level).length && new Set(filteredIds).size === filteredIds.length, `${level} recommendations must preserve all filtered stories without duplicate cards.`);
    await evaluate("document.getElementById('clear').click()");
  }
  for (const level of ["B1", "B2", "C1"]) await evaluate(`document.querySelector('.chip[data-f="level"][data-v="${level}"]').click()`);
  const multipleLevelPicks = await recommendedIds();
  assert(multipleLevelPicks.length <= 3 && ["dracula-abridged", "frankenstein-abridged"].every((id) => multipleLevelPicks.includes(id)), "Multiple selected levels must share at most three recommendations with abridged classics first.");
  const multipleLevelIds = await ids();
  assert(multipleLevelIds.length === stories.filter((s) => ["B1", "B2", "C1"].includes(s.level)).length && new Set(multipleLevelIds).size === multipleLevelIds.length, "Multi-level featured cards must stay unique and leave the complete filtered collection available.");
  await evaluate("document.querySelector('.chip[data-f=\"genre\"][data-v=\"horror\"]').click()");
  assert((await ids()).every((id) => stories.find((s) => s.id === id)?.genre === "horror") && (await recommendedIds()).every((id) => stories.find((s) => s.id === id)?.genre === "horror"), "Genre filters must apply to both featured cards and the remaining story list.");
  const draculaTitle = stories.find((s) => s.id === "dracula-abridged").title;
  await evaluate(`(() => { const q = document.getElementById('q'); q.value = ${JSON.stringify(draculaTitle)}; q.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  assert(JSON.stringify(await ids()) === JSON.stringify(["dracula-abridged"]) && JSON.stringify(await recommendedIds()) === JSON.stringify(["dracula-abridged"]), "Title search must narrow recommendations and results to the matching abridged classic.");
  await evaluate("document.getElementById('clear').click()");
  await evaluate("document.querySelector('.chip[data-f=\"length\"][data-v=\"short\"]').click()");
  assert(await evaluate("Array.from(document.querySelectorAll('#results .card')).every(a => window.LANTERN_LIBRARY.find(t => t.id === a.hash.slice(3))?.length === 'short')") && (await recommendedIds()).length <= 3, "Length filters must apply to every displayed card while recommendations remain capped at three.");
  await evaluate("document.getElementById('clear').click()");
  await evaluate(`document.querySelector('.chip[data-f="genre"][data-v="horror"]').click()`);
  const horrorStoryIds = await ids();
  assert(horrorStoryIds.length === stories.filter((s) => s.genre === "horror").length && horrorStoryIds.every((id) => storyIds.has(id)), "Genre-filtered stories must not include related article cards.");
  await screenshot("stories-desktop");

  await navigate("articles", "document.querySelector('.lib-head h1')?.textContent === 'Makaleler'");
  assert((await ids()).length === articles.length && (await ids()).every((id) => articleIds.has(id)), "Articles must have an independent unfiltered collection.");
  assert(await evaluate(`document.querySelectorAll('.chip[data-f="level"]').length === 3`), "Article levels must be B2–C2.");
  await evaluate(`document.querySelector('.chip[data-f="genre"][data-v="horror"]').click()`);
  const horrorArticleIds = await ids();
  assert(horrorArticleIds.length === articles.filter((a) => a.genre === "horror").length && horrorArticleIds.every((id) => articleIds.has(id)), "Article genre filter must return only matching articles.");
  await navigate("library", "document.querySelector('.lib-head h1')?.textContent === 'Hikâyeler'");
  assert(JSON.stringify(await ids()) === JSON.stringify(horrorStoryIds), "Story filters must survive switching to articles.");
  await navigate("articles", "document.querySelector('.lib-head h1')?.textContent === 'Makaleler'");
  assert(JSON.stringify(await ids()) === JSON.stringify(horrorArticleIds), "Article filters must survive switching to stories.");
  await evaluate(`(() => { const q = document.getElementById('q'); q.value = 'zzzx-nonexistent-title'; q.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  assert((await ids()).length === 0 && await evaluate("document.querySelector('.empty h3').textContent.includes('makale')"), "Empty article searches must use article-specific messaging.");
  await evaluate("document.getElementById('clear').click()");
  assert((await ids()).length === articles.length, "Clearing article filters must restore every article.");
  await screenshot("articles-desktop");

  const advancedStory = stories.find((s) => s.level === "C2" && s.author === "Lantern Original");
  await navigate("s." + advancedStory.id, readerReady);
  const initialPage = await pageState();
  assert(initialPage.page === 1 && initialPage.pages > 1, "A long story must start on the first of multiple pages.");
  assert(await evaluate("document.querySelectorAll('nav.reader-pagination').length === 2"), "Story page controls must appear above and below the text.");
  assert(await evaluate(`document.getElementById('page-status').textContent.trim().startsWith('Sayfa 1 / ${initialPage.pages}')`), "The page indicator must display the current and total pages.");
  assert(!(await isVisible("#quiz")), "The quiz must remain hidden before the final story page.");
  const allParagraphs = [];
  for (let number = 1; number <= initialPage.pages; number++) {
    const state = await pageState();
    assert(state.page === number && state.pages === initialPage.pages, `Story page ${number} must be selected.`);
    assert(await evaluate(`Array.from(document.querySelectorAll('[data-page-prev]')).every(b => b.disabled === ${number === 1}) && Array.from(document.querySelectorAll('[data-page-next]')).every(b => b.disabled === ${number === initialPage.pages})`), `Previous/next boundaries must be correct on page ${number}.`);
    assert(await evaluate(`Array.from(document.querySelectorAll('[data-page-select]')).every(s => s.selectedIndex === ${number - 1})`), `Both page selectors must stay synchronized on page ${number}.`);
    assert(await evaluate("document.getElementById('text').lastElementChild.tagName !== 'H2'"), `Page ${number} must keep a section heading with its following paragraph.`);
    assert((await isVisible("#quiz")) === (number === initialPage.pages), `Quiz visibility must match the final page on page ${number}.`);
    allParagraphs.push(...await readerParagraphs());
    if (number < initialPage.pages) {
      await evaluate("document.querySelector('[data-page-next]').click()");
      await waitFor(`document.getElementById('text')?.dataset.page === '${number + 1}'`);
    }
  }
  const expectedParagraphs = advancedStory.paragraphs.map((p) => plainTypography(p.startsWith("## ") ? p.slice(3) : p));
  assert(JSON.stringify(allParagraphs.map(plainTypography)) === JSON.stringify(expectedParagraphs), "Paginated story paragraphs must match the complete source in order, without loss or duplication.");
  assert(await evaluate(`location.hash === '#s.${advancedStory.id}'`), "Changing reader pages must not add page fragments to the route.");
  const nextStories = await evaluate(`Array.from(document.querySelectorAll('.next-up .card')).map(a => a.hash.slice(3))`);
  assert(nextStories.every((id) => storyIds.has(id)) && await evaluate("document.querySelectorAll('.reader .card.article').length === 0"), "Story readers must recommend stories only.");
  for (const [i, q] of advancedStory.quiz.entries()) await evaluate(`document.querySelector('#quiz .q[data-i="${i}"] .opt[data-j="${q.answer}"]').click()`);
  assert(await evaluate(`document.querySelector('#score b').textContent === '${advancedStory.quiz.length}/${advancedStory.quiz.length}'`), "Quiz scoring must work in the new long story.");
  await evaluate(`Array.from(document.querySelectorAll('#text .w')).find(e => e.textContent.toLowerCase() === 'the').click()`);
  assert(await evaluate("!document.getElementById('tip').hidden && !!document.querySelector('#tip .tip-tr')?.textContent.trim()"), "New-story words must show their Turkish tooltip.");
  await evaluate("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))");
  await screenshot("c2-reader-desktop");

  await evaluate("document.querySelector('[data-page-prev]').click()");
  await waitFor(`document.getElementById('text')?.dataset.page === '${initialPage.pages - 1}'`);
  assert(!(await isVisible("#quiz")), "Previous page must hide the final-page quiz again.");
  await selectPage(2);
  assert((await pageState()).page === 2, "The page selector must jump directly to the selected story page.");

  // Use an unfinished story to check saved-page resume; completed stories deliberately reopen at page one.
  const resumeStory = stories.find((s) => s.id !== advancedStory.id && s.author === "Lantern Original" && s.paragraphs.join(" ").length > 15000);
  assert(!!resumeStory, "A second long story must be available for resume checks.");
  await navigate("s." + resumeStory.id, readerReady);
  assert((await pageState()).pages > 1, "The resume story must expose multiple reader pages.");
  await selectPage(2);
  assert(await evaluate(`JSON.parse(localStorage.getItem('lantern.progress'))[${JSON.stringify(resumeStory.id)}].page === 1`), "Selecting a page must immediately persist its zero-based index.");
  await evaluate("window.scrollTo(0, document.getElementById('text').offsetTop + 250)");
  await waitFor(`JSON.parse(localStorage.getItem('lantern.progress'))[${JSON.stringify(resumeStory.id)}].pageF > 0`);
  await pause(700);
  const oldTimeOrigin = await evaluate("performance.timeOrigin");
  await page("Page.reload");
  await waitFor(`performance.timeOrigin !== ${oldTimeOrigin} && document.getElementById('text')?.dataset.page === '2'`);
  assert((await pageState()).page === 2 && await isVisible("#resume-btn"), "Reloading an unfinished story must restore its page and offer within-page resume.");
  await evaluate("document.getElementById('resume-btn').click()");
  assert(!(await isVisible("#resume-btn")), "Resume must dismiss its prompt after returning to the saved position.");

  await navigate("s." + advancedStory.id, readerReady);
  assert((await pageState()).page === 1, "A completed story must reopen at page one.");

  for (const story of stories) {
    await navigate("s." + story.id, readerReady);
    const state = await pageState();
    assert(Number.isInteger(state.page) && Number.isInteger(state.pages) && state.page >= 1 && state.page <= state.pages && await evaluate("document.querySelectorAll('nav.reader-pagination').length === 2"), `${story.id} must expose a valid page indicator and both page controls.`);
    assert(await evaluate("(() => { const box = document.getElementById('reader-bookmark'); return !!box?.matches('input[type=\"checkbox\"][data-bookmark-reader=\"true\"]') && !box.checked && Array.from(box.labels || []).some(label => label.textContent.trim() === 'Kitaplığıma ekle'); })()"), `${story.id} must offer an unchecked native personal-library checkbox with its fixed label.`);
  }
  assert((await bookmarkIds()).length === 0, "Reader visits, page changes, completed quizzes and reloads must not automatically add bookmarks.");

  await navigate("s." + articles[0].id, readerReady);
  assert(await evaluate("!document.querySelector('nav.reader-pagination')") && await isVisible("#quiz"), "Articles must remain unpaginated with their quiz visible.");
  assert(JSON.stringify((await readerParagraphs()).map(plainTypography)) === JSON.stringify(articles[0].paragraphs.map((p) => plainTypography(p.startsWith("## ") ? p.slice(3) : p))), "An article must still render all source paragraphs together.");
  const nextArticles = await evaluate(`Array.from(document.querySelectorAll('.next-up .card')).map(a => a.hash.slice(3))`);
  assert(nextArticles.every((id) => articleIds.has(id)), "Article readers must recommend articles only.");

  await navigate("summaries", "location.hash === '#library' && document.querySelector('.lib-head h1')?.textContent === 'Hikâyeler'");
  assert(await evaluate("!document.querySelector('[data-nav=\"summaries\"], .card.summary')"), "The old summaries route must fall back to stories without summary cards.");
  for (const id of ["dracula", "the-metamorphosis", "frankenstein"]) {
    await navigate("s." + id, "!!document.querySelector('.empty') && !document.getElementById('text')");
    assert(await evaluate("!!document.querySelector('main a[href=\"#library\"]')"), `${id} must no longer render the deleted book guide and must offer the story collection.`);
  }

  await navigate("home", "!!document.querySelector('.collection-grid')");
  await evaluate("document.querySelector('[data-nav=\"library\"]').click()");
  await waitFor("document.querySelector('.lib-head h1')?.textContent === 'Hikâyeler'");
  await evaluate("document.getElementById('clear').click()");
  await evaluate(`document.querySelector('#results a[href="#s.${resumeStory.id}"]').click()`);
  await waitFor(readerReady);
  await selectPage(2);
  await evaluate("document.getElementById('nav-back').click()");
  await waitFor("location.hash === '#library' && document.querySelector('.lib-head h1')?.textContent === 'Hikâyeler'");
  assert(await evaluate("location.hash === '#library'"), "Global back must return to the collection after page changes instead of undoing reader pages.");
  await evaluate("document.getElementById('nav-back').click()");
  await waitFor("location.hash === '#home' && !!document.querySelector('.collection-grid')");
  assert(await evaluate("location.hash === '#home'"), "A second back action must return to the previous home route.");

  const checkDirectBack = async (hash, fallback, ready = readerReady) => {
    const { targetId: directTarget } = await send("Target.createTarget", { url: "about:blank" });
    try {
      const { sessionId: directSession } = await send("Target.attachToTarget", { targetId: directTarget, flatten: true });
      await send("Runtime.enable", {}, directSession);
      await send("Network.enable", {}, directSession);
      // Block remote media before navigating even if a future regression accidentally loads it early.
      await send("Network.setBlockedURLs", { urls: ["https://*"] }, directSession);
      await send("Page.navigate", { url: origin + "/index.html#" + hash }, directSession);
      const directEvaluate = async (expression) => {
        const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }, directSession);
        if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
        return result.result.value;
      };
      for (let i = 0; i < 100; i++) { if (await directEvaluate(ready)) break; await pause(100); }
      assert(await directEvaluate(`(${ready}) && !document.getElementById('nav-back').disabled`), "Direct-entry views must have an enabled back button.");
      await directEvaluate("document.getElementById('nav-back').click()");
      for (let i = 0; i < 100; i++) { if (await directEvaluate(`location.hash === '#${fallback}'`)) break; await pause(100); }
      assert(await directEvaluate(`location.hash === '#${fallback}' && location.origin === ${JSON.stringify(origin)}`), `Direct-entry ${hash} must return safely to #${fallback}.`);
    } finally { await send("Target.closeTarget", { targetId: directTarget }); }
  };
  await checkDirectBack("s." + resumeStory.id, "library");
  await checkDirectBack("s." + articles[0].id, "articles");

  // Saved reading is independent of collection filters, vocabulary and reading progress.
  const bookmarkStory = resumeStory;
  const bookmarkArticle = articles[0];
  const savedTexts = [bookmarkStory, bookmarkArticle, advancedStory];
  await navigate("library", "document.querySelector('.lib-head h1')?.textContent === 'Hikâyeler'");
  await evaluate("document.getElementById('clear').click()");
  assert(await evaluate(`(() => { const button = document.querySelector('#results [data-bookmark="${bookmarkStory.id}"]'); return !!button && !button.closest('a') && !!button.closest('.card-shell')?.querySelector('a.card') && button.getAttribute('aria-pressed') === 'false' && !!button.getAttribute('aria-label')?.trim(); })()`), "Story cards must expose an accessible save button separate from the reader link.");
  await clickBookmark(bookmarkStory.id, "#results ");
  assert(await evaluate(`location.hash === '#library' && document.querySelector('#results [data-bookmark="${bookmarkStory.id}"]').getAttribute('aria-pressed') === 'true' && document.getElementById('library-badge').textContent.trim() === '1'`), "Saving a story card must update its state and badge without opening the reader.");
  await clickBookmark(bookmarkStory.id, "#results ");
  await clickBookmark(bookmarkStory.id, "#results ");
  assert(JSON.stringify(await bookmarkIds()) === JSON.stringify([bookmarkStory.id]), "Removing and saving a story again must keep exactly one bookmark ID.");

  await navigate("articles", "document.querySelector('.lib-head h1')?.textContent === 'Makaleler'");
  await clickBookmark(bookmarkArticle.id, "#results ");
  assert(await evaluate(`location.hash === '#articles' && document.querySelector('#results [data-bookmark="${bookmarkArticle.id}"]').getAttribute('aria-pressed') === 'true'`), "Article cards must save independently without changing the collection route.");
  await navigate("s." + advancedStory.id, readerReady);
  assert(await evaluate("document.querySelector('.reader-head #reader-bookmark')?.type === 'checkbox' && !document.getElementById('reader-bookmark').checked"), "Reader headers must offer an unchecked checkbox for unsaved texts.");
  await clickReaderBookmark();
  assert(await evaluate(`location.hash === '#s.${advancedStory.id}' && document.getElementById('reader-bookmark').checked`), "Checking the reader bookmark must save its text while retaining the current route.");
  assert(JSON.stringify((await bookmarkIds()).slice().sort()) === JSON.stringify(savedTexts.map((t) => t.id).sort()), "Personal bookmarks must contain exactly the saved story and article IDs.");

  await navigate("my-library", myLibraryReady);
  assert(JSON.stringify((await ids()).slice().sort()) === JSON.stringify(savedTexts.map((t) => t.id).sort()), "Kitaplığım must list only saved texts across story and article types.");
  assert(await evaluate(`!!document.querySelector('#results a[href="#s.${advancedStory.id}"] .state.done') && !!document.querySelector('#results a[href="#s.${bookmarkStory.id}"] .bar span')`), "Saved cards must retain completed and unfinished reading progress.");
  const filtersBeforeSavedSearch = await evaluate("[localStorage.getItem('lantern.filters'), localStorage.getItem('lantern.articleFilters')]");
  await evaluate("document.querySelector('[data-library-type=\"article\"]').click()");
  assert(JSON.stringify(await ids()) === JSON.stringify([bookmarkArticle.id]), "The personal article tab must show only saved articles.");
  await evaluate("document.querySelector('[data-library-type=\"story\"]').click()");
  assert((await ids()).length === 2 && (await ids()).every((id) => storyIds.has(id)), "The personal story tab must show only saved stories.");
  await evaluate("document.querySelector('[data-library-type=\"all\"]').click()");
  await evaluate(`(() => { const q = document.getElementById('q'); q.value = ${JSON.stringify(bookmarkArticle.title)}; q.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  assert(JSON.stringify(await ids()) === JSON.stringify([bookmarkArticle.id]), "Personal library search must search within saved texts.");
  await evaluate("(() => { const q = document.getElementById('q'); q.value = 'zzzx-nonexistent-title'; q.dispatchEvent(new Event('input', { bubbles: true })); })()");
  assert((await ids()).length === 0 && (await bookmarkIds()).length === 3, "An empty saved search must preserve all stored bookmarks.");
  await evaluate("(() => { const q = document.getElementById('q'); q.value = ''; q.dispatchEvent(new Event('input', { bubbles: true })); const sort = document.getElementById('sort'); sort.value = 'title'; sort.dispatchEvent(new Event('change', { bubbles: true })); })()");
  const savedTitleOrder = savedTexts.slice().sort((a, b) => a.title.localeCompare(b.title)).map((t) => t.id);
  assert(JSON.stringify(await ids()) === JSON.stringify(savedTitleOrder), "Personal library title sorting must order the saved cards.");
  assert(JSON.stringify(await evaluate("[localStorage.getItem('lantern.filters'), localStorage.getItem('lantern.articleFilters')]")) === JSON.stringify(filtersBeforeSavedSearch), "Saved-library search and tabs must not modify story/article filters.");
  await reload(myLibraryReady);
  assert(JSON.stringify(await ids()) === JSON.stringify(savedTitleOrder) && (await bookmarkIds()).length === 3, "Saved texts and personal sorting must survive a document reload.");
  assert(await evaluate("document.getElementById('library-badge').textContent.trim() === '3'"), "The saved-item badge must restore its count after reload.");
  const savedStoryPage = await evaluate(`JSON.parse(localStorage.getItem('lantern.progress'))[${JSON.stringify(bookmarkStory.id)}].page + 1`);
  await evaluate(`document.querySelector('#results a[href="#s.${bookmarkStory.id}"]').click()`);
  await waitFor(`document.getElementById('text')?.dataset.page === '${savedStoryPage}'`);
  assert((await pageState()).page === savedStoryPage, "Opening a saved unfinished story must resume its stored reader page.");
  await evaluate("document.getElementById('nav-back').click()");
  await waitFor(myLibraryReady);
  assert((await ids()).length === 3, "Reader back must return to the personal library with its saved list intact.");

  // A real second tab changes localStorage so the browser emits its native storage event.
  const { targetId: savedTarget } = await send("Target.createTarget", { url: origin + "/index.html#my-library" });
  try {
    const { sessionId: savedSession } = await send("Target.attachToTarget", { targetId: savedTarget, flatten: true });
    await send("Runtime.enable", {}, savedSession);
    const secondEvaluate = async (expression) => {
      const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }, savedSession);
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
      return result.result.value;
    };
    const secondWait = async (expression) => {
      for (let i = 0; i < 100; i++) { if (await secondEvaluate(expression)) return; await pause(100); }
      throw new Error("Second-tab condition failed: " + expression);
    };
    await secondWait(myLibraryReady + " && document.querySelectorAll('#results a.card').length === 3");
    await evaluate(`document.querySelector('#results [data-bookmark="${bookmarkArticle.id}"]').focus()`);
    await secondEvaluate(`document.querySelector('#results [data-bookmark="${bookmarkStory.id}"]').click()`);
    await waitFor("document.querySelectorAll('#results a.card').length === 2");
    assert(!(await ids()).includes(bookmarkStory.id), "Removing a saved item in another tab must immediately update the open personal library.");
    assert(await evaluate(`document.activeElement.matches('button[data-bookmark="${bookmarkArticle.id}"]')`), "A cross-tab redraw must retain keyboard focus on an unaffected saved-card button.");
    await navigate("s." + bookmarkStory.id, readerReady);
    const pageBeforeStorage = (await pageState()).page;
    assert(await evaluate("!document.getElementById('reader-bookmark').checked"), "The reader checkbox must reflect changes made in another tab.");
    await clickReaderBookmark();
    await secondWait("document.querySelectorAll('#results a.card').length === 3");
    await secondEvaluate(`document.querySelector('#results [data-bookmark="${bookmarkStory.id}"]').click()`);
    await waitFor("!document.getElementById('reader-bookmark').checked");
    assert((await pageState()).page === pageBeforeStorage, "A cross-tab bookmark change must update reader controls without resetting its page.");
    await clickReaderBookmark();
    await secondWait("document.querySelectorAll('#results a.card').length === 3");
  } finally { await send("Target.closeTarget", { targetId: savedTarget }); }

  // A personal library has no three-item limit; only editorial recommendations are capped.
  const additionalSavedStories = stories.filter((s) => !savedTexts.some((t) => t.id === s.id)).slice(0, 4);
  const expandedSavedTexts = [...savedTexts, ...additionalSavedStories];
  const expandedSavedIds = expandedSavedTexts.map((t) => t.id).sort();
  assert(additionalSavedStories.length === 4, "Four additional stories must be available for the seven-item personal-library check.");
  for (const story of additionalSavedStories) {
    await navigate("s." + story.id, readerReady);
    assert(await evaluate("!document.getElementById('reader-bookmark').checked"), `${story.id} must stay unsaved until its checkbox is checked.`);
    await clickReaderBookmark();
    assert(await evaluate("document.getElementById('reader-bookmark').checked"), `${story.id} must show its explicit saved checkbox state.`);
  }
  assert(JSON.stringify((await bookmarkIds()).slice().sort()) === JSON.stringify(expandedSavedIds), "Saving six stories and one article must retain all seven IDs without a three-item cap.");
  await navigate("my-library", myLibraryReady);
  assert(JSON.stringify((await ids()).slice().sort()) === JSON.stringify(expandedSavedIds), "Kitaplığım must show every explicitly saved story and article, including older saves.");
  assert(await evaluate("document.getElementById('library-badge').textContent.trim() === '7'"), "The personal-library badge must count all seven saves.");
  await reload(myLibraryReady);
  assert(JSON.stringify((await ids()).slice().sort()) === JSON.stringify(expandedSavedIds) && JSON.stringify((await bookmarkIds()).slice().sort()) === JSON.stringify(expandedSavedIds), "All seven personal-library items must remain visible and stored after refresh.");
  await evaluate("document.querySelector('[data-library-type=\"article\"]').click()");
  await evaluate(`(() => { const q = document.getElementById('q'); q.value = ${JSON.stringify(bookmarkArticle.title)}; q.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  assert(JSON.stringify(await ids()) === JSON.stringify([bookmarkArticle.id]) && await evaluate("JSON.stringify((document.getElementById('count').textContent.match(/\\d+/g) || []).map(Number).slice(0, 2)) === '[1,7]'"), "Filtered personal-library captions must distinguish the one shown item from seven total saves.");

  const unsavedStory = stories.find((s) => !expandedSavedIds.includes(s.id) && s.paragraphs.join(" ").length > 15000);
  assert(!!unsavedStory, "An unsaved multi-page story must be available for manual-only bookmarking checks.");
  await navigate("s." + unsavedStory.id, readerReady);
  assert(await evaluate("!document.getElementById('reader-bookmark').checked") && JSON.stringify((await bookmarkIds()).slice().sort()) === JSON.stringify(expandedSavedIds), "Visiting an unsaved story must leave its checkbox unchecked and all bookmarks unchanged.");
  await selectPage(2);
  await evaluate("document.getElementById('listen').click(); document.getElementById('listen').click()");
  await reload("document.getElementById('text')?.dataset.page === '2'");
  assert(await evaluate("!document.getElementById('reader-bookmark').checked") && JSON.stringify((await bookmarkIds()).slice().sort()) === JSON.stringify(expandedSavedIds), "Pagination, listening and refreshing must not automatically save an unsaved story.");
  await clickReaderBookmark();
  assert(await evaluate("document.getElementById('reader-bookmark').checked") && JSON.stringify((await bookmarkIds()).slice().sort()) === JSON.stringify([...expandedSavedIds, unsavedStory.id].sort()), "Checking a story must add exactly that ID while preserving all seven existing saves.");
  await clickReaderBookmark();
  assert(await evaluate("!document.getElementById('reader-bookmark').checked") && JSON.stringify((await bookmarkIds()).slice().sort()) === JSON.stringify(expandedSavedIds), "Unchecking a story must remove only that ID while preserving the other saved texts.");
  await navigate("s." + bookmarkStory.id, readerReady);
  assert(await evaluate("document.getElementById('reader-bookmark').checked"), "Revisiting an explicitly saved story must restore its checked state.");
  await evaluate("document.getElementById('nav-back').click()");
  await waitFor(`document.querySelector('.reader-head h1')?.textContent === ${JSON.stringify(unsavedStory.title)} && (${readerReady})`);
  assert(await evaluate("!document.getElementById('reader-bookmark').checked") && JSON.stringify((await bookmarkIds()).slice().sort()) === JSON.stringify(expandedSavedIds), "Back navigation must restore the unsaved story checkbox without changing other saves.");
  await evaluate("document.querySelector('[data-nav=\"my-library\"]').click()");
  await waitFor(myLibraryReady);
  assert(JSON.stringify((await ids()).slice().sort()) === JSON.stringify(expandedSavedIds) && await evaluate("document.getElementById('q').value === '' && document.querySelector('[data-library-type=\"all\"]').getAttribute('aria-pressed') === 'true'"), "Entering Kitaplığım again must show all saved items with an empty search and the all-types tab.");

  await navigate("my-library", myLibraryReady);
  const progressBeforeRemoval = await evaluate("localStorage.getItem('lantern.progress')");
  for (const text of expandedSavedTexts) await clickBookmark(text.id, "#results ");
  assert((await ids()).length === 0 && await isVisible(".empty") && (await bookmarkIds()).length === 0, "Removing the last saved text must immediately return the personal library to its empty state.");
  assert(await evaluate("localStorage.getItem('lantern.progress')") === progressBeforeRemoval, "Removing saved texts must leave reading progress unchanged.");
  await reload(myLibraryReady);
  assert((await ids()).length === 0 && (await bookmarkIds()).length === 0, "Removed bookmarks must remain removed after a reload.");

  for (const raw of ["{broken-json", JSON.stringify({ invalid: bookmarkStory.id }), JSON.stringify([bookmarkStory.id, bookmarkStory.id, null, 42, {}, "unknown-story", ""])]) {
    await evaluate(`localStorage.setItem('lantern.bookmarks', ${JSON.stringify(raw)})`);
    await reload(myLibraryReady);
    const expected = raw.startsWith("[") ? [bookmarkStory.id] : [];
    assert(JSON.stringify(await ids()) === JSON.stringify(expected), "Malformed, duplicate and unknown bookmark entries must not crash or produce invalid cards.");
  }
  await clickBookmark(bookmarkStory.id, "#results ");
  assert(JSON.stringify(await bookmarkIds()) === "[]", "The next bookmark update must persist a clean string-ID array after corrupt storage.");

  // Storage can be disabled in embedded/private browsers; saving should still work for this session.
  const { targetId: blockedTarget } = await send("Target.createTarget", { url: "about:blank" });
  try {
    const { sessionId: blockedSession } = await send("Target.attachToTarget", { targetId: blockedTarget, flatten: true });
    await send("Runtime.enable", {}, blockedSession);
    await send("Page.enable", {}, blockedSession);
    await send("Page.addScriptToEvaluateOnNewDocument", { source: "Storage.prototype.getItem = function () { throw new DOMException('Storage disabled', 'SecurityError'); }; Storage.prototype.setItem = function () { throw new DOMException('Storage disabled', 'SecurityError'); };" }, blockedSession);
    await send("Page.navigate", { url: origin + "/index.html#articles" }, blockedSession);
    const blockedEvaluate = async (expression) => {
      const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }, blockedSession);
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
      return result.result.value;
    };
    for (let i = 0; i < 100; i++) { if (await blockedEvaluate("!!document.querySelector('#results [data-bookmark]')")) break; await pause(100); }
    await blockedEvaluate(`document.querySelector('#results [data-bookmark="${bookmarkArticle.id}"]').click(); document.querySelector('[data-nav="my-library"]').click()`);
    for (let i = 0; i < 100; i++) { if (await blockedEvaluate(myLibraryReady)) break; await pause(100); }
    assert(await blockedEvaluate(`document.querySelectorAll('#results a.card').length === 1 && document.querySelector('#results a.card').hash === '#s.${bookmarkArticle.id}'`), "Saving must remain usable within the session when localStorage is unavailable.");
  } finally { await send("Target.closeTarget", { targetId: blockedTarget }); }

  // Failed writes can coexist with successful stale reads; multiple saves must stay in memory.
  const secondBlockedArticle = articles.find((a) => a.id !== bookmarkArticle.id);
  const { targetId: writeBlockedTarget } = await send("Target.createTarget", { url: "about:blank" });
  try {
    const { sessionId: writeBlockedSession } = await send("Target.attachToTarget", { targetId: writeBlockedTarget, flatten: true });
    await send("Runtime.enable", {}, writeBlockedSession);
    await send("Page.enable", {}, writeBlockedSession);
    await send("Page.addScriptToEvaluateOnNewDocument", { source: "Storage.prototype.setItem = function () { throw new DOMException('Storage writes disabled', 'QuotaExceededError'); };" }, writeBlockedSession);
    await send("Page.navigate", { url: origin + "/index.html#articles" }, writeBlockedSession);
    const writeBlockedEvaluate = async (expression) => {
      const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }, writeBlockedSession);
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
      return result.result.value;
    };
    for (let i = 0; i < 100; i++) { if (await writeBlockedEvaluate("!!document.querySelector('#results [data-bookmark]')")) break; await pause(100); }
    await writeBlockedEvaluate(`document.querySelector('#results [data-bookmark="${bookmarkArticle.id}"]').click(); document.querySelector('#results [data-bookmark="${secondBlockedArticle.id}"]').click(); document.querySelector('[data-nav="my-library"]').click()`);
    for (let i = 0; i < 100; i++) { if (await writeBlockedEvaluate(myLibraryReady)) break; await pause(100); }
    const blockedIds = [bookmarkArticle.id, secondBlockedArticle.id].sort();
    assert(await writeBlockedEvaluate(`JSON.stringify(Array.from(document.querySelectorAll('#results a.card')).map(a => a.hash.slice(3)).sort()) === ${JSON.stringify(JSON.stringify(blockedIds))}`), "Failed storage writes must retain both session bookmarks despite stale successful reads.");
    await writeBlockedEvaluate(`document.querySelector('#results [data-bookmark="${bookmarkArticle.id}"]').click()`);
    assert(await writeBlockedEvaluate(`document.querySelectorAll('#results a.card').length === 1 && document.querySelector('#results a.card').hash === '#s.${secondBlockedArticle.id}'`), "Removing one write-blocked session bookmark must preserve the other saved article.");
  } finally { await send("Target.closeTarget", { targetId: writeBlockedTarget }); }

  await navigate("library", "document.querySelector('.lib-head h1')?.textContent === 'Hikâyeler'");
  await clickBookmark(bookmarkStory.id, "#results ");
  await navigate("articles", "document.querySelector('.lib-head h1')?.textContent === 'Makaleler'");
  await clickBookmark(bookmarkArticle.id, "#results ");

  // Video requests are blocked before entry: the normal suite never downloads remote media.
  await page("Network.enable");
  await page("Network.setBlockedURLs", { urls: ["https://*"] });
  const beforeVideoState = await evaluate("[localStorage.getItem('lantern.bookmarks'), localStorage.getItem('lantern.progress')]");
  const beforeVideoRequests = externalRequests.length;
  await evaluate("document.querySelector('[data-nav=\"videos\"]').click()");
  await waitFor(videoCollectionReady);
  const trialVideo = await evaluate("window.LANTERN_VIDEOS[0]");
  assert(await evaluate("window.LANTERN_VIDEOS.length >= 1 && window.LANTERN_VIDEOS[0].id === 'sintel' && window.LANTERN_VIDEOS[0].level === 'B1' && document.querySelector('a.video-card').hash === '#v.sintel'"), "The video trial must contain exactly one Sintel B1 card.");
  assert(await evaluate("document.querySelector('[data-nav=\"videos\"]').getAttribute('aria-current') === 'page'"), "The video collection must have active navigation.");
  await screenshot("videos-desktop");
  await evaluate("document.querySelector('a.video-card').click()");
  await waitFor(videoReady);
  assert(await evaluate("document.querySelector('#video-view h1').textContent === 'Sintel' && document.querySelector('#video-view .lvl').textContent === 'B1' && document.querySelector('[data-nav=\"videos\"]').getAttribute('aria-current') === 'page'"), "Sintel details must show the B1 level and video navigation.");
  const unloadedPlayer = "(() => { const p = document.getElementById('video-player'); return p instanceof HTMLVideoElement && !p.controls && !!document.getElementById('video-bar') && p.playsInline && p.preload === 'none' && !p.hasAttribute('src') && !p.hasAttribute('poster') && !p.querySelector('source'); })()";
  assert(await evaluate(unloadedPlayer), "Opening a video must leave its native player unloaded with no media source or remote poster.");
  const fallbackUrl = trialVideo.source.watchUrl || trialVideo.source.url;
  assert(await evaluate(`(() => { const a = document.getElementById('video-source'); return a.href === ${JSON.stringify(fallbackUrl)} && a.target === '_blank' && a.relList.contains('noopener'); })()`), "The official watch fallback must be an HTTPS link with a safe new-tab target.");
  assert(await evaluate(`Array.from(document.querySelectorAll('.video-credit a')).some(a => a.href === ${JSON.stringify(trialVideo.source.licenseUrl)}) && document.querySelector('.video-credit').textContent.includes(${JSON.stringify(trialVideo.creator)})`), "Video credits must include the creator and the source's Creative Commons license.");
  assert(await evaluate(`document.querySelectorAll('#caption-select option').length === ${trialVideo.captions.length} && document.getElementById('video-captions').dataset.cue === '0' && document.getElementById('caption-prev').disabled`), "Every licensed caption must be selectable, with the first cue previewed initially.");
  assert(await evaluate("!!document.querySelector('#video-stage #video-captions') && !document.querySelector('.caption-panel #video-captions') && getComputedStyle(document.getElementById('video-captions')).position === 'absolute'"), "Video captions must be an overlay inside the video frame.");
  assert(await evaluate("(() => { document.getElementById('cap-settings-btn').click(); const open = !document.getElementById('cap-settings').hidden; document.getElementById('cs-bigger').click(); const scale = getComputedStyle(document.getElementById('video-stage')).getPropertyValue('--cap-scale').trim(); document.getElementById('cs-reset').click(); document.getElementById('cap-settings-btn').click(); return open && scale === '1.2' && document.getElementById('cap-settings').hidden; })()"), "Subtitle size/background settings must open and change the caption scale.");
  assert(await evaluate("(() => { const q = document.getElementById('cs-quality'); const on = document.getElementById('cs-on'); const row = document.getElementById('cs-quality-row'); const had = !row.hidden && q.options.length >= 2; on.click(); const off = getComputedStyle(document.getElementById('video-captions')).display === 'none'; on.click(); const back = getComputedStyle(document.getElementById('video-captions')).display !== 'none'; return had && off && back; })()"), "Subtitles must be switchable off and picture quality must be selectable in the unified settings.");
  assert(await evaluate("!document.getElementById('video-center') && !document.querySelector('.video-center') && !!document.getElementById('video-placeholder')"), "The old centre tap zone must be gone (no #video-center); the idle placeholder remains before playback.");
  const captionText = async () => evaluate("document.getElementById('video-captions').textContent.replace(/\\s+/g, ' ').trim()");
  assert(await captionText() === trialVideo.captions[0].text.replace(/\s+/g, " ").trim(), "The initial caption preview must preserve the source dialogue.");
  await evaluate("document.getElementById('caption-next').click()");
  assert(await evaluate("document.getElementById('video-captions').dataset.cue === '1'"), "Next must preview the next dialogue without activating media.");
  await evaluate("document.getElementById('caption-prev').click()");
  assert(await evaluate("document.getElementById('video-captions').dataset.cue === '0'"), "Previous must return to the earlier dialogue.");
  await evaluate("(() => { const s = document.getElementById('caption-select'); s.selectedIndex = 1; s.dispatchEvent(new Event('change', { bubbles: true })); })()");
  assert(await captionText() === trialVideo.captions[1].text.replace(/\s+/g, " ").trim() && await evaluate(unloadedPlayer), "Selecting a caption before playback must only change its offline preview.");

  const liveTime = (trialVideo.captions[1].start + trialVideo.captions[1].end) / 2;
  const gapTime = (trialVideo.captions[0].end + trialVideo.captions[1].start) / 2;
  await evaluate(`(() => { const p = document.getElementById('video-player'); Object.defineProperty(p, 'currentTime', { configurable: true, writable: true, value: ${liveTime} }); p.dispatchEvent(new Event('timeupdate')); })()`);
  assert(await evaluate("document.getElementById('video-captions').dataset.cue === '1'"), "A time update inside a dialogue must display its synchronized caption.");
  await evaluate(`document.getElementById('video-player').currentTime = ${gapTime}; document.getElementById('video-player').dispatchEvent(new Event('timeupdate'))`);
  assert(await evaluate("document.getElementById('video-captions').dataset.cue === '-1' && !document.querySelector('#video-captions .w')"), "Silent gaps must clear the dialogue instead of retaining the previous caption.");
  await evaluate("delete document.getElementById('video-player').currentTime; (() => { const s = document.getElementById('caption-select'); s.selectedIndex = 0; s.dispatchEvent(new Event('change', { bubbles: true })); })()");
  await evaluate("(() => { const p = document.getElementById('video-player'); const pause = p.pause.bind(p); window.__videoPauseCount = 0; p.pause = function () { window.__videoPauseCount++; pause(); }; const w = document.querySelector('#video-captions .w'); w.focus(); w.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); })()");
  assert(await evaluate("window.__videoPauseCount > 0 && !document.getElementById('tip').hidden && !!document.querySelector('#tip .tip-tr')?.textContent.trim() && document.querySelector('#video-captions .w').tabIndex === 0"), "Caption words must pause playback and open Turkish meanings through the keyboard.");
  const captionLemma = await evaluate("document.querySelector('#video-captions .w').textContent.toLowerCase()");
  await evaluate("document.querySelector('#tip [data-act=\"save\"]').click()");
  assert(await evaluate(`!!JSON.parse(localStorage.getItem('lantern.words'))[${JSON.stringify(captionLemma)}]?.tr`), "A caption word must save to the existing vocabulary notebook.");
  await evaluate("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); window.__videoPauseCount = 0; document.querySelector('#video-captions .w').click()");
  assert(await evaluate("window.__videoPauseCount > 0 && !document.getElementById('tip').hidden"), "Clicking or tapping a caption word must pause playback before showing its tooltip.");
  await evaluate("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))");
  await pause(250);
  assert(externalRequests.length === beforeVideoRequests && await evaluate(unloadedPlayer), "Entering videos and inspecting captions must not request external media before explicit playback.");
  await screenshot("video-preview-desktop");
  await evaluate("document.getElementById('video-start').click()");
  await waitFor(`document.getElementById('video-player').getAttribute('src') === ${JSON.stringify(trialVideo.videoUrl)}`);
  assert(await evaluate(`document.querySelectorAll('video').length === 1 && document.getElementById('video-player').src === ${JSON.stringify(trialVideo.videoUrl)} && !document.getElementById('video-player').hidden`), "Explicit playback must activate exactly one player using the configured official MP4.");
  await evaluate("document.getElementById('video-player').dispatchEvent(new Event('error'))");
  assert(await evaluate("document.getElementById('video-status').textContent.includes('yüklenemedi')") && await isVisible("#video-source"), "A blocked/offline media failure must provide meaningful status and retain the official fallback.");
  await evaluate("document.getElementById('caption-replay').click(); document.getElementById('video-player').pause()");
  assert(await evaluate(`document.getElementById('video-player').getAttribute('src') === ${JSON.stringify(trialVideo.videoUrl)}`), "Replaying a selected dialogue must reuse the single configured video source.");
  await screenshot("video-player-desktop");
  await evaluate("window.__discardedVideo = document.getElementById('video-player')");
  await evaluate("document.getElementById('nav-back').click()");
  await waitFor(videoCollectionReady);
  assert(await evaluate("!document.getElementById('video-player')"), "Back from a video must return to its collection and remove the active player.");
  const afterVideoCleanup = await evaluate("document.getElementById('main').innerHTML");
  await evaluate("window.__discardedVideo.dispatchEvent(new Event('timeupdate')); window.__discardedVideo.dispatchEvent(new Event('loadedmetadata'))");
  assert(await evaluate("document.getElementById('main').innerHTML") === afterVideoCleanup && browserErrors.length === 0, "Late events from a discarded player must not mutate the next view or throw errors.");
  await checkDirectBack("v.sintel", "videos", videoReady);
  await checkDirectBack("videos", "home", videoCollectionReady);
  assert(JSON.stringify(await evaluate("[localStorage.getItem('lantern.bookmarks'), localStorage.getItem('lantern.progress')]")) === JSON.stringify(beforeVideoState), "Video playback and caption tools must leave reading bookmarks and story progress unchanged.");

  // --- video gestures, fullscreen fill, keyboard ---
  // The offline player never loads media, so its playback state is stubbed on the element and read back through window.__vt.
  // The Fullscreen API is removed before the document loads (what iPhone Safari and in-app browsers look like), which makes
  // the fullscreen button use the in-page mode. Touch input comes from real CDP touch events where it matters.
  const fsPrefsBefore = await evaluate("localStorage.getItem('lantern.prefs')");
  const clearFillPref = () => evaluate("(() => { const p = JSON.parse(localStorage.getItem('lantern.prefs') || '{}'); delete p.videoFill; localStorage.setItem('lantern.prefs', JSON.stringify(p)); })()");
  const storedFill = () => evaluate("JSON.parse(localStorage.getItem('lantern.prefs') || '{}').videoFill");
  const gestureStub = `(() => {
    const p = document.getElementById('video-player');
    const st = window.__vt = { time: 0, ready: 4, paused: true, duration: 120, plays: 0, pauses: 0, sets: 0, native: 0 };
    Object.defineProperty(p, 'currentTime', { configurable: true, get: () => st.time, set: (v) => { st.sets++; st.time = v; } });
    Object.defineProperty(p, 'readyState', { configurable: true, get: () => st.ready });
    Object.defineProperty(p, 'paused', { configurable: true, get: () => st.paused });
    Object.defineProperty(p, 'duration', { configurable: true, get: () => st.duration });
    p.play = () => { st.plays++; st.paused = false; return Promise.resolve(); };
    p.pause = () => { st.pauses++; st.paused = true; };
    p.webkitEnterFullscreen = () => { st.native++; };
    // a controllable clock keeps the double-tap window (380 ms) deterministic
    let now = Date.now();
    Date.now = () => now;
    window.__clock = (ms) => { now += ms; };
    const snap = () => ({ time: st.time, sets: st.sets, plays: st.plays, pauses: st.pauses, native: st.native });
    window.__snap = snap;
    window.__reset = (t) => {
      st.time = t; st.ready = 4; st.paused = true; st.sets = st.plays = st.pauses = st.native = 0;
      document.getElementById('seek-fwd').hidden = true; document.getElementById('seek-back').hidden = true;
      p.dispatchEvent(new Event('timeupdate'));
    };
    window.__key = (key, opts) => {
      opts = opts || {};
      const target = opts.selector ? document.querySelector(opts.selector) : document.body;
      const ev = new KeyboardEvent('keydown', { key, code: key === ' ' ? 'Space' : key, bubbles: true, cancelable: true, ctrlKey: !!opts.ctrl, repeat: !!opts.repeat });
      target.dispatchEvent(ev);
      return Object.assign(snap(), { prevented: ev.defaultPrevented });
    };
    // a point on the left/right half of the picture, clear of the subtitle strip and the control bar (also when rotated)
    window.__point = (half) => {
      const r = document.getElementById('video-frame').getBoundingClientRect();
      const f = half === 'left' ? 0.25 : 0.75;
      return document.getElementById('video-stage').classList.contains('rot90')
        ? { x: r.left + r.width * 0.6, y: r.top + r.height * f }
        : { x: r.left + r.width * f, y: r.top + r.height * 0.4 };
    };
    window.__taps = (o) => {
      o = o || {};
      let pt = window.__point(o.half || 'right'), target;
      if (o.selector) {
        target = document.querySelector(o.selector);
        const b = target.getBoundingClientRect();
        pt = { x: b.left + b.width / 2, y: b.top + b.height / 2 };
      } else target = document.elementFromPoint(pt.x, pt.y);
      if (!target) throw new Error('the tap point is outside the viewport');
      for (let i = 0; i < (o.taps || 2); i++) {
        if (i) window.__clock(o.gap == null ? 120 : o.gap);
        if (i && o.cancel) target.dispatchEvent(new PointerEvent('pointercancel', { pointerType: 'touch', bubbles: true, isPrimary: true }));
        target.dispatchEvent(new PointerEvent('pointerup', { pointerType: o.type || 'touch', clientX: pt.x + i * (o.spread || 0), clientY: pt.y, bubbles: true, cancelable: true, isPrimary: true }));
      }
      window.__clock(1000);
      return Object.assign(snap(), { onFrame: !!target.closest('#video-frame') });
    };
  })()`;
  const near = (a, b, tolerance = 0.01) => Math.abs(a - b) <= tolerance;
  const vreset = (t) => evaluate(`window.__reset(${t})`);
  const vkey = (key, opts) => evaluate(`window.__key(${JSON.stringify(key)}, ${JSON.stringify(opts || {})})`);
  const vtaps = (opts) => evaluate(`window.__taps(${JSON.stringify(opts || {})})`);
  const vsnap = () => evaluate("window.__snap()");
  const realKey = async (key, code, keyCode, text) => {
    await page("Input.dispatchKeyEvent", { type: "keyDown", key, code, windowsVirtualKeyCode: keyCode, ...(text ? { text } : {}) });
    await page("Input.dispatchKeyEvent", { type: "keyUp", key, code, windowsVirtualKeyCode: keyCode });
  };
  const realMouse = async (x, y, clicks = 1) => {
    await page("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
    for (let i = 1; i <= clicks; i++) {
      await page("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: i });
      await page("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: i });
    }
  };
  const realTap = async (x, y) => {
    await page("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
    await page("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  };
  const realDoubleTap = async (half) => {
    const { x, y } = await evaluate(`window.__point(${JSON.stringify(half)})`);
    await realTap(x, y); await realTap(x, y);
    await evaluate("window.__clock(1000)");
  };
  // Brings the picture to a stable spot in the viewport before coordinates are used for real input events.
  const settleFrame = () => evaluate("new Promise((resolve) => { const f = document.getElementById('video-frame'); document.getElementById('video-stage').scrollIntoView({ block: 'center', behavior: 'instant' }); let last = null, stable = 0; const tick = () => { const t = f.getBoundingClientRect().top; if (t === last) stable++; else { stable = 0; last = t; } if (stable >= 2) resolve(t); else requestAnimationFrame(tick); }; requestAnimationFrame(tick); })");
  const resizeTo = async (width, height, mobile) => {
    await page("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile });
    await waitFor(`innerWidth === ${width} && innerHeight === ${height}`);
    // let the resize handlers (rotation, tooltip placement) run
    await evaluate("new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))");
  };
  const freshVideo = async () => {
    await navigate("videos", videoCollectionReady);
    await navigate("v.sintel", videoReady);
    await evaluate(gestureStub);
  };
  const stageState = () => evaluate("(() => { const s = document.getElementById('video-stage'), f = document.getElementById('video-frame'), v = document.getElementById('video-player'); const r = f.getBoundingClientRect(), vr = v.getBoundingClientRect(); return { pseudo: s.classList.contains('pseudo-fs'), fill: s.classList.contains('video-fill'), rot: s.classList.contains('rot90'), bodyOpen: document.body.classList.contains('video-fs-open'), fit: getComputedStyle(v).objectFit, transform: getComputedStyle(f).transform, left: r.left, top: r.top, width: r.width, height: r.height, videoRatio: vr.width / vr.height, vw: innerWidth, vh: innerHeight, offsetW: f.offsetWidth, offsetH: f.offsetHeight }; })()");
  const covers = (s) => near(s.left, 0, 2) && near(s.top, 0, 2) && near(s.width, s.vw, 2) && near(s.height, s.vh, 2);
  const letterboxed = (s) => near(s.width / s.height, 16 / 9, 0.03) && near(s.left + s.width / 2, s.vw / 2, 2) && near(s.top + s.height / 2, s.vh / 2, 2);
  const tipBox = () => evaluate("(() => { const t = document.getElementById('tip'), r = t.getBoundingClientRect(); return { hidden: t.hidden, parent: t.parentElement ? (t.parentElement.id || t.parentElement.tagName) : null, left: r.left, top: r.top, right: r.right, bottom: r.bottom, vw: innerWidth, vh: innerHeight }; })()");
  const tipInside = (t) => !t.hidden && t.right > t.left && t.left >= -1 && t.top >= -1 && t.right <= t.vw + 1 && t.bottom <= t.vh + 1;
  const cue0 = trialVideo.captions[0];
  const cue0Mid = (cue0.start + cue0.end) / 2;
  const cueAfterForward = trialVideo.captions.findIndex((c) => c.start <= cue0Mid + 5 && cue0Mid + 5 < c.end);

  // iPhone-like document: no Element.requestFullscreen, but the video element offers its own native fullscreen
  // (Chromium has none, so a no-op is defined; each view's player gets a counting stub on top of it).
  const noFullscreenApi = (await page("Page.addScriptToEvaluateOnNewDocument", { source: "delete Element.prototype.requestFullscreen; delete Element.prototype.webkitRequestFullscreen; HTMLVideoElement.prototype.webkitEnterFullscreen = function () {};" })).identifier;
  // Desktop first: a mouse and a 1100x820 window.
  await clearFillPref();
  await page("Emulation.setTouchEmulationEnabled", { enabled: false });
  await page("Emulation.setDeviceMetricsOverride", { width: 1100, height: 820, deviceScaleFactor: 1, mobile: false });
  await reload(videoCollectionReady);
  await freshVideo();
  assert(await evaluate("!Element.prototype.requestFullscreen && !Element.prototype.webkitRequestFullscreen && typeof HTMLVideoElement.prototype.webkitEnterFullscreen === 'function' && !matchMedia('(pointer: coarse)').matches && innerWidth === 1100 && innerHeight === 820"), "The desktop gesture checks need a fine pointer, a 1100x820 window and an iPhone-like Fullscreen API (video-only).");
  assert(await evaluate("!document.getElementById('video-center') && !document.querySelector('.video-center') && !!document.getElementById('video-frame')"), "There must be no #video-center element: the old centre tap zone is removed.");

  // Before the video starts, keys and taps do nothing; Space starts it.
  await vreset(cue0Mid);
  const idleKeys = [await vkey("ArrowRight"), await vkey("ArrowLeft")];
  const idleTaps = await vtaps({ half: "right" });
  assert(idleKeys.every((k) => !k.prevented && k.sets === 0 && k.time === cue0Mid) && idleTaps.sets === 0 && idleTaps.time === cue0Mid && await evaluate("document.getElementById('video-player').getAttribute('src') === null && document.getElementById('seek-fwd').hidden && document.getElementById('seek-back').hidden"), "Arrow keys and double taps must be ignored (and not prevented) while the video has not started.");
  const spaceStart = await vkey(" ");
  assert(spaceStart.prevented && spaceStart.plays === 1 && await evaluate("!!document.getElementById('video-player').getAttribute('src') && !document.getElementById('video-bar').hidden"), "Space must start an idle video (preventing page scroll) and request playback once.");

  // Keyboard on a started video (the player must be on screen: shortcuts are ignored while it is scrolled away).
  await settleFrame();
  await vreset(cue0Mid);
  const keyForward = await evaluate("(() => { const out = window.__key('ArrowRight'); const f = document.getElementById('seek-fwd'); return Object.assign(out, { fwdHidden: f.hidden, fwdText: f.textContent, backHidden: document.getElementById('seek-back').hidden, cue: document.getElementById('video-captions').dataset.cue }); })()");
  assert(keyForward.prevented && keyForward.sets === 1 && near(keyForward.time, cue0Mid + 5) && !keyForward.fwdHidden && keyForward.fwdText === "+5 sn" && keyForward.backHidden && keyForward.cue === String(cueAfterForward), "ArrowRight must seek +5 s, resync the subtitle, prevent default and flash \"+5 sn\" in #seek-fwd only.");
  const keyBack = await evaluate("(() => { const out = window.__key('ArrowLeft'); const b = document.getElementById('seek-back'); return Object.assign(out, { backHidden: b.hidden, backText: b.textContent, cue: document.getElementById('video-captions').dataset.cue }); })()");
  assert(keyBack.prevented && keyBack.sets === 2 && near(keyBack.time, cue0Mid) && !keyBack.backHidden && keyBack.backText === "−5 sn" && keyBack.cue === "0", "ArrowLeft must seek -5 s, resync the subtitle, prevent default and flash \"−5 sn\" in #seek-back.");
  await evaluate("window.__vt.time = 3");
  const clampStart = await vkey("ArrowLeft");
  assert(clampStart.time === 0 && clampStart.sets === 3, "Seeking back near the start must clamp at 0 s.");
  await evaluate("window.__vt.time = window.__vt.duration - 2");
  const clampEnd = await vkey("ArrowRight");
  assert(clampEnd.time <= 120 && clampEnd.time >= 119.9 && clampEnd.sets === 4, "Seeking forward near the end must clamp at the duration.");
  await evaluate("window.__vt.paused = false; window.__vt.plays = 0; window.__vt.pauses = 0");
  const spacePause = await vkey(" ");
  const spacePlay = await vkey(" ");
  assert(spacePause.prevented && spacePause.pauses === 1 && spacePause.plays === 0 && spacePlay.prevented && spacePlay.plays === 1 && spacePlay.pauses === 1, "Space on the page must toggle pause then play and prevent the default scroll.");
  await vreset(cue0Mid);
  await evaluate("document.getElementById('vb-play').focus()");
  const spaceOnButton = await vkey(" ", { selector: "#vb-play" });
  assert(!spaceOnButton.prevented && spaceOnButton.plays === 0 && spaceOnButton.pauses === 0, "Space on a focused button must be left to the button (the shortcut must not toggle playback itself).");
  await realKey(" ", "Space", 32, " ");
  const buttonSpace = await vsnap();
  assert(buttonSpace.plays === 1 && buttonSpace.pauses === 0, "A real Space press on the focused play button must toggle playback exactly once.");
  await vreset(cue0Mid);
  const sliderKeys = [];
  for (const selector of ["#vol-range", "#cs-alpha", "#caption-select"]) for (const key of ["ArrowLeft", "ArrowRight", " "]) sliderKeys.push(await vkey(key, { selector }));
  sliderKeys.push(await vkey("ArrowRight", { ctrl: true }));
  assert(sliderKeys.every((k) => !k.prevented && k.sets === 0 && k.plays === 0 && k.pauses === 0 && k.time === cue0Mid), "Arrow keys and Space inside the volume slider, background slider and caption select (or with Ctrl held) must not seek or toggle playback.");
  await evaluate("document.getElementById('vb-cc').click(); document.getElementById('cs-alpha').focus()");
  await realKey("ArrowRight", "ArrowRight", 39);
  assert(await evaluate("Number(document.getElementById('cs-alpha').value) > 72 && window.__vt.sets === 0 && window.__vt.time === " + cue0Mid), "A real ArrowRight on the background slider must move the slider and leave the video position alone.");
  await evaluate("document.getElementById('vb-cc').click(); document.activeElement.blur()");
  await vreset(cue0Mid);
  const seekBarKey = await evaluate("(() => { document.getElementById('vb-seek').focus(); return window.__key('ArrowRight', { selector: '#vb-seek' }); })()");
  assert(seekBarKey.prevented && seekBarKey.sets === 1 && near(seekBarKey.time, cue0Mid + 5), "ArrowRight on the seek bar must seek exactly 5 s instead of moving the slider by its own step.");
  await vreset(cue0Mid);
  await evaluate("document.activeElement.blur()");
  await realKey("ArrowRight", "ArrowRight", 39);
  const realArrow = await vsnap();
  assert(realArrow.sets === 1 && near(realArrow.time, cue0Mid + 5), "A real ArrowRight key press with nothing focused must seek +5 s.");
  await vreset(cue0Mid);
  await evaluate("window.__vt.paused = false");
  const wordSpace = await evaluate("(() => { const w = document.querySelector('#video-captions .w'); w.focus(); const out = window.__key(' ', { selector: '#video-captions .w' }); return Object.assign(out, { tipOpen: !document.getElementById('tip').hidden }); })()");
  assert(wordSpace.prevented && wordSpace.pauses === 1 && wordSpace.plays === 0 && wordSpace.tipOpen, "Space on a focused caption word must open its meaning and pause once without the global shortcut toggling playback again.");
  await evaluate("document.body.click()");
  await vreset(cue0Mid);
  const spaceRepeat = await vkey(" ", { repeat: true });
  assert(spaceRepeat.prevented && spaceRepeat.plays === 0 && spaceRepeat.pauses === 0, "A held (auto-repeating) Space must not toggle playback again, and must not scroll the page.");
  await evaluate("document.getElementById('vb-cc').click()");
  const panelKey = await vkey("ArrowRight");
  await evaluate("document.getElementById('vb-cc').click()");
  assert(!panelKey.prevented && panelKey.sets === 0 && panelKey.time === cue0Mid, "Arrow keys must not seek while the settings panel is open.");
  const awayKeys = await evaluate("(() => { const spacer = document.createElement('div'); spacer.style.height = '4000px'; document.getElementById('main').appendChild(spacer); window.scrollTo({ top: 1e6, behavior: 'instant' }); const r = document.getElementById('video-stage').getBoundingClientRect(); const out = { gone: r.bottom < 0, keys: [window.__key('ArrowRight'), window.__key(' ')] }; spacer.remove(); return out; })()");
  assert(awayKeys.gone && awayKeys.keys.every((k) => !k.prevented && k.sets === 0 && k.plays === 0 && k.pauses === 0), "Shortcuts must be ignored (and not prevented) while the player is scrolled out of view.");

  // The picture itself is no longer a play/pause button.
  await vreset(cue0Mid);
  await settleFrame();
  const centre = await evaluate("(() => { const r = document.getElementById('video-frame').getBoundingClientRect(); const x = r.left + r.width / 2, y = r.top + r.height / 2; const el = document.elementFromPoint(x, y); return { x, y, tag: el && el.tagName, inFrame: !!(el && el.closest('#video-frame')) }; })()");
  await realMouse(centre.x, centre.y, 2);
  const afterCentre = await vsnap();
  assert(centre.inFrame && centre.tag === "VIDEO" && afterCentre.plays === 0 && afterCentre.pauses === 0 && afterCentre.sets === 0, "A click or double-click on the middle of the picture must not play, pause or seek.");
  const mouseHalves = await evaluate("({ left: window.__point('left'), right: window.__point('right') })");
  await realMouse(mouseHalves.right.x, mouseHalves.right.y, 2);
  await realMouse(mouseHalves.left.x, mouseHalves.left.y, 2);
  const afterMouse = await vsnap();
  assert(afterMouse.sets === 0 && afterMouse.plays === 0 && afterMouse.pauses === 0 && near(afterMouse.time, cue0Mid), "Real mouse double-clicks on either half of the picture must not seek.");

  // Touch double tap (synthetic touch pointer events on the picture).
  await vreset(cue0Mid);
  const tapRight = await evaluate("(() => { const out = window.__taps({ half: 'right' }); const f = document.getElementById('seek-fwd'); return Object.assign(out, { fwdHidden: f.hidden, fwdText: f.textContent }); })()");
  assert(tapRight.onFrame && tapRight.sets === 1 && near(tapRight.time, cue0Mid + 5) && !tapRight.fwdHidden && tapRight.fwdText === "+5 sn", "A touch double tap on the right half must seek +5 s and flash \"+5 sn\".");
  await vreset(cue0Mid);
  const tapLeft = await evaluate("(() => { const out = window.__taps({ half: 'left' }); const b = document.getElementById('seek-back'); return Object.assign(out, { backHidden: b.hidden, backText: b.textContent }); })()");
  assert(tapLeft.onFrame && tapLeft.sets === 1 && near(tapLeft.time, cue0Mid - 5) && !tapLeft.backHidden && tapLeft.backText === "−5 sn", "A touch double tap on the left half must seek -5 s and flash \"−5 sn\".");
  await vreset(cue0Mid);
  const notDouble = [await vtaps({ half: "right", taps: 1 }), await vtaps({ half: "right", gap: 600 }), await vtaps({ half: "right", spread: 140 })];
  assert(notDouble.every((s) => s.sets === 0 && s.time === cue0Mid), "A single tap, two taps more than 380 ms apart, or two taps far apart must not seek.");
  await vreset(cue0Mid);
  const stripTaps = [await vtaps({ selector: "#video-captions p" }), await vtaps({ selector: "#video-captions .w" })];
  assert(await evaluate("!!document.querySelector('#video-captions p')") && stripTaps.every((s) => s.sets === 0 && s.time === cue0Mid), "Double taps on the subtitle strip (so on its words) must not seek.");
  const barTaps = [];
  for (const selector of ["#video-bar", "#vb-play", "#vb-seek", "#vb-mute", "#vb-cc", "#vb-fs"]) barTaps.push(await vtaps({ selector }));
  assert(barTaps.every((s) => s.sets === 0 && s.time === cue0Mid && s.plays === 0), "Double taps on the control bar or any button must not seek.");
  const mouseTaps = [await vtaps({ half: "right", type: "mouse" }), await vtaps({ half: "left", type: "mouse" })];
  assert(mouseTaps.every((s) => s.sets === 0 && s.time === cue0Mid), "Double clicks with a mouse pointer must not seek.");
  const cancelledTaps = await vtaps({ half: "right", cancel: true });
  assert(cancelledTaps.sets === 0 && cancelledTaps.time === cue0Mid, "A cancelled touch (pointercancel, e.g. a scroll gesture) between two taps must not complete a double tap.");

  // In-page fullscreen on a non-touch desktop: letterboxed, never rotated, even in a portrait-shaped window.
  await vreset(cue0Mid);
  await evaluate("document.getElementById('vb-fs').click()");
  const desktopFs = await stageState();
  assert(desktopFs.pseudo && desktopFs.bodyOpen && !desktopFs.fill && !desktopFs.rot && desktopFs.fit !== "cover" && letterboxed(desktopFs) && (await vsnap()).native === 0, "Without the Fullscreen API the fullscreen button must use the in-page mode (pseudo-fs) without calling webkitEnterFullscreen, and a desktop shows the whole 16:9 picture.");
  const fsKey = await vkey("ArrowRight");
  assert(fsKey.prevented && fsKey.sets === 1 && near(fsKey.time, cue0Mid + 5), "Arrow keys must keep seeking in in-page fullscreen.");
  await vreset(cue0Mid);
  await resizeTo(500, 900, false);
  const desktopPortrait = await stageState();
  assert(desktopPortrait.pseudo && !desktopPortrait.rot && desktopPortrait.transform === "none" && desktopPortrait.offsetW === desktopPortrait.width, "A portrait-shaped window on a non-touch desktop must never rotate the fullscreen picture.");
  await evaluate("document.querySelector('#video-captions .w').click()");
  const desktopTip = await tipBox();
  assert(tipInside(desktopTip) && desktopTip.parent === "video-stage", "In desktop in-page fullscreen the word tooltip must live inside the stage and stay within the viewport.");
  await resizeTo(1100, 820, false);
  await evaluate("document.getElementById('vb-fs').click()");
  const desktopExit = await stageState();
  assert(!desktopExit.pseudo && !desktopExit.bodyOpen && !desktopExit.rot && (await tipBox()).parent === "BODY", "Leaving in-page fullscreen must restore the page and return the tooltip to the document body.");

  // iPhone: no Fullscreen API but a native video fullscreen; it is opt-in through the settings row.
  await vreset(cue0Mid);
  await evaluate("document.getElementById('vb-cc').click()");
  assert(await evaluate("(() => { const row = document.getElementById('cs-inpage-row'); return !row.hidden && row.getClientRects().length > 0 && !document.getElementById('cap-settings').hidden; })()"), "The device-player settings row must be visible when the video element has webkitEnterFullscreen and the page has no requestFullscreen.");
  await evaluate("document.getElementById('cs-inpage-fs').click()");
  const nativeUsed = await vsnap();
  assert(nativeUsed.native === 1 && await evaluate("document.getElementById('cap-settings').hidden && !document.getElementById('video-stage').classList.contains('pseudo-fs') && !!document.querySelector('#video-player track')"), "The settings row button must call player.webkitEnterFullscreen (with a caption track) instead of the in-page mode.");
  const afterNative = await vtaps({ half: "right" });
  assert(afterNative.native === 1, "Double taps must not re-enter the native player.");
  await navigate("videos", videoCollectionReady);
  await evaluate("delete HTMLVideoElement.prototype.webkitEnterFullscreen");
  await navigate("v.sintel", videoReady);
  await evaluate(gestureStub);
  await evaluate("document.getElementById('video-start').click()");
  await evaluate("document.getElementById('vb-cc').click(); document.getElementById('vb-cc').click()");
  assert(await evaluate("document.getElementById('cs-inpage-row').hidden && getComputedStyle(document.getElementById('cs-inpage-row')).display === 'none'"), "The device-player settings row must stay hidden when webkitEnterFullscreen does not exist.");
  await evaluate("document.getElementById('vb-fs').click()");
  assert((await stageState()).pseudo, "The fullscreen button must still use the in-page mode when webkitEnterFullscreen is missing too.");
  await navigate("videos", videoCollectionReady);
  assert(await evaluate("(() => { const ev = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }); document.body.dispatchEvent(ev); const ev2 = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }); document.body.dispatchEvent(ev2); return !ev.defaultPrevented && !ev2.defaultPrevented && !document.body.classList.contains('video-fs-open'); })()"), "Leaving the video must detach its keyboard shortcuts and leave in-page fullscreen (Space must scroll the collection again).");

  // Touch phone, landscape 844x390: fullscreen fills the screen by default.
  await page("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 1 });
  await page("Emulation.setDeviceMetricsOverride", { width: 844, height: 390, deviceScaleFactor: 1, mobile: true });
  await clearFillPref();
  await reload(videoCollectionReady);
  await freshVideo();
  assert(await evaluate("matchMedia('(pointer: coarse)').matches && innerWidth === 844 && innerHeight === 390 && !Element.prototype.requestFullscreen"), "The touch checks need a coarse pointer, an 844x390 viewport and no Fullscreen API.");
  assert(await evaluate("document.getElementById('video-stage').classList.contains('video-fill') && document.getElementById('cs-fit').getAttribute('aria-checked') === 'true'"), "A touch device must default to the screen-filling picture.");
  await evaluate("document.getElementById('video-start').click()");
  assert((await vsnap()).plays === 1 && await evaluate("!!document.getElementById('video-player').getAttribute('src')"), "The start button must request playback once.");
  await vreset(cue0Mid);
  await settleFrame();
  await realDoubleTap("right");
  const touchRight = await vsnap();
  await vreset(cue0Mid);
  await realDoubleTap("left");
  const touchLeft = await vsnap();
  await vreset(cue0Mid);
  const singlePoint = await evaluate("window.__point('right')");
  await realTap(singlePoint.x, singlePoint.y);
  const touchSingle = await vsnap();
  assert(touchRight.sets === 1 && near(touchRight.time, cue0Mid + 5) && touchLeft.sets === 1 && near(touchLeft.time, cue0Mid - 5) && touchSingle.sets === 0, "Real touch double taps must seek +5 s on the right half and -5 s on the left half; one tap must not seek.");
  await evaluate("window.__clock(1000)");

  await evaluate("document.getElementById('vb-fs').click()");
  const phoneFs = await stageState();
  assert(phoneFs.pseudo && phoneFs.fill && !phoneFs.rot && phoneFs.fit === "cover" && covers(phoneFs) && (await vsnap()).native === 0, "Touch landscape fullscreen must be in-page (pseudo-fs) with video-fill: the frame covers the viewport and the video is object-fit: cover.");
  await vreset(cue0Mid);
  await realDoubleTap("right");
  const fsTouch = await vsnap();
  assert(fsTouch.sets === 1 && near(fsTouch.time, cue0Mid + 5), "A real double tap on the right half of the fullscreen picture must seek +5 s.");
  await vreset(cue0Mid);
  await evaluate("document.getElementById('vb-cc').click()");
  assert(await evaluate("!document.getElementById('cap-settings').hidden && getComputedStyle(document.getElementById('cap-settings')).display !== 'none'"), "The settings panel must open from the fullscreen control bar.");
  await evaluate("document.getElementById('cs-fit').click()");
  const phoneFit = await stageState();
  assert(!phoneFit.fill && phoneFit.pseudo && phoneFit.fit !== "cover" && (phoneFit.fit === "contain" || near(phoneFit.videoRatio, 16 / 9, 0.03)) && letterboxed(phoneFit) && await storedFill() === false && await evaluate("document.getElementById('cs-fit').getAttribute('aria-checked') === 'false'"), "Switching \"Ekranı kapla\" off must remove video-fill, centre a 16:9 picture and persist videoFill:false in lantern.prefs.");
  await evaluate("document.getElementById('cs-fit').click()");
  assert((await stageState()).fill && await storedFill() === true, "Switching the fill option on again must persist videoFill:true.");
  await evaluate("document.getElementById('vb-cc').click()");

  // Portrait 390x844 touch: the picture is turned 90 degrees to fill the screen.
  await resizeTo(390, 844, true);
  const portrait = await stageState();
  assert(portrait.rot && portrait.pseudo && portrait.fill && covers(portrait) && portrait.fit === "cover" && near(portrait.offsetW, portrait.vh, 2) && near(portrait.offsetH, portrait.vw, 2), "Portrait in-page fullscreen on a touch device must rotate the picture (rot90) so that the frame covers the viewport.");
  await vreset(cue0Mid);
  await evaluate("document.querySelector('#video-captions .w').click()");
  const portraitTip = await tipBox();
  assert(tipInside(portraitTip) && portraitTip.parent === "video-frame", "In rotated fullscreen the word tooltip must live inside #video-frame and sit fully inside the viewport.");
  const tipTap = await vtaps({ selector: "#tip" });
  assert(tipTap.sets === 0 && tipTap.time === cue0Mid, "Double taps on the open word tooltip must not seek.");
  await resizeTo(390, 790, true);
  const barResize = await tipBox();
  assert(barResize.parent === "video-frame" && tipInside(barResize) && (await stageState()).rot, "A small viewport change in portrait (browser bar showing or hiding) must keep rotated fullscreen and a pinned tooltip.");
  await resizeTo(390, 844, true);
  await evaluate("document.querySelector('#video-captions .w').click()");
  await evaluate("document.body.click()");
  await vreset(cue0Mid);
  await settleFrame();
  const portraitUp = await evaluate("window.__point('left')");
  await realTap(portraitUp.x, portraitUp.y); await realTap(portraitUp.x, portraitUp.y);
  await evaluate("window.__clock(1000)");
  const rotLeft = await vsnap();
  await vreset(cue0Mid);
  await realDoubleTap("right");
  const rotRight = await vsnap();
  assert(portraitUp.y < 844 / 2 && rotLeft.sets === 1 && near(rotLeft.time, cue0Mid - 5) && rotRight.sets === 1 && near(rotRight.time, cue0Mid + 5), "In rotated fullscreen the picture's left half is the upper half of the screen: a double tap there must seek -5 s and the lower half +5 s.");
  await evaluate("document.getElementById('vb-cc').click(); document.getElementById('cs-fit').click(); document.getElementById('vb-cc').click()");
  const portraitFit = await stageState();
  assert(portraitFit.rot && !portraitFit.fill && portraitFit.fit === "contain" && covers(portraitFit), "With the fill option off, rotated fullscreen must still cover the viewport and letterbox the picture inside it (object-fit: contain).");
  await evaluate("document.getElementById('vb-cc').click(); document.getElementById('cs-fit').click(); document.getElementById('vb-cc').click()");

  // Back to landscape: rotation ends, the tooltip stays visible inside the stage and returns to the body on exit.
  await resizeTo(844, 390, true);
  const landscapeAgain = await stageState();
  await vreset(cue0Mid);
  await evaluate("document.querySelector('#video-captions .w').click()");
  const landscapeTip = await tipBox();
  assert(!landscapeAgain.rot && landscapeAgain.pseudo && landscapeAgain.fill && covers(landscapeAgain) && landscapeAgain.transform === "none" && tipInside(landscapeTip) && landscapeTip.parent === "video-stage", "Resizing back to landscape must remove rot90, cover the viewport again and keep the tooltip inside the stage.");
  await evaluate("document.getElementById('vb-fs').click()");
  const phoneExit = await stageState();
  assert(!phoneExit.pseudo && !phoneExit.rot && !phoneExit.bodyOpen && (await tipBox()).parent === "BODY", "Leaving fullscreen must return #tip to document.body.");

  // Entering fullscreen while already in portrait rotates at once; leaving drops the rotation again.
  await resizeTo(390, 844, true);
  await evaluate("document.getElementById('vb-fs').click()");
  const portraitEnter = await stageState();
  assert(portraitEnter.pseudo && portraitEnter.rot && covers(portraitEnter), "Entering fullscreen in portrait must rotate the picture immediately.");
  await evaluate("document.querySelector('#video-captions .w').click()");
  assert((await tipBox()).parent === "video-frame", "A tooltip opened in rotated fullscreen must be placed inside #video-frame.");
  await evaluate("document.getElementById('vb-fs').click()");
  const portraitExit = await stageState();
  assert(!portraitExit.pseudo && !portraitExit.rot && !portraitExit.bodyOpen && portraitExit.transform === "none" && (await tipBox()).parent === "BODY", "Leaving rotated fullscreen must remove rot90 and return #tip to document.body.");

  // Restore the shared browser state for the checks that follow.
  await page("Emulation.setTouchEmulationEnabled", { enabled: false });
  await page("Page.removeScriptToEvaluateOnNewDocument", { identifier: noFullscreenApi });
  await evaluate(fsPrefsBefore === null ? "localStorage.removeItem('lantern.prefs')" : `localStorage.setItem('lantern.prefs', ${JSON.stringify(fsPrefsBefore)})`);
  await page("Emulation.setDeviceMetricsOverride", { width: 1360, height: 900, deviceScaleFactor: 1, mobile: false });
  await reload(videoReady);
  assert(await evaluate("!!Element.prototype.requestFullscreen && document.getElementById('cs-inpage-row').hidden && !document.getElementById('video-center')"), "On a browser with the Fullscreen API the device-player settings row must stay hidden.");

  await page("Emulation.setDeviceMetricsOverride", { width: 375, height: 812, deviceScaleFactor: 1, mobile: true });
  await navigate("home", "!!document.querySelector('.collection-grid')");
  assert(await evaluate("document.documentElement.scrollWidth <= innerWidth + 1"), "Mobile home must fit the viewport.");
  await screenshot("home-mobile");
  await navigate("articles", "document.querySelector('.lib-head h1')?.textContent === 'Makaleler'");
  assert(await evaluate("document.documentElement.scrollWidth <= innerWidth + 1"), "Mobile article collection must fit the viewport.");
  await screenshot("articles-mobile");
  for (const width of [375, 390]) {
    await page("Emulation.setDeviceMetricsOverride", { width, height: 844, deviceScaleFactor: 1, mobile: true });
    await navigate("s." + resumeStory.id, readerReady);
    assert(await evaluate("document.documentElement.scrollWidth <= innerWidth + 1"), `${width}px story pages must fit the viewport.`);
    assert(await evaluate("Array.from(document.querySelectorAll('nav.reader-pagination, #nav-back')).every(e => { const r = e.getBoundingClientRect(); return r.left >= -1 && r.right <= innerWidth + 1; })"), `${width}px back and page controls must fit the viewport.`);
    await selectPage((await pageState()).pages);
    assert(await isVisible("#quiz") && await evaluate("document.documentElement.scrollWidth <= innerWidth + 1"), `${width}px final-page quiz must be visible without horizontal overflow.`);
    await selectPage(1);
    await evaluate(`Array.from(document.querySelectorAll('#text .w')).find(e => e.textContent.toLowerCase() === 'the').click()`);
    assert(await evaluate("!document.getElementById('tip').hidden && !!document.querySelector('#tip .tip-tr')?.textContent.trim()"), `${width}px page words must retain Turkish tooltips.`);
    assert(await evaluate("(() => { const r = document.getElementById('tip').getBoundingClientRect(); return r.left >= -1 && r.right <= innerWidth + 1; })()"), `${width}px word tooltips must remain within the viewport.`);
    await evaluate("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))");
    await screenshot("reader-mobile-" + width);
    await navigate("my-library", myLibraryReady);
    assert((await ids()).length === 2 && await evaluate("document.documentElement.scrollWidth <= innerWidth + 1"), `${width}px personal library must display saved stories/articles without horizontal overflow.`);
    assert(await evaluate("Array.from(document.querySelectorAll('#results [data-bookmark]')).every(b => { const r = b.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.left >= -1 && r.right <= innerWidth + 1 && !!b.getAttribute('aria-label')?.trim() && b.getAttribute('aria-pressed') === 'true'; })"), `${width}px saved-card controls must remain visible, reachable and labelled.`);
    await evaluate("document.querySelector('[data-nav=\"my-library\"]').scrollIntoView({ block: 'nearest', inline: 'nearest' })");
    assert(await evaluate("(() => { const r = document.querySelector('[data-nav=\"my-library\"]').getBoundingClientRect(); return r.width > 0 && r.left >= -1 && r.right <= innerWidth + 1; })()"), `${width}px personal-library navigation must be reachable in the header.`);
    await screenshot("my-library-mobile-" + width);
    await navigate("videos", videoCollectionReady);
    assert(await evaluate("document.documentElement.scrollWidth <= innerWidth + 1 && document.querySelectorAll('a.video-card').length === window.LANTERN_VIDEOS.length"), `${width}px video collection must fit and list every video.`);
    await screenshot("videos-mobile-" + width);
    await evaluate("document.querySelector('a.video-card').click()");
    await waitFor(videoReady);
    assert(await evaluate(unloadedPlayer) && await evaluate("document.documentElement.scrollWidth <= innerWidth + 1 && Array.from(document.querySelectorAll('.video-stage, .caption-controls')).every(e => { const r = e.getBoundingClientRect(); return r.left >= -1 && r.right <= innerWidth + 1; })"), `${width}px video details and caption controls must fit without loading media.`);
    await evaluate("document.querySelector('#video-captions .w').click()");
    assert(await evaluate("!document.getElementById('tip').hidden && (() => { const r = document.getElementById('tip').getBoundingClientRect(); return r.left >= -1 && r.right <= innerWidth + 1; })()"), `${width}px caption word translations must remain within the viewport.`);
    await evaluate("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))");
    await screenshot("video-preview-mobile-" + width);
    await evaluate("document.getElementById('video-start').click()");
    assert(await evaluate("document.documentElement.scrollWidth <= innerWidth + 1 && (() => { const r = document.getElementById('video-player').getBoundingClientRect(); return r.width > 0 && r.left >= -1 && r.right <= innerWidth + 1; })()"), `${width}px activated video controls must stay within the viewport.`);
    await screenshot("video-player-mobile-" + width);
  }
  if (process.argv.includes("--online-video")) {
    // This opt-in check is a single bounded media attempt, never part of ordinary offline smoke.
    await navigate("videos", videoCollectionReady);
    await evaluate("document.querySelector('a.video-card').click()");
    await waitFor(videoReady);
    await page("Network.setBlockedURLs", { urls: [] });
    await page("Network.emulateNetworkConditions", { offline: false, latency: 50, downloadThroughput: 196608, uploadThroughput: 65536, connectionType: "cellular3g" });
    let playable = false;
    let mediaResult;
    try {
      await evaluate("document.getElementById('caption-replay').click()", { userGesture: true });
      const attemptStarted = Date.now();
      let advancingFrom = null;
      for (let i = 0; i < 150; i++) {
        mediaResult = await evaluate("(() => { const p = document.getElementById('video-player'); return { readyState: p.readyState, currentTime: p.currentTime, paused: p.paused, error: p.error && { code: p.error.code, message: p.error.message } }; })()");
        if (mediaResult.error) break;
        if (!mediaResult.paused && mediaResult.readyState >= 2 && mediaResult.currentTime >= trialVideo.captions[0].start) {
          if (advancingFrom === null) advancingFrom = mediaResult.currentTime;
          if (mediaResult.currentTime >= advancingFrom + 2) { playable = true; break; }
        }
        if (Date.now() - attemptStarted >= 15000) break;
        await pause(100);
      }
    } finally {
      await evaluate("document.getElementById('video-player').pause(); document.getElementById('video-player').removeAttribute('src'); document.getElementById('video-player').load()");
      await page("Network.setBlockedURLs", { urls: ["https://*"] });
      await page("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
    }
    console.log("Online video probe: " + JSON.stringify({ playable, ...mediaResult }));
    assert(playable, "The opt-in online video check could not verify two seconds of playback in its single bounded attempt.");
  }
  assert(browserErrors.length === 0, "Uncaught browser errors: " + browserErrors.join("\n"));
  console.log(`OK: ${passed} browser checks; ${stories.length} stories, ${articles.length} articles.`);
  console.log(`Screenshots: ${runDir}`);
} finally {
  if (send && socket?.readyState === WebSocket.OPEN) { try { await send("Browser.close"); } catch {} }
  socket?.close(); browser.kill();
  await new Promise((resolve) => server.close(resolve));
  // Only the profile created for this test run may be removed; screenshots remain.
  if (path.dirname(path.resolve(profile)) === path.resolve(runDir) && path.basename(profile) === "browser-profile") {
    await pause(300);
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch { /* Browser may still be releasing its temporary profile. */ }
  }
}
