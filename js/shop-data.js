// ======================================================================
// Einkaufsliste: Katalog und Daten (Teil des Planners)
// planner.shop = { list: [{n, c, e, q}], recent: [{n, c, e}], custom: [{n, c, e}], counts: {Name: Anzahl}, log: [{n, c, t}] }
//   log = jeder abgehakte Artikel mit Zeitpunkt (t in Millisekunden), Grundlage der Statistik
//   n = Name, c = Kategorie-Schlüssel, e = Symbol (Emoji), q = Menge (Text, optional), a = wann auf die Liste gelegt (ms)
// ======================================================================

const SHOP_CATS = [
  { k: 'obst',   n: 'Obst & Gemüse',     e: '🥦' },
  { k: 'brot',   n: 'Brot & Backwaren',  e: '🍞' },
  { k: 'milch',  n: 'Kühlregal',          e: '🥛' },
  { k: 'fleisch', n: 'Veggie & Eiweiß',   e: '🌱' },
  { k: 'vorrat', n: 'Vorrat & Konserven', e: '🍝' },
  { k: 'suess',  n: 'Süßes & Snacks',    e: '🍫' },
  { k: 'getraenke', n: 'Getränke',       e: '🥤' },
  { k: 'tk',     n: 'Tiefkühl',          e: '🧊' },
  { k: 'haushalt', n: 'Haushalt',        e: '🧻' },
  { k: 'drogerie', n: 'Drogerie',        e: '🧴' },
  { k: 'sonst',  n: 'Sonstiges',         e: '🛒' }
];

