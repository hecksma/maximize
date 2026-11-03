// ======================================================================
// Einkaufsliste: Anzeige und Bedienung (dritte Ansicht im Planner)
// Antippen im Katalog legt einen Artikel auf die Liste. Antippen auf der Liste hakt ihn ab
// ("Zuletzt gekauft"), von dort kommt er mit einem Tipp zurück. Lange drücken öffnet Menge und Details.
// ======================================================================

const shopState = { q: '', open: new Set(), sub: 'list', period: 30 };

function shopTileHtml(it, kind) {
  // kind: 'list' (zu kaufen), 'recent' (zuletzt gekauft), 'cat' (Katalog, listed = schon auf der Liste)
  const listed = kind === 'cat' && ensureShop().list.some(x => shopKey(x.n) === shopKey(it.n));
  const cls = 'shop-tile' + (kind === 'list' ? ' on' : kind === 'recent' ? ' bought' : listed ? ' on' : '') + (it.own ? ' own' : '');
  const act = kind === 'list' ? 'buy' : kind === 'recent' ? 'unbuy' : 'toggle';
  return '<button type="button" class="' + cls + '" data-sh="' + act + '" data-n="' + escapeHtml(it.n) + '" data-c="' + it.c + '" aria-label="' + escapeHtml(it.n) + (kind === 'list' ? ', abhaken' : kind === 'recent' ? ', wieder auf die Liste' : listed ? ', von der Liste nehmen' : ', auf die Liste') + '">'
    + (kind === 'list' && it.q ? '<span class="shop-qty">' + escapeHtml(it.q) + '</span>' : '')
    + (listed ? '<span class="shop-tick" aria-hidden="true">✓</span>' : '')
    + '<span class="shop-ico" aria-hidden="true">' + escapeHtml(it.e) + '</span>'
    + '<span class="shop-name">' + escapeHtml(it.n) + '</span></button>';
}

function shopMainHtml() {
  const sh = ensureShop(), q = shopState.q.trim().toLowerCase();
  let h = '';
  // Zu kaufen, nach Kategorie gruppiert
  if (!q) {
    if (sh.list.length) {
      // Eine Liste ohne Überschriften; nur die Reihenfolge der Kategorien bleibt
      const order = SHOP_CATS.map(c => c.k), sorted = sh.list.slice().sort((x, y) => order.indexOf(x.c) - order.indexOf(y.c));
      h += '<h3 class="p-sec">Zu kaufen <small>' + sh.list.length + '</small></h3><div class="shop-grid">' + sorted.map(it => shopTileHtml(it, 'list')).join('') + '</div>';
    } else {
      h += '<div class="empty-state" style="margin:14px 0 6px;"><div class="big">Liste ist leer</div>Tippe unten auf Artikel, um sie auf die Liste zu legen. Neue Artikel schreibst du in die Leiste ganz unten.</div>';
    }
    if (sh.recent.length) {
      h += '<h3 class="p-sec">Zuletzt gekauft <small>' + sh.recent.length + '</small></h3><div class="shop-grid">' + sh.recent.slice(0, 16).map(it => shopTileHtml(it, 'recent')).join('') + '</div>'
        + '<div class="start-row" style="justify-content:flex-start;"><button type="button" class="tool-btn" data-sh="clear-recent">Verlauf leeren</button></div>';
    }
    h += '<h3 class="p-sec">Katalog</h3>';
  }
  // Katalog je Kategorie
  let any = false;
  SHOP_CATS.forEach(c => {
    let arts = shopArticles(c.k);
    if (q) arts = arts.filter(a => shopKey(a.n).indexOf(q) >= 0);
    if (!arts.length) return;
    any = true;
    const open = q ? true : shopState.open.has(c.k);
    h += '<details class="shop-cat" data-k="' + c.k + '"' + (open ? ' open' : '') + '><summary><span class="shop-cat-ico">' + c.e + '</span> ' + c.n + ' <small>' + arts.length + '</small></summary>'
      + '<div class="shop-grid">' + arts.map(a => shopTileHtml(a, 'cat')).join('') + '</div></details>';
  });
  if (q) {
    const exact = shopFind(shopState.q.trim());
    if (!exact) h += '<div class="shop-grid" style="margin-top:12px;"><button type="button" class="shop-tile new" data-sh="new" data-n="' + escapeHtml(shopState.q.trim().slice(0, 30)) + '"><span class="shop-ico" aria-hidden="true">＋</span><span class="shop-name">„' + escapeHtml(shopState.q.trim().slice(0, 30)) + '“ neu</span></button></div>';
    else if (!any) h += '<p class="hint" style="text-align:center;">Nichts gefunden.</p>';
  }
  return h;
}

