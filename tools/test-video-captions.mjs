// User-visible caption behavior; uses a deterministic YouTube transport, not remote movies.
import { loadVideos } from "./video-content.mjs";
export async function testVideoCaptions({ page, evaluate, waitFor, navigate, screenshot, assert, pause, origin }) {
  const mock = `(() => {
    window.__captionTest = { calls: [], players: [], translationMode: 'ok', ready: true, delayed: [], fastTimers: false };
    const originalTimeout = window.setTimeout;
    window.setTimeout = (fn, ms, ...args) => originalTimeout(fn, window.__captionTest.fastTimers && ms === 20000 ? 40 : ms, ...args);
    const originalFetch = window.fetch;
    window.fetch = (input, options) => {
      const url = String(input);
      if (!url.startsWith('https://api.mymemory.translated.net/')) return originalFetch(input, options);
      const t = window.__captionTest;
      const word = new URL(url).searchParams.get('q'); t.calls.push(word);
      const response = () => ({ ok: true, json: async () => ({responseStatus: 200, responseData: {translatedText: ['same','alternative'].includes(t.translationMode) ? word : 'deneme anlamı'}, matches:t.translationMode==='alternative'?[{segment:word,translation:word,match:1},{segment:'different word',translation:'yanlış karşılık',match:1},{segment:word,translation:'Türkçe karşılık',match:.97}]:[], quotaFinished: false}) });
      if (t.translationMode === 'fail') return Promise.reject(new Error('offline'));
      if (t.translationMode === 'delay') return new Promise(resolve => t.delayed.push(() => resolve(response())));
      return Promise.resolve(response());
    };
    window.YT = { Player: class {
      constructor(id, options) {
        this.options = options; this.time = 0; this.state = 2; this.pauses = 0; this.dead = false;
        const iframe = document.createElement('iframe'); iframe.id = id; iframe.title = 'Test playback transport'; iframe.src = 'about:blank';
        document.getElementById(id).replaceWith(iframe); this.iframe = iframe;
        window.__captionTest.players.push(this);
        if (window.__captionTest.ready) originalTimeout(() => options.events.onReady({target:this}), 10);
      }
      getCurrentTime() { return this.time; }
      getPlayerState() { return this.state; }
      seekTo(at) { this.time = at; }
      playVideo() { this.state = 1; this.options.events.onStateChange({data:1,target:this}); }
      pauseVideo() { this.pauses++; this.state = 2; this.options.events.onStateChange({data:2,target:this}); }
      destroy() { this.dead = true; this.iframe.remove(); }
    }};
  })();`;
  const { identifier } = await page("Page.addScriptToEvaluateOnNewDocument", { source: mock });
  await page("Network.enable");
  await page("Network.setBlockedURLs", { urls: ["https://www.youtube.com/*", "https://www.youtube-nocookie.com/*", "https://api.mymemory.translated.net/*"] });
  await page("Emulation.setDeviceMetricsOverride", { width: 1360, height: 900, deviceScaleFactor: 1, mobile: false });
  await navigate("videos", "window.LANTERN_VIDEOS?.length > 0 && document.querySelectorAll('a.video-card').length === window.LANTERN_VIDEOS.length");
  assert(await evaluate("window.LANTERN_VIDEOS.every(v => v.captions.length > 0)"), "Every video needs timed interactive captions.");
  assert(await evaluate("Array.from(document.querySelectorAll('.video-card')).every(c => c.textContent.includes('Dokunulabilir İngilizce altyazı'))"), "Every card describes its caption support.");
  const catalog = await evaluate("window.LANTERN_VIDEOS.map(v => ({id:v.id,provider:v.provider,kind:v.captionKind}))");
  const { videos } = loadVideos();
  const unpublished = videos.filter(v => v.published === false);
  assert(catalog.length === videos.length - unpublished.length, "Only published sources enter the visitor catalog.");
  for (const v of catalog) {
    const youtube = v.provider === "youtube";
    const root = youtube ? "youtube-captions" : "video-captions";
    await navigate("v." + v.id, `!!document.getElementById('${root}')`);
    await evaluate(`(() => {if(document.querySelector('#${root} .w'))return; const v=window.LANTERN_VIDEOS.find(v=>v.id===${JSON.stringify(v.id)});const i=v.captions.findIndex(c=>/[A-Za-z]/.test(c.text));const s=document.getElementById('${youtube ? "youtube-select" : "caption-select"}');s.value=String(i);s.dispatchEvent(new Event('change',{bubbles:true}));})()`);
    await waitFor(`!!document.querySelector('#${root} .w')`);
    assert(await evaluate("document.querySelector('.video-view').dataset.id === " + JSON.stringify(v.id)), "Video route: " + v.id);
    assert(await evaluate("!document.querySelector('#youtube-frame iframe') && !document.getElementById('video-player')?.getAttribute('src')"), "Playback stays lazy: " + v.id);
    await evaluate(`document.querySelector('#${root} .w').click()`);
    await waitFor("!document.getElementById('tip').hidden");
    assert(await evaluate("!!document.querySelector('#tip .tip-tr, #tip .tip-ctx, #tip .tip-none')"), "A caption word opens a meaning or lookup status: " + v.id);
    assert(await evaluate("document.querySelector('#tip [data-act=sentence]') !== null"), "Caption sentence translation remains available: " + v.id);
  }

  if (!catalog.some(v => v.provider === "youtube")) {
    assert(await evaluate("!window.LANTERN_VIDEOS.some(v=>v.provider==='youtube')"), "The temporarily unpublished YouTube catalog is absent.");
    for (const v of unpublished) {
      await navigate("v." + v.id, "document.querySelector('.empty h3')?.textContent === 'Video bulunamadı'");
      assert(await evaluate("!document.querySelector('iframe, #youtube-start, #video-player')"), "An unpublished direct route cannot create a player: " + v.id);
    }
    await navigate("videos", "document.querySelectorAll('a.video-card').length === window.LANTERN_VIDEOS.length");
    assert(await evaluate("!document.querySelector('.video-head .lead').textContent.includes('YouTube')"), "The visible catalog description reflects the remaining videos.");
    await screenshot("native-only-video-catalog");
    await page("Page.removeScriptToEvaluateOnNewDocument", { identifier });
    console.log(`Caption checks cover ${catalog.length} published video routes and ${unpublished.length} unavailable direct routes.`);
    return;
  }

  await navigate("v.the-expert", "!!document.querySelector('#youtube-captions .w')");
  await evaluate("document.getElementById('youtube-start').click()");
  await waitFor("window.__captionTest.players.length > 0 && document.getElementById('youtube-start').textContent === 'Duraklat'");
  assert(await evaluate("window.__captionTest.players.at(-1).options.playerVars.fs === 0"), "Native iframe fullscreen cannot hide the interactive caption panel.");
  await evaluate("window.__captionTest.players.at(-1).time = 12");
  await waitFor("document.getElementById('youtube-captions').dataset.cue === '2'");
  assert(await evaluate("document.getElementById('youtube-select').value === '2'"), "Caption selection follows video time.");
  await evaluate("document.querySelector('#youtube-captions .w').dispatchEvent(new PointerEvent('pointerdown', {bubbles:true,isPrimary:true,button:0}))");
  assert(await evaluate("window.__captionTest.players.at(-1).state === 2 && window.__captionTest.players.at(-1).pauses > 0"), "Touch pauses the YouTube video before long press.");
  await evaluate("window.__captionTest.players.at(-1).time = 30"); await pause(150);
  assert(await evaluate("document.getElementById('youtube-captions').dataset.cue === '2'"), "The tapped caption stays stable until resume.");
  await evaluate("document.querySelector('#youtube-captions .w').click()");
  assert(await evaluate("!document.getElementById('tip').hidden"), "Paused YouTube captions open a tooltip.");
  await evaluate("document.getElementById('youtube-start').click()");
  await waitFor("document.getElementById('tip').hidden && document.getElementById('youtube-captions').dataset.cue !== '2'");
  assert(await evaluate("window.__captionTest.players.at(-1).state === 1"), "Resume restarts the video and captions.");
  await evaluate("document.getElementById('youtube-next').click()");
  assert(await evaluate("window.__captionTest.players.at(-1).state === 2 && Number(document.getElementById('youtube-select').value) === Number(document.getElementById('youtube-captions').dataset.cue)"), "Next cue seeks and pauses.");
  await evaluate("document.querySelector('#youtube-captions .w').dispatchEvent(new KeyboardEvent('keydown', {key:'Enter',bubbles:true}))");
  assert(await evaluate("!document.getElementById('tip').hidden"), "Keyboard activation opens the same tooltip.");
  await evaluate("window.__oldPlayer = window.__captionTest.players.at(-1); document.querySelector('[data-nav=videos]').click()");
  await waitFor("!!document.querySelector('.video-cats')");
  await evaluate("window.__oldPlayer.options.events.onReady({target:window.__oldPlayer}); window.__oldPlayer.options.events.onStateChange({data:1,target:window.__oldPlayer}); window.__oldPlayer.options.events.onError({target:window.__oldPlayer})");
  assert(await evaluate("!!document.querySelector('.video-cats') && window.__oldPlayer.dead"), "Late callbacks cannot mutate the next route.");

  await navigate("v.the-expert", "!!document.getElementById('youtube-start')");
  await evaluate("window.__captionTest.ready=false; window.__captionTest.fastTimers=true; document.getElementById('youtube-start').click()");
  await waitFor("document.getElementById('youtube-start').textContent === 'Tekrar dene' && !document.getElementById('youtube-start').disabled");
  assert(await evaluate("document.getElementById('youtube-help').textContent.includes('yüklenemedi')"), "An iframe that never becomes ready times out and permits retry.");
  await evaluate("window.__captionTest.ready=true; document.getElementById('youtube-start').click()");
  await waitFor("document.getElementById('youtube-start').textContent === 'Duraklat'");
  assert(await evaluate("window.__captionTest.players.at(-2).dead"), "Retry discards the timed-out player.");

  // Inject test-only words into a catalog object, keeping production captions untouched.
  await evaluate("location.hash='#videos'"); await waitFor("!!document.querySelector('.video-cats')");
  await evaluate("window.LANTERN_VIDEOS.find(v=>v.id==='the-expert').captions[0].text='zztestword zzdelayed zzfail zzsame zzhold zzunsafe zzalternative'; location.hash='#v.the-expert'");
  await waitFor("document.querySelector('#youtube-captions .w')?.textContent === 'zztestword'");
  await evaluate("document.querySelector('#youtube-captions .w').click()");
  await waitFor("document.querySelector('#tip .tip-ctx')?.textContent.includes('deneme anlamı')");
  assert(await evaluate("document.getElementById('tip').textContent.includes('Otomatik çeviri') && !!document.querySelector('#tip [data-act=save]')"), "Automatic meanings are labeled and can be saved.");
  await evaluate("document.querySelector('#tip [data-act=save]').click()");
  assert(await evaluate("JSON.parse(localStorage.getItem('lantern.words')).zztestword.tr === 'deneme anlamı'"), "Saved caption words retain their translated meaning.");
  const calls = await evaluate("window.__captionTest.calls.length");
  await evaluate("document.querySelector('#youtube-captions .w').click(); document.querySelector('#youtube-captions .w').click()");
  assert(await evaluate("window.__captionTest.calls.length") === calls, "A known automatic result does not repeat the network request.");

  await evaluate("window.__captionTest.translationMode='delay'; document.querySelectorAll('#youtube-captions .w')[1].click()");
  await waitFor("window.__captionTest.delayed.length === 1");
  await evaluate("location.hash='#videos'"); await waitFor("!!document.querySelector('.video-cats')");
  await evaluate("window.__captionTest.delayed.pop()()"); await pause(30);
  assert(await evaluate("document.getElementById('tip').hidden && !!document.querySelector('.video-cats')"), "A delayed meaning cannot reopen a tooltip after navigation.");
  await evaluate("location.hash='#v.the-expert'"); await waitFor("!!document.querySelector('#youtube-captions .w')");
  await evaluate("window.__captionTest.translationMode='fail'; document.querySelectorAll('#youtube-captions .w')[2].click()");
  await waitFor("!!document.querySelector('#tip [data-act=retryWord]')");
  assert(await evaluate("document.getElementById('tip').textContent.includes('alınamadı') && !document.querySelector('#tip [data-act=save]')"), "Failed translations show retry without saving an empty meaning.");
  await evaluate("window.__captionTest.translationMode='same'; document.querySelectorAll('#youtube-captions .w')[3].click()");
  await waitFor("document.getElementById('tip').textContent.includes('karşılık bulunamadı')");
  assert(await evaluate("!document.querySelector('#tip [data-act=save]')"), "Unchanged English is not presented as a Turkish meaning.");
  await evaluate("window.__captionTest.translationMode='alternative'; document.querySelectorAll('#youtube-captions .w')[3].click(); document.querySelectorAll('#youtube-captions .w')[3].click()");
  await waitFor("document.querySelector('#tip .tip-ctx')?.textContent.includes('Türkçe karşılık')");
  assert(await evaluate("document.getElementById('tip').textContent.includes('Türkçe karşılık')"), "An unchanged English result is not cached as a permanent lookup failure.");
  await evaluate("window.__captionTest.translationMode='alternative'; document.querySelectorAll('#youtube-captions .w')[6].click()");
  await waitFor("document.querySelector('#tip .tip-ctx')?.textContent.includes('Türkçe karşılık')");
  assert(await evaluate("!document.getElementById('tip').textContent.includes('yanlış karşılık')"), "An unchanged first match falls back only to an exact-source Turkish alternative.");
  await evaluate("window.__captionTest.translationMode='ok'; document.querySelectorAll('#youtube-captions .w')[4].dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,isPrimary:true,button:0,clientX:20,clientY:20,pointerId:1}))");
  await pause(600);
  assert(await evaluate("document.getElementById('tip').classList.contains('sentence-tip')"), "Long press opens the complete caption sentence.");
  await evaluate("document.querySelectorAll('#youtube-captions .w')[4].dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:1})); document.querySelectorAll('#youtube-captions .w')[4].click()");
  assert(await evaluate("document.getElementById('tip').classList.contains('sentence-tip')"), "The click after long press does not replace the sentence meaning.");

  for (const width of [375, 390]) {
    await page("Emulation.setDeviceMetricsOverride", { width, height: 844, deviceScaleFactor: 1, mobile: true });
    await navigate("v.the-expert", "!!document.querySelector('#youtube-captions .w')");
    await evaluate("document.getElementById('youtube-stage').requestFullscreen = undefined; document.getElementById('youtube-fullscreen').click()");
    await waitFor("document.getElementById('youtube-stage').classList.contains('youtube-expanded')");
    await evaluate("document.querySelector('#youtube-captions .w').click()");
    await waitFor("!document.getElementById('tip').hidden");
    assert(await evaluate("document.getElementById('tip').parentNode.id === 'youtube-stage'"), "Tooltip stays inside the fullscreen container at " + width);
    assert(await evaluate("(() => {const r=document.getElementById('tip').getBoundingClientRect();return r.left>=0 && r.right<=innerWidth+1 && r.top>=0 && r.bottom<=innerHeight+1})()"), "Tooltip fits the mobile viewport at " + width);
    assert(await evaluate("document.documentElement.scrollWidth <= innerWidth+1"), "No mobile horizontal overflow at " + width);
    await screenshot("youtube-captions-" + width);
    await evaluate("document.getElementById('youtube-fullscreen').click()");
    assert(await evaluate("!document.getElementById('youtube-stage').classList.contains('youtube-expanded') && document.getElementById('tip').parentNode === document.body && document.body.style.overflow !== 'hidden'"), "Fullscreen restores tooltip and scroll at " + width);
  }
  await page("Emulation.setDeviceMetricsOverride", { width: 844, height: 390, deviceScaleFactor: 1, mobile: true });
  await evaluate("document.getElementById('youtube-fullscreen').click()");
  await screenshot("youtube-captions-landscape");
  assert(await evaluate("(() => {const e=document.getElementById('youtube-stage');const r=e.getBoundingClientRect();return r.top===0 && r.bottom<=innerHeight+1 && e.scrollHeight>=e.clientHeight && getComputedStyle(e).overflowY==='auto' && document.querySelector('.youtube-frame').getBoundingClientRect().height>=200})()"), "Short landscape fullscreen contains the player and permits scrolling when needed.");
  await evaluate("location.hash='#videos'"); await waitFor("!!document.querySelector('.video-cats')");
  assert(await evaluate("document.body.style.overflow !== 'hidden' && document.getElementById('tip').parentNode === document.body"), "Navigation cleans up fullscreen.");

  await navigate("v.sintel", "!!document.querySelector('#video-captions .w')");
  await evaluate("window.__nativePaused=0; document.getElementById('video-player').pause=()=>window.__nativePaused++; document.querySelector('#video-captions .w').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,isPrimary:true,button:0}))");
  assert(await evaluate("window.__nativePaused === 1"), "Native captions also pause on pointerdown.");
  await screenshot("native-caption-mobile");
  await page("Page.removeScriptToEvaluateOnNewDocument", { identifier });
  console.log("Caption checks cover all 31 routes and deterministic player/translation behavior; external movie playback is separate.");
}