// Katalog: [Name, Symbol] je Kategorie
const SHOP_CATALOG = {
  obst: [['Äpfel', '🍎'], ['Bananen', '🍌'], ['Birnen', '🍐'], ['Orangen', '🍊'], ['Zitronen', '🍋'], ['Trauben', '🍇'], ['Erdbeeren', '🍓'], ['Beeren', '🫐'], ['Melone', '🍉'], ['Ananas', '🍍'], ['Mango', '🥭'], ['Kiwi', '🥝'], ['Avocado', '🥑'], ['Tomaten', '🍅'], ['Gurke', '🥒'], ['Paprika', '🫑'], ['Karotten', '🥕'], ['Brokkoli', '🥦'], ['Blumenkohl', '🥦'], ['Salat', '🥬'], ['Rucola', '🥬'], ['Spinat', '🥬'], ['Grünkohl', '🥬'], ['Zucchini', '🥒'], ['Zwiebeln', '🧅'], ['Knoblauch', '🧄'], ['Kartoffeln', '🥔'], ['Süßkartoffeln', '🍠'], ['Kürbis', '🎃'], ['Rote Bete', '🟣'], ['Radieschen', '🔴'], ['Fenchel', '🌱'], ['Sellerie', '🥬'], ['Rosenkohl', '🥬'], ['Champignons', '🍄'], ['Mais', '🌽'], ['Aubergine', '🍆'], ['Ingwer', '🌱'], ['Lauch', '🌱'], ['Petersilie', '🌿'], ['Basilikum', '🌿'], ['Koriander', '🌿'], ['Kräuter', '🌿']],
  brot: [['Brot', '🍞'], ['Brötchen', '🥖'], ['Toast', '🍞'], ['Croissants', '🥐'], ['Bagels', '🥯'], ['Brezeln', '🥨'], ['Wraps', '🫓'], ['Kuchen', '🍰'], ['Muffins', '🧁'], ['Knäckebrot', '🍘']],
  milch: [['Milch', '🥛'], ['Hafermilch', '🥛'], ['Sojamilch', '🥛'], ['Mandelmilch', '🥛'], ['Eier', '🥚'], ['Butter', '🧈'], ['Vegane Butter', '🧈'], ['Joghurt', '🥣'], ['Sojajoghurt', '🥣'], ['Skyr', '🥣'], ['Quark', '🥣'], ['Sahne', '🥛'], ['Hafercuisine', '🥛'], ['Käse', '🧀'], ['Veganer Käse', '🧀'], ['Mozzarella', '🧀'], ['Feta', '🧀'], ['Frischkäse', '🧀'], ['Parmesan', '🧀'], ['Hummus', '🥣'], ['Pudding', '🍮']],
  fleisch: [['Tofu', '🧊'], ['Räuchertofu', '🧊'], ['Seidentofu', '🧊'], ['Tempeh', '🌱'], ['Seitan', '🌱'], ['Sojaschnitzel', '🌱'], ['Veggie-Hack', '🌱'], ['Veggie-Burger', '🍔'], ['Veggie-Würstchen', '🌭'], ['Veggie-Aufschnitt', '🌱'], ['Falafel', '🧆'], ['Edamame', '🫛'], ['Proteinpulver', '💪']],
  vorrat: [['Nudeln', '🍝'], ['Vollkornnudeln', '🍝'], ['Reis', '🍚'], ['Couscous', '🌾'], ['Quinoa', '🌾'], ['Bulgur', '🌾'], ['Mehl', '🌾'], ['Zucker', '🍚'], ['Salz', '🧂'], ['Pfeffer', '🧂'], ['Öl', '🫒'], ['Olivenöl', '🫒'], ['Essig', '🍶'], ['Haferflocken', '🥣'], ['Müsli', '🥣'], ['Cornflakes', '🥣'], ['Linsen', '🫘'], ['Kichererbsen', '🫘'], ['Bohnen', '🫘'], ['Dosentomaten', '🥫'], ['Passierte Tomaten', '🥫'], ['Tomatenmark', '🥫'], ['Kokosmilch', '🥥'], ['Gemüsebrühe', '🥫'], ['Nüsse', '🥜'], ['Mandeln', '🥜'], ['Cashews', '🥜'], ['Erdnussbutter', '🥜'], ['Tahini', '🥜'], ['Chiasamen', '🌱'], ['Leinsamen', '🌱'], ['Hefeflocken', '🧂'], ['Honig', '🍯'], ['Ahornsirup', '🍯'], ['Marmelade', '🍯'], ['Nuss-Nougat-Creme', '🍫'], ['Ketchup', '🍅'], ['Senf', '🌭'], ['Sojasauce', '🍶'], ['Gewürze', '🌶️'], ['Backpulver', '🧂']],
  suess: [['Schokolade', '🍫'], ['Kekse', '🍪'], ['Chips', '🍟'], ['Gummibärchen', '🍬'], ['Eis', '🍦'], ['Popcorn', '🍿'], ['Müsliriegel', '🍫'], ['Proteinriegel', '🍫'], ['Salzstangen', '🥨'], ['Trockenfrüchte', '🍇'], ['Bonbons', '🍬']],
  getraenke: [['Wasser', '💧'], ['Sprudel', '💧'], ['Saft', '🧃'], ['Cola', '🥤'], ['Limonade', '🥤'], ['Eistee', '🥤'], ['Tee', '🍵'], ['Kaffee', '☕'], ['Kaffeebohnen', '☕'], ['Kakao', '☕'], ['Proteinshake', '🥛'], ['Energy Drink', '⚡'], ['Bier', '🍺'], ['Wein', '🍷'], ['Sekt', '🍾']],
  tk: [['Tiefkühlpizza', '🍕'], ['Pommes', '🍟'], ['Tiefkühlgemüse', '🥦'], ['Tiefkühlbeeren', '🫐'], ['Spinat (TK)', '🥬'], ['Edamame (TK)', '🫛'], ['Veggie-Nuggets', '🌱'], ['Falafel (TK)', '🧆'], ['Eiscreme', '🍨'], ['Eiswürfel', '🧊']],
  haushalt: [['Toilettenpapier', '🧻'], ['Küchenrolle', '🧻'], ['Taschentücher', '🤧'], ['Spülmittel', '🧴'], ['Spülmaschinentabs', '🧼'], ['Waschmittel', '🧺'], ['Weichspüler', '🧺'], ['Allzweckreiniger', '🧴'], ['Schwämme', '🧽'], ['Müllbeutel', '🗑️'], ['Backpapier', '📄'], ['Alufolie', '📄'], ['Frischhaltefolie', '📄'], ['Gefrierbeutel', '🛍️'], ['Batterien', '🔋'], ['Glühbirnen', '💡'], ['Kerzen', '🕯️'], ['Streichhölzer', '🔥']],
  drogerie: [['Zahnpasta', '🪥'], ['Zahnbürste', '🪥'], ['Zahnseide', '🦷'], ['Shampoo', '🧴'], ['Duschgel', '🚿'], ['Seife', '🧼'], ['Deo', '🧴'], ['Rasierer', '🪒'], ['Rasierschaum', '🧴'], ['Handcreme', '🧴'], ['Sonnencreme', '☀️'], ['Wattepads', '⚪'], ['Pflaster', '🩹'], ['Vitamine', '💊'], ['Tabletten', '💊'], ['Taschenspiegel', '🪞']]
};