function renderShopHtml() {
  const seg = '<div class="seg shop-sub" role="group" aria-label="Einkauf"><button type="button" data-sh="sub" data-v="list" aria-pressed="' + (shopState.sub === 'list') + '">Liste</button>'
    + '<button type="button" data-sh="sub" data-v="stats" aria-pressed="' + (shopState.sub === 'stats') + '">Statistik</button></div>';
  if (shopState.sub === 'stats') return seg + shopStatsHtml();
  return seg + '<input type="search" id="shopSearch" class="text-input note-search" placeholder="Artikel suchen" maxlength="30" autocomplete="off" value="' + escapeHtml(shopState.q) + '" aria-label="Artikel suchen" />'
    + '<div id="shopMain">' + shopMainHtml() + '</div>'
    + '<p class="hint" style="margin-top:16px;">Tipp: Lange auf einen Artikel drücken für Menge und eigene Symbole. Das Plus unten legt einen eigenen Artikel an.</p>';
}

// ---- Statistik ----

function shopStatsHtml() {
  const sh = ensureShop(), log = sh.log, P = shopState.period;
  const chips = '<div class="chips wrap" style="margin:10px 0 4px;">' + [[30, '30 Tage'], [90, '90 Tage'], [0, 'Alles']].map(([v, l]) => '<button type="button" class="chip" data-sh="period" data-v="' + v + '" aria-pressed="' + (P === v) + '">' + l + '</button>').join('') + '</div>';
  if (!log.length) return '<div class="empty-state" style="margin-top:20px;"><div class="big">Noch keine Statistik</div>Sobald du Artikel auf der Liste abhakst, siehst du hier, wie oft du einkaufst und was du am häufigsten kaufst. Gezählt wird ab jetzt.</div>';
  const now = Date.now(), DAY = 864e5;
  const from = P ? now - P * DAY : 0, prevFrom = P ? now - 2 * P * DAY : 0;
  const cur = log.filter(x => x.t >= from), prev = P ? log.filter(x => x.t >= prevFrom && x.t < from) : [];
  const days = (arr) => Array.from(new Set(arr.map(x => fmt(new Date(x.t))))).sort();
  const dCur = days(cur), dPrev = days(prev);
  const gaps = []; for (let i = 1; i < dCur.length; i++) gaps.push(Math.round((parseDate(dCur[i]) - parseDate(dCur[i - 1])) / DAY));
  const avgGap = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : null;
  const nf1 = (v) => nf.format(Math.round(v * 10) / 10);
  const card = (v, l, sub) => '<div class="stat-card"><div class="stat-value">' + v + '</div><div class="stat-label">' + l + '</div>' + (sub ? '<div class="stat-sub">' + sub + '</div>' : '') + '</div>';
  const vs = (c, p) => P ? 'davor ' + p : '';
  let h = chips + '<div class="stat-grid" style="margin-top:8px;">'
    + card(dCur.length, 'Einkäufe', vs(dCur.length, dPrev.length))
    + card(cur.length, 'Artikel gekauft', vs(cur.length, prev.length))
    + card(dCur.length ? nf1(cur.length / dCur.length) : '–', 'Ø Artikel pro Einkauf', dPrev.length ? 'davor ' + nf1(prev.length / dPrev.length) : '')
    + card(avgGap != null ? nf1(avgGap) + ' Tage' : '–', 'Ø Abstand', avgGap != null ? 'zwischen zwei Einkäufen' : 'zu wenig Daten')
    + '</div>';
  if (!cur.length) return h + '<p class="hint" style="text-align:center;margin-top:16px;">In diesem Zeitraum wurde nichts gekauft.</p>';

  // Verlauf: Artikel pro Woche, letzte 12 Wochen
  const mon = (d) => addDays(d, -weekdayIdx(d));
  const thisMon = mon(new Date()), weeks = [];
  for (let i = 11; i >= 0; i--) {
    const a = addDays(thisMon, -7 * i), b = addDays(a, 7), ta = a.getTime(), tb = b.getTime();
    const w = log.filter(x => x.t >= ta && x.t < tb);
    weeks.push({ a, n: w.length, trips: days(w).length });
  }
  const wmax = Math.max(1, ...weeks.map(w => w.n));
  h += '<div class="stats-title">Verlauf</div><p class="stats-note" style="margin:-6px 2px 8px;">Gekaufte Artikel pro Woche, letzte 12 Wochen.</p>'
    + '<div class="chart" role="img" aria-label="Artikel pro Woche">' + weeks.map(w => {
      const tip = 'Woche ab ' + w.a.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' }) + ': ' + w.n + ' Artikel an ' + w.trips + (w.trips === 1 ? ' Tag' : ' Tagen');
      return '<div class="bar-col' + (w.n ? '' : ' empty') + '" data-tip="' + escapeHtml(tip) + '" tabindex="0" role="button" aria-label="' + escapeHtml(tip) + '"><span class="bar-val">' + (w.n || '–') + '</span>'
        + '<span class="bar-track"><span class="bar" style="height:' + Math.max(Math.round(100 * w.n / wmax), 2) + '%"></span></span><span class="bar-label">' + w.a.getDate() + '.</span></div>';
    }).join('') + '</div>';

  // Top-Artikel
  const cnt = {}; cur.forEach(x => { const k = shopKey(x.n); (cnt[k] = cnt[k] || { n: x.n, c: x.c, k: 0 }).k++; });
  const top = Object.values(cnt).sort((p, q) => q.k - p.k || (p.n < q.n ? -1 : 1)).slice(0, 10), tmax = top[0].k;
  h += '<div class="stats-title">Am häufigsten gekauft</div><div class="sh-rows">' + top.map(t => {
    const art = shopFind(t.n), e = art ? art.e : shopCat(t.c).e;
    return '<div class="sh-row"><span class="sh-rn">' + escapeHtml(e) + ' ' + escapeHtml(t.n) + '</span><span class="sh-rv">' + t.k + '×</span><span class="sh-bar"><span style="width:' + Math.round(100 * t.k / tmax) + '%"></span></span></div>';
  }).join('') + '</div>';

  // Kategorien
  const cc = {}; cur.forEach(x => { cc[x.c] = (cc[x.c] || 0) + 1; });
  const cats = SHOP_CATS.filter(c => cc[c.k]).sort((p, q) => cc[q.k] - cc[p.k]);
  h += '<div class="stats-title">Nach Kategorie</div><div class="sh-rows">' + cats.map(c => {
    const pct = Math.round(100 * cc[c.k] / cur.length);
    return '<div class="sh-row"><span class="sh-rn">' + c.e + ' ' + c.n + '</span><span class="sh-rv">' + pct + ' %</span><span class="sh-bar"><span style="width:' + pct + '%"></span></span></div>';
  }).join('') + '</div>';
  return h;
}

