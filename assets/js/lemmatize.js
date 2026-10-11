/* Lantern lemmatizer — shared by the browser app and the node build tools.
   Produces ordered lemma candidates for an English word form; the caller picks
   the first candidate that exists in the dictionary. */
(function (root) {
  "use strict";

  const IRREGULAR = {
    // be / have / do
    am: "be", is: "be", are: "be", was: "be", were: "be", been: "be", being: "be",
    has: "have", had: "have", having: "have", does: "do", did: "do", done: "do", doing: "do",
    // irregular verbs
    arose: "arise", arisen: "arise", awoke: "awake", awoken: "awake", bore: "bear", borne: "bear", born: "bear",
    beat: "beat", beaten: "beat", became: "become", began: "begin", begun: "begin", bent: "bend", bet: "bet",
    bit: "bite", bitten: "bite", bled: "bleed", blew: "blow", blown: "blow", broke: "break", broken: "break",
    bred: "breed", brought: "bring", built: "build", burnt: "burn", burst: "burst", bought: "buy",
    caught: "catch", chose: "choose", chosen: "choose", clung: "cling", came: "come", crept: "creep",
    dealt: "deal", dug: "dig", dove: "dive", drew: "draw", drawn: "draw", dreamt: "dream", drank: "drink",
    drunk: "drink", drove: "drive", driven: "drive", ate: "eat", eaten: "eat", fell: "fall", fallen: "fall",
    fed: "feed", felt: "feel", fought: "fight", found: "find", fled: "flee", flung: "fling", flew: "fly",
    flown: "fly", forbade: "forbid", forbidden: "forbid", forgot: "forget", forgotten: "forget",
    forgave: "forgive", forgiven: "forgive", froze: "freeze", frozen: "freeze", got: "get", gotten: "get",
    gave: "give", given: "give", went: "go", gone: "go", ground: "grind", grew: "grow", grown: "grow",
    hung: "hang", heard: "hear", hid: "hide", hidden: "hide", held: "hold", hurt: "hurt", kept: "keep",
    knelt: "kneel", knew: "know", known: "know", laid: "lay", led: "lead", leapt: "leap", learnt: "learn",
    left: "leave", lent: "lend", lay: "lie", lain: "lie", lit: "light", lost: "lose", made: "make",
    meant: "mean", met: "meet", mistook: "mistake", mistaken: "mistake", paid: "pay", proved: "prove",
    quit: "quit", rode: "ride", ridden: "ride", rang: "ring", rung: "ring", rose: "rise", risen: "rise",
    ran: "run", said: "say", saw: "see", seen: "see", sought: "seek", sold: "sell", sent: "send",
    shook: "shake", shaken: "shake", shone: "shine", shot: "shoot", shown: "show", shrank: "shrink",
    shut: "shut", sang: "sing", sung: "sing", sank: "sink", sunk: "sink", sat: "sit", slept: "sleep",
    slid: "slide", slung: "sling", slit: "slit", smelt: "smell", spoke: "speak", spoken: "speak",
    sped: "speed", spent: "spend", spilt: "spill", spun: "spin", spat: "spit", split: "split",
    spread: "spread", sprang: "spring", sprung: "spring", stood: "stand", stole: "steal", stolen: "steal",
    stuck: "stick", stung: "sting", stank: "stink", strode: "stride", struck: "strike", strung: "string",
    strove: "strive", striven: "strive", swore: "swear", sworn: "swear", swept: "sweep", swam: "swim",
    swum: "swim", swung: "swing", took: "take", taken: "take", taught: "teach", tore: "tear", torn: "tear",
    told: "tell", thought: "think", threw: "throw", thrown: "throw", understood: "understand",
    undertook: "undertake", undid: "undo", undone: "undo", upset: "upset", woke: "wake", woken: "wake",
    wore: "wear", worn: "wear", wove: "weave", woven: "weave", wept: "weep", won: "win", wound: "wind",
    withdrew: "withdraw", withdrawn: "withdraw", wrung: "wring", wrote: "write", written: "write",
    overcame: "overcome", overtook: "overtake", overtaken: "overtake", foresaw: "foresee",
    foreseen: "foresee", beheld: "behold", bade: "bid", bidden: "bid", forsook: "forsake",
    forsaken: "forsake", slain: "slay", slew: "slay", strewn: "strew", trod: "tread", trodden: "tread",
    used: "use", using: "use", could: "can", would: "will", should: "shall", might: "may", "'d": "would",
    // irregular nouns
    children: "child", men: "man", women: "woman", feet: "foot", teeth: "tooth", geese: "goose",
    mice: "mouse", people: "person", oxen: "ox", lives: "life", wives: "wife", knives: "knife",
    leaves: "leaf", wolves: "wolf", halves: "half", shelves: "shelf", thieves: "thief", selves: "self",
    loaves: "loaf", calves: "calf", phenomena: "phenomenon", criteria: "criterion", data: "data",
    // irregular adjectives
    better: "good", best: "good", worse: "bad", worst: "bad", further: "far", furthest: "far",
    farther: "far", farthest: "far", less: "little", least: "little", more: "much", most: "much",
    elder: "old", eldest: "old",
    // pronouns & determiners map to themselves via the dictionary; contractions:
    "won't": "will", "can't": "can", "shan't": "shall", "ain't": "be"
  };

  const VOWELS = "aeiou";
  const isCons = (c) => c && !VOWELS.includes(c);

  function normalize(word) {
    return String(word).toLowerCase().replace(/[‘’ʼ`]/g, "'").replace(/^'+|'+$/g, "");
  }

  function push(list, w) {
    if (w && w.length > 1 && !list.includes(w)) list.push(w);
    else if (w && w.length === 1 && (w === "a" || w === "i") && !list.includes(w)) list.push(w);
  }

  // consonant-vowel-consonant stems (rid, mak, hat, car): the silent-e form (ride, make, hate, care) is the likelier base
  const cvc = (t) => /[^aeiou][aeiou][^aeiouwxy]$/.test(t);

  function undouble(stem) {
    const n = stem.length;
    if (n > 2 && stem[n - 1] === stem[n - 2] && isCons(stem[n - 1])) {
      return stem.slice(0, -1);
    }
    return null;
  }

  function candidates(raw) {
    const out = [];
    let w = normalize(raw);
    if (!w) return out;
    push(out, w);
    if (IRREGULAR[w]) push(out, IRREGULAR[w]);

    // possessives & contractions
    if (/'s$/.test(w)) { w = w.slice(0, -2); push(out, w); if (IRREGULAR[w]) push(out, IRREGULAR[w]); }
    else if (/s'$/.test(w)) { w = w.slice(0, -1); push(out, w); }
    const contr = w.match(/^(.+?)('ll|'re|'ve|'d|'m|n't)$/);
    if (contr) {
      push(out, contr[1]);
      if (IRREGULAR[contr[1]]) push(out, IRREGULAR[contr[1]]);
      if (contr[2] === "n't") push(out, contr[1].replace(/n$/, ""));
    }

    const rules = [];
    const s = w;
    const L = s.length;
    if (L > 4 && s.endsWith("ies")) rules.push(s.slice(0, -3) + "y");
    if (L > 4 && s.endsWith("ves")) { rules.push(s.slice(0, -3) + "f"); rules.push(s.slice(0, -3) + "fe"); }
    if (L > 3 && s.endsWith("men")) rules.push(s.slice(0, -3) + "man");
    if (L > 3 && s.endsWith("es")) {
      const b = s.slice(0, -2);
      if (/(x|z|ch|sh|ss|o)$/.test(b)) { rules.push(b); rules.push(s.slice(0, -1)); }
      else { rules.push(s.slice(0, -1)); rules.push(b); } // rides -> ride (not rid), bases -> base
    }
    if (L > 3 && s.endsWith("s") && !s.endsWith("ss")) rules.push(s.slice(0, -1));
    if (L > 4 && s.endsWith("ied")) rules.push(s.slice(0, -3) + "y");
    if (L > 3 && s.endsWith("ed")) {
      const st = s.slice(0, -2);
      if (cvc(st)) { rules.push(s.slice(0, -1)); rules.push(st); } else { rules.push(st); rules.push(s.slice(0, -1)); }
      const u = undouble(st); if (u) rules.push(u);
    }
    if (L > 4 && s.endsWith("ing")) {
      const st = s.slice(0, -3);
      if (cvc(st)) { rules.push(st + "e"); rules.push(st); } else { rules.push(st); rules.push(st + "e"); }
      const u = undouble(st); if (u) rules.push(u);
      if (st.endsWith("y")) rules.push(st.slice(0, -1) + "ie"); // lying -> lie
    }
    if (L > 4 && s.endsWith("ier")) rules.push(s.slice(0, -3) + "y");
    if (L > 5 && s.endsWith("iest")) rules.push(s.slice(0, -4) + "y");
    if (L > 3 && s.endsWith("er")) {
      const st = s.slice(0, -2);
      if (cvc(st)) { rules.push(s.slice(0, -1)); rules.push(st); } else { rules.push(st); rules.push(s.slice(0, -1)); }
      const u = undouble(st); if (u) rules.push(u);
    }
    if (L > 4 && s.endsWith("est")) {
      const st = s.slice(0, -3);
      if (cvc(st)) { rules.push(s.slice(0, -2)); rules.push(st); } else { rules.push(st); rules.push(s.slice(0, -2)); }
      const u = undouble(st); if (u) rules.push(u);
    }
    if (L > 5 && s.endsWith("ily")) rules.push(s.slice(0, -3) + "y");
    if (L > 6 && s.endsWith("ally")) { rules.push(s.slice(0, -4)); rules.push(s.slice(0, -2)); }
    if (L > 4 && s.endsWith("ly")) { rules.push(s.slice(0, -2)); rules.push(s.slice(0, -1) + "e"); }
    if (L > 5 && s.endsWith("ness")) rules.push(s.slice(0, -4));

    for (const r of rules) {
      push(out, r);
      if (IRREGULAR[r]) push(out, IRREGULAR[r]);
    }
    return out;
  }

  /** Return {lemma, entry} for the first candidate found in dict (object or Map-like via get). */
  function lookup(word, dict) {
    const get = typeof dict.get === "function" ? (k) => dict.get(k) : (k) => dict[k];
    for (const c of candidates(word)) {
      const e = get(c);
      if (e) return { lemma: c, entry: e };
    }
    return null;
  }

  // Word tokens: letters with inner apostrophes (don't, Della's, o'clock).
  const WORD_RE = /[A-Za-zÀ-ɏ]+(?:['’][A-Za-z]+)*/g;

  const api = { candidates, lookup, normalize, WORD_RE, IRREGULAR };
  root.LanternLemma = api;
})(typeof window !== "undefined" ? window : globalThis);