const SHOP_EMOJI_SUGGEST = ['🛒', '🥦', '🍎', '🍞', '🥛', '🍗', '🍝', '🍫', '🥤', '🧊', '🧻', '🧴', '🌶️', '🐾', '🎁', '🔧'];

function shopCatKey(k) { return SHOP_CATS.some(c => c.k === k) ? k : 'sonst'; }
function shopCat(k) { return SHOP_CATS.find(c => c.k === k) || SHOP_CATS[SHOP_CATS.length - 1]; }
const shopKey = (n) => String(n).trim().toLowerCase();

function cleanShopEmoji(e, fallback) {
  const t = typeof e === 'string' ? e.trim().slice(0, 8) : '';
  return t || fallback;
}

function sanitizeShop(raw) {
  const out = { list: [], recent: [], custom: [], counts: {}, log: [] };
  const r = raw && typeof raw === 'object' ? raw : {};
  const take = (src, max, withQty, dest) => {
    const seen = new Set();
    (Array.isArray(src) ? src : []).forEach(x => {
      if (!x || typeof x.n !== 'string' || dest.length >= max) return;
      const n = x.n.trim().slice(0, 30);
      if (!n || seen.has(shopKey(n))) return;
      seen.add(shopKey(n));
      const c = shopCatKey(x.c);
      const it = { n, c, e: cleanShopEmoji(x.e, shopCat(c).e) };
      if (withQty) { it.q = typeof x.q === 'string' ? x.q.trim().slice(0, 12) : ''; it.a = Number.isFinite(x.a) && x.a > 1e12 ? Math.floor(x.a) : 0; }
      dest.push(it);
    });
  };
  take(r.custom, 500, false, out.custom);
  take(r.list, 300, true, out.list);
  take(r.recent, 60, false, out.recent);
  if (r.counts && typeof r.counts === 'object') {
    Object.keys(r.counts).slice(0, 1000).forEach(k => {
      const v = r.counts[k];
      if (Number.isFinite(v) && v > 0 && v < 100000) out.counts[k.slice(0, 30)] = Math.floor(v);
    });
  }
  const seenLog = new Set();
  (Array.isArray(r.log) ? r.log : []).forEach(x => {
    if (!x || typeof x.n !== 'string' || !Number.isFinite(x.t) || x.t < 1e12 || x.t > Date.now() + 864e5) return;
    const n = x.n.trim().slice(0, 30), key = shopKey(n) + '|' + x.t;
    if (!n || seenLog.has(key)) return;
    seenLog.add(key);
    out.log.push({ n, c: shopCatKey(x.c), t: Math.floor(x.t) });
  });
  out.log.sort((a, b) => a.t - b.t);
  if (out.log.length > 4000) out.log = out.log.slice(-4000);
  return out;
}

function ensureShop() {
  if (!planner.shop) planner.shop = { list: [], recent: [], custom: [], counts: {}, log: [] };
  if (!planner.shop.log) planner.shop.log = [];
  return planner.shop;
}

// Beim Import: Neues aus der Sicherung dazunehmen, Vorhandenes bleibt
function mergeShop(incoming) {
  const sh = ensureShop();
  let added = 0;
  const have = (arr, n) => arr.some(x => shopKey(x.n) === shopKey(n));
  (incoming.custom || []).forEach(x => { if (!have(sh.custom, x.n)) { sh.custom.push(x); added++; } });
  (incoming.list || []).forEach(x => { if (!have(sh.list, x.n)) sh.list.push(x); });
  (incoming.recent || []).forEach(x => { if (!have(sh.recent, x.n) && !have(sh.list, x.n)) sh.recent.push(x); });
  const lk = new Set(sh.log.map(x => shopKey(x.n) + '|' + x.t));
  (incoming.log || []).forEach(x => { if (!lk.has(shopKey(x.n) + '|' + x.t)) sh.log.push(x); });
  sh.log.sort((a, b) => a.t - b.t);
  if (sh.log.length > 4000) sh.log = sh.log.slice(-4000);
  Object.keys(incoming.counts || {}).forEach(k => { sh.counts[k] = Math.max(sh.counts[k] || 0, incoming.counts[k]); });
  return added;
}