function shopRerender(keepScroll) {
  const y = window.scrollY;
  const box = document.getElementById('shopMain');
  if (!box) { renderPlanner(); return; }
  box.innerHTML = shopMainHtml();
  updatePlannerSubtitle();
  if (keepScroll) window.scrollTo(0, y);
}

// ---- Aktionen ----

function shopAdd(art, qty) {
  const sh = ensureShop();
  sh.recent = sh.recent.filter(x => shopKey(x.n) !== shopKey(art.n));
  const ex = sh.list.find(x => shopKey(x.n) === shopKey(art.n));
  if (ex) { if (qty != null) ex.q = qty; }
  else sh.list.push({ n: art.n, c: art.c, e: art.e, q: qty || '' });
}
function shopBuy(name) {
  const sh = ensureShop(), i = sh.list.findIndex(x => shopKey(x.n) === shopKey(name));
  if (i < 0) return;
  const it = sh.list.splice(i, 1)[0];
  sh.recent = sh.recent.filter(x => shopKey(x.n) !== shopKey(it.n));
  sh.recent.unshift({ n: it.n, c: it.c, e: it.e });
  sh.recent = sh.recent.slice(0, 40);
  sh.counts[it.n] = (sh.counts[it.n] || 0) + 1;
  sh.log.push({ n: it.n, c: it.c, t: Date.now() });
  if (sh.log.length > 4000) sh.log = sh.log.slice(-4000);
}
function shopQuickAdd(text) {
  const name = text.trim().slice(0, 30);
  if (!name) return;
  const art = shopFind(name) || (() => {
    const sh = ensureShop();
    const a = { n: name, c: 'sonst', e: shopCat('sonst').e, own: true };
    sh.custom.push({ n: a.n, c: a.c, e: a.e });
    return a;
  })();
  shopAdd(art, null);
  habitInput.value = '';
  savePlanner(); renderPlanner();
}

// ---- Klicks auf Kacheln ----