export async function probeVideoCaptions({ page, evaluate, waitFor, navigate, screenshot, assert, pause }) {
  await page("Network.enable");
  await page("Network.setBlockedURLs", { urls: [] });
  await page("Emulation.setDeviceMetricsOverride", { width: 1360, height: 900, deviceScaleFactor: 1, mobile: false });
  await navigate("v.the-expert", "!!document.querySelector('#youtube-captions .w')");
  await evaluate("window.__ytTimes=[];window.addEventListener('message',e=>{if(e.source!==document.getElementById('youtube-player')?.contentWindow)return;try{const d=typeof e.data==='string'?JSON.parse(e.data):e.data;if(Number.isFinite(d?.info?.currentTime))window.__ytTimes.push(d.info.currentTime)}catch{}});document.getElementById('youtube-start').click()");
  let playing = false;
  let tapped = false;
  let iframeTapped = false;
  const started = Date.now();
  while (Date.now() - started < 30000) {
    const state = await evaluate("({button:document.getElementById('youtube-start').textContent,cue:document.getElementById('youtube-captions').dataset.cue,status:document.getElementById('youtube-help').textContent,times:window.__ytTimes,iframe:!!document.querySelector('#youtube-frame iframe')})");
    if (state.button === 'Oynat' && !tapped) {
      await evaluate("document.getElementById('youtube-start').scrollIntoView({block:'center',behavior:'instant'})");
      const point = await evaluate("(() => {const r=document.getElementById('youtube-start').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()");
      await page('Input.dispatchMouseEvent', {type:'mousePressed', ...point, button:'left',clickCount:1});
      await page('Input.dispatchMouseEvent', {type:'mouseReleased', ...point, button:'left',clickCount:1});
      tapped = true;
    }
    if (state.button === 'Oynat' && tapped && !iframeTapped && Date.now()-started>10000) {
      await evaluate("document.getElementById('youtube-player').scrollIntoView({block:'center',behavior:'instant'})");
      const point = await evaluate("(() => {const r=document.getElementById('youtube-player').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()");
      await page('Input.dispatchMouseEvent', {type:'mousePressed', ...point, button:'left',clickCount:1});
      await page('Input.dispatchMouseEvent', {type:'mouseReleased', ...point, button:'left',clickCount:1});
      iframeTapped=true;
    }
    if (state.times.some(t=>t>1) && state.cue !== '0' && state.cue !== '-1') { playing = true; break; }
    if (state.button === 'Tekrar dene') { console.log('Online playback status:', state); break; }
    await pause(250);
  }
  console.log('Online YouTube playback:', await evaluate("({times:window.__ytTimes,cue:document.getElementById('youtube-captions').dataset.cue,status:document.getElementById('youtube-help').textContent})"));
  await screenshot("youtube-real-playback");
  assert(playing, "Could not verify real YouTube progress and an advancing interactive caption in the bounded online check.");
  await evaluate("document.querySelector('#youtube-captions .w').click()");
  await waitFor("document.getElementById('youtube-start').textContent === 'Devam et' && !document.getElementById('tip').hidden");
  assert(await evaluate("!!document.querySelector('#tip .tip-tr, #tip .tip-ctx')"), "A real playing YouTube caption pauses and shows a meaning.");
}