// Alle bekannten Artikel einer Kategorie: eigene zuerst markiert, dann Katalog; häufig gekaufte nach vorn
function shopArticles(catKey) {
  const sh = ensureShop(), seen = new Set(), out = [];
  const add = (n, e, own) => { if (seen.has(shopKey(n))) return; seen.add(shopKey(n)); out.push({ n, c: catKey, e, own }); };
  sh.custom.filter(x => x.c === catKey).forEach(x => add(x.n, x.e, true));
  (SHOP_CATALOG[catKey] || []).forEach(([n, e]) => add(n, e, false));
  return out.map((a, i) => ({ a, i })).sort((p, q) => ((sh.counts[q.a.n] || 0) - (sh.counts[p.a.n] || 0)) || (p.i - q.i)).map(p => p.a);
}
// Findet einen Artikel anhand des Namens (eigene zuerst, dann Katalog)
function shopFind(name) {
  const key = shopKey(name), sh = ensureShop();
  const own = sh.custom.find(x => shopKey(x.n) === key);
  if (own) return { n: own.n, c: own.c, e: own.e, own: true };
  for (const c of SHOP_CATS) {
    const hit = (SHOP_CATALOG[c.k] || []).find(([n]) => shopKey(n) === key);
    if (hit) return { n: hit[0], c: c.k, e: hit[1], own: false };
  }
  return null;
}

// ---- Smarte Suche: findet Artikel auch bei Wortteilen ("Hack" -> "Veggie-Hack"), Mehrzahl und kleinen Tippfehlern ----

const shopFold = (t) => String(t).toLowerCase().replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss').replace(/ae/g, 'a').replace(/oe/g, 'o').replace(/ue/g, 'u').replace(/[^a-z0-9]+/g, ' ').trim();
// Grobe Wortstämme: Tomate/Tomaten, Apfel/Äpfel, Banane/Bananen
const shopStem = (w) => w.length > 4 ? w.replace(/(en|er|n|e|s)$/, '') : w;
function shopLev(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 3;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
function shopScore(q, name) {
  const n = shopFold(name);
  if (!q || !n) return 0;
  if (n === q) return 100;
  const toks = n.split(' '), qs = shopStem(q);
  if (n.replace(/ /g, '') === q.replace(/ /g, '')) return 98;
  if (toks.some(t => t === q) ) return 80 - Math.min(10, toks.length * 2);   // ein ganzes Wort ist gleich ("Hack" in "Veggie Hack")
  if (shopStem(n) === qs || toks.some(t => shopStem(t) === qs)) return 78;
  if (n.startsWith(q)) return 76;
  if (toks.some(t => t.startsWith(q))) return 72;
  if (q.length >= 3 && toks.some(t => shopStem(t).startsWith(qs))) return 66;
  if (q.length >= 3 && n.includes(q)) return 58;
  if (q.length >= 4) {
    const lim = q.length >= 7 ? 2 : 1;
    const dist = Math.min(shopLev(q, n), ...toks.map(t => shopLev(q, t)));
    if (dist <= lim) return 45 - dist * 4;
    // Angefangenes Wort mit Tippfehler ("Haferflok" -> "Haferflocken")
    if (q.length >= 5 && toks.some(t => t.length > q.length && shopLev(q, t.slice(0, q.length)) <= 1)) return 42;
  }
  return 0;
}
// Gibt die besten Treffer zurück: { n, c, e, own, score }
function shopRank(text, limit) {
  const q = shopFold(text), sh = ensureShop(), all = [], seen = new Set();
  if (!q) return [];
  SHOP_CATS.forEach(c => shopArticles(c.k).forEach(a => { if (!seen.has(shopKey(a.n))) { seen.add(shopKey(a.n)); all.push(a); } }));
  const res = all.map((a, i) => ({ a, i, s: shopScore(q, a.n) })).filter(x => x.s > 0)
    .sort((p, r) => (r.s - p.s) || ((sh.counts[r.a.n] || 0) - (sh.counts[p.a.n] || 0)) || (p.i - r.i))
    .map(x => Object.assign({ score: x.s }, x.a));
  return limit ? res.slice(0, limit) : res;
}
