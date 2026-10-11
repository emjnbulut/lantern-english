/* Lantern — single-page app. Routes: #home #library #articles #words #about #s.<id> */
(function () {
  "use strict";

  const L = window.LanternLemma;
  const LIB = window.LANTERN_LIBRARY || [];
  const DICT = window.LANTERN_DICT || {};
  const STORIES = LIB.filter((t) => t.type === "story");
  const ARTICLES = LIB.filter((t) => t.type === "article");
  const BY_ID = Object.fromEntries(LIB.map((t) => [t.id, t]));
  const $main = document.getElementById("main");

  // ---------- reference data ----------
  const LEVELS = [
    { id: "A1", name: "Başlangıç", desc: "Basit cümleler, günlük kelimeler" },
    { id: "A2", name: "Temel", desc: "Geçmiş zaman, kısa diyaloglar" },
    { id: "B1", name: "Orta", desc: "Akıcı anlatım, bağlaçlar" },
    { id: "B2", name: "Orta üstü", desc: "Klasik kısa öyküler" },
    { id: "C1", name: "İleri", desc: "Zengin kelime, eski üslup" },
    { id: "C2", name: "Ustalık", desc: "Edebî ve akademik dil" },
  ];
  const GENRES = {
    comedy: { name: "Komedi", desc: "Gülümseten, bazen kahkaha attıran" },
    mystery: { name: "Gizem", desc: "İpuçları, sırlar, dedektifler" },
    horror: { name: "Korku", desc: "Işıkları açık bırakın" },
    adventure: { name: "Macera", desc: "Doğayla ve kendinle mücadele" },
    romance: { name: "Romantik", desc: "Aşk, fedakârlık, sürpriz sonlar" },
    scifi: { name: "Bilim Kurgu", desc: "Yarının ve uzayın hikâyeleri" },
    fable: { name: "Fabl", desc: "Kısa, hayvanlı, hikmetli" },
    drama: { name: "Dram", desc: "İnsan halleri, gurur ve kader" },
  };
  const LENGTHS = { short: "Kısa", medium: "Orta", long: "Uzun" };
  const WPM = { A1: 70, A2: 90, B1: 110, B2: 130, C1: 150, C2: 170 };
  const DAY = 86400000;
  const BOX_DAYS = [0, 0, 1, 3, 7, 16]; // Leitner box -> days until next review

  const ICON = {
    speak: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8 6.6 19.7l1.1-6.1L3.2 9.4l6.1-.8z"/></svg>',
    starFill: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8 6.6 19.7l1.1-6.1L3.2 9.4l6.1-.8z"/></svg>',
    ext: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l13-7.5z"/></svg>',
    stop: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1.5"/></svg>',
    check: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
    dice: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.2" fill="currentColor"/><circle cx="15" cy="15" r="1.2" fill="currentColor"/><circle cx="15" cy="9" r="1.2" fill="currentColor"/><circle cx="9" cy="15" r="1.2" fill="currentColor"/></svg>',
  };

  // ---------- storage (per-browser conveniences) ----------
  const S = {
    load(k, d) { try { const v = localStorage.getItem("lantern." + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    save(k, v) { try { localStorage.setItem("lantern." + k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } },
  };
  let words = S.load("words", {});
  let progress = S.load("progress", {});
  const prefs = Object.assign({ size: 19, mode: "hover", last: null }, S.load("prefs", {}));
  const filt = Object.assign({ level: [], genre: [], length: [], q: "", sort: "level" }, S.load("filters", {}));
  const saveWords = () => { S.save("words", words); updateBadge(); };
  const saveProgress = () => S.save("progress", progress);
  const savePrefs = () => S.save("prefs", prefs);
  const saveFilt = () => S.save("filters", filt);

  // ---------- helpers ----------
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const fmt = (n) => n.toLocaleString("tr-TR");
  const minutes = (t) => Math.max(1, Math.round(t.words / (WPM[t.level] || 130)));
  const hoverDevice = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const genreName = (g) => (GENRES[g] ? GENRES[g].name : g);

  function smart(s) {
    return s
      .replace(/--/g, "—")
      .replace(/(^|[\s(\[—-])"/g, "$1“").replace(/"/g, "”")
      .replace(/([A-Za-z])'([A-Za-z])/g, "$1’$2")
      .replace(/(^|[\s(\[—-])'/g, "$1‘").replace(/'/g, "’");
  }

  const lookCache = new Map();
  function lookupWord(raw) {
    const key = L.normalize(raw);
    if (lookCache.has(key)) return lookCache.get(key);
    const hit = L.lookup(raw, DICT);
    let res = null;
    if (hit) {
      const v = hit.entry; const bar = v.indexOf("|");
      res = { lemma: hit.lemma, pos: v.slice(0, bar), tr: v.slice(bar + 1) };
    }
    lookCache.set(key, res);
    return res;
  }
  const lemmaOf = (raw) => { const r = lookupWord(raw); return r ? r.lemma : L.normalize(raw); };

  function glossFor(raw, text) {
    if (!text || !text.glossary) return null;
    for (const c of L.candidates(raw)) if (text.glossary[c]) return text.glossary[c];
    return null;
  }

  // ---------- text rendering (every word becomes a hoverable span) ----------
  function prepPhrases(text) {
    return (text.phrases || [])
      .map((p, i) => ({ i, words: (p.en.match(L.WORD_RE) || []).map(L.normalize) }))
      .filter((p) => p.words.length > 1)
      .sort((a, b) => b.words.length - a.words.length);
  }

  function renderInline(str, phrases) {
    const toks = [];
    for (const m of str.matchAll(L.WORD_RE)) toks.push({ s: m.index, e: m.index + m[0].length, w: m[0] });
    const open = new Map(), close = new Set();
    if (phrases.length) {
      const norms = toks.map((t) => L.normalize(t.w));
      const cc = [];
      const cands = (k) => cc[k] || (cc[k] = L.candidates(toks[k].w));
      for (let k = 0; k < toks.length; k++) {
        for (const p of phrases) {
          const n = p.words.length;
          if (k + n > toks.length) continue;
          let ok = true;
          for (let j = 0; j < n && ok; j++) {
            const pw = p.words[j];
            ok = norms[k + j] === pw || cands(k + j).includes(pw);
            if (ok && j > 0 && !/^[\s-]+$/.test(str.slice(toks[k + j - 1].e, toks[k + j].s))) ok = false;
          }
          if (ok) { open.set(k, p.i); close.add(k + n - 1); k += n - 1; break; }
        }
      }
    }
    let out = "", last = 0;
    toks.forEach((t, k) => {
      out += esc(str.slice(last, t.s));
      if (open.has(k)) out += `<span class="ph" data-ph="${open.get(k)}">`;
      out += `<span class="w">${esc(t.w)}</span>`;
      if (close.has(k)) out += "</span>";
      last = t.e;
    });
    return out + esc(str.slice(last));
  }

  function renderBody(text) {
    const phrases = prepPhrases(text);
    return text.paragraphs.map((p) =>
      p.startsWith("## ")
        ? `<h2 class="sec">${renderInline(smart(p.slice(3)), phrases)}</h2>`
        : `<p>${renderInline(smart(p), phrases)}</p>`
    ).join("");
  }

  function markSaved(root) {
    root.querySelectorAll(".w").forEach((sp) => sp.classList.toggle("saved", !!words[lemmaOf(sp.textContent)]));
  }

  // ---------- tooltip ----------
  const Tip = {
    el: document.getElementById("tip"),
    span: null, text: null, pinned: false, timer: 0,
    show(span, text, pin) {
      clearTimeout(this.timer);
      if (this.span && this.span !== span) this.span.classList.remove("on");
      this.span = span; this.text = text; this.pinned = !!pin;
      this.el.innerHTML = this.content(span, text, pin);
      this.el.classList.toggle("pinned", this.pinned);
      this.el.hidden = false;
      span.classList.add("on");
      this.place();
    },
    hide() {
      clearTimeout(this.timer);
      this.el.hidden = true; this.pinned = false;
      if (this.span) this.span.classList.remove("on");
      this.span = null;
    },
    place() {
      if (!this.span || this.el.hidden) return;
      const r = this.span.getBoundingClientRect();
      const tw = this.el.offsetWidth, th = this.el.offsetHeight;
      const left = Math.min(Math.max(8, r.left + r.width / 2 - tw / 2), window.innerWidth - tw - 8);
      let top = r.top - th - 10;
      if (top < 70) top = r.bottom + 10;
      this.el.style.left = left + "px";
      this.el.style.top = top + "px";
    },
    content(span, text, pin) {
      const raw = span.textContent;
      const norm = L.normalize(raw);
      const hit = lookupWord(raw);
      const ctx = glossFor(raw, text);
      const phEl = span.closest(".ph");
      const phrase = phEl && text && text.phrases ? text.phrases[+phEl.dataset.ph] : null;
      const lemma = hit ? hit.lemma : norm;
      const saved = !!words[lemma];
      let h = `<div class="tip-head"><span class="tip-word">${esc(raw)}</span>`;
      if (hit && hit.lemma !== norm) h += `<span class="tip-lemma">← ${esc(hit.lemma)}</span>`;
      h += `<button class="icon-btn" data-act="speak" aria-label="Telaffuz et" title="Telaffuz">${ICON.speak}</button></div>`;
      if (hit) {
        if (hit.pos) h += `<div class="tip-pos">${esc(hit.pos)}</div>`;
        h += `<div class="tip-tr">${esc(hit.tr)}</div>`;
      } else if (!ctx) {
        h += /^[A-Z]/.test(raw)
          ? `<div class="tip-none">Büyük olasılıkla özel isim (kişi ya da yer adı).</div>`
          : `<div class="tip-none">Bu kelime sözlüğümüzde henüz yok.</div>`;
      }
      if (ctx) h += `<div class="tip-ctx"><b>Bu metinde:</b> ${esc(ctx)}</div>`;
      if (phrase) h += `<div class="tip-ctx"><b>İfade · ${esc(phrase.en)}</b><br>${esc(phrase.tr)}</div>`;
      if (pin) {
        h += `<div class="tip-actions">`;
        if (hit || ctx) h += `<button class="btn sm${saved ? "" : " primary"}" data-act="save">${saved ? ICON.starFill + " Defterde" : ICON.star + " Deftere ekle"}</button>`;
        h += `<a class="btn sm ghost" href="https://tureng.com/tr/turkce-ingilizce/${encodeURIComponent(lemma)}" target="_blank" rel="noopener">${ICON.ext} Tureng</a></div>`;
      } else {
        h += `<div class="tip-hint">${hoverDevice ? "Kaydetmek için tıkla" : ""}</div>`;
      }
      return h;
    },
  };

  function sentenceAround(span) {
    const block = span.closest("p, h2");
    if (!block) return "";
    const range = document.createRange();
    range.setStart(block, 0);
    range.setEndBefore(span);
    const off = range.toString().length;
    const all = block.textContent;
    let s = off, e = off + span.textContent.length;
    while (s > 0 && !/[.!?]/.test(all[s - 1])) s--;
    while (e < all.length && !/[.!?]/.test(all[e])) e++;
    while (e < all.length && /[.!?”’"]/.test(all[e])) e++;
    const sent = all.slice(s, e).trim();
    return sent.length > 240 ? sent.slice(0, 237) + "…" : sent;
  }

  function toggleSave(span, text) {
    const raw = span.textContent;
    const hit = lookupWord(raw);
    const lemma = hit ? hit.lemma : L.normalize(raw);
    if (words[lemma]) {
      delete words[lemma];
      toast(`“${lemma}” defterden çıkarıldı`);
    } else {
      const ctx = glossFor(raw, text);
      words[lemma] = {
        w: lemma, form: raw, pos: hit ? hit.pos : "", tr: ctx || (hit ? hit.tr : ""),
        src: text && text.id && BY_ID[text.id] ? text.id : null, ctx: sentenceAround(span),
        added: Date.now(), box: 1, due: Date.now(),
      };
      toast(`“${lemma}” deftere eklendi`);
    }
    saveWords();
    const root = span.closest(".reader-text");
    if (root) markSaved(root);
  }

  function bindText(root, text) {
    root.addEventListener("mouseover", (ev) => {
      if (!hoverDevice || prefs.mode !== "hover" || Tip.pinned) return;
      const sp = ev.target.closest(".w");
      if (!sp) return;
      clearTimeout(Tip.timer);
      Tip.timer = setTimeout(() => Tip.show(sp, text, false), 90);
    });
    root.addEventListener("mouseout", (ev) => {
      if (Tip.pinned) return;
      const sp = ev.target.closest(".w");
      if (sp && !sp.contains(ev.relatedTarget)) { clearTimeout(Tip.timer); Tip.hide(); }
    });
    root.addEventListener("click", (ev) => {
      const sp = ev.target.closest(".w");
      if (!sp) return;
      ev.stopPropagation();
      if (Tip.pinned && Tip.span === sp) { Tip.hide(); return; }
      Tip.show(sp, text, true);
    });
  }

  Tip.el.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-act]");
    if (!b || !Tip.span) return;
    ev.stopPropagation();
    if (b.dataset.act === "speak") Speech.say(Tip.span.textContent);
    if (b.dataset.act === "save") { toggleSave(Tip.span, Tip.text); Tip.show(Tip.span, Tip.text, true); }
  });
  document.addEventListener("click", (ev) => { if (Tip.pinned && !Tip.el.contains(ev.target)) Tip.hide(); });
  document.addEventListener("keydown", (ev) => { if (ev.key === "Escape") Tip.hide(); });
  window.addEventListener("scroll", () => { if (Tip.pinned) Tip.place(); else if (!Tip.el.hidden) Tip.hide(); }, { passive: true });
  window.addEventListener("resize", () => Tip.place());

  // ---------- speech ----------
  const Speech = {
    ok: "speechSynthesis" in window,
    voice: null, queue: [], active: false, onStop: null,
    pick() {
      if (!this.ok) return;
      const vs = speechSynthesis.getVoices().filter((v) => /^en[-_]/i.test(v.lang));
      this.voice = vs.find((v) => /natural|online|google/i.test(v.name) && /GB|US/i.test(v.lang)) || vs.find((v) => /en[-_]US/i.test(v.lang)) || vs[0] || null;
    },
    utter(text, rate) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = this.voice ? this.voice.lang : "en-US";
      if (this.voice) u.voice = this.voice;
      u.rate = rate || 0.92;
      return u;
    },
    say(text) {
      if (!this.ok) { toast("Tarayıcın sesli okumayı desteklemiyor"); return; }
      this.stop();
      speechSynthesis.speak(this.utter(text, 0.85));
    },
    readBlocks(blocks, startIdx, onBlock, onDone) {
      if (!this.ok) { toast("Tarayıcın sesli okumayı desteklemiyor"); return; }
      this.stop();
      this.active = true; this.onStop = onDone;
      const run = (i) => {
        if (!this.active) return;
        if (i >= blocks.length) { this.stop(); return; }
        onBlock(blocks[i]);
        const parts = blocks[i].textContent.split(/(?<=[.!?][”’"]?)\s+/).filter((x) => x.trim());
        parts.forEach((part, j) => {
          const u = this.utter(part, prefs.rate || 0.92);
          if (j === parts.length - 1) u.onend = () => run(i + 1);
          speechSynthesis.speak(u);
        });
        if (!parts.length) run(i + 1);
      };
      run(startIdx);
    },
    stop() {
      if (!this.ok) return;
      const was = this.active;
      this.active = false;
      speechSynthesis.cancel();
      if (was && this.onStop) { const f = this.onStop; this.onStop = null; f(); }
    },
  };
  if (Speech.ok) { Speech.pick(); speechSynthesis.onvoiceschanged = () => Speech.pick(); }

  // ---------- toast / badge ----------
  let toastTimer = 0;
  function toast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (t.hidden = true), 2200);
  }
  const dueWords = () => Object.values(words).filter((w) => (w.due || 0) <= Date.now());
  function updateBadge() {
    const b = document.getElementById("due-badge");
    const n = dueWords().length;
    b.textContent = n; b.hidden = n === 0;
    b.title = `${n} kelime tekrar bekliyor`;
  }

  // ---------- shared fragments ----------
  function stateOf(t) {
    const p = progress[t.id];
    if (!p) return "";
    if (p.done) return `<span class="state done">${ICON.check} ${t.type === "article" ? "Okundu" : "Bitti"}</span>`;
    if (p.f > 0.03) return `<span class="state">%${Math.round(p.f * 100)}</span>`;
    return "";
  }
  function card(t) {
    const p = progress[t.id];
    const bar = p && !p.done && p.f > 0.03 ? `<div class="bar"><span style="width:${Math.round(p.f * 100)}%"></span></div>` : "";
    const by = t.author.startsWith("Lantern") ? (t.type === "article" ? "Lantern makalesi" : "Lantern özgün hikâyesi") : esc(t.author) + (t.year ? " · " + t.year : "");
    return `<a class="card${t.type === "article" ? " article" : ""}" href="#s.${t.id}">
      <div class="card-top"><span class="lvl lvl-${t.level}">${t.level}</span><span class="genre g-${t.genre}"><span class="dot"></span>${genreName(t.genre)}</span>${stateOf(t)}</div>
      <h3>${esc(t.title)}</h3>
      <div class="by">${by}</div>
      <p class="teaser">${esc(t.summaryTr)}</p>
      ${bar}
      <div class="meta"><span>${LENGTHS[t.length]}</span><span>·</span><span>${fmt(t.words)} kelime</span><span>·</span><span>~${minutes(t)} dk</span></div>
    </a>`;
  }
  const grid = (items) => items.length ? `<div class="grid">${items.map(card).join("")}</div>` : "";

  // ---------- views ----------
  const DEMO = {
    id: "demo",
    paragraphs: ["The old lantern flickered, and somewhere in the dark house a door slowly creaked open."],
    glossary: { flickered: "titredi (ışık)", creaked: "gıcırdadı", lantern: "fener", flicker: "titreşmek (ışık)", creak: "gıcırdamak" },
    phrases: [{ en: "in the dark", tr: "karanlıkta" }],
  };

  function viewHome() {
    const reading = Object.entries(progress)
      .filter(([id, p]) => BY_ID[id] && !p.done && p.f > 0.03)
      .sort((a, b) => (b[1].at || 0) - (a[1].at || 0)).slice(0, 3).map(([id]) => BY_ID[id]);
    const featured = LEVELS.map((lv) => STORIES.find((s) => s.level === lv.id && !(progress[s.id] && progress[s.id].done)) || STORIES.find((s) => s.level === lv.id)).filter(Boolean);
    const levelCount = (id) => LIB.filter((t) => t.level === id).length;
    const genreCount = (g) => STORIES.filter((t) => t.genre === g).length;
    $main.innerHTML = `
      <section class="hero">
        <div>
          <p class="eyebrow">Hikâyelerle İngilizce</p>
          <h1>Okudukça öğren. <em>Her kelime</em> bir dokunuş uzağında.</h1>
          <p class="lead">Seviyene uygun hikâyeleri oku; anlamını bilmediğin kelimenin üzerine gel, Türkçesi hemen çıksın. Beğendiklerini defterine kaydet, kartlarla tekrar et.</p>
          <div class="hero-actions">
            <a class="btn primary" href="#library">Kütüphaneye göz at</a>
            <button class="btn" id="random">${ICON.dice} Bana bir hikâye seç</button>
          </div>
          <div class="stats">
            <div class="stat"><b>${STORIES.length}</b><span>hikâye</span></div>
            <div class="stat"><b>${ARTICLES.length}</b><span>makale</span></div>
            <div class="stat"><b>${fmt(Object.keys(DICT).length)}</b><span>sözlük maddesi</span></div>
            <div class="stat"><b>${Object.keys(words).length}</b><span>defterindeki kelime</span></div>
          </div>
        </div>
        <div class="demo">
          <div class="demo-label">Dene</div>
          <div class="reader-text" id="demo-text">${renderBody(DEMO)}</div>
          <p class="demo-hint">${hoverDevice ? "Kelimelerin üzerine gel. Tıklarsan kutu sabitlenir: dinle ya da deftere ekle." : "Bir kelimeye dokun: anlamı, telaffuzu ve deftere ekleme düğmesi çıkar."}</p>
        </div>
      </section>

      ${reading.length ? `<section class="section"><div class="section-head"><h2>Okumaya devam et</h2></div>${grid(reading)}</section>` : ""}

      <section class="section">
        <div class="section-head"><h2>Seviyeni seç</h2><a class="link" href="#about">Hangi seviyedeyim?</a></div>
        <div class="ladder">
          ${LEVELS.map((lv, i) => `<a class="step lvl-${lv.id}" style="--h:${i}" href="#library" data-level="${lv.id}">
            <b>${lv.id}</b><span class="name">${lv.name}</span><span class="count">${levelCount(lv.id)} metin · ${lv.desc}</span></a>`).join("")}
        </div>
      </section>

      <section class="section">
        <div class="section-head"><h2>Türler</h2></div>
        <div class="genre-grid">
          ${Object.entries(GENRES).map(([g, v]) => `<a class="genre-tile g-${g}" href="#library" data-genre="${g}">
            <span class="gname"><span class="dot"></span>${v.name}</span><span class="gdesc">${v.desc} · ${genreCount(g)} hikâye</span></a>`).join("")}
        </div>
      </section>

      <section class="section">
        <div class="section-head"><h2>Her seviyeden bir hikâye</h2><a class="link" href="#library">Tümünü gör</a></div>
        ${grid(featured) || `<div class="empty"><h3>Kütüphane hazırlanıyor</h3><p>Hikâyeler eklendiğinde burada görünecek.</p></div>`}
      </section>`;
    bindText(document.getElementById("demo-text"), DEMO);
    document.getElementById("random").addEventListener("click", () => {
      const pool = STORIES.filter((s) => !(progress[s.id] && progress[s.id].done));
      const pick = (pool.length ? pool : STORIES)[Math.floor(Math.random() * (pool.length || STORIES.length))];
      if (pick) location.hash = "s." + pick.id;
    });
  }

  function viewLibrary() {
    const chip = (group, val, label, extra) =>
      `<button class="chip${extra || ""}" data-f="${group}" data-v="${val}" aria-pressed="${filt[group].includes(val)}">${label}</button>`;
    $main.innerHTML = `
      <div class="lib-head">
        <div><p class="eyebrow">Kütüphane</p><h1>Ne okumak istersin?</h1></div>
        <label class="search">${ICON.search}<input id="q" type="search" placeholder="Başlık ya da yazar ara" value="${esc(filt.q)}" aria-label="Ara"></label>
      </div>
      <div class="filters">
        <div class="filter-row"><span>Seviye</span><div class="chips">${LEVELS.map((l) => chip("level", l.id, `<span class="lvl lvl-${l.id}">${l.id}</span> ${l.name}`)).join("")}</div></div>
        <div class="filter-row"><span>Tür</span><div class="chips">${Object.entries(GENRES).map(([g, v]) => chip("genre", g, `<span class="dot"></span>${v.name}`, " g-" + g)).join("")}</div></div>
        <div class="filter-row"><span>Uzunluk</span><div class="chips">${chip("length", "short", "Kısa · 5–10 dk")}${chip("length", "medium", "Orta · 10–30 dk")}${chip("length", "long", "Uzun · 30 dk+")}</div></div>
      </div>
      <div class="result-line"><span id="count"></span>
        <label>Sırala <select id="sort"><option value="level">Seviye</option><option value="short">En kısa</option><option value="long">En uzun</option><option value="title">Başlık</option></select></label>
      </div>
      <div id="results"></div>`;
    document.getElementById("sort").value = filt.sort;
    const draw = () => {
      const q = filt.q.trim().toLocaleLowerCase("tr");
      let list = STORIES.filter((t) =>
        (!filt.level.length || filt.level.includes(t.level)) &&
        (!filt.genre.length || filt.genre.includes(t.genre)) &&
        (!filt.length.length || filt.length.includes(t.length)) &&
        (!q || (t.title + " " + t.author + " " + t.summaryTr).toLocaleLowerCase("tr").includes(q)));
      const lv = (t) => LEVELS.findIndex((l) => l.id === t.level);
      list = list.slice().sort(
        filt.sort === "short" ? (a, b) => a.words - b.words :
        filt.sort === "long" ? (a, b) => b.words - a.words :
        filt.sort === "title" ? (a, b) => a.title.localeCompare(b.title) :
        (a, b) => lv(a) - lv(b) || a.words - b.words);
      document.getElementById("count").textContent = `${list.length} hikâye`;
      const arts = ARTICLES.filter((a) => filt.genre.includes(a.genre));
      document.getElementById("results").innerHTML =
        (grid(list) || `<div class="empty"><h3>Bu filtrelerle hikâye yok</h3><p>Bir filtreyi kaldırmayı dene.</p><button class="btn" id="clear">Filtreleri temizle</button></div>`) +
        (arts.length ? `<section class="section"><div class="section-head"><h2>Bu tür hakkında makaleler</h2><a class="link" href="#articles">Tüm makaleler</a></div>${grid(arts)}</section>` : "");
      const clr = document.getElementById("clear");
      if (clr) clr.addEventListener("click", () => { filt.level = []; filt.genre = []; filt.length = []; filt.q = ""; saveFilt(); viewLibrary(); });
    };
    $main.querySelector(".filters").addEventListener("click", (ev) => {
      const b = ev.target.closest(".chip");
      if (!b) return;
      const arr = filt[b.dataset.f], v = b.dataset.v, i = arr.indexOf(v);
      if (i >= 0) arr.splice(i, 1); else arr.push(v);
      b.setAttribute("aria-pressed", i < 0);
      saveFilt(); draw();
    });
    document.getElementById("q").addEventListener("input", (ev) => { filt.q = ev.target.value; saveFilt(); draw(); });
    document.getElementById("sort").addEventListener("change", (ev) => { filt.sort = ev.target.value; saveFilt(); draw(); });
    draw();
  }

  function viewArticles() {
    const byGenre = Object.keys(GENRES).map((g) => [g, ARTICLES.filter((a) => a.genre === g)]).filter(([, a]) => a.length);
    $main.innerHTML = `
      <div class="lib-head"><div><p class="eyebrow">Makaleler · B2–C2</p><h1>Hikâyenin arkasındaki fikirler</h1>
      <p class="lead">İleri seviye okurlar için her türe özel denemeler: korkunun psikolojisi, dedektif romanının doğuşu, fabllar neden ölmez… Hepsinde kelime ipuçları ve anlama soruları var.</p></div></div>
      ${byGenre.length ? grid(ARTICLES.slice().sort((a, b) => Object.keys(GENRES).indexOf(a.genre) - Object.keys(GENRES).indexOf(b.genre))) : `<div class="empty"><h3>Makaleler hazırlanıyor</h3></div>`}`;
  }

  function viewReader(id) {
    const t = BY_ID[id];
    if (!t) { $main.innerHTML = `<div class="empty"><h3>Bu metni bulamadık</h3><p><a class="link" href="#library">Kütüphaneye dön</a></p></div>`; return; }
    prefs.last = id; savePrefs();
    const p = progress[id] || (progress[id] = { f: 0 });
    p.at = Date.now(); saveProgress();
    const isArt = t.type === "article";
    const article = !isArt && ARTICLES.find((a) => a.genre === t.genre);
    const lvIdx = LEVELS.findIndex((l) => l.id === t.level);
    const next = STORIES.filter((s) => s.id !== id && !(progress[s.id] && progress[s.id].done))
      .map((s) => ({ s, score: Math.abs(LEVELS.findIndex((l) => l.id === s.level) - lvIdx) * 2 + (s.genre === t.genre ? 0 : 1) }))
      .sort((a, b) => a.score - b.score).slice(0, 3).map((x) => x.s);
    const src = t.source
      ? `Kaynak: <a href="${esc(t.source.url)}" target="_blank" rel="noopener">${esc(t.source.name)}</a> · ${esc(t.source.license)}`
      : isArt ? "Lantern için yazılmış özgün makale." : "Lantern için yazılmış özgün hikâye.";

    $main.innerHTML = `
      <article class="reader">
        <nav class="crumbs"><a href="#home">Ana sayfa</a><span>/</span><a href="${isArt ? "#articles" : "#library"}">${isArt ? "Makaleler" : "Kütüphane"}</a></nav>
        <header class="reader-head">
          <h1>${esc(t.title)}</h1>
          <div class="by">${t.author.startsWith("Lantern") ? (isArt ? "Lantern makalesi" : "Lantern özgün hikâyesi") : esc(t.author) + (t.year ? ", " + t.year : "")}</div>
          <div class="tags"><span class="lvl lvl-${t.level}">${t.level}</span><span class="genre g-${t.genre}" style="display:inline-flex;align-items:center;gap:6px"><span class="dot"></span>${genreName(t.genre)}</span>
            <span class="sep">|</span><span>${LENGTHS[t.length]}</span><span class="sep">|</span><span>${fmt(t.words)} kelime</span><span class="sep">|</span><span>~${minutes(t)} dk</span></div>
          <div class="teaser-box">${esc(t.summaryTr)}</div>
        </header>
        <div class="toolbar" role="toolbar" aria-label="Okuma ayarları">
          <button class="btn sm" id="listen">${ICON.play} Dinle</button>
          <div class="seg" aria-label="Yazı boyutu"><button id="smaller" aria-label="Yazıyı küçült">A−</button><button id="bigger" aria-label="Yazıyı büyüt">A+</button></div>
          ${hoverDevice ? `<div class="seg" aria-label="İpucu modu"><button data-mode="hover" aria-pressed="${prefs.mode === "hover"}">Üzerine gel</button><button data-mode="click" aria-pressed="${prefs.mode === "click"}">Tıkla</button></div>` : ""}
          <span class="spacer"></span>
          <span class="hint">Kesik çizgili kısımlar kalıp ifadedir</span>
        </div>
        ${p.f > 0.05 && !p.done ? `<div class="resume" id="resume"><span>En son %${Math.round(p.f * 100)}'te kalmıştın.</span><button class="btn sm primary" id="resume-btn">Kaldığın yerden devam et</button></div>` : ""}
        <div class="reader-text" id="text">${renderBody(t)}</div>

        <div class="end">
          ${t.phrases && t.phrases.length ? `<section class="panel"><h2>Bu metindeki ifadeler</h2><p class="sub">Metinde kesik çizgiyle işaretlenenler. Üzerine gelince de görürsün.</p>
            <dl class="phrases">${t.phrases.map((ph) => `<div><dt>${esc(ph.en)}</dt><dd>${esc(ph.tr)}</dd></div>`).join("")}</dl></section>` : ""}
          ${t.quiz && t.quiz.length ? `<section class="panel"><h2>Ne kadar anladın?</h2><p class="sub">${t.quiz.length} soru. Cevabını seçince açıklaması görünür.</p><div class="quiz" id="quiz"></div></section>` : ""}
          ${article ? `<section><div class="section-head"><h2>Bu türü daha yakından tanı</h2></div>${grid([article])}</section>` : ""}
          ${next.length ? `<section><div class="section-head"><h2>Sıradaki okuma</h2></div><div class="next-up">${next.map(card).join("")}</div></section>` : ""}
          <p class="source">${src}</p>
        </div>
      </article>`;

    const textEl = document.getElementById("text");
    document.documentElement.style.setProperty("--read-size", prefs.size + "px");
    bindText(textEl, t);
    markSaved(textEl);

    // quiz
    const qz = document.getElementById("quiz");
    if (qz) {
      let answered = 0, correct = 0;
      qz.innerHTML = t.quiz.map((q, i) => `<div class="q" data-i="${i}"><p>${i + 1}. ${esc(q.q)}</p><div class="opts">${q.options.map((o, j) =>
        `<button class="opt" data-j="${j}"><span class="k">${"ABCD"[j] || j + 1}</span><span>${esc(o)}</span></button>`).join("")}</div></div>`).join("") +
        `<div class="score" id="score" hidden></div>`;
      qz.addEventListener("click", (ev) => {
        const b = ev.target.closest(".opt");
        if (!b || b.disabled) return;
        const qEl = b.closest(".q"), q = t.quiz[+qEl.dataset.i], j = +b.dataset.j;
        qEl.querySelectorAll(".opt").forEach((o) => { o.disabled = true; if (+o.dataset.j === q.answer) o.classList.add("right"); });
        if (j !== q.answer) b.classList.add("wrong"); else correct++;
        answered++;
        if (q.explainTr) qEl.insertAdjacentHTML("beforeend", `<div class="explain">${j === q.answer ? "Doğru. " : "Doğru cevap " + "ABCD"[q.answer] + ". "}${esc(q.explainTr)}</div>`);
        if (answered === t.quiz.length) {
          const sc = document.getElementById("score");
          sc.hidden = false;
          sc.innerHTML = `<b>${correct}/${t.quiz.length}</b><span>${correct === t.quiz.length ? "Tam isabet!" : correct >= t.quiz.length / 2 ? "Güzel iş." : "Bir kez daha okumaya değer."}</span>`;
          p.done = true; p.f = 1; p.quiz = [correct, t.quiz.length]; saveProgress();
          toast(isArt ? "Makale tamamlandı" : "Hikâye tamamlandı");
        }
      });
    }

    // toolbar
    const setSize = (d) => { prefs.size = Math.min(26, Math.max(15, prefs.size + d)); document.documentElement.style.setProperty("--read-size", prefs.size + "px"); savePrefs(); };
    document.getElementById("smaller").addEventListener("click", () => setSize(-1));
    document.getElementById("bigger").addEventListener("click", () => setSize(1));
    $main.querySelectorAll("[data-mode]").forEach((b) => b.addEventListener("click", () => {
      prefs.mode = b.dataset.mode; savePrefs();
      $main.querySelectorAll("[data-mode]").forEach((x) => x.setAttribute("aria-pressed", x === b));
    }));
    const listen = document.getElementById("listen");
    const blocks = [...textEl.querySelectorAll("p, h2")];
    const resetListen = () => { listen.innerHTML = ICON.play + " Dinle"; blocks.forEach((b) => b.classList.remove("speaking")); };
    listen.addEventListener("click", () => {
      if (Speech.active) { Speech.stop(); return; }
      const barBottom = listen.closest(".toolbar").getBoundingClientRect().bottom;
      let start = blocks.findIndex((b) => b.getBoundingClientRect().bottom > barBottom + 10);
      if (start < 0) start = 0;
      listen.innerHTML = ICON.stop + " Durdur";
      Speech.readBlocks(blocks, start, (b) => {
        blocks.forEach((x) => x.classList.toggle("speaking", x === b));
        b.scrollIntoView({ block: "center", behavior: "smooth" });
      }, resetListen);
    });
    const rb = document.getElementById("resume-btn");
    if (rb) rb.addEventListener("click", () => {
      const h = textEl.offsetTop + textEl.offsetHeight * p.f - window.innerHeight / 3;
      window.scrollTo({ top: h, behavior: "smooth" });
      document.getElementById("resume").hidden = true;
    });

    // reading progress
    let saveT = 0;
    readerScroll = () => {
      const r = textEl.getBoundingClientRect();
      const f = Math.min(1, Math.max(0, (window.innerHeight * 0.6 - r.top) / r.height));
      document.querySelector("#progress span").style.width = (f * 100) + "%";
      if (!p.done && f > (p.f || 0)) {
        p.f = f; p.at = Date.now();
        clearTimeout(saveT); saveT = setTimeout(saveProgress, 600);
      }
    };
    readerScroll();
  }

  function viewWords(tab) {
    tab = tab || "list";
    const all = Object.values(words).sort((a, b) => b.added - a.added);
    const due = dueWords();
    $main.innerHTML = `
      <div class="lib-head"><div><p class="eyebrow">Kelime Defterim</p><h1>${all.length ? `${all.length} kelime biriktirdin` : "Defterin boş"}</h1>
        <p class="lead">Okurken bir kelimeye tıklayıp “Deftere ekle” dediğinde buraya gelir, geçtiği cümleyle birlikte. Kartlar bölümünde aralıklı tekrar yöntemiyle çalışırsın.</p></div>
        ${all.length ? `<button class="btn sm" id="copy">Anki için kopyala</button>` : ""}</div>
      <div class="tabs" role="tablist">
        <button role="tab" data-tab="list" aria-selected="${tab === "list"}">Liste</button>
        <button role="tab" data-tab="cards" aria-selected="${tab === "cards"}">Kartlar ${due.length ? `<span class="badge">${due.length}</span>` : ""}</button>
      </div>
      <div id="tab-body"></div>`;
    $main.querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", () => viewWords(b.dataset.tab)));
    const cp = document.getElementById("copy");
    if (cp) cp.addEventListener("click", () => {
      const tsv = all.map((w) => [w.w, w.tr + (w.pos ? " (" + w.pos + ")" : ""), w.ctx || ""].join("\t")).join("\n");
      const done = () => toast("Kopyalandı: Anki'de 'Metin dosyası içe aktar' ile yapıştırabilirsin");
      if (navigator.clipboard) navigator.clipboard.writeText(tsv).then(done, () => toast("Kopyalanamadı; tarayıcı izin vermedi"));
    });
    const body = document.getElementById("tab-body");
    if (!all.length) {
      body.innerHTML = `<div class="empty"><h3>İlk kelimeni ekle</h3><p>Bir hikâye aç, bilmediğin bir kelimeye tıkla ve “Deftere ekle”ye bas.</p><a class="btn primary" href="#library">Bir hikâye seç</a></div>`;
      return;
    }
    if (tab === "list") {
      body.innerHTML = `<div class="wordlist">${all.map((w) => {
        const src = w.src && BY_ID[w.src];
        return `<div class="wrow" data-w="${esc(w.w)}">
          <div class="wen">${esc(w.w)}${w.pos ? `<small>${esc(w.pos)}</small>` : ""}</div>
          <div class="wtr-col"><div class="wtr">${esc(w.tr || "—")}</div>${w.ctx ? `<div class="wctx">“${esc(w.ctx)}”${src ? ` · <a href="#s.${src.id}">${esc(src.title)}</a>` : ""}</div>` : ""}</div>
          <div class="wact"><span class="box-pill" title="Tekrar kutusu">Kutu ${w.box || 1}</span>
            <button class="icon-btn" data-act="speak" aria-label="Telaffuz et">${ICON.speak}</button>
            <button class="icon-btn" data-act="del" aria-label="Defterden çıkar">${ICON.trash}</button></div>
        </div>`; }).join("")}</div>`;
      body.addEventListener("click", (ev) => {
        const b = ev.target.closest("[data-act]");
        if (!b) return;
        const w = b.closest(".wrow").dataset.w;
        if (b.dataset.act === "speak") Speech.say(w);
        if (b.dataset.act === "del") { delete words[w]; saveWords(); toast(`“${w}” çıkarıldı`); viewWords("list"); }
      });
      return;
    }
    // flashcards — Leitner boxes
    let queue = due.slice().sort(() => Math.random() - 0.5);
    let extra = false;
    const drawCard = () => {
      if (!queue.length) {
        const nextDue = Object.values(words).map((w) => w.due).filter((d) => d > Date.now()).sort()[0];
        body.innerHTML = `<div class="empty"><h3>Bugünlük bu kadar</h3><p>${nextDue ? `Sıradaki tekrar ${new Date(nextDue).toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" })}.` : ""}</p>
          <button class="btn" id="more">Yine de çalış</button></div>`;
        document.getElementById("more").addEventListener("click", () => { extra = true; queue = Object.values(words).sort(() => Math.random() - 0.5).slice(0, 20); drawCard(); });
        return;
      }
      const w = queue[0];
      const ctxHtml = w.ctx ? esc(w.ctx).replace(new RegExp("\\b(" + esc(w.form || w.w).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")\\b", "i"), "<b>$1</b>") : "";
      body.innerHTML = `<div class="flash-wrap">
        <div class="flash-meta"><span>${extra ? "Serbest çalışma" : "Tekrar"}</span><span>${queue.length} kart kaldı</span></div>
        <div class="flash" id="flash" tabindex="0" role="button" aria-label="Kartı çevir">
          <div class="fw">${esc(w.w)}</div>${ctxHtml ? `<div class="fctx">“${ctxHtml}”</div>` : ""}
          <div id="back" hidden><div class="fpos">${esc(w.pos || "")}</div><div class="ftr">${esc(w.tr || "—")}</div></div>
          <div class="muted" id="flip-hint">Anlamı görmek için tıkla ya da <kbd>Boşluk</kbd></div>
        </div>
        <div class="flash-actions" id="grade" hidden>
          <button class="btn" data-g="0">Tekrar <kbd>1</kbd></button>
          <button class="btn primary" data-g="1">Biliyorum <kbd>2</kbd></button>
        </div></div>`;
      const flip = () => { document.getElementById("back").hidden = false; document.getElementById("grade").hidden = false; document.getElementById("flip-hint").hidden = true; Speech.say(w.w); };
      document.getElementById("flash").addEventListener("click", flip);
      document.getElementById("grade").addEventListener("click", (ev) => { const b = ev.target.closest("[data-g]"); if (b) grade(+b.dataset.g); });
      cardKeys = (ev) => {
        if (ev.key === " ") { ev.preventDefault(); flip(); }
        else if (!document.getElementById("grade").hidden && (ev.key === "1" || ev.key === "2")) grade(ev.key === "2" ? 1 : 0);
      };
    };
    const grade = (ok) => {
      const w = queue.shift();
      const rec = words[w.w];
      if (rec) {
        rec.box = ok ? Math.min(5, (rec.box || 1) + 1) : 1;
        rec.due = Date.now() + BOX_DAYS[rec.box] * DAY;
        if (!ok) queue.push(rec);
        saveWords();
      }
      drawCard();
    };
    drawCard();
  }
  let cardKeys = null;
  document.addEventListener("keydown", (ev) => { if (cardKeys && location.hash === "#words" && !ev.target.closest("input, textarea")) cardKeys(ev); });

  function viewAbout() {
    const pd = STORIES.filter((s) => s.source);
    $main.innerHTML = `<div class="prose">
      <p class="eyebrow">Nasıl çalışır</p>
      <h1>Okurken öğrenmenin en rahat yolu</h1>
      <p>Lantern'de kelime listesi ezberlemezsin; hikâyenin içinde kalırsın. Bilmediğin her kelimenin anlamı bir fare hareketi uzaklıkta.</p>
      <h2>Dört adım</h2>
      <ol>
        <li><strong>Seviyeni ve türünü seç.</strong> Kütüphanede seviye, tür ve uzunluğa göre süz.</li>
        <li><strong>Kelimelerin üzerine gel.</strong> Türkçe anlamı, kökü (ör. <em>went ← go</em>) ve o metne özel anlamı görünür. Kesik çizgili kısımlar kalıp ifadelerdir.</li>
        <li><strong>Tıkla ve kaydet.</strong> Tıklayınca kutu sabitlenir: sesli dinle, deftere ekle ya da Tureng'de aç. Telefonda dokunman yeterli.</li>
        <li><strong>Kartlarla tekrar et.</strong> Defterindeki kelimeler, geçtikleri cümleyle birlikte aralıklı tekrar kartlarına dönüşür. Bildiğin kart daha seyrek, bilmediğin daha sık gelir.</li>
      </ol>
      <h2>Hangi seviyedeyim?</h2>
      <p>Seviyeler Avrupa Ortak Dil Çerçevesi'ne (CEFR) göredir. Bir hikâyede sayfa başına beşten fazla kelimeye bakıyorsan bir alt seviyeyi dene; hiç bakmıyorsan bir üste çık.</p>
      <div class="table-wrap"><table class="cefr"><thead><tr><th>Seviye</th><th>Ne okuyabilirsin</th><th>Lantern'de</th></tr></thead><tbody>
        <tr><td><span class="lvl lvl-A1">A1</span></td><td>Kısa, basit cümleler; günlük konular.</td><td>Özgün kısa hikâyeler</td></tr>
        <tr><td><span class="lvl lvl-A2">A2</span></td><td>Geçmiş zamanlı anlatılar, basit diyaloglar.</td><td>Özgün hikâyeler, Aisopos fablları</td></tr>
        <tr><td><span class="lvl lvl-B1">B1</span></td><td>Akıcı olay örgüsü, bağlaçlar, birkaç deyim.</td><td>Özgün korku, bilim kurgu, macera</td></tr>
        <tr><td><span class="lvl lvl-B2">B2</span></td><td>Klasik kısa öyküler, ironi, eski üsluplu ifadeler.</td><td>O. Henry, Saki, Maupassant, Jacobs</td></tr>
        <tr><td><span class="lvl lvl-C1">C1</span></td><td>Yoğun betimleme, uzun cümleler, nadir kelimeler.</td><td>Poe, Conan Doyle, Jack London, H. G. Wells</td></tr>
        <tr><td><span class="lvl lvl-C2">C2</span></td><td>Akademik ve edebî metinler, ince anlam farkları.</td><td>Tür makaleleri</td></tr>
      </tbody></table></div>
      <h2>Kısayollar</h2>
      <p><kbd>Esc</kbd> ipucu kutusunu kapatır. Kartlarda <kbd>Boşluk</kbd> kartı çevirir, <kbd>1</kbd> tekrar, <kbd>2</kbd> biliyorum.</p>
      <h2>Kaynaklar ve telif</h2>
      <p>Klasik metinler ABD'de kamu malıdır ve <a href="https://www.gutenberg.org" target="_blank" rel="noopener">Project Gutenberg</a>'den kısaltılmadan alınmıştır. A1–B1 hikâyeleri ve tüm makaleler Lantern için özgün olarak yazılmıştır. Sözlük maddeleri Lantern için hazırlanmıştır.</p>
      ${pd.length ? `<ul>${pd.map((s) => `<li>${esc(s.author)}, <em>${esc(s.title)}</em>${s.year ? " (" + s.year + ")" : ""} · <a href="${esc(s.source.url)}" target="_blank" rel="noopener">${esc(s.source.name)}</a></li>`).join("")}</ul>` : ""}
      <h2>Verilerin</h2>
      <p>Kelime defterin ve okuma ilerlemen yalnızca bu tarayıcıda saklanır. Tarayıcı verilerini silersen bunlar da silinir.</p>
    </div>`;
  }

  // ---------- router ----------
  let readerScroll = null;
  window.addEventListener("scroll", () => { if (readerScroll) readerScroll(); }, { passive: true });

  $main.addEventListener("click", (ev) => {
    const a = ev.target.closest("[data-level], [data-genre]");
    if (!a) return;
    filt.level = a.dataset.level ? [a.dataset.level] : [];
    filt.genre = a.dataset.genre ? [a.dataset.genre] : [];
    filt.length = []; filt.q = "";
    saveFilt();
    if (location.hash === "#library") route();
  });

  function route() {
    const h = decodeURIComponent(location.hash.slice(1)) || "home";
    Speech.stop(); Tip.hide();
    readerScroll = null; cardKeys = null;
    document.querySelector("#progress span").style.width = "0";
    const section = h.startsWith("s.") ? (BY_ID[h.slice(2)] && BY_ID[h.slice(2)].type === "article" ? "articles" : "library") : h;
    document.querySelectorAll("[data-nav]").forEach((a) => { if (a.dataset.nav === section) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
    if (h.startsWith("s.")) viewReader(h.slice(2));
    else if (h === "library") viewLibrary();
    else if (h === "articles") viewArticles();
    else if (h === "words") viewWords();
    else if (h === "about") viewAbout();
    else viewHome();
    const t = h.startsWith("s.") && BY_ID[h.slice(2)];
    document.title = t ? `${t.title} · Lantern English` : "Lantern English";
    window.scrollTo(0, 0);
  }

  window.addEventListener("hashchange", route);
  updateBadge();
  route();
})();
