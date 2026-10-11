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
  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(String(data));
    if (message.method === "Runtime.exceptionThrown") browserErrors.push(message.params.exceptionDetails.text + ": " + (message.params.exceptionDetails.exception?.description || ""));
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
  const evaluate = async (expression) => {
    const result = await page("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  };
  const waitFor = async (expression) => {
    for (let i = 0; i < 100; i++) { if (await evaluate(expression)) return; await pause(100); }
    throw new Error(`Page condition failed: ${expression}`);
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
  const storyIds = new Set(stories.map((s) => s.id));
  const articleIds = new Set(articles.map((a) => a.id));
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
  await evaluate("document.getElementById('advanced-stories').click()");
  await waitFor("document.querySelector('.lib-head h1')?.textContent === 'Hikâyeler'");
  assert((await ids()).every((id) => stories.find((s) => s.id === id && ["B2", "C1", "C2"].includes(s.level))), "Advanced shortcut must show only B2–C2 stories.");
  await evaluate("document.getElementById('clear').click()");
  assert((await ids()).length === stories.length && (await ids()).every((id) => storyIds.has(id)), "Story collection must include all stories and no articles.");
  await evaluate(`document.querySelector('.chip[data-f="level"][data-v="C2"]').click()`);
  assert((await ids()).length === stories.filter((s) => s.level === "C2").length && (await ids()).length >= 1, "C2 story filter must include the new advanced stories.");
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
  }

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

  const checkDirectBack = async (hash, fallback) => {
    const { targetId: directTarget } = await send("Target.createTarget", { url: origin + "/index.html#" + hash });
    try {
      const { sessionId: directSession } = await send("Target.attachToTarget", { targetId: directTarget, flatten: true });
      await send("Runtime.enable", {}, directSession);
      const directEvaluate = async (expression) => {
        const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }, directSession);
        if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
        return result.result.value;
      };
      for (let i = 0; i < 100; i++) { if (await directEvaluate(readerReady)) break; await pause(100); }
      assert(await directEvaluate("!!document.getElementById('text') && !document.getElementById('nav-back').disabled"), "Direct-entry readers must have an enabled back button.");
      await directEvaluate("document.getElementById('nav-back').click()");
      for (let i = 0; i < 100; i++) { if (await directEvaluate(`location.hash === '#${fallback}'`)) break; await pause(100); }
      assert(await directEvaluate(`location.hash === '#${fallback}' && location.origin === ${JSON.stringify(origin)}`), `Direct-entry ${hash} must return safely to #${fallback}.`);
    } finally { await send("Target.closeTarget", { targetId: directTarget }); }
  };
  await checkDirectBack("s." + resumeStory.id, "library");
  await checkDirectBack("s." + articles[0].id, "articles");

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