export async function probeCaptionWord({ page, evaluate, waitFor, navigate, screenshot, assert, pause }) {
  await page("Network.enable");
  await page("Network.setBlockedURLs", { urls: [] });
  await navigate("v.carnival-of-souls", "!!document.getElementById('caption-select')");
  await evaluate("(() => {const v=window.LANTERN_VIDEOS.find(v=>v.id==='carnival-of-souls');const s=document.getElementById('caption-select');s.value=String(v.captions.findIndex(c=>/\\bcarnival\\b/i.test(c.text)));s.dispatchEvent(new Event('change',{bubbles:true}));Array.from(document.querySelectorAll('#video-captions .w')).find(w=>w.textContent.toLowerCase()==='carnival').click()})()");
  for (let i=0;i<60;i++) { if (await evaluate("!!document.querySelector('#tip .tip-ctx') || document.querySelector('#tip .tip-none')?.getAttribute('aria-busy') === 'false'")) break; await pause(250); }
  console.log("Real caption word result:", await evaluate("document.getElementById('tip').textContent"));
  assert(await evaluate("document.querySelector('#tip .tip-ctx')?.textContent.toLowerCase().includes('karnaval')"), "The real missing-word service returns Turkish.");
  assert(await evaluate("document.getElementById('tip').textContent.includes('Otomatik çeviri')"), "The real missing-word service returns a labeled Turkish meaning.");
  await screenshot("real-caption-word-translation");
}
