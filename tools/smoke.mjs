// Browser checks for the separate story/article collections. No npm dependencies.
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
    await waitFor(condition);
  };
  const screenshot = async (name) => {
    const { data } = await page("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    fs.writeFileSync(path.join(runDir, name + ".png"), Buffer.from(data, "base64"));
  };
  const ids = async () => evaluate(`Array.from(document.querySelectorAll('#results .card')).map(a => a.hash.slice(3))`);
  const storyIds = new Set(stories.map((s) => s.id));
  const articleIds = new Set(articles.map((a) => a.id));

  await page("Emulation.setDeviceMetricsOverride", { width: 1360, height: 900, deviceScaleFactor: 1, mobile: false });
  await navigate("home", "!!document.querySelector('.collection-grid')");
  const counts = await evaluate(`Array.from(document.querySelectorAll('.step .count')).map(e => parseInt(e.textContent, 10))`);
  assert(counts.every((n, i) => n === stories.filter((s) => s.level === ["A1", "A2", "B1", "B2", "C1", "C2"][i]).length), "Home level counts must count only stories.");
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
  await evaluate(`const q = document.getElementById('q'); q.value = 'zzzx-nonexistent-title'; q.dispatchEvent(new Event('input', { bubbles: true }));`);
  assert((await ids()).length === 0 && await evaluate("document.querySelector('.empty h3').textContent.includes('makale')"), "Empty article searches must use article-specific messaging.");
  await evaluate("document.getElementById('clear').click()");
  assert((await ids()).length === articles.length, "Clearing article filters must restore every article.");
  await screenshot("articles-desktop");

  const advancedStory = stories.find((s) => s.level === "C2" && s.author === "Lantern Original");
  await navigate("s." + advancedStory.id, "!!document.querySelector('#text .w') && !!document.getElementById('quiz')");
  assert(await evaluate("document.querySelectorAll('#text .w').length > 5000"), "Long C2 story must render its complete text.");
  const nextStories = await evaluate(`Array.from(document.querySelectorAll('.next-up .card')).map(a => a.hash.slice(3))`);
  assert(nextStories.every((id) => storyIds.has(id)) && await evaluate("document.querySelectorAll('.reader .card.article').length === 0"), "Story readers must recommend stories only.");
  for (const [i, q] of advancedStory.quiz.entries()) await evaluate(`document.querySelector('#quiz .q[data-i="${i}"] .opt[data-j="${q.answer}"]').click()`);
  assert(await evaluate(`document.querySelector('#score b').textContent === '${advancedStory.quiz.length}/${advancedStory.quiz.length}'`), "Quiz scoring must work in the new long story.");
  await evaluate(`Array.from(document.querySelectorAll('#text .w')).find(e => e.textContent.toLowerCase() === 'the').click()`);
  assert(await evaluate("!document.getElementById('tip').hidden && !!document.querySelector('#tip .tip-tr')?.textContent.trim()"), "New-story words must show their Turkish tooltip.");
  await evaluate("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))");
  await screenshot("c2-reader-desktop");

  await navigate("s." + articles[0].id, "!!document.querySelector('#text .w') && !!document.getElementById('quiz')");
  const nextArticles = await evaluate(`Array.from(document.querySelectorAll('.next-up .card')).map(a => a.hash.slice(3))`);
  assert(nextArticles.every((id) => articleIds.has(id)), "Article readers must recommend articles only.");
  await page("Emulation.setDeviceMetricsOverride", { width: 375, height: 812, deviceScaleFactor: 1, mobile: true });
  await navigate("home", "!!document.querySelector('.collection-grid')");
  assert(await evaluate("document.documentElement.scrollWidth <= innerWidth + 1"), "Mobile home must fit the viewport.");
  await screenshot("home-mobile");
  await navigate("articles", "document.querySelector('.lib-head h1')?.textContent === 'Makaleler'");
  assert(await evaluate("document.documentElement.scrollWidth <= innerWidth + 1"), "Mobile article collection must fit the viewport.");
  await screenshot("articles-mobile");
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