let shopLpAt = 0;
plannerEl.addEventListener('click', (e) => {
  const b = e.target.closest('[data-sh]');
  if (!b || plannerState.tab !== 'shop') return;
  if (Date.now() - shopLpAt < 700) { e.preventDefault(); return; }   // das Loslassen nach langem Drücken zählt nicht
  const a = b.dataset.sh, n = b.dataset.n, c = b.dataset.c;
  const sh = ensureShop();
  if (a === 'buy') shopBuy(n);
  else if (a === 'unbuy') {
    const it = sh.recent.find(x => shopKey(x.n) === shopKey(n));
    if (it) {
      shopAdd(it, null);
      // Versehentlich abgehakt: den letzten Eintrag in der Statistik wieder entfernen
      for (let i = sh.log.length - 1; i >= 0; i--) if (shopKey(sh.log[i].n) === shopKey(n)) { sh.log.splice(i, 1); if (sh.counts[it.n] > 0) sh.counts[it.n]--; break; }
    }
  }
  else if (a === 'sub') { shopState.sub = b.dataset.v === 'stats' ? 'stats' : 'list'; window.scrollTo(0, 0); renderPlanner(); return; }
  else if (a === 'period') { shopState.period = Number(b.dataset.v) || 0; renderPlanner(); return; }
  else if (a === 'toggle') {
    const i = sh.list.findIndex(x => shopKey(x.n) === shopKey(n));
    if (i >= 0) sh.list.splice(i, 1); else { const art = shopFind(n) || { n, c, e: shopCat(c).e }; shopAdd(art, null); }
  }
  else if (a === 'clear-recent') { if (!twoStep(b, 'Wirklich leeren?')) return; sh.recent = []; }
  else if (a === 'new') { openShopSheet({ n, c: 'sonst', e: shopCat('sonst').e, own: true, isNew: true }); return; }
  else return;
  savePlanner(); shopRerender(true);
});
plannerEl.addEventListener('toggle', (e) => {
  const d = e.target;
  if (!d.classList || !d.classList.contains('shop-cat') || shopState.q.trim()) return;
  if (d.open) shopState.open.add(d.dataset.k); else shopState.open.delete(d.dataset.k);
}, true);
plannerEl.addEventListener('input', (e) => {
  if (e.target.id !== 'shopSearch') return;
  shopState.q = e.target.value;
  shopRerender(false);
});

// Lange drücken: Menge und Details
(function () {
  let t = null, sx = 0, sy = 0;
  const stop = () => { clearTimeout(t); t = null; };
  plannerEl.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('.shop-tile');
    if (!b || plannerState.tab !== 'shop' || b.dataset.sh === 'new') return;
    sx = e.clientX; sy = e.clientY;
    t = setTimeout(() => {
      t = null; shopLpAt = Date.now();
      if (navigator.vibrate) { try { navigator.vibrate(15); } catch (err) { /* egal */ } }
      const n = b.dataset.n, sh = ensureShop();
      const onList = sh.list.find(x => shopKey(x.n) === shopKey(n)) || sh.recent.find(x => shopKey(x.n) === shopKey(n));
      const art = onList ? { n: onList.n, c: onList.c, e: onList.e, own: !!sh.custom.find(x => shopKey(x.n) === shopKey(n)) } : (shopFind(n) || { n, c: b.dataset.c, e: shopCat(b.dataset.c).e, own: false });
      openShopSheet(art);
    }, 450);
  });
  plannerEl.addEventListener('pointermove', (e) => { if (t && Math.hypot(e.clientX - sx, e.clientY - sy) > 10) stop(); });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => plannerEl.addEventListener(ev, stop));
  plannerEl.addEventListener('contextmenu', (e) => { if (e.target.closest('.shop-tile')) e.preventDefault(); });
})();

// ---- Fenster: Menge, eigene Artikel ----

const shopSheet = document.getElementById('shopSheet');
let shd = null;

