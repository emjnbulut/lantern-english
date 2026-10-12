/* Lantern English — single-page app. Routes: #home #library #articles #videos #my-library #words #about #s.<id> #v.<id> */
(function () {
  "use strict";

  const L = window.LanternLemma;
  const LIB = (window.LANTERN_LIBRARY || []).filter((t) => t.type === "story" || t.type === "article");
  const DICT = window.LANTERN_DICT || {};
  const STORIES = LIB.filter((t) => t.type === "story");
  const ARTICLES = LIB.filter((t) => t.type === "article");
  const FEATURED = window.LANTERN_FEATURED || {};
  const VIDEOS = window.LANTERN_VIDEOS || [];
  const VIDEO_BY_ID = Object.fromEntries(VIDEOS.map((v) => [v.id, v]));
  const BY_ID = Object.fromEntries(LIB.map((t) => [t.id, t]));
  const $main = document.getElementById("main");

  // ---------- reference data ----------
  const LEVELS = [
    { id: "A1", name: "Başlangıç", desc: "Basit cümleler, günlük kelimeler" },
    { id: "A2", name: "Temel", desc: "Geçmiş zaman, kısa diyaloglar" },
    { id: "B1", name: "Orta", desc: "Akıcı anlatım, bağlaçlar" },
    { id: "B2", name: "Orta üstü", desc: "Klasikler ve özgün öyküler" },
    { id: "C1", name: "İleri", desc: "Zengin kelime, yoğun anlatım" },
    { id: "C2", name: "Ustalık", desc: "Edebî ve akademik dil" },
  ];
  const GENRES = {
    comedy: { name: "Komedi", desc: "Gülümseten, bazen kahkaha attıran" },
    mystery: { name: "Gizem", desc: "İpuçları, sırlar, dedektifler" },
    horror: { name: "Korku", desc: "Işıkları açık bırakın" },
    adventure: { name: "Macera", desc: "Doğayla ve kendinle mücadele" },
    romance: { name: "Romantik", desc: "Aşk, fedakârlık, sürpriz sonlar" },
    scifi: { name: "Bilim Kurgu", desc: "Yarının ve uzayın hikâyeleri" },
    fable: { name: "Fabl", desc: "Hayvanlar, seçimler ve dersler" },
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
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7 10.5l5 5 5-5M5 19.5h14"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    mute: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="m16 9 5 6M21 9l-5 6"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4.5" height="14" rx="1.2"/><rect x="13.5" y="5" width="4.5" height="14" rx="1.2"/></svg>',
    expand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
    shrink: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>',
    dice: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.2" fill="currentColor"/><circle cx="15" cy="15" r="1.2" fill="currentColor"/><circle cx="15" cy="9" r="1.2" fill="currentColor"/><circle cx="9" cy="15" r="1.2" fill="currentColor"/></svg>',
    bookmark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4z"/></svg>',
    bookmarkFill: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4z"/></svg>',
  };

  // ---------- storage (per-browser conveniences) ----------
  const S = {
    load(k, d) { try { const v = localStorage.getItem("lantern." + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    save(k, v) { try { localStorage.setItem("lantern." + k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  };
  let words = S.load("words", {});
  let progress = S.load("progress", {});
  const cleanBookmarks = (value) => Array.isArray(value) ? value.filter((id, i) => typeof id === "string" && Object.prototype.hasOwnProperty.call(BY_ID, id) && value.indexOf(id) === i) : [];
  let bookmarks = cleanBookmarks(S.load("bookmarks", []));
  let bookmarkStorageAvailable = true;
  const prefs = Object.assign({ size: 19, mode: "hover", last: null }, S.load("prefs", {}));
  const filt = Object.assign({ level: [], genre: [], length: [], q: "", sort: "level" }, S.load("filters", {}));
  const articleFilt = Object.assign({ level: [], genre: [], length: [], q: "", sort: "level" }, S.load("articleFilters", {}));
  const shelfFilt = Object.assign({ type: "all", q: "", sort: "saved" }, S.load("myLibraryFilters", {}));
  if (!["all", "story", "article"].includes(shelfFilt.type)) shelfFilt.type = "all";
  if (typeof shelfFilt.q !== "string") shelfFilt.q = "";
  if (!["saved", "recent", "level", "title"].includes(shelfFilt.sort)) shelfFilt.sort = "saved";
  let shelfDraw = null;
  const COLLECTIONS = {
    story: { items: STORIES, filters: filt, key: "filters", route: "library", title: "Hikâyeler", label: "hikâye", search: "Hikâye", eyebrow: "Hikâye kütüphanesi · A1–C2", lead: "Klasikler ve özgün hikâyeler. Seviyene, türe ve okuma uzunluğuna göre seç." },
    article: { items: ARTICLES, filters: articleFilt, key: "articleFilters", route: "articles", title: "Makaleler", label: "makale", search: "Makale", eyebrow: "Denemeler · B2–C2", lead: "Edebiyat, türler ve anlatı üzerine özgün denemeler. Seviyene ve ilgini çeken konuya göre bir makale seç." },
  };
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

  function renderBody(text, paragraphs) {
    const phrases = prepPhrases(text);
    return (paragraphs || text.paragraphs).map((p) =>
      p.startsWith("## ")
        ? `<h2 class="sec">${renderInline(smart(p.slice(3)), phrases)}</h2>`
        : `<p>${renderInline(smart(p), phrases)}</p>`
    ).join("");
  }

  // Page breaks preserve paragraphs and keep chapter headings with their first paragraph.
  function storyPages(text) {
    const pages = [];
    let start = 0, words = 0, before = 0;
    for (let i = 0; i < text.paragraphs.length;) {
      let end = i;
      while (end < text.paragraphs.length && text.paragraphs[end].startsWith("## ")) end++;
      if (end < text.paragraphs.length) end++;
      const count = text.paragraphs.slice(i, end).filter((p) => !p.startsWith("## ")).join(" ").match(L.WORD_RE)?.length || 0;
      if (words && words + count > 450) {
        pages.push({ start, end: i, words, before });
        before += words; start = i; words = 0;
      }
      words += count; i = end;
    }
    pages.push({ start, end: text.paragraphs.length, words, before });
    return pages;
  }

  function jumpScroll(top) {
    const style = document.documentElement.style;
    const previous = style.scrollBehavior;
    style.scrollBehavior = "auto";
    window.scrollTo(0, Math.max(0, top));
    style.scrollBehavior = previous;
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
      if (this.rotFrame) {
        // the frame is rotated 90deg clockwise about the viewport centre
        const f = this.rotFrame, W = f.offsetWidth, H = f.offsetHeight;
        const dx = r.left + r.width / 2 - window.innerWidth / 2, dy = r.top + r.height / 2 - window.innerHeight / 2;
        const cxl = W / 2 + dy, cyl = H / 2 - dx, hl = r.width;
        const tw2 = this.el.offsetWidth, th2 = this.el.offsetHeight;
        const l2 = Math.min(Math.max(8, cxl - tw2 / 2), Math.max(8, W - tw2 - 8));
        let t2 = cyl - hl / 2 - th2 - 10;
        if (t2 < 8) t2 = cyl + hl / 2 + 10;
        t2 = Math.min(Math.max(8, t2), Math.max(8, H - th2 - 8));
        this.el.style.left = l2 + "px"; this.el.style.top = t2 + "px";
        return;
      }
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
        if (phrase) h += `<button class="btn sm" data-act="savePhrase">${words[phrase.en.toLowerCase()] ? ICON.starFill + " İfade defterde" : ICON.star + " İfadeyi ekle"}</button>`;
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
    if (b.dataset.act === "savePhrase") {
      const ph = Tip.text.phrases[+Tip.span.closest(".ph").dataset.ph];
      const key = ph.en.toLowerCase();
      if (words[key]) { delete words[key]; toast(`“${ph.en}” defterden çıkarıldı`); }
      else {
        words[key] = { w: key, form: ph.en, pos: "ifade", tr: ph.tr, src: BY_ID[Tip.text.id] ? Tip.text.id : null,
          ctx: sentenceAround(Tip.span), added: Date.now(), box: 1, due: Date.now() };
        toast(`“${ph.en}” deftere eklendi`);
      }
      saveWords();
      Tip.show(Tip.span, Tip.text, true);
    }
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
        // sentence split without lookbehind (older mobile WebViews reject that syntax at parse time)
        const parts = (blocks[i].textContent.match(/[^.!?]+[.!?]*["”’']?\s*|[.!?]+["”’']?\s*/g) || []).filter((x) => x.trim());
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

  // ---------- personal reading shelf ----------
  function bookmarkText(saved) {
    return saved ? "Kaydedildi" : "Kaydet";
  }
  function bookmarkContent(saved) {
    return (saved ? ICON.bookmarkFill : ICON.bookmark) + `<span>${bookmarkText(saved)}</span>`;
  }
  function bookmarkLabel(t, saved) {
    return `${bookmarkText(saved)}${saved ? " · Kitaplığımdan çıkar" : ""}: ${t.title}`;
  }
  function bookmarkButton(t) {
    const saved = bookmarks.includes(t.id);
    return `<button class="btn sm bookmark-btn" type="button" data-bookmark="${esc(t.id)}" aria-pressed="${saved}" aria-label="${esc(bookmarkLabel(t, saved))}" title="${saved ? "Kitaplığımdan çıkar" : "Kitaplığıma ekle"}">${bookmarkContent(saved)}</button>`;
  }
  function bookmarkCheckbox(t) {
    const saved = bookmarks.includes(t.id);
    return `<label class="bookmark-choice${saved ? " is-saved" : ""}" for="reader-bookmark"><input id="reader-bookmark" type="checkbox" data-bookmark="${esc(t.id)}" data-bookmark-reader="true" aria-label="${esc("Kitaplığıma ekle: " + t.title)}" aria-describedby="bookmark-hint"${saved ? " checked" : ""}><span>Kitaplığıma ekle</span></label>`;
  }
  const bookmarkStorageNote = () => bookmarkStorageAvailable ? "Kitaplığın bu tarayıcıda saklanır." : "Kayıtların şu an yalnızca bu oturumda tutulabiliyor.";
  function updateBookmarks() {
    const badge = document.getElementById("library-badge");
    badge.textContent = bookmarks.length; badge.hidden = bookmarks.length === 0;
    badge.title = `${bookmarks.length} kayıt`;
    document.querySelectorAll("[data-bookmark-count]").forEach((e) => { e.textContent = bookmarks.length; });
    const note = $main.querySelector(".library-note");
    if (note) note.textContent = bookmarkStorageNote();
    $main.querySelectorAll("[data-bookmark]").forEach((b) => {
      const t = BY_ID[b.dataset.bookmark];
      if (!t) return;
      const saved = bookmarks.includes(t.id);
      if (b.matches("input[type='checkbox']")) {
        b.checked = saved;
        b.closest(".bookmark-choice").classList.toggle("is-saved", saved);
        return;
      }
      b.setAttribute("aria-pressed", saved);
      b.setAttribute("aria-label", bookmarkLabel(t, saved));
      b.title = saved ? "Kitaplığımdan çıkar" : "Kitaplığıma ekle";
      b.innerHTML = bookmarkContent(saved);
    });
  }
  function refreshShelf() {
    if (!shelfDraw) return;
    const active = document.activeElement;
    const button = active.closest("#results [data-bookmark]");
    const link = active.closest("#results a.card");
    const id = button ? button.dataset.bookmark : link ? link.hash.slice(3) : null;
    const shell = active.closest("#results .card-shell");
    const neighbor = shell && (shell.nextElementSibling || shell.previousElementSibling);
    const nextId = neighbor && neighbor.querySelector("[data-bookmark]")?.dataset.bookmark;
    shelfDraw();
    if (id) {
      const controls = Array.from($main.querySelectorAll(button ? "#results [data-bookmark]" : "#results a.card"));
      const controlId = (e) => button ? e.dataset.bookmark : e.hash.slice(3);
      const next = controls.find((e) => controlId(e) === id) || controls.find((e) => controlId(e) === nextId) || controls[0];
      (next || document.getElementById("q")).focus({ preventScroll: true });
    }
  }
  function changeBookmark(id, checked) {
    if (!Object.prototype.hasOwnProperty.call(BY_ID, id)) return;
    // Read the latest list before editing so another tab's saves are retained.
    if (bookmarkStorageAvailable) bookmarks = cleanBookmarks(S.load("bookmarks", bookmarks));
    const saved = bookmarks.includes(id), wanted = typeof checked === "boolean" ? checked : !saved;
    if (saved === wanted) { updateBookmarks(); return; }
    bookmarks = wanted ? [id, ...bookmarks] : bookmarks.filter((item) => item !== id);
    bookmarkStorageAvailable = S.save("bookmarks", bookmarks); updateBookmarks(); refreshShelf();
    toast((wanted ? "Kitaplığına eklendi" : "Kitaplığından çıkarıldı") + (bookmarkStorageAvailable ? "" : " · Bu oturum için"));
  }
  $main.addEventListener("click", (ev) => {
    const b = ev.target.closest("button[data-bookmark]");
    if (!b) return;
    ev.preventDefault(); changeBookmark(b.dataset.bookmark);
  });
  $main.addEventListener("change", (ev) => {
    const checkbox = ev.target.closest("input[type='checkbox'][data-bookmark]");
    if (checkbox) changeBookmark(checkbox.dataset.bookmark, checkbox.checked);
  });
  window.addEventListener("storage", (ev) => {
    if (!bookmarkStorageAvailable || (ev.key !== null && ev.key !== "lantern.bookmarks")) return;
    bookmarks = cleanBookmarks(S.load("bookmarks", []));
    updateBookmarks();
    refreshShelf();
  });

  // ---------- shared fragments ----------
  function stateOf(t) {
    const p = progress[t.id];
    if (!p) return "";
    if (p.done) return `<span class="state done">${ICON.check} ${t.type === "article" ? "Okundu" : "Bitti"}</span>`;
    if (p.f > 0.03) return `<span class="state">%${Math.round(p.f * 100)}</span>`;
    return "";
  }
  function card(t, why) {
    const p = progress[t.id];
    const bar = p && !p.done && p.f > 0.03 ? `<div class="bar"><span style="width:${Math.round(p.f * 100)}%"></span></div>` : "";
    const by = t.author.startsWith("Lantern") ? (t.type === "article" ? "Lantern makalesi" : "Lantern özgün hikâyesi") : esc(t.author) + (t.year ? " · " + t.year : "");
    return `<div class="card-shell"><a class="card${t.type === "story" ? "" : " " + t.type}${why ? " rec" : ""}" href="#s.${t.id}">
      <div class="card-top"><span class="lvl lvl-${t.level}">${t.level}</span><span class="genre g-${t.genre}"><span class="dot"></span>${genreName(t.genre)}</span>${t.type === "article" ? '<span class="content-kind">Makale</span>' : ""}${t.abridged ? '<span class="abr">Kısaltılmış klasik</span>' : ""}${stateOf(t)}</div>
      <h3>${esc(t.title)}</h3>
      <div class="by">${by}</div>
      ${why ? `<p class="why">${ICON.starFill}<span>${esc(why)}</span></p>` : ""}
      <p class="teaser">${esc(t.summaryTr)}</p>
      ${bar}
      <div class="meta"><span>${LENGTHS[t.length]}</span><span>·</span><span>${fmt(t.words)} kelime</span><span>·</span><span>~${minutes(t)} dk</span></div>
    </a><div class="card-actions">${bookmarkButton(t)}</div></div>`;
  }
  const grid = (items) => items.length ? `<div class="grid">${items.map((t) => card(t)).join("")}</div>` : "";
  const collectionNav = (kind) => `<nav class="collection-switch" aria-label="Okuma bölümleri">${Object.entries(COLLECTIONS).map(([key, c]) => `<a href="#${c.route}"${key === kind ? ' aria-current="page"' : ""}>${c.title} <span>${c.items.length}</span></a>`).join("")}<a href="#my-library"${kind === "saved" ? ' aria-current="page"' : ""}>Kitaplığım <span data-bookmark-count>${bookmarks.length}</span></a></nav>`;

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
      .sort((a, b) => (b[1].at || 0) - (a[1].at || 0)).map(([id]) => BY_ID[id]);
    const readingStories = reading.filter((t) => t.type === "story").slice(0, 3);
    const readingArticles = reading.filter((t) => t.type === "article").slice(0, 3);
    const featured = LEVELS.map((lv) => STORIES.find((s) => s.level === lv.id && !(progress[s.id] && progress[s.id].done)) || STORIES.find((s) => s.level === lv.id)).filter(Boolean);
    const advanced = STORIES.filter((s) => ["B2", "C1", "C2"].includes(s.level) && s.author === "Lantern Original")
      .sort((a, b) => LEVELS.findIndex((l) => l.id === b.level) - LEVELS.findIndex((l) => l.id === a.level)).slice(0, 5);
    const levelCount = (id) => STORIES.filter((t) => t.level === id).length;
    const genreCount = (g) => STORIES.filter((t) => t.genre === g).length;
    $main.innerHTML = `
      <section class="hero">
        <div>
          <p class="eyebrow">Hikâyelerle İngilizce</p>
          <h1>Okudukça öğren. <em>Her kelime</em> bir dokunuş uzağında.</h1>
          <p class="lead">Seviyene uygun hikâyeleri oku; anlamını bilmediğin kelimenin üzerine gel, Türkçesi hemen çıksın. Beğendiklerini defterine kaydet, kartlarla tekrar et.</p>
          <div class="hero-actions">
            <a class="btn primary" href="#library">Hikâyelere göz at</a>
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

      <section class="section" aria-label="Okuma bölümleri">
        <div class="collection-grid">
          <a class="collection-link" href="#library"><span class="eyebrow">A1–C2 · ${STORIES.length} hikâye</span><h2>Hikâyeler</h2><p>Karakterler, olaylar ve farklı dünyalar. Seviyene ve sevdiğin türe göre bir hikâye seç.</p><span class="link">Hikâye kütüphanesine git →</span></a>
          <a class="collection-link articles-link" href="#articles"><span class="eyebrow">B2–C2 · ${ARTICLES.length} makale</span><h2>Makaleler</h2><p>Edebiyat ve anlatı üzerine denemeler. Bir fikri daha yakından incelemek için oku.</p><span class="link">Makalelere git →</span></a>
          ${VIDEOS.length ? `<a class="collection-link videos-link" href="#videos"><span class="eyebrow">İzleyerek öğren · ${VIDEOS.length} video</span><h2>Videolar</h2><p>Animasyon, bilim kurgu, macera ve astronotlar: İngilizce izle, altyazıdaki kelimelere dokun, Türkçe anlamlarını gör.</p><span class="link">Videolara göz at →</span></a>` : ""}
        </div>
      </section>

      ${readingStories.length ? `<section class="section"><div class="section-head"><h2>Hikâyene devam et</h2><a class="link" href="#library">Hikâyeler</a></div>${grid(readingStories)}</section>` : ""}
      ${readingArticles.length ? `<section class="section"><div class="section-head"><h2>Makalene devam et</h2><a class="link" href="#articles">Makaleler</a></div>${grid(readingArticles)}</section>` : ""}
      <section class="section">
        <div class="section-head"><h2>Hikâye seviyeni seç</h2><a class="link" href="#about">Hangi seviyedeyim?</a></div>
        <div class="ladder">
          ${LEVELS.map((lv, i) => `<a class="step lvl-${lv.id}" style="--h:${i}" href="#library" data-level="${lv.id}">
            <b>${lv.id}</b><span class="name">${lv.name}</span><span class="count">${levelCount(lv.id)} hikâye · ${lv.desc}</span></a>`).join("")}
        </div>
      </section>

      <section class="section">
        <div class="section-head"><h2>Hikâye türleri</h2></div>
        <div class="genre-grid">
          ${Object.entries(GENRES).map(([g, v]) => `<a class="genre-tile g-${g}" href="#library" data-genre="${g}">
            <span class="gname"><span class="dot"></span>${v.name}</span><span class="gdesc">${v.desc} · ${genreCount(g)} hikâye</span></a>`).join("")}
        </div>
      </section>

      ${advanced.length ? `<section class="section"><div class="section-head"><h2>İleri seviye özgün hikâyeler</h2><button class="btn sm" id="advanced-stories">B2–C2 hikâyelerini gör</button></div>${grid(advanced)}</section>` : ""}

      <section class="section">
        <div class="section-head"><h2>Her seviyeden bir hikâye</h2><a class="link" href="#library">Tümünü gör</a></div>
        ${grid(featured) || `<div class="empty"><h3>Kütüphane hazırlanıyor</h3><p>Hikâyeler eklendiğinde burada görünecek.</p></div>`}
      </section>`;
    bindText(document.getElementById("demo-text"), DEMO);
    const advancedButton = document.getElementById("advanced-stories");
    if (advancedButton) advancedButton.addEventListener("click", () => {
      filt.level = ["B2", "C1", "C2"]; filt.genre = []; filt.length = []; filt.q = "";
      saveFilt(); location.hash = "library";
    });
    document.getElementById("random").addEventListener("click", () => {
      const pool = STORIES.filter((s) => !(progress[s.id] && progress[s.id].done));
      const pick = (pool.length ? pool : STORIES)[Math.floor(Math.random() * (pool.length || STORIES.length))];
      if (pick) location.hash = "s." + pick.id;
    });
  }

  function viewLibrary() {
    viewCollection("story");
  }

  function viewArticles() {
    viewCollection("article");
  }

  // Videos have their own collection and never become reading bookmarks.
  const videoTime = (seconds) => Math.floor(seconds / 60) + ":" + String(Math.floor(seconds % 60)).padStart(2, "0");

  // ---------- offline video downloads ----------
  // Files live in Cache Storage under VCACHE (outside the versioned "lantern-*" app caches, so updates keep them);
  // sw.js serves them with byte ranges, also offline. lantern.downloads lists {id: {url, label, bytes, at}}.
  const VCACHE = "offline-videos-v1";
  const canDownload = "caches" in window && "serviceWorker" in navigator && /^https?:$/.test(location.protocol);
  let downloads = (() => { const d = S.load("downloads", {}); return d && typeof d === "object" && !Array.isArray(d) ? d : {}; })();
  const saveDownloads = () => S.save("downloads", downloads);
  const activeDownloads = {}; // id -> { loaded, total, label, controller }
  const blockedDownloads = new Set(); // ids whose host refused a CORS read during this visit
  const dlListeners = new Set();
  const dlNotify = () => dlListeners.forEach((f) => f());
  const fmtMB = (b) => { const mb = b / 1048576; return (mb >= 100 ? Math.round(mb) : mb.toFixed(1)) + " MB"; };
  const isDownloaded = (id) => !!downloads[id];
  const tellWorker = () => { const sw = navigator.serviceWorker && navigator.serviceWorker.controller; if (sw) sw.postMessage({ type: "offline-videos-changed" }); };
  function downloadQuality(v, current) {
    const Q = Array.isArray(v.qualities) && v.qualities.length ? v.qualities : [{ label: "", url: v.videoUrl }];
    return (current && Q.find((q) => q.url === current.url)) || Q.find((q) => q.url === v.videoUrl) || Q[0];
  }
  async function verifyDownloads() {
    if (!canDownload) return;
    try {
      const cache = await caches.open(VCACHE);
      let changed = false;
      for (const id of Object.keys(downloads)) {
        if (!VIDEO_BY_ID[id] || !(await cache.match(downloads[id].url))) { delete downloads[id]; changed = true; }
      }
      if (changed) { saveDownloads(); dlNotify(); }
    } catch (e) { /* storage unavailable: keep the list as it is */ }
  }
  // One GET (Range from `offset` when resuming). Content-Length is CORS-safelisted, so the size is readable.
  async function openVideoStream(url, offset, signal) {
    const ctrl = new AbortController();
    const stop = () => ctrl.abort();
    signal.addEventListener("abort", stop, { once: true });
    const res = await fetch(url, { mode: "cors", credentials: "omit", signal: ctrl.signal, headers: offset ? { Range: "bytes=" + offset + "-" } : {} });
    if (!res.ok || !res.body) { signal.removeEventListener("abort", stop); throw new Error("http"); }
    return {
      reader: res.body.getReader(), type: res.headers.get("content-type"),
      length: offset ? 0 : Number(res.headers.get("content-length")) || 0,
      skip: offset && res.status === 200 ? offset : 0, // server ignored Range: drop bytes we already have
      close() { signal.removeEventListener("abort", stop); ctrl.abort(); },
    };
  }
  // Some CDNs slow a long single download to a trickle; when the speed collapses (compared with the best
  // speed seen so far, so a steadily slow phone connection is left alone), reconnect from the last byte.
  // Only attempts that deliver nothing count towards giving up.
  function resumableBody(url, first, total, signal, onBytes) {
    let conn = first, offset = 0, stuck = 0, sinceConnect = 0, bestWindow = 0, windowStart = Date.now(), windowBytes = 0;
    const SLOW_MS = 8000, MAX_STUCK = 8;
    const reconnect = async () => {
      conn.close();
      stuck = sinceConnect ? 0 : stuck + 1;
      if (stuck > MAX_STUCK) throw new Error("http");
      if (stuck) await new Promise((r) => setTimeout(r, Math.min(15000, 1000 * stuck)));
      conn = await openVideoStream(url, offset, signal);
      sinceConnect = 0; windowStart = Date.now(); windowBytes = 0;
    };
    return new ReadableStream({
      async pull(ctl) {
        for (;;) {
          if (signal.aborted) throw new DOMException("Aborted", "AbortError");
          let step, timer = 0;
          try {
            step = await Promise.race([conn.reader.read(), new Promise((r) => { timer = setTimeout(() => r({ stalled: true }), SLOW_MS); })]);
          } catch (err) {
            if (signal.aborted) throw err;
            await reconnect(); continue; // network hiccup: resume
          } finally { clearTimeout(timer); }
          if (step.stalled) { await reconnect(); continue; }
          if (step.done) {
            if (total && offset < total) { await reconnect(); continue; } // ended early
            conn.close(); ctl.close(); return;
          }
          let chunk = step.value;
          if (conn.skip) {
            const drop = Math.min(conn.skip, chunk.byteLength);
            conn.skip -= drop; chunk = chunk.subarray(drop);
            if (!chunk.byteLength) continue;
          }
          offset += chunk.byteLength; windowBytes += chunk.byteLength; sinceConnect += chunk.byteLength; onBytes(chunk.byteLength);
          ctl.enqueue(chunk);
          if (Date.now() - windowStart > SLOW_MS) {
            const collapsed = bestWindow > 0 && windowBytes < bestWindow / 5 && (!total || total - offset > windowBytes);
            bestWindow = Math.max(bestWindow, windowBytes);
            windowStart = Date.now(); windowBytes = 0;
            if (collapsed) await reconnect();
          }
          return;
        }
      },
      cancel() { conn.close(); },
    });
  }
  async function startDownload(v, q) {
    if (activeDownloads[v.id] || downloads[v.id]) return;
    const controller = new AbortController();
    const job = activeDownloads[v.id] = { loaded: 0, total: (q.sizeMB || 0) * 1048576, label: q.label, controller };
    dlNotify();
    try {
      if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
      if (navigator.storage && navigator.storage.estimate) {
        const est = await navigator.storage.estimate();
        if (est.quota && job.total && est.quota - (est.usage || 0) < job.total * 1.05) throw new Error("space");
      }
      const first = await openVideoStream(q.url, 0, controller.signal);
      const len = first.length;
      if (len) job.total = len;
      let last = 0;
      const body = resumableBody(q.url, first, len, controller.signal, (n) => {
        job.loaded += n;
        const now = Date.now();
        if (now - last > 300) { last = now; dlNotify(); }
      });
      const headers = { "Content-Type": first.type || "video/mp4" };
      if (len) headers["Content-Length"] = String(len);
      const cache = await caches.open(VCACHE);
      await cache.put(q.url, new Response(body, { headers }));
      if (len && job.loaded < len) throw new Error("incomplete");
      downloads[v.id] = { url: q.url, label: q.label, bytes: job.loaded || len, at: Date.now() };
      saveDownloads();
      delete activeDownloads[v.id];
      tellWorker();
      toast("İndirildi: " + v.title);
    } catch (err) {
      delete activeDownloads[v.id];
      try { await (await caches.open(VCACHE)).delete(q.url); } catch (e) { /* nothing stored */ }
      if (controller.signal.aborted) {
        // cancelled by the reader: nothing to report
      } else if (err && err.name === "TypeError" && navigator.onLine && !job.loaded) {
        // online but the file could not be read at all: the host does not allow downloads from other sites (CORS)
        blockedDownloads.add(v.id);
        toast("Bu videonun sunucusu indirmeye izin vermiyor; internetle izleyebilirsin.");
      } else if (!(err && err.name === "AbortError")) {
        toast(err && (err.message === "space" || err.name === "QuotaExceededError") ? "Cihazda yeterli yer yok." : "İndirme tamamlanamadı. İnternetini kontrol edip tekrar dene.");
      }
    }
    dlNotify();
  }
  async function removeDownload(id) {
    const d = downloads[id];
    if (!d) return;
    try { await (await caches.open(VCACHE)).delete(d.url); } catch (e) { /* already gone */ }
    delete downloads[id]; saveDownloads(); tellWorker(); dlNotify();
  }
  verifyDownloads();

  // Shelves on #videos, in display order. Keep ids in sync with VIDEO_CATEGORIES in tools/video-content.mjs.
  const VIDEO_CATEGORIES = [
    { id: "fun", label: "Eğlenceli", note: "Gülümseten kısa animasyonlar" },
    { id: "adventure", label: "Macera ve fantastik", note: "Ejderhalar, sırlar ve masal dünyaları" },
    { id: "scifi", label: "Bilim kurgu", note: "Gelecek, robotlar ve tuhaf dünyalar" },
    { id: "real", label: "Gerçek hayat ve uzay", note: "Astronotlar ve bilim insanları anlatıyor" },
  ];
  const videoCategory = (v) => VIDEO_CATEGORIES.find((c) => c.id === v.category) || VIDEO_CATEGORIES[0];
  const levelRank = (id) => LEVELS.findIndex((l) => l.id === id);

  function videoCard(v) {
    return `<a class="video-card" href="#v.${esc(v.id)}">
        <div class="video-art" aria-hidden="true">${ICON.play}<span>İzle</span></div>
        <div class="video-card-body"><div class="card-top"><span class="lvl lvl-${esc(v.level)}">${esc(v.level)}</span><span>${videoTime(v.durationSeconds)}</span>${isDownloaded(v.id) ? `<span class="dl-badge">${ICON.download} İndirildi</span>` : ""}</div>
          <h3>${esc(v.title)}</h3><p class="by">${esc(v.creator)} · ${v.year}</p><p>${esc(v.summaryTr)}</p><span class="link">İzlemeye başla →</span></div>
      </a>`;
  }

  function viewVideos() {
    let current = "all";
    const shelves = VIDEO_CATEGORIES.map((c) => ({ ...c, list: VIDEOS.filter((v) => videoCategory(v).id === c.id)
      .sort((a, b) => levelRank(a.level) - levelRank(b.level) || a.durationSeconds - b.durationSeconds) })).filter((c) => c.list.length);
    $main.innerHTML = `<div class="lib-head video-head"><div><p class="eyebrow">İzleyerek öğren · ${VIDEOS.length} video</p><h1>Videolar</h1>
      <p class="lead">İngilizce kısa filmler ve videolar. Altyazıdaki kelimeye dokun; anlamını gör ve defterine kaydet.</p></div>
      ${canDownload ? `<button class="dl-tab" type="button" data-video-cat="downloads" aria-pressed="false" aria-controls="shelf-downloads-box">${ICON.download} İndirilenler <span class="chip-n" id="dl-count"></span></button>` : ""}</div>
      <div class="video-cats chips" role="group" aria-label="Video türü">
        <button class="chip" type="button" data-video-cat="all" aria-pressed="true">Tümü <span class="chip-n">${VIDEOS.length}</span></button>
        ${shelves.map((c) => `<button class="chip" type="button" data-video-cat="${c.id}" aria-pressed="false">${esc(c.label)} <span class="chip-n">${c.list.length}</span></button>`).join("")}
      </div>
      <div id="video-shelves">${shelves.map((c) => `<section class="video-shelf" data-shelf="${c.id}" aria-labelledby="shelf-${c.id}">
        <div class="section-head"><h2 id="shelf-${c.id}">${esc(c.label)}</h2><span>${esc(c.note)}</span></div>
        <div class="video-grid">${c.list.map(videoCard).join("")}</div></section>`).join("") || '<div class="empty"><h3>Henüz video yok</h3></div>'}
        ${canDownload ? '<section class="video-shelf" data-shelf="downloads" id="shelf-downloads-box" aria-labelledby="shelf-downloads" hidden></section>' : ""}</div>`;
    const dlShelf = document.getElementById("shelf-downloads-box");
    const drawDownloads = () => {
      if (!dlShelf || !dlShelf.isConnected) { dlListeners.delete(drawDownloads); return; }
      const saved = VIDEOS.filter((v) => isDownloaded(v.id)).sort((a, b) => downloads[b.id].at - downloads[a.id].at);
      const busy = VIDEOS.filter((v) => activeDownloads[v.id]);
      const total = saved.reduce((n, v) => n + (downloads[v.id].bytes || 0), 0);
      document.getElementById("dl-count").textContent = saved.length || "";
      dlShelf.innerHTML = `<div class="section-head"><h2 id="shelf-downloads">İndirilenler</h2><span>${saved.length ? `${saved.length} video · ${fmtMB(total)} · internetsiz izlenebilir` : "Bu cihaza kaydettiğin videolar"}</span></div>
        ${busy.map((v) => { const j = activeDownloads[v.id]; const pct = j.total ? Math.min(99, Math.floor(j.loaded / j.total * 100)) : 0;
          return `<p class="dl-line">${ICON.download} <b>${esc(v.title)}</b> indiriliyor · %${pct}</p>`; }).join("")}
        ${saved.length ? `<div class="video-grid">${saved.map((v) => `<div class="dl-item">${videoCard(v)}<button class="btn sm ghost dl-remove" type="button" data-dl-remove="${esc(v.id)}">${ICON.trash} Sil · ${fmtMB(downloads[v.id].bytes || 0)}</button></div>`).join("")}</div>`
          : busy.length ? "" : '<div class="empty"><h3>Henüz indirdiğin video yok</h3><p>Bir videonun sayfasındaki <b>İndir</b> düğmesine bas; video bu cihaza kaydedilir ve internetsiz de izlenir.</p></div>'}
        <p class="dl-note">Videolar yalnızca bu tarayıcıda saklanır. Tarayıcı verilerini silersen indirilenler de silinir.</p>`;
    };
    const select = (cat) => {
      current = cat;
      $main.querySelectorAll("[data-video-cat]").forEach((x) => x.setAttribute("aria-pressed", x.dataset.videoCat === current));
      $main.querySelectorAll(".video-shelf").forEach((s) => {
        s.hidden = s.dataset.shelf === "downloads" ? current !== "downloads" : (current !== "all" && s.dataset.shelf !== current);
      });
    };
    $main.querySelector(".video-cats").addEventListener("click", (ev) => {
      const b = ev.target.closest("[data-video-cat]");
      if (b) select(b.dataset.videoCat);
    });
    if (dlShelf) {
      $main.querySelector(".dl-tab").addEventListener("click", () => select(current === "downloads" ? "all" : "downloads"));
      dlShelf.addEventListener("click", (ev) => {
        const b = ev.target.closest("[data-dl-remove]");
        if (b) removeDownload(b.dataset.dlRemove);
      });
      dlListeners.add(drawDownloads);
      drawDownloads();
      verifyDownloads();
    }
  }

  function viewVideo(id) {
    const v = VIDEO_BY_ID[id];
    if (!v) {
      $main.innerHTML = '<div class="empty"><h3>Video bulunamadı</h3><a class="btn" href="#videos">Videolara dön</a></div>';
      return;
    }
    $main.innerHTML = `<article class="video-view" id="video-view" data-id="${esc(v.id)}">
      <nav class="crumbs" aria-label="İçerik yolu"><a href="#videos">Videolar</a><span>›</span><span>${esc(v.title)}</span></nav>
      <header class="reader-head"><div class="card-top"><span class="lvl lvl-${esc(v.level)}">${esc(v.level)}</span><span>${esc(videoCategory(v).label)} · Altyazı destekli · ${videoTime(v.durationSeconds)}</span></div>
        <h1>${esc(v.title)}</h1><p class="by">${esc(v.creator)} · ${v.year}</p><p class="lead">${esc(v.summaryTr)}</p>
        <p class="video-level-note">${esc(v.levelNoteTr)}</p>${v.advisoryTr ? `<p class="video-advisory">${esc(v.advisoryTr)}</p>` : ""}</header>
      <div class="video-stage" id="video-stage"><div class="video-frame" id="video-frame"><div class="video-placeholder" id="video-placeholder"><span aria-hidden="true">${ICON.play}</span><p>İngilizce kısa film · ${videoTime(v.durationSeconds)}</p>
        <button class="btn primary" id="video-start" type="button">Videoyu başlat</button><p class="video-load-note">${isDownloaded(v.id) ? "Bu video cihazına indirildi; internetsiz de izleyebilirsin." : "Video için internet bağlantısı gerekir. Oynatma başladığında yüklenir."}</p></div>
        <video id="video-player" playsinline webkit-playsinline preload="none" aria-label="${esc(v.title)} İngilizce kısa film" hidden></video>
        <div class="reader-text video-captions" id="video-captions" lang="en" aria-describedby="caption-help"></div>
        <div class="seek-flash seek-back" id="seek-back" hidden aria-hidden="true">−5 sn</div>
        <div class="seek-flash seek-fwd" id="seek-fwd" hidden aria-hidden="true">+5 sn</div>
        <div class="fs-hint" id="fs-hint" hidden>Daha büyük görüntü için telefonu yan çevir</div>
        <div class="video-bar" id="video-bar" hidden>
          <button type="button" class="vb-btn" id="vb-play" aria-label="Oynat">${ICON.play}</button>
          <input type="range" id="vb-seek" min="0" max="1000" value="0" step="1" aria-label="Videoda konum">
          <span class="vb-time" id="vb-time">0:00 / ${videoTime(v.durationSeconds)}</span>
          <button type="button" class="vb-btn vb-cc" id="vb-cc" aria-label="Ayarlar" aria-expanded="false" aria-controls="cap-settings">${ICON.gear}</button>
          <div class="vb-vol" id="vb-vol">
            <button type="button" class="vb-btn" id="vb-mute" aria-label="Ses ayarı" aria-haspopup="true" aria-expanded="false" aria-controls="vol-pop">${ICON.speak}</button>
            <div class="vol-pop" id="vol-pop" role="group" aria-label="Ses ayarı" hidden>
              <div class="vol-row" id="vol-row"><input type="range" id="vol-range" min="0" max="100" step="1" value="100" aria-label="Ses düzeyi"><output id="vol-val">100%</output></div>
              <button type="button" class="vol-mute" id="vol-mute" aria-pressed="false">Sesi kapat</button>
              <p class="vol-note" id="vol-note" hidden>Bu cihazda ses düzeyi telefonun ses tuşlarıyla ayarlanır.</p>
            </div>
          </div>
          <button type="button" class="vb-btn" id="vb-fs" aria-label="Tam ekran">${ICON.expand}</button>
        </div>
        <div class="cap-settings" id="cap-settings" role="group" aria-label="Video ayarları" hidden>
          <div class="cs-title">Ayarlar</div>
          <div class="cs-row" id="cs-quality-row" hidden><label for="cs-quality">Görüntü</label><select id="cs-quality"></select></div>
          <p class="cs-hint" id="cs-quality-note" hidden></p>
          <div class="cs-row" id="cs-inpage-row" hidden><span>Tam ekran</span><button type="button" class="cs-switch" id="cs-inpage-fs">Cihazın kendi oynatıcısı (altyazıya dokunulamaz)</button></div>
          <div class="cs-row" id="cs-fit-row"><span>Görüntü</span><button type="button" class="cs-switch" id="cs-fit" role="switch" aria-label="Ekranı kapla" aria-checked="false"><span class="cs-knob"></span><span class="cs-switch-label">Sığdır</span></button></div>
          <p class="cs-hint" id="cs-fit-note">Tam ekranda kenarlardaki siyah boşluğu kaldırır; görüntünün üst-alt kenarlarından biraz kırpar.</p>
          <div class="cs-sep" role="separator"></div>
          <div class="cs-sub">Altyazı</div>
          <div class="cs-row"><span>Görünüm</span><button type="button" class="cs-switch" id="cs-on" role="switch" aria-label="Altyazı" aria-checked="true"><span class="cs-knob"></span><span class="cs-switch-label">Açık</span></button></div>
          <div class="cs-row"><span>Yazı boyutu</span><div class="cs-size"><button type="button" id="cs-smaller" aria-label="Altyazıyı küçült">A−</button><output id="cs-size-val">100%</output><button type="button" id="cs-bigger" aria-label="Altyazıyı büyüt">A+</button></div></div>
          <div class="cs-row"><label for="cs-alpha">Arka plan</label><input type="range" id="cs-alpha" min="0" max="100" step="5"><output id="cs-alpha-val">72%</output></div>
          <p class="cs-hint">Sola çekince arka plan saydamlaşır, görüntü öne çıkar.</p>
          <button type="button" class="cs-reset" id="cs-reset">Varsayılana dön</button>
        </div></div></div>
      <p class="video-status" id="video-status" role="status" aria-live="polite">Altyazı videonun üzerinde görünür; bir kelimeye dokununca anlamı açılır.</p>
      ${canDownload ? '<div class="video-dl" id="video-dl" aria-live="polite"></div>' : ""}
      <section class="panel caption-panel" aria-labelledby="caption-heading"><div class="section-head"><h2 id="caption-heading">İngilizce altyazı</h2><span id="caption-time"></span></div>
        <p class="sub" id="caption-help">Altyazı videonun üzerinde görünür. Bir kelimeye dokunduğunda video durur ve Türkçe anlamı açılır; oynat düğmesiyle devam edebilirsin. Görüntü kalitesi ve altyazı görünümü için Ayarlar düğmesini kullan.</p>
        <div class="caption-controls"><button class="btn sm" id="caption-prev" type="button" aria-label="Önceki altyazı">← Önceki</button>
          <label for="caption-select">Konuşma <select id="caption-select">${v.captions.map((c, i) => `<option value="${i}">${i + 1} / ${v.captions.length} · ${videoTime(c.start)}</option>`).join("")}</select></label>
          <button class="btn sm" id="caption-next" type="button" aria-label="Sonraki altyazı">Sonraki →</button>
          <button class="btn sm" id="caption-replay" type="button">${ICON.play} Bu konuşmayı dinle</button>
          <button class="btn sm" id="video-fullscreen" type="button" disabled>Tam ekran</button>
          <button class="btn sm" id="cap-settings-btn" type="button" aria-expanded="false" aria-controls="cap-settings">${ICON.gear} Ayarlar</button></div>
      </section>
      <p class="video-credit">Film: <a id="video-source" href="${esc(v.source.watchUrl || v.source.url)}" target="_blank" rel="noopener">${esc(v.source.name)} · Resmî sayfada izle</a>.
        ${esc(v.source.credit)} · <a href="${esc(v.source.licenseUrl)}" target="_blank" rel="noopener">${esc(v.source.license)}</a>.
        <a href="${esc(v.subtitleSource.url)}" target="_blank" rel="noopener">${esc(v.subtitleSource.name)}</a> · ${v.subtitleSource.licenseUrl ? `<a href="${esc(v.subtitleSource.licenseUrl)}" target="_blank" rel="noopener">${esc(v.subtitleSource.license)}</a>` : esc(v.subtitleSource.license)}. ${v.subtitleSource.credit ? esc(v.subtitleSource.credit) + ". " : ""}${v.subtitleSource.changeNoteTr ? esc(v.subtitleSource.changeNoteTr) + " " : ""}Film, kapanış jeneriğiyle birlikte oynatılır. Türkçe öğrenme açıklamaları Lantern English tarafından hazırlanmıştır.</p>
    </article>`;
    const player = document.getElementById("video-player");
    const captions = document.getElementById("video-captions");
    const select = document.getElementById("caption-select");
    const prev = document.getElementById("caption-prev");
    const next = document.getElementById("caption-next");
    const replay = document.getElementById("caption-replay");
    const status = document.getElementById("video-status");
    let selected = 0, displayed = null, pendingSeek = null, disposed = false, switching = null;

    function showCaption(index) {
      if (disposed || displayed === index) return;
      Tip.hide(); displayed = index; captions.dataset.cue = String(index);
      const cue = v.captions[index];
      if (cue) {
        selected = index; select.value = String(index);
        captions.innerHTML = `<p>${renderInline(cue.text, [])}</p>`;
        captions.querySelectorAll(".w").forEach((word) => {
          word.tabIndex = 0; word.setAttribute("role", "button"); word.setAttribute("aria-label", word.textContent + " · Türkçe anlamını gör");
        });
        document.getElementById("caption-time").textContent = videoTime(cue.start) + "–" + videoTime(cue.end);
        markSaved(captions);
      } else {
        captions.innerHTML = "";
        document.getElementById("caption-time").textContent = "Bu sahnede konuşma yok";
      }
      prev.disabled = selected === 0; next.disabled = selected === v.captions.length - 1;
    }

    function syncCaptions() {
      if (disposed || switching) return;
      const now = player.currentTime;
      showCaption(v.captions.findIndex((cue) => cue.start <= now && now < cue.end));
    }

    function seekCaption(index) {
      if (index < 0 || index >= v.captions.length) return;
      if (switching) switching.at = v.captions[index].start;
      showCaption(index);
      if (player.getAttribute("src")) {
        const at = v.captions[index].start;
        if (player.readyState >= 1) player.currentTime = at;
        else pendingSeek = at;
      }
    }

    const stage = document.getElementById("video-stage");
    const fsBtn = document.getElementById("video-fullscreen");
    const bar = document.getElementById("video-bar");
    const vbPlay = document.getElementById("vb-play"), vbSeek = document.getElementById("vb-seek"), vbTime = document.getElementById("vb-time");
    const vbMute = document.getElementById("vb-mute"), vbFs = document.getElementById("vb-fs");
    const fsAllowed = document.fullscreenEnabled !== false && document.webkitFullscreenEnabled !== false;
    const requestFs = fsAllowed ? (stage.requestFullscreen || stage.webkitRequestFullscreen) : null;
    const fsElement = () => document.fullscreenElement || document.webkitFullscreenElement || null;
    let pseudoFs = false, seeking = false;
    player.setAttribute("disablepictureinpicture", "");
    const isFs = () => pseudoFs || fsElement() === stage;
    const frameEl = document.getElementById("video-frame");
    let lockedLandscape = false;
    const isTouch = !!(window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
    // portrait fullscreen without a landscape lock: turn the picture so it fills the screen (touch devices only)
    function syncRotate() {
      const portrait = window.innerHeight > window.innerWidth;
      // decided from the real screen shape (locks are ignored by some foldables/tablets); phones only
      const want = isFs() && portrait && isTouch && Math.min(window.innerWidth, window.innerHeight) < 600;
      const host = want ? frameEl : (isFs() ? stage : document.body);
      const same = stage.classList.contains("rot90") === want && Tip.el.parentElement === host;
      const hintEl = document.getElementById("fs-hint");
      if (hintEl && !portrait) hintEl.hidden = true;
      if (same) return; // e.g. the mobile address bar showing/hiding must not close a pinned tooltip
      stage.classList.toggle("rot90", want);
      Tip.rotFrame = want ? frameEl : null;
      Tip.el.style.position = want ? "absolute" : "";
      // the dictionary tooltip must live inside the fullscreen element (and the rotated frame) to be visible
      host.appendChild(Tip.el);
      Tip.hide();
    }
    window.addEventListener("resize", syncRotate);
    function syncFsUi() {
      if (fsElement() === stage) pseudoFs = false; // real fullscreen arrived after the fallback fired
      const on = isFs();
      syncRotate();
      stage.classList.toggle("pseudo-fs", pseudoFs);
      stage.classList.toggle("real-fs", fsElement() === stage);
      if (!on) unlockOrientation();
      document.body.classList.toggle("video-fs-open", on);
      fsBtn.textContent = on ? "Tam ekrandan çık" : "Tam ekran";
      vbFs.innerHTML = on ? ICON.shrink : ICON.expand;
      vbFs.setAttribute("aria-label", on ? "Tam ekrandan çık" : "Tam ekran");
      const hint = document.getElementById("fs-hint");
      clearTimeout(syncFsUi.hintTimer);
      if (on && window.matchMedia && window.matchMedia("(orientation: portrait)").matches) {
        hint.textContent = stage.classList.contains("rot90") ? "Telefonu yan çevirirsen görüntü dik durur" : "Daha büyük görüntü için telefonu yan çevir";
        hint.hidden = false;
        syncFsUi.hintTimer = setTimeout(() => { hint.hidden = true; }, 4500);
      } else hint.hidden = true;
    }
    function lockLandscape() {
      try {
        if (screen.orientation && screen.orientation.lock) {
          screen.orientation.lock("landscape").then(() => { lockedLandscape = true; syncRotate(); }, () => { lockedLandscape = false; syncRotate(); });
        } else syncRotate();
      } catch (e) { syncRotate(); }
    }
    function unlockOrientation() {
      lockedLandscape = false;
      try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch (e) { /* not supported */ }
    }
    function enterPseudoFs() { pseudoFs = true; syncFsUi(); }
    // iPhone Safari cannot fullscreen an ordinary element, but can fullscreen the <video> itself.
    // Captions are then supplied as a WebVTT track so they still show (read-only) in the native player.
    const nativeFs = !requestFs && typeof player.webkitEnterFullscreen === "function";
    let vttUrl = null;
    function vttTime(sec) {
      const ms = Math.round(sec * 1000), p = (n, w) => String(n).padStart(w, "0");
      return p(Math.floor(ms / 3600000), 2) + ":" + p(Math.floor(ms / 60000) % 60, 2) + ":" + p(Math.floor(ms / 1000) % 60, 2) + "." + p(ms % 1000, 3);
    }
    function ensureTrack() {
      if (player.querySelector("track")) return player.querySelector("track");
      const body = "WEBVTT\n\n" + v.captions.map((c, i) => (i + 1) + "\n" + vttTime(c.start) + " --> " + vttTime(c.end) + "\n" + c.text).join("\n\n") + "\n";
      vttUrl = URL.createObjectURL(new Blob([body], { type: "text/vtt" }));
      const tr = document.createElement("track");
      tr.kind = "subtitles"; tr.label = "English"; tr.srclang = "en"; tr.src = vttUrl;
      player.appendChild(tr);
      tr.track.mode = "hidden";
      return tr;
    }
    const onNativeBegin = () => { const t = player.querySelector("track"); if (t) t.track.mode = "showing"; };
    const onNativeEnd = () => { const t = player.querySelector("track"); if (t) t.track.mode = "hidden"; syncBar(); };
    player.addEventListener("webkitbeginfullscreen", onNativeBegin);
    player.addEventListener("webkitendfullscreen", onNativeEnd);
    function enterNativeFs() {
      if (!nativeFs || !player.getAttribute("src")) { enterPseudoFs(); return; }
      try { const tr = ensureTrack(); tr.track.mode = "showing"; player.webkitEnterFullscreen(); } catch (e) { enterPseudoFs(); }
    }
    function enterFs() {
      if (!requestFs) { enterPseudoFs(); return; }
      let r;
      try { r = requestFs.call(stage); } catch (e) { enterPseudoFs(); return; }
      let settled = false;
      if (r && r.then) r.then(() => { settled = true; lockLandscape(); }, () => { settled = true; enterPseudoFs(); }); else lockLandscape();
      // some in-app browsers accept the call and silently do nothing: fall back to the in-page mode
      setTimeout(() => { if (!disposed && !settled && !isFs()) enterPseudoFs(); }, 900);
    }
    function exitFs() {
      if (pseudoFs) { pseudoFs = false; syncFsUi(); }
      const f = document.exitFullscreen || document.webkitExitFullscreen;
      if (f && fsElement()) { const r = f.call(document); if (r && r.catch) r.catch(() => {}); }
      unlockOrientation();
    }
    const toggleFs = () => { if (isFs()) exitFs(); else enterFs(); };
    document.addEventListener("fullscreenchange", syncFsUi);
    document.addEventListener("webkitfullscreenchange", syncFsUi);
    fsBtn.addEventListener("click", toggleFs);
    vbFs.addEventListener("click", toggleFs);
    const onEscape = (ev) => {
      if (ev.key !== "Escape") return;
      const panel = document.getElementById("cap-settings"), vp = document.getElementById("vol-pop");
      if (panel && !panel.hidden) { panel.hidden = true; document.getElementById("vb-cc").setAttribute("aria-expanded", "false"); document.getElementById("cap-settings-btn").setAttribute("aria-expanded", "false"); document.getElementById("vb-cc").focus(); return; }
      if (vp && !vp.hidden) { vp.hidden = true; document.getElementById("vb-mute").setAttribute("aria-expanded", "false"); document.getElementById("vb-mute").focus(); return; }
      if (pseudoFs) exitFs();
    };
    document.addEventListener("keydown", onEscape);

    // controls fade out while playing and come back on touch / mouse move / keyboard
    let hideTimer = 0;
    const controlsPinned = () => !player.getAttribute("src") || player.paused || player.ended || !!switching ||
      !document.getElementById("cap-settings").hidden || !document.getElementById("vol-pop").hidden ||
      (bar.contains(document.activeElement) && document.activeElement.matches && document.activeElement.matches(":focus-visible"));
    function hideControls() {
      if (disposed || controlsPinned()) return;
      stage.classList.add("controls-hidden");
    }
    function showControls() {
      stage.classList.remove("controls-hidden");
      clearTimeout(hideTimer);
      if (!controlsPinned()) hideTimer = setTimeout(hideControls, 3000);
    }
    ["pointermove", "pointerdown", "touchstart", "keydown", "focusin"].forEach((n) => stage.addEventListener(n, showControls, { passive: true }));
    stage.addEventListener("pointercancel", () => { lastTap = null; });
    ["play", "playing", "pause", "ended"].forEach((n) => player.addEventListener(n, showControls));

    // custom controls (native controls cannot show our captions in fullscreen)
    const duration = () => (isFinite(player.duration) && player.duration > 0 ? player.duration : v.durationSeconds);
    function syncBar() {
      const d = duration(), t = switching ? switching.at : (player.currentTime || 0);
      if (!seeking) vbSeek.value = String(Math.round((t / d) * 1000));
      vbTime.textContent = videoTime(t) + " / " + videoTime(d);
      vbSeek.setAttribute("aria-valuetext", vbTime.textContent);
      vbPlay.innerHTML = player.paused ? ICON.play : ICON.pause;
      vbPlay.setAttribute("aria-label", player.paused ? "Oynat" : "Duraklat");
      const silent = player.muted || (volumeSettable && player.volume === 0);
      vbMute.innerHTML = silent ? ICON.mute : ICON.speak;
      vbMute.setAttribute("aria-label", silent ? "Ses kapalı, ses ayarını aç" : "Ses ayarı");
      vbMute.classList.toggle("is-muted", silent);
      volMute.textContent = player.muted ? "Sesi aç" : "Sesi kapat";
      volMute.setAttribute("aria-pressed", String(!!player.muted));
      const level = player.muted ? 0 : Math.round(player.volume * 100);
      if (document.activeElement !== volRange) volRange.value = String(level);
      volVal.textContent = (volumeSettable ? level : (player.muted ? 0 : 100)) + "%";
    }
    function togglePlay() {
      if (!player.getAttribute("src")) { startVideo(); return; }
      if (player.paused) { const r = player.play(); if (r && r.catch) r.catch(() => {}); } else player.pause();
    }
    vbPlay.addEventListener("click", togglePlay);

    // ±5 s: arrow keys / double tap on the left or right half of the picture
    const SEEK_STEP = 5;
    const flashEls = { back: document.getElementById("seek-back"), fwd: document.getElementById("seek-fwd") };
    function flashSeek(dir, text) {
      const el = dir < 0 ? flashEls.back : flashEls.fwd;
      el.textContent = text;
      el.hidden = false;
      el.classList.remove("on"); void el.offsetWidth; el.classList.add("on");
      clearTimeout(el._t);
      el._t = setTimeout(() => { el.hidden = true; el.classList.remove("on"); }, 650);
    }
    function seekBy(delta) {
      if (!player.getAttribute("src")) return false;
      const d = duration();
      const base = switching ? switching.at : (pendingSeek !== null ? pendingSeek : (player.currentTime || 0));
      const at = Math.min(Math.max(0, base + delta), Math.max(0, d - 0.05));
      if (switching) switching.at = at;
      else if (player.readyState >= 1) { try { player.currentTime = at; } catch (err) { pendingSeek = at; } }
      else pendingSeek = at;
      syncCaptions(); syncBar(); showControls();
      flashSeek(delta < 0 ? -1 : 1, (delta < 0 ? "−" : "+") + Math.abs(delta) + " sn");
      return true;
    }
    const onVideoKey = (ev) => {
      if (ev.defaultPrevented || ev.ctrlKey || ev.altKey || ev.metaKey) return;
      const t = ev.target;
      if (ev.key !== "ArrowLeft" && ev.key !== "ArrowRight" && ev.key !== " " && ev.code !== "Space") return;
      if (ev.repeat && (ev.key === " " || ev.code === "Space")) { ev.preventDefault(); return; }
      // ignore keys while the page shows something else of the video view, e.g. the player is scrolled away
      if (!isFs()) { const r = stage.getBoundingClientRect(); if (r.bottom < 0 || r.top > window.innerHeight) return; }
      const panelOpen = !document.getElementById("cap-settings").hidden || !document.getElementById("vol-pop").hidden;
      const tag = t && t.tagName;
      if (tag === "TEXTAREA" || tag === "SELECT" || (t && t.isContentEditable)) return;
      if (tag === "INPUT" && t.type !== "button" && t.id !== "vb-seek") return; // sliders keep their own arrow keys
      if (ev.key === "ArrowLeft" || ev.key === "ArrowRight") {
        if (panelOpen) return;
        if (seekBy(ev.key === "ArrowLeft" ? -SEEK_STEP : SEEK_STEP)) ev.preventDefault();
      } else if (ev.key === " " || ev.code === "Space") {
        if (t && t.closest && t.closest("button, a, summary, [role=button]")) return; // let a focused control handle its own Space
        ev.preventDefault();
        togglePlay();
        showControls();
      }
    };
    document.addEventListener("keydown", onVideoKey);
    let lastTap = null;
    frameEl.addEventListener("pointerup", (ev) => {
      if (ev.pointerType !== "touch" || !player.getAttribute("src")) return;
      if (ev.target.closest && ev.target.closest(".video-captions p, .video-bar, .cap-settings, .vol-pop, .tip, button, input, select, a")) { lastTap = null; return; }
      const rect = frameEl.getBoundingClientRect();
      // when the frame is rotated, the picture's horizontal axis runs down the screen
      const frac = stage.classList.contains("rot90") ? (ev.clientY - rect.top) / rect.height : (ev.clientX - rect.left) / rect.width;
      const now = Date.now();
      if (lastTap && now - lastTap.t < 380 && Math.abs(ev.clientX - lastTap.x) < 90 && Math.abs(ev.clientY - lastTap.y) < 90) {
        lastTap = null;
        seekBy(frac < 0.5 ? -SEEK_STEP : SEEK_STEP);
      } else lastTap = { t: now, x: ev.clientX, y: ev.clientY };
    });

    vbSeek.addEventListener("input", () => {
      seeking = true;
      const at = (Number(vbSeek.value) / 1000) * duration();
      vbTime.textContent = videoTime(at) + " / " + videoTime(duration());
    });
    vbSeek.addEventListener("change", () => {
      const at = (Number(vbSeek.value) / 1000) * duration();
      seeking = false;
      if (player.readyState >= 1) player.currentTime = at; else pendingSeek = at;
      syncCaptions(); syncBar();
    });
    ["timeupdate", "play", "pause", "volumechange", "loadedmetadata", "seeked", "ended"].forEach((n) => player.addEventListener(n, syncBar));

    // picture quality: user-selectable, remembered; keeps position and play state when switched
    const QUALS = Array.isArray(v.qualities) ? v.qualities : [];
    const qRow = document.getElementById("cs-quality-row");
    const qSel = document.getElementById("cs-quality");
    const qNote = document.getElementById("cs-quality-note");
    const saveData = !!(navigator.connection && navigator.connection.saveData);
    let curQ = QUALS.find((q) => q.url === v.videoUrl) || QUALS[0] || null;
    const wanted = QUALS.find((q) => q.label === prefs.vq) || (saveData && QUALS.find((q) => q.label === "360p")) || null;
    if (wanted) curQ = wanted;
    // a downloaded copy wins, so it plays from this device (also offline)
    const offlineQ = downloads[v.id] && QUALS.find((q) => q.url === downloads[v.id].url);
    if (offlineQ) curQ = offlineQ;
    const currentSrc = () => (curQ ? curQ.url : downloads[v.id] ? downloads[v.id].url : v.videoUrl);
    if (QUALS.length > 1) {
      qSel.innerHTML = QUALS.slice().reverse().map((q) => `<option value="${esc(q.label)}">${esc(q.label)}${q.sizeMB ? " · ~" + q.sizeMB + " MB" : ""}</option>`).join("");
      qSel.value = curQ.label;
      qRow.hidden = false;
      qNote.hidden = false;
      qNote.textContent = "Yüksek kalite daha net görüntü, düşük kalite daha az veri demektir. Kalite değişince video kaldığı yerden devam eder.";
      qSel.addEventListener("change", () => {
        const q = QUALS.find((x) => x.label === qSel.value);
        if (!q || q === curQ) return;
        const previousQ = curQ;
        curQ = q;
        if (!player.getAttribute("src")) { prefs.vq = q.label; savePrefs(); return; } // not started yet: used on start
        // keep the exact position and play state across the source switch
        const at = switching ? switching.at : (player.currentTime || 0);
        const resume = switching ? switching.resume : (!player.paused && !player.ended);
        const token = {};
        switching = { at, resume, token };
        status.textContent = "Kalite değişiyor: " + q.label + "…";
        const restore = () => {
          if (disposed || !switching || switching.token !== token) return;
          const target = switching && switching.token === token ? switching.at : at;
          if (Math.abs((player.currentTime || 0) - target) > 1) { try { player.currentTime = target; } catch (err) { /* retried on canplay */ } }
        };
        const abort = () => {
          player.removeEventListener("loadedmetadata", restore);
          player.removeEventListener("canplay", finish);
          if (disposed || !switching || switching.token !== token) return;
          switching = null;
          curQ = previousQ; qSel.value = previousQ.label;
          status.textContent = "Bu kalite yüklenemedi; önceki kaliteye dönüldü.";
          player.src = previousQ.url + (at > 0.5 ? "#t=" + at.toFixed(2) : "");
          syncCaptions(); syncBar();
        };
        const finish = () => {
          player.removeEventListener("loadedmetadata", restore);
          player.removeEventListener("canplay", finish);
          player.removeEventListener("error", abort);
          if (disposed || !switching || switching.token !== token) return;
          prefs.vq = q.label; savePrefs();
          restore();
          switching = null;
          if (resume) { const r = player.play(); if (r && r.catch) r.catch(() => {}); }
          status.textContent = "Görüntü kalitesi: " + q.label;
          syncCaptions(); syncBar();
        };
        player.addEventListener("loadedmetadata", restore);
        player.addEventListener("canplay", finish);
        player.addEventListener("error", abort, { once: true });
        player.preload = "auto"; // also load while paused so the frame and position are ready
        player.src = at > 0.5 ? q.url + "#t=" + at.toFixed(2) : q.url;
      });
    }

    // download for offline viewing: saves the picture quality that is selected in Ayarlar
    const dlBox = document.getElementById("video-dl");
    const drawDl = () => {
      if (!dlBox || !dlBox.isConnected) { dlListeners.delete(drawDl); return; }
      const d = downloads[v.id], job = activeDownloads[v.id];
      if (job) {
        const pct = job.total ? Math.min(99, Math.floor(job.loaded / job.total * 100)) : 0;
        dlBox.innerHTML = `<div class="dl-progress" role="progressbar" aria-label="İndirme" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><span style="width:${pct}%"></span></div>
          <span class="dl-text">İndiriliyor · %${pct}${job.total ? " · " + fmtMB(job.loaded) + " / " + fmtMB(job.total) : ""}</span>
          <button class="btn sm ghost" type="button" data-dl="cancel">İptal</button>`;
      } else if (d) {
        dlBox.innerHTML = `<span class="dl-done">${ICON.check} İndirildi${d.label ? " · " + esc(d.label) : ""} · ${fmtMB(d.bytes || 0)}</span>
          <span class="dl-text">İnternetsiz de izleyebilirsin.</span>
          <button class="btn sm ghost" type="button" data-dl="remove">${ICON.trash} Sil</button>`;
      } else if (blockedDownloads.has(v.id)) {
        dlBox.innerHTML = '<span class="dl-text">Bu videonun sunucusu indirmeye izin vermiyor; internetle izleyebilirsin.</span>';
      } else {
        const q = downloadQuality(v, curQ);
        dlBox.innerHTML = `<button class="btn sm" type="button" data-dl="start">${ICON.download} İndir${q.label ? " · " + esc(q.label) : ""}${q.sizeMB ? " · ~" + q.sizeMB + " MB" : ""}</button>
          <span class="dl-text">İnternetsiz izlemek için bu cihaza kaydet. Kaliteyi Ayarlar'dan seçebilirsin.</span>`;
      }
    };
    if (dlBox) {
      dlBox.addEventListener("click", (ev) => {
        const b = ev.target.closest("[data-dl]");
        if (!b) return;
        if (b.dataset.dl === "start") startDownload(v, downloadQuality(v, curQ));
        if (b.dataset.dl === "cancel" && activeDownloads[v.id]) activeDownloads[v.id].controller.abort();
        if (b.dataset.dl === "remove") removeDownload(v.id);
      });
      if (QUALS.length > 1) qSel.addEventListener("change", drawDl);
      dlListeners.add(drawDl);
      drawDl();
    }

    // subtitle size + background opacity (remembered per device)
    const CAP_SCALES = [0.7, 0.85, 1, 1.2, 1.45, 1.8];
    const capPrefs = Object.assign({ scale: 1, alpha: 72, on: true }, prefs.cap || {});
    const csOn = document.getElementById("cs-on");
    const capPanel = document.getElementById("cap-settings");
    const capBtns = [document.getElementById("vb-cc"), document.getElementById("cap-settings-btn")];
    const csAlpha = document.getElementById("cs-alpha");
    function applyCap(save) {
      if (CAP_SCALES.indexOf(capPrefs.scale) < 0) capPrefs.scale = 1;
      capPrefs.alpha = Math.min(100, Math.max(0, Math.round(Number(capPrefs.alpha) || 0)));
      stage.style.setProperty("--cap-scale", String(capPrefs.scale));
      stage.style.setProperty("--cap-alpha", String(capPrefs.alpha / 100));
      document.getElementById("cs-size-val").textContent = Math.round(capPrefs.scale * 100) + "%";
      document.getElementById("cs-alpha-val").textContent = capPrefs.alpha + "%";
      csAlpha.value = String(capPrefs.alpha);
      capPrefs.on = capPrefs.on !== false;
      stage.classList.toggle("captions-off", !capPrefs.on);
      csOn.setAttribute("aria-checked", String(capPrefs.on));
      csOn.querySelector(".cs-switch-label").textContent = capPrefs.on ? "Açık" : "Kapalı";
      ["cs-smaller", "cs-bigger", "cs-alpha"].forEach((id) => { if (!capPrefs.on) document.getElementById(id).disabled = true; });
      document.getElementById("cs-smaller").disabled = CAP_SCALES.indexOf(capPrefs.scale) === 0;
      document.getElementById("cs-bigger").disabled = CAP_SCALES.indexOf(capPrefs.scale) === CAP_SCALES.length - 1;
      csAlpha.disabled = false;
      if (!capPrefs.on) { document.getElementById("cs-smaller").disabled = true; document.getElementById("cs-bigger").disabled = true; csAlpha.disabled = true; }
      if (save) { prefs.cap = { scale: capPrefs.scale, alpha: capPrefs.alpha, on: capPrefs.on }; savePrefs(); }
    }
    function setCapPanel(open) {
      if (open) Tip.hide();
      capPanel.hidden = !open;
      capBtns.forEach((b) => b.setAttribute("aria-expanded", String(open)));
      showControls();
    }
    capBtns.forEach((b) => b.addEventListener("click", (ev) => { ev.stopPropagation(); setCapPanel(capPanel.hidden); }));
    capPanel.addEventListener("click", (ev) => ev.stopPropagation());
    function onDocClickCap() { if (!capPanel.hidden) setCapPanel(false); }
    document.addEventListener("click", onDocClickCap);
    document.getElementById("cs-smaller").addEventListener("click", () => { capPrefs.scale = CAP_SCALES[Math.max(0, CAP_SCALES.indexOf(capPrefs.scale) - 1)]; applyCap(true); });
    document.getElementById("cs-bigger").addEventListener("click", () => { capPrefs.scale = CAP_SCALES[Math.min(CAP_SCALES.length - 1, CAP_SCALES.indexOf(capPrefs.scale) + 1)]; applyCap(true); });
    csAlpha.addEventListener("input", () => { capPrefs.alpha = Number(csAlpha.value); applyCap(true); });
    const csFit = document.getElementById("cs-fit");
    let videoFill = typeof prefs.videoFill === "boolean" ? prefs.videoFill : isTouch;
    function applyFit(save) {
      stage.classList.toggle("video-fill", videoFill);
      csFit.setAttribute("aria-checked", String(videoFill));
      csFit.querySelector(".cs-switch-label").textContent = videoFill ? "Ekranı kapla" : "Sığdır";
      if (save) { prefs.videoFill = videoFill; savePrefs(); }
    }
    csFit.addEventListener("click", () => { videoFill = !videoFill; applyFit(true); });
    applyFit(false);
    document.getElementById("cs-reset").addEventListener("click", () => {
      capPrefs.scale = 1; capPrefs.alpha = 72; capPrefs.on = true; applyCap(true);
      videoFill = isTouch; applyFit(true);
    });
    const toggleCaptions = () => { capPrefs.on = !capPrefs.on; Tip.hide(); applyCap(true); };
    csOn.addEventListener("click", toggleCaptions);
    applyCap(false);

    // volume: popover with slider + mute (phones that lock the volume only get mute)
    const volPop = document.getElementById("vol-pop"), volRange = document.getElementById("vol-range");
    const volVal = document.getElementById("vol-val"), volMute = document.getElementById("vol-mute");
    let volumeSettable = true;
    try {
      const keep = player.volume; player.volume = keep === 0.5 ? 0.4 : 0.5; volumeSettable = player.volume !== keep; player.volume = keep;
    } catch (err) { volumeSettable = false; }
    document.getElementById("vol-row").hidden = !volumeSettable;
    document.getElementById("vol-note").hidden = volumeSettable;
    function applyStoredVolume() {
      if (volumeSettable && typeof prefs.vol === "number") player.volume = Math.min(1, Math.max(0, prefs.vol));
      player.muted = !!prefs.muted;
    }
    function setVolPop(open) {
      if (open) Tip.hide();
      stage.classList.toggle("vol-open", open);
      volPop.hidden = !open;
      vbMute.setAttribute("aria-expanded", String(open));
      if (open && !capPanel.hidden) setCapPanel(false);
      showControls();
    }
    vbMute.addEventListener("click", (ev) => { ev.stopPropagation(); setVolPop(volPop.hidden); });
    volPop.addEventListener("click", (ev) => ev.stopPropagation());
    function onDocClickVol() { if (!volPop.hidden) setVolPop(false); }
    document.addEventListener("click", onDocClickVol);
    volRange.addEventListener("input", () => {
      const level = Number(volRange.value) / 100;
      player.volume = level;
      player.muted = level === 0;
      prefs.vol = level; prefs.muted = player.muted; savePrefs();
      syncBar();
    });
    volMute.addEventListener("click", () => {
      player.muted = !player.muted;
      if (!player.muted && volumeSettable && player.volume === 0) player.volume = 0.5;
      prefs.muted = player.muted; if (volumeSettable) prefs.vol = player.volume; savePrefs();
      syncBar();
    });
    capBtns.forEach((b) => b.addEventListener("click", () => setVolPop(false)));
    document.getElementById("cs-inpage-row").hidden = !nativeFs;
    document.getElementById("cs-inpage-fs").addEventListener("click", () => { setCapPanel(false); enterNativeFs(); });

    function startVideo(at) {
      const offlineCopy = downloads[v.id] && navigator.serviceWorker && navigator.serviceWorker.controller;
      if (!navigator.onLine && !player.getAttribute("src") && !offlineCopy) {
        status.textContent = "Çevrimdışısın. Altyazıyı inceleyebilirsin; video için internete bağlan.";
        return;
      }
      if (!player.getAttribute("src")) {
        player.src = currentSrc(); player.dataset.started = "true"; player.hidden = false; fsBtn.disabled = false; bar.hidden = false; applyStoredVolume(); syncBar();
        if (stage.scrollIntoView && !isFs()) stage.scrollIntoView({ block: "nearest", behavior: "smooth" });
        document.getElementById("video-placeholder").hidden = true;
      }
      if (typeof at === "number") {
        if (player.readyState >= 1) player.currentTime = at;
        else pendingSeek = at;
      }
      status.textContent = "Video yükleniyor…";
      const request = player.play();
      if (request && request.catch) request.catch((err) => {
        if (err && err.name === "AbortError") return;
        if (!document.contains(player)) return;
        status.textContent = player.error ? "Video yüklenemedi. İnternetini kontrol et veya aşağıdaki resmî sayfada izle bağlantısını kullan." : "Oynatmak için kontrol çubuğundaki oynat düğmesine basabilirsin.";
      });
    }

    document.getElementById("video-start").addEventListener("click", () => startVideo());
    select.addEventListener("change", () => seekCaption(Number(select.value)));
    prev.addEventListener("click", () => seekCaption(selected - 1));
    next.addEventListener("click", () => seekCaption(selected + 1));
    replay.addEventListener("click", () => startVideo(v.captions[selected].start));
    player.addEventListener("loadedmetadata", () => {
      if (disposed) return;
      if (pendingSeek !== null) { player.currentTime = pendingSeek; pendingSeek = null; }
      syncCaptions();
    });
    player.addEventListener("timeupdate", syncCaptions);
    player.addEventListener("seeking", syncCaptions);
    player.addEventListener("play", () => { Tip.hide(); Speech.stop(); });
    player.addEventListener("playing", () => { status.textContent = "Altyazı konuşmayla birlikte ilerler. Anlamına bakmak için bir kelimeye dokun."; });
    player.addEventListener("error", () => { status.textContent = "Video yüklenemedi. İnternetini kontrol et veya aşağıdaki resmî sayfada izle bağlantısını kullan."; });
    player.addEventListener("ended", () => { status.textContent = "Film bitti. Konuşma seçicisinden bir sahneyi yeniden dinleyebilirsin."; });
    // Pause before the existing dictionary handler pins its tooltip.
    captions.addEventListener("click", (ev) => { if (ev.target.closest(".w")) player.pause(); });
    captions.addEventListener("keydown", (ev) => {
      if ((ev.key === "Enter" || ev.key === " ") && ev.target.matches(".w")) { ev.preventDefault(); ev.target.click(); }
    });
    bindText(captions, v); showCaption(0);
    videoCleanup = () => {
      disposed = true; player.pause(); player.removeAttribute("src"); player.load();
      document.removeEventListener("fullscreenchange", syncFsUi);
      document.removeEventListener("webkitfullscreenchange", syncFsUi);
      document.removeEventListener("keydown", onEscape);
      document.removeEventListener("keydown", onVideoKey);
      window.removeEventListener("resize", syncRotate);
      Tip.rotFrame = null; Tip.el.style.position = "";
      document.removeEventListener("click", onDocClickCap);
      document.removeEventListener("click", onDocClickVol);
      clearTimeout(hideTimer);
      if (vttUrl) { try { URL.revokeObjectURL(vttUrl); } catch (err) { /* ignore */ } }
      exitFs(); document.body.classList.remove("video-fs-open"); document.body.appendChild(Tip.el);
    };
  }

  function viewMyLibrary() {
    // A new visit always starts with the complete saved list; sorting may be retained.
    shelfFilt.type = "all"; shelfFilt.q = "";
    const saveFilters = () => S.save("myLibraryFilters", shelfFilt);
    saveFilters();
    $main.innerHTML = `
      ${collectionNav("saved")}
      <div class="lib-head">
        <div><p class="eyebrow">Senin okuma listen</p><h1>Kitaplığım</h1><p class="lead">Kaydettiğin hikâye ve makaleler burada. Bir metin seç ve kaldığın yerden devam et.</p><p class="library-note">${bookmarkStorageNote()}</p></div>
        <label class="search">${ICON.search}<input id="q" type="search" placeholder="Kitaplığında başlık ya da yazar ara" value="${esc(shelfFilt.q)}" aria-label="Kitaplığımda ara"></label>
      </div>
      <div class="bookshelf-types chips" role="group" aria-label="Kaydedilen metin türü">
        ${[["all", "Tümü"], ["story", "Hikâyeler"], ["article", "Makaleler"]].map(([type, label]) => `<button class="chip" type="button" data-library-type="${type}" aria-pressed="${shelfFilt.type === type}">${label}</button>`).join("")}
      </div>
      <div class="result-line"><span id="count" aria-live="polite"></span><button class="btn sm ghost" id="clear">Filtreleri temizle</button>
        <label>Sırala <select id="sort"><option value="saved">Son kaydedilen</option><option value="recent">Son okunan</option><option value="level">Seviye</option><option value="title">Başlık</option></select></label>
      </div>
      <div id="results"></div>`;
    document.getElementById("sort").value = shelfFilt.sort;
    shelfDraw = () => {
      const q = shelfFilt.q.trim().toLocaleLowerCase("tr");
      let list = bookmarks.map((id) => BY_ID[id]).filter((t) =>
        (shelfFilt.type === "all" || t.type === shelfFilt.type) &&
        (!q || [t.title, t.author, t.summaryTr].join(" ").toLocaleLowerCase("tr").includes(q)));
      if (shelfFilt.sort === "title") list.sort((a, b) => a.title.localeCompare(b.title));
      else if (shelfFilt.sort === "recent") list.sort((a, b) => (progress[b.id]?.at || 0) - (progress[a.id]?.at || 0));
      else if (shelfFilt.sort === "level") list.sort((a, b) => LEVELS.findIndex((l) => l.id === a.level) - LEVELS.findIndex((l) => l.id === b.level) || a.words - b.words);
      document.getElementById("count").textContent = `${list.length === bookmarks.length ? `${bookmarks.length} kayıt` : `${list.length} / ${bookmarks.length} kayıt gösteriliyor`} · ${list.filter((t) => t.type === "story").length} hikâye · ${list.filter((t) => t.type === "article").length} makale`;
      $main.querySelectorAll("[data-library-type]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.libraryType === shelfFilt.type));
      document.getElementById("results").innerHTML = grid(list) || (bookmarks.length
        ? '<div class="empty"><h3>Bu filtrelerle kayıt yok</h3><p>Bir filtreyi kaldırmayı veya aramayı temizlemeyi dene.</p></div>'
        : '<div class="empty"><h3>Kitaplığın henüz boş</h3><p>Hikâye ve makalelerdeki “Kaydet” düğmesiyle okuma listeni oluştur.</p><div class="empty-actions"><a class="btn primary" href="#library">Hikâyelere göz at</a><a class="btn" href="#articles">Makalelere göz at</a></div></div>');
    };
    $main.querySelector(".bookshelf-types").addEventListener("click", (ev) => {
      const b = ev.target.closest("[data-library-type]");
      if (!b) return;
      shelfFilt.type = b.dataset.libraryType; saveFilters(); shelfDraw();
    });
    document.getElementById("q").addEventListener("input", (ev) => { shelfFilt.q = ev.target.value; saveFilters(); shelfDraw(); });
    document.getElementById("sort").addEventListener("change", (ev) => { shelfFilt.sort = ev.target.value; saveFilters(); shelfDraw(); });
    document.getElementById("clear").addEventListener("click", () => {
      shelfFilt.type = "all"; shelfFilt.q = ""; saveFilters();
      document.getElementById("q").value = ""; shelfDraw();
    });
    shelfDraw();
  }

  function viewCollection(kind) {
    const config = COLLECTIONS[kind];
    const collection = config.items;
    const filters = config.filters;
    const saveFilters = () => S.save(config.key, filters);
    const label = config.label;
    const levels = kind === "story" ? LEVELS : LEVELS.filter((l) => ["B2", "C1", "C2"].includes(l.id));
    const chip = (group, val, label, extra) =>
      `<button class="chip${extra || ""}" data-f="${group}" data-v="${val}" aria-pressed="${filters[group].includes(val)}">${label}</button>`;
    $main.innerHTML = `
      ${collectionNav(kind)}
      <div class="lib-head">
        <div><p class="eyebrow">${config.eyebrow}</p><h1>${config.title}</h1><p class="lead">${config.lead}</p></div>
        <label class="search">${ICON.search}<input id="q" type="search" placeholder="${config.search} başlığı ya da yazar ara" value="${esc(filters.q)}" aria-label="${config.search} ara"></label>
      </div>
      <div class="filters">
        <div class="filter-row"><span>Seviye</span><div class="chips">${levels.map((l) => chip("level", l.id, `<span class="lvl lvl-${l.id}">${l.id}</span> ${l.name}`)).join("")}</div></div>
        <div class="filter-row"><span>Tür</span><div class="chips">${Object.entries(GENRES).map(([g, v]) => chip("genre", g, `<span class="dot"></span>${v.name}`, " g-" + g)).join("")}</div></div>
        <div class="filter-row"><span>Uzunluk</span><div class="chips">${chip("length", "short", "Kısa · 1.200 kelimeden az")}${chip("length", "medium", "Orta · 1.200–3.500 kelime")}${chip("length", "long", "Uzun · 3.500 kelimeden fazla")}</div></div>
      </div>
      <div class="result-line"><span id="count" aria-live="polite"></span><button class="btn sm ghost" id="clear">Filtreleri temizle</button>
        <label>Sırala <select id="sort"><option value="level">Seviye</option><option value="short">En kısa</option><option value="long">En uzun</option><option value="title">Başlık</option></select></label>
      </div>
      <div id="results"></div>`;
    document.getElementById("sort").value = filters.sort;
    const draw = () => {
      const q = filters.q.trim().toLocaleLowerCase("tr");
      let list = collection.filter((t) =>
        (!filters.level.length || filters.level.includes(t.level)) &&
        (!filters.genre.length || filters.genre.includes(t.genre)) &&
        (!filters.length.length || filters.length.includes(t.length)) &&
        (!q || [t.title, t.author, t.summaryTr, t.work?.titleTr, t.work?.author].filter(Boolean).join(" ").toLocaleLowerCase("tr").includes(q)));
      const lv = (t) => LEVELS.findIndex((l) => l.id === t.level);
      list = list.slice().sort(
        filters.sort === "short" ? (a, b) => a.words - b.words :
        filters.sort === "long" ? (a, b) => b.words - a.words :
        filters.sort === "title" ? (a, b) => a.title.localeCompare(b.title) :
        (a, b) => lv(a) - lv(b) || a.words - b.words);
      document.getElementById("count").textContent = `${list.length} ${label}`;
      // "Önerilenler": editorial picks of each selected level go first (stories only)
      let recs = [];
      if (kind === "story") {
        const inList = new Set(list.map((t) => t.id));
        for (const lvl of LEVELS.map((l) => l.id).filter((id) => !filters.level.length || filters.level.includes(id))) {
          const picks = FEATURED[lvl] || [];
          // a level needs more stories than picks, otherwise the whole level would be "recommended"
          if (!picks.length || collection.filter((t) => t.level === lvl).length <= picks.length) continue;
          for (const p of picks) if (BY_ID[p.id] && inList.has(p.id)) recs.push({ t: BY_ID[p.id], why: p.why });
        }
      }
      // Keep the section compact and give abridged classics priority within the active filters.
      recs = recs.sort((a, b) => Number(!!b.t.abridged) - Number(!!a.t.abridged)).slice(0, 3);
      const recIds = new Set(recs.map((r) => r.t.id));
      const rest = list.filter((t) => !recIds.has(t.id));
      const recHtml = recs.length
        ? `<section class="recs" aria-labelledby="recs-h"><div class="recs-head"><h2 id="recs-h">${ICON.starFill}Önerilenler</h2><p>${filters.level.length ? (filters.level.length > 1 ? "Seçtiğin seviyelerde önce bunlarla başla." : "Bu seviyede önce bunlarla başla.") : "Okumaya başlamak için birkaç öneri."}</p></div>
            <div class="grid">${recs.map((r) => card(r.t, r.why)).join("")}</div></section>
            ${rest.length ? `<h2 class="rest-h">Diğer ${label}ler</h2>` : ""}`
        : "";
      document.getElementById("results").innerHTML = (recHtml + grid(rest)) || `<div class="empty"><h3>Bu filtrelerle ${label} yok</h3><p>Bir filtreyi kaldırmayı veya aramayı temizlemeyi dene.</p></div>`;
    };
    $main.querySelector(".filters").addEventListener("click", (ev) => {
      const b = ev.target.closest(".chip");
      if (!b) return;
      const arr = filters[b.dataset.f], v = b.dataset.v, i = arr.indexOf(v);
      if (i >= 0) arr.splice(i, 1); else arr.push(v);
      b.setAttribute("aria-pressed", i < 0);
      saveFilters(); draw();
    });
    document.getElementById("q").addEventListener("input", (ev) => { filters.q = ev.target.value; saveFilters(); draw(); });
    document.getElementById("sort").addEventListener("change", (ev) => { filters.sort = ev.target.value; saveFilters(); draw(); });
    document.getElementById("clear").addEventListener("click", () => { filters.level = []; filters.genre = []; filters.length = []; filters.q = ""; saveFilters(); viewCollection(kind); });
    draw();
  }

  function viewReader(id) {
    const t = BY_ID[id];
    if (!t) { $main.innerHTML = `<div class="empty"><h3>Bu metni bulamadık</h3><p><a class="link" href="#library">Kütüphaneye dön</a></p></div>`; return; }
    prefs.last = id; savePrefs();
    const p = progress[id] || (progress[id] = { f: 0 });
    p.at = Date.now(); saveProgress();
    const isArt = t.type === "article";
    const collection = COLLECTIONS[t.type];
    const pages = isArt ? [{ start: 0, end: t.paragraphs.length, words: t.words, before: 0 }] : storyPages(t);
    const oldWord = (p.f || 0) * t.words;
    const oldPage = Math.max(0, pages.findIndex((pg) => pg.before + pg.words >= oldWord));
    const savedPage = Number.isInteger(p.page) ? Math.min(pages.length - 1, Math.max(0, p.page)) : oldPage;
    const savedOffset = Number.isFinite(p.pageF) ? Math.min(1, Math.max(0, p.pageF)) : Math.min(1, Math.max(0, (oldWord - pages[savedPage].before) / Math.max(1, pages[savedPage].words)));
    let pageIndex = p.done || isArt ? 0 : savedPage;
    let blocks = [], tracking = false;
    const pager = (place) => `<nav class="reader-pagination" data-placement="${place}" aria-label="Hikâye sayfaları (${place === "top" ? "üst" : "alt"})"></nav>`;
    const lvIdx = LEVELS.findIndex((l) => l.id === t.level);
    const next = collection.items.filter((s) => s.id !== id && !(progress[s.id] && progress[s.id].done))
      .map((s) => ({ s, score: Math.abs(LEVELS.findIndex((l) => l.id === s.level) - lvIdx) * 2 + (s.genre === t.genre ? 0 : 1) }))
      .sort((a, b) => a.score - b.score).slice(0, 3).map((x) => x.s);
    const src = t.source
      ? `Kaynak: <a href="${esc(t.source.url)}" target="_blank" rel="noopener">${esc(t.source.name)}</a> · ${esc(t.source.license)}`
      : isArt ? "Lantern için yazılmış özgün makale." : "Lantern için yazılmış özgün hikâye.";

    $main.innerHTML = `
      <article class="reader">
        <nav class="crumbs"><a href="#home">Ana sayfa</a><span>/</span><a href="#${collection.route}">${collection.title}</a></nav>
        <header class="reader-head">
          <h1>${esc(t.title)}</h1>
          <div class="by">${t.author.startsWith("Lantern") ? (isArt ? "Lantern makalesi" : "Lantern özgün hikâyesi") : esc(t.author) + (t.year ? ", " + t.year : "")}</div>
          <div class="tags"><span class="lvl lvl-${t.level}">${t.level}</span><span class="genre g-${t.genre}" style="display:inline-flex;align-items:center;gap:6px"><span class="dot"></span>${genreName(t.genre)}</span>
            <span class="sep">|</span><span>${LENGTHS[t.length]}</span><span class="sep">|</span><span>${fmt(t.words)} kelime</span><span class="sep">|</span><span>~${minutes(t)} dk</span></div>
          <div class="teaser-box">${esc(t.summaryTr)}</div>
          ${t.abridged ? '<p class="spoiler-note"><b>Kısaltılmış klasik</b> · Kitabın olay örgüsü ve sonu sırasıyla korunarak sadeleştirilmiş, kısaltılmış anlatımdır. Spoiler içerir; yaklaşık okuma süresi seviyeye göre tahminidir.</p>' : ""}
          <div class="reader-actions">${bookmarkCheckbox(t)}<a class="link" href="#my-library">Kitaplığım →</a><p class="bookmark-hint" id="bookmark-hint">Yalnızca seçtiğin metinler kitaplığına eklenir. Seçimi kaldırarak bu metni çıkarabilirsin.</p></div>
        </header>
        <div class="toolbar" role="toolbar" aria-label="Okuma ayarları">
          <button class="btn sm" id="listen">${ICON.play} ${isArt ? "Dinle" : "Sayfayı dinle"}</button>
          <div class="seg" aria-label="Yazı boyutu"><button id="smaller" aria-label="Yazıyı küçült">A−</button><button id="bigger" aria-label="Yazıyı büyüt">A+</button></div>
          ${hoverDevice ? `<div class="seg" aria-label="İpucu modu"><button data-mode="hover" aria-pressed="${prefs.mode === "hover"}">Üzerine gel</button><button data-mode="click" aria-pressed="${prefs.mode === "click"}">Tıkla</button></div>` : ""}
          <span class="spacer"></span>
          <span class="hint">Kesik çizgili kısımlar kalıp ifadedir</span>
        </div>
        ${(savedOffset > 0.05 || pageIndex > 0) && !p.done ? `<div class="resume" id="resume"><span>${isArt ? `En son %${Math.round(p.f * 100)}'te kalmıştın.` : `${pageIndex + 1}. sayfadan devam ediyorsun.`}</span><button class="btn sm primary" id="resume-btn">Kaldığın yerden devam et</button></div>` : ""}
        ${isArt ? "" : pager("top") + '<p class="page-status" id="page-status" tabindex="-1" role="status" aria-live="polite"></p>'}
        <div class="reader-text" id="text"></div>
        ${isArt ? "" : pager("bottom")}

        <div class="end">
          ${t.phrases && t.phrases.length ? `<section class="panel"><h2>Bu metindeki ifadeler</h2><p class="sub">Metinde kesik çizgiyle işaretlenenler. Üzerine gelince de görürsün.</p>
            <dl class="phrases">${t.phrases.map((ph) => `<div><dt>${esc(ph.en)}</dt><dd>${esc(ph.tr)}</dd></div>`).join("")}</dl></section>` : ""}
          ${t.quiz && t.quiz.length ? `<section class="panel"><h2>Ne kadar anladın?</h2><p class="sub">${t.quiz.length} soru. Cevabını seçince açıklaması görünür.</p><div class="quiz" id="quiz"></div></section>` : ""}
          ${next.length ? `<section><div class="section-head"><h2>${isArt ? "Diğer makaleler" : "Sıradaki hikâyeler"}</h2></div><div class="next-up">${next.map(card).join("")}</div></section>` : ""}
          <p class="source">${src}</p>
        </div>
      </article>`;

    const textEl = document.getElementById("text");
    const reader = $main.querySelector(".reader");
    const endEl = reader.querySelector(".end");
    document.documentElement.style.setProperty("--read-size", prefs.size + "px");
    bindText(textEl, t);

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
    const resetListen = () => { listen.innerHTML = ICON.play + (isArt ? " Dinle" : " Sayfayı dinle"); blocks.forEach((b) => b.classList.remove("speaking")); };
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
      document.getElementById("resume").hidden = true;
      const h = window.scrollY + textEl.getBoundingClientRect().top + textEl.offsetHeight * savedOffset - window.innerHeight * 0.6;
      tracking = true; jumpScroll(h); readerScroll();
    });

    // reading progress
    let saveT = 0;
    readerScroll = (persist) => {
      const r = textEl.getBoundingClientRect();
      const pageF = Math.min(1, Math.max(0, (window.innerHeight * 0.6 - r.top) / Math.max(1, r.height)));
      const pg = pages[pageIndex];
      const f = isArt ? pageF : (pg.before + pg.words * pageF) / Math.max(1, t.words);
      document.querySelector("#progress span").style.width = (f * 100) + "%";
      if (persist !== false && tracking && !p.done) {
        if (!isArt) { p.page = pageIndex; p.pageF = pageF; }
        p.f = Math.max(p.f || 0, f); p.at = Date.now();
        clearTimeout(saveT); saveT = setTimeout(saveProgress, 600);
      }
    };
    readerFlush = () => { clearTimeout(saveT); saveProgress(); };

    function renderPage(index, move) {
      Speech.stop(); Tip.hide(); tracking = false;
      pageIndex = index;
      const pg = pages[index];
      textEl.innerHTML = renderBody(t, t.paragraphs.slice(pg.start, pg.end));
      textEl.dataset.page = String(index + 1); textEl.dataset.pages = String(pages.length);
      blocks = [...textEl.querySelectorAll("p, h2")];
      markSaved(textEl);
      endEl.hidden = !isArt && index !== pages.length - 1;
      reader.querySelectorAll(".reader-pagination").forEach((nav) => {
        const selectId = "page-select-" + nav.dataset.placement;
        nav.innerHTML = `<button class="btn sm" type="button" data-page-prev${index === 0 ? " disabled" : ""}>← Önceki</button>
          <label for="${selectId}">Sayfa <select id="${selectId}" data-page-select aria-label="Sayfaya git">${pages.map((_, n) => `<option value="${n}"${n === index ? " selected" : ""}>${n + 1} / ${pages.length}</option>`).join("")}</select></label>
          <button class="btn sm${index === pages.length - 1 ? "" : " primary"}" type="button" data-page-next${index === pages.length - 1 ? " disabled" : ""}>Sonraki →</button>`;
      });
      const status = document.getElementById("page-status");
      if (status) status.textContent = `Sayfa ${index + 1} / ${pages.length} · ~${Math.max(1, Math.round(pg.words / (WPM[t.level] || 130)))} dk`;
      if (move) {
        clearTimeout(saveT);
        const resume = document.getElementById("resume");
        if (resume) resume.hidden = true;
        p.page = index; p.pageF = 0;
        p.f = Math.max(p.f || 0, pg.before / Math.max(1, t.words)); p.at = Date.now(); saveProgress();
        // Focus without scrolling first, then account for both sticky bars.
        if (status) {
          status.focus({ preventScroll: true });
          const bar = reader.querySelector(".toolbar");
          const offset = document.querySelector(".topbar").offsetHeight + bar.offsetHeight + 20;
          jumpScroll(window.scrollY + status.getBoundingClientRect().top - offset);
        }
      }
      readerScroll(false);
      requestAnimationFrame(() => { if (document.getElementById("text") === textEl) tracking = true; });
    }

    reader.addEventListener("click", (ev) => {
      const prev = ev.target.closest("[data-page-prev]");
      const next = ev.target.closest("[data-page-next]");
      if (prev && pageIndex > 0) renderPage(pageIndex - 1, true);
      if (next && pageIndex < pages.length - 1) renderPage(pageIndex + 1, true);
    });
    reader.addEventListener("change", (ev) => {
      if (!ev.target.matches("[data-page-select]")) return;
      const index = Number(ev.target.value);
      if (Number.isInteger(index) && index >= 0 && index < pages.length && index !== pageIndex) renderPage(index, true);
    });
    renderPage(pageIndex, false);
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
        <tr><td><span class="lvl lvl-A1">A1</span></td><td>Kısa, basit cümleler; günlük konular.</td><td>Özgün hikâyeler</td></tr>
        <tr><td><span class="lvl lvl-A2">A2</span></td><td>Geçmiş zamanlı anlatılar, basit diyaloglar.</td><td>Özgün hikâyeler, Aisopos fablları</td></tr>
        <tr><td><span class="lvl lvl-B1">B1</span></td><td>Akıcı olay örgüsü, bağlaçlar, birkaç deyim.</td><td>Macera, korku, bilim kurgu, romantik ve dram hikâyeleri</td></tr>
        <tr><td><span class="lvl lvl-B2">B2</span></td><td>Klasik kısa öyküler, ironi, eski üsluplu ifadeler.</td><td>O. Henry, Saki, Maupassant, Jacobs ve özgün gizem</td></tr>
        <tr><td><span class="lvl lvl-C1">C1</span></td><td>Yoğun betimleme, uzun cümleler, nadir kelimeler.</td><td>Poe, Conan Doyle, Jack London, H. G. Wells ve özgün korku</td></tr>
        <tr><td><span class="lvl lvl-C2">C2</span></td><td>Akademik ve edebî metinler, ince anlam farkları.</td><td>Özgün bilim kurgu ve tür makaleleri</td></tr>
      </tbody></table></div>
      <h2>Kısayollar</h2>
      <p><kbd>Esc</kbd> ipucu kutusunu kapatır. Kartlarda <kbd>Boşluk</kbd> kartı çevirir, <kbd>1</kbd> tekrar, <kbd>2</kbd> biliyorum.</p>
      <h2>Kaynaklar ve telif</h2>
      <p>Klasik metinler ABD'de kamu malıdır ve <a href="https://www.gutenberg.org" target="_blank" rel="noopener">Project Gutenberg</a>'den kısaltılmadan alınmıştır. “Lantern Original” imzalı hikâyeler ve tüm makaleler Lantern English için özgün olarak yazılmıştır. Sözlük maddeleri Lantern English için hazırlanmıştır.</p>
      ${pd.length ? `<ul>${pd.map((s) => `<li>${esc(s.author)}, <em>${esc(s.title)}</em>${s.year ? " (" + s.year + ")" : ""} · <a href="${esc(s.source.url)}" target="_blank" rel="noopener">${esc(s.source.name)}</a></li>`).join("")}</ul>` : ""}
      <h2>Uygulama gibi kullan</h2>
      <p>Lantern English telefonda uygulama gibi çalışır, mağazadan indirmen gerekmez.</p>
      <ul>
        <li><strong>iPhone / iPad (Safari):</strong> Paylaş düğmesi → <em>Ana Ekrana Ekle</em>.</li>
        <li><strong>Android (Chrome):</strong> Menü → <em>Uygulamayı yükle</em> ya da <em>Ana ekrana ekle</em>.</li>
        <li><strong>Bilgisayar (Chrome / Edge):</strong> adres çubuğundaki yükle simgesi.</li>
      </ul>
      <p>Bir kez açtıktan sonra daha önce okuduğun hikâyeler internet olmadan da açılır.</p>
      <h2>Verilerin</h2>
      <p>Kartlardaki “Kaydet” düğmesini veya okuma ekranındaki “Kitaplığıma ekle” kutucuğunu kullanarak okuma listeni oluştur. Bir metni açmak kitaplığına eklemez. <a href="#my-library">Kitaplığım</a> sekmesi tüm kayıtlarını gösterir; kayıt sayısı sınırı yoktur. Bir metni kitaplığından çıkarmak okuma ilerlemeni silmez.</p>
      <p>Kitaplığın, kelime defterin ve okuma ilerlemen yalnızca bu tarayıcıda saklanır. Tarayıcı verilerini silersen bunlar da silinir.</p>
    </div>`;
  }

  // ---------- router ----------
  let readerScroll = null, readerFlush = null, videoCleanup = null;
  const $back = document.getElementById("nav-back");
  const initialDepth = history.state && history.state.lanternDepth;
  let navigationDepth = Number.isInteger(initialDepth) && initialDepth >= 0 ? initialDepth : 0;
  window.addEventListener("scroll", () => { if (readerScroll) readerScroll(); }, { passive: true });
  window.addEventListener("pagehide", () => { if (readerFlush) readerFlush(); });
  window.addEventListener("resize", () => { if (readerScroll) readerScroll(false); });

  $back.addEventListener("click", () => {
    if (navigationDepth > 0) { history.back(); return; }
    const h = location.hash.slice(1);
    const text = h.startsWith("s.") && BY_ID[h.slice(2)];
    const fallback = text ? COLLECTIONS[text.type].route : h.startsWith("s.") ? "library" : h.startsWith("v.") ? "videos" : "home";
    // Direct links have no proven in-app predecessor; stay inside Lantern.
    history.replaceState(Object.assign({}, history.state, { lanternDepth: 0 }), "", "#" + fallback);
    route();
  });

  $main.addEventListener("click", (ev) => {
    const a = ev.target.closest("[data-level], [data-genre]");
    if (!a) return;
    filt.level = a.dataset.level ? [a.dataset.level] : [];
    filt.genre = a.dataset.genre ? [a.dataset.genre] : [];
    filt.length = []; filt.q = "";
    saveFilt();
    if (location.hash === "#library") route();
  });

  function route(ev) {
    if (window.__lanternReloadPending && !window.__lanternReloading) { window.__lanternReloading = true; location.reload(); return; }
    let h;
    try { h = decodeURIComponent(location.hash.slice(1)) || "home"; } catch (e) { h = "home"; }
    if (ev && ev.type === "hashchange") {
      const depth = history.state && history.state.lanternDepth;
      navigationDepth = Number.isInteger(depth) && depth >= 0 ? depth : navigationDepth + 1;
    }
    if (h === "summaries") h = "library";
    history.replaceState(Object.assign({}, history.state, { lanternDepth: navigationDepth }), "", "#" + h);
    $back.disabled = h === "home" && navigationDepth === 0;
    if (readerFlush) readerFlush();
    if (videoCleanup) { videoCleanup(); videoCleanup = null; }
    Speech.stop(); Tip.hide();
    readerScroll = null; readerFlush = null; cardKeys = null; shelfDraw = null;
    jumpScroll(0);
    document.querySelector("#progress span").style.width = "0";
    const section = h.startsWith("s.") ? (COLLECTIONS[BY_ID[h.slice(2)]?.type]?.route || "library") : h.startsWith("v.") ? "videos" : h;
    document.querySelectorAll("[data-nav]").forEach((a) => { if (a.dataset.nav === section) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
    const activeNav = document.querySelector(".nav [aria-current='page']");
    if (activeNav) {
      const nav = activeNav.parentElement, item = activeNav.getBoundingClientRect(), bounds = nav.getBoundingClientRect();
      if (item.left < bounds.left) nav.scrollLeft -= bounds.left - item.left;
      else if (item.right > bounds.right) nav.scrollLeft += item.right - bounds.right;
    }
    if (h.startsWith("s.")) viewReader(h.slice(2));
    else if (h.startsWith("v.")) viewVideo(h.slice(2));
    else if (h === "library") viewLibrary();
    else if (h === "articles") viewArticles();
    else if (h === "videos") viewVideos();
    else if (h === "my-library") viewMyLibrary();
    else if (h === "words") viewWords();
    else if (h === "about") viewAbout();
    else viewHome();
    const t = h.startsWith("s.") && BY_ID[h.slice(2)];
    const video = h.startsWith("v.") && VIDEO_BY_ID[h.slice(2)];
    document.title = video ? `${video.title} · Lantern English` : h === "videos" ? "Videolar · Lantern English" : t ? `${t.title} · Lantern English` : h === "my-library" ? "Kitaplığım · Lantern English" : "Lantern English";
  }

  // ---------- installable app (PWA) ----------
  const $install = document.getElementById("install");
  let installEvt = null;
  window.addEventListener("beforeinstallprompt", (ev) => {
    ev.preventDefault(); installEvt = ev;
    if ($install) $install.hidden = false;
  });
  if ($install) $install.addEventListener("click", () => {
    if (!installEvt) return;
    installEvt.prompt();
    const done = () => { installEvt = null; $install.hidden = true; };
    if (installEvt.userChoice && installEvt.userChoice.then) installEvt.userChoice.then(done, done); else done();
  });
  window.addEventListener("appinstalled", () => { if ($install) $install.hidden = true; toast("Uygulama yüklendi"); });
  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
    const wasControlled = !!navigator.serviceWorker.controller;
    let reloading = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      // Once an updated worker takes control, load its complete, consistent app shell.
      if (!wasControlled || reloading) return;
      reloading = true;
      if (readerFlush) readerFlush();
      location.reload();
    });
    window.addEventListener("load", () => {
      try {
        const hadController = !!navigator.serviceWorker.controller;
        navigator.serviceWorker.register("sw.js").then((reg) => {
          document.addEventListener("visibilitychange", () => { if (!document.hidden && reg.update) reg.update().catch(() => {}); });
        }).catch(() => {});
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (!hadController || window.__lanternReloading) return; // first install: nothing stale to replace
          const p = document.getElementById("video-player");
          if (p && p.getAttribute("src") && !p.paused) { window.__lanternReloadPending = true; return; }
          window.__lanternReloading = true;
          location.reload();
        });
      } catch (e) { /* unsupported frame */ }
    });
  }

  window.addEventListener("hashchange", route);
  updateBadge();
  updateBookmarks();
  route();
})();