function openShopSheet(art) {
  const sh = ensureShop();
  const listed = sh.list.find(x => shopKey(x.n) === shopKey(art.n));
  shd = { art, orig: art.n, isNew: !!art.isNew, own: !!art.own || !!art.isNew, c: art.c, e: art.e, listed: !!listed };
  document.getElementById('shHead').textContent = shd.isNew ? 'Neuer Artikel' : 'Artikel';
  const nameEl = document.getElementById('shName');
  nameEl.value = art.n;
  nameEl.readOnly = !shd.own;
  document.getElementById('shQty').value = listed ? (listed.q || '') : '';
  document.getElementById('shEmoji').value = shd.e;
  document.getElementById('shMsg').textContent = '';
  document.getElementById('shOwnFields').hidden = !shd.own;
  const del = document.getElementById('shDelete');
  del.classList.remove('confirm'); del.dataset.arm = '';
  del.hidden = !(shd.own && !shd.isNew) && !shd.listed;
  del.textContent = shd.own && !shd.isNew ? 'Artikel löschen' : 'Entfernen';
  document.getElementById('shSave').textContent = shd.listed ? 'Speichern' : 'Auf die Liste';
  drawShopSheet();
  shopSheet.showModal();
}
function drawShopSheet() {
  if (!shd.own) return;
  document.getElementById('shCats').innerHTML = SHOP_CATS.map(c => '<button type="button" class="chip" data-shc="' + c.k + '" aria-pressed="' + (shd.c === c.k) + '">' + c.e + ' ' + c.n + '</button>').join('');
  document.getElementById('shEmojiChips').innerHTML = SHOP_EMOJI_SUGGEST.map(e => '<button type="button" class="chip emo" data-she="' + e + '" aria-label="Symbol ' + e + '">' + e + '</button>').join('');
}
shopSheet.addEventListener('click', (e) => {
  const c = e.target.closest('[data-shc]'), em = e.target.closest('[data-she]');
  if (c) { shd.c = c.dataset.shc; const cur = document.getElementById('shEmoji').value; if (SHOP_CATS.some(x => x.e === cur)) document.getElementById('shEmoji').value = shopCat(shd.c).e; drawShopSheet(); }
  else if (em) document.getElementById('shEmoji').value = em.dataset.she;
});
document.getElementById('shCancel').addEventListener('click', () => shopSheet.close());
document.getElementById('shForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const sh = ensureShop();
  const name = document.getElementById('shName').value.trim().slice(0, 30);
  const qty = document.getElementById('shQty').value.trim().slice(0, 12);
  const emoji = cleanShopEmoji(document.getElementById('shEmoji').value, shopCat(shd.c).e);
  if (!name) { document.getElementById('shMsg').textContent = 'Bitte gib einen Namen ein.'; return; }
  let art = { n: shd.art.n, c: shd.art.c, e: shd.art.e };
  if (shd.own) {
    const clash = sh.custom.find(x => shopKey(x.n) === shopKey(name) && shopKey(x.n) !== shopKey(shd.orig));
    if (clash || (shd.isNew && shopFind(name))) { document.getElementById('shMsg').textContent = 'Diesen Artikel gibt es schon.'; return; }
    art = { n: name, c: shd.c, e: emoji };
    const i = sh.custom.findIndex(x => shopKey(x.n) === shopKey(shd.orig));
    if (i >= 0) sh.custom[i] = { n: art.n, c: art.c, e: art.e }; else sh.custom.push({ n: art.n, c: art.c, e: art.e });
    // Namen oder Symbol auf der Liste und im Verlauf nachziehen
    [sh.list, sh.recent].forEach(arr => arr.forEach(x => { if (shopKey(x.n) === shopKey(shd.orig)) { x.n = art.n; x.c = art.c; x.e = art.e; } }));
    if (shopKey(shd.orig) !== shopKey(art.n) && sh.counts[shd.orig]) { sh.counts[art.n] = sh.counts[shd.orig]; delete sh.counts[shd.orig]; }
  }
  shopAdd(art, qty);
  savePlanner(); renderPlanner();
  shopSheet.close();
});
document.getElementById('shDelete').addEventListener('click', function () {
  if (this.dataset.arm !== '1') {
    this.dataset.arm = '1'; this.classList.add('confirm'); this.textContent = 'Wirklich?';
    this._t = setTimeout(() => { this.dataset.arm = ''; this.classList.remove('confirm'); this.textContent = shd.own && !shd.isNew ? 'Artikel löschen' : 'Entfernen'; }, 4000);
    return;
  }
  clearTimeout(this._t); this.dataset.arm = ''; this.classList.remove('confirm');
  const sh = ensureShop(), k = shopKey(shd.orig);
  sh.list = sh.list.filter(x => shopKey(x.n) !== k);
  if (shd.own && !shd.isNew) { sh.custom = sh.custom.filter(x => shopKey(x.n) !== k); sh.recent = sh.recent.filter(x => shopKey(x.n) !== k); }
  savePlanner(); renderPlanner();
  shopSheet.close();
});
