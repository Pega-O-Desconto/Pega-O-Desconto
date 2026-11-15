// Pega O Desconto — feed de ofertas de jogos (site)
// Fonte: deals.json (mesma origem), com fallback embutido caso o fetch falhe.
const FEED_URL = 'deals.json';

const DEFAULT_FEED = {
  updated: '2026-11-11',
  stores: [
    { id: 'nuuvem', name: 'Nuuvem', domain: 'nuuvem.com', kind: 'Loja de jogos (Brasil)', url: 'https://www.nuuvem.com/', accent: '#6d28d9', tags: ['Brasil', 'Loja', 'Steam'] },
    { id: 'fanatical', name: 'Fanatical', domain: 'fanatical.com', kind: 'Chaves oficiais (Steam/Windows)', url: 'https://www.fanatical.com/en/deals', accent: '#7c3aed', tags: ['Internacional', 'Chaves'] },
    { id: 'greenmangaming', name: 'Green Man Gaming', domain: 'greenmangaming.com', kind: 'Chaves e lançamentos', url: 'https://www.greenmangaming.com/', accent: '#4f46e5', tags: ['Internacional', 'Chaves'] },
    { id: 'gamersgate', name: 'GamersGate', domain: 'gamersgate.com', kind: 'Loja de jogos digitais', url: 'https://www.gamersgate.com/', accent: '#5b21b6', tags: ['Internacional', 'Loja'] },
    { id: 'eneba', name: 'Eneba', domain: 'eneba.com', kind: 'Marketplace de chaves', url: 'https://www.eneba.com/', accent: '#8b5cf6', tags: ['Internacional', 'Marketplace'] },
    { id: 'amazon', name: 'Amazon Brasil', domain: 'amazon.com.br', kind: 'Ofertas e games', url: 'https://www.amazon.com.br/ofertas', accent: '#0ea5e9', tags: ['Brasil', 'Loja'] },
    { id: 'cuponomia', name: 'Cuponomia', domain: 'cuponomia.com.br', kind: 'Agregador de cupons', url: 'https://www.cuponomia.com.br/', accent: '#a78bfa', tags: ['Brasil', 'Cupons'] }
  ],
  deals: []
};

const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
const safeColor = (c) => (/^#[0-9a-f]{3,8}$/i.test(String(c || '')) ? c : '#7c3aed');
const safeUrl = (u) => { try { const x = new URL(u); return (x.protocol === 'https:' || x.protocol === 'http:') ? x.href : null; } catch { return null; } };

const T = (key, fallback) => (window.podT ? window.podT(key) || fallback : fallback);
const isEN = () => !!(window.podIsEN && window.podIsEN());
const KIND_EN = {
  'Loja de jogos (Brasil)': 'Game store (Brazil)',
  'Chaves oficiais (Steam/Windows)': 'Official keys (Steam/Windows)',
  'Chaves e lançamentos': 'Keys and new releases',
  'Loja de jogos digitais': 'Digital game store',
  'Marketplace de chaves': 'Key marketplace',
  'Ofertas e games': 'Deals and games',
  'Agregador de cupons': 'Coupon aggregator'
};
const TAG_EN = { 'Brasil': 'Brazil', 'Loja': 'Store', 'Chaves': 'Keys', 'Internacional': 'International', 'Cupons': 'Coupons', 'Marketplace': 'Marketplace', 'Steam': 'Steam' };
const kindLabel = (k) => (isEN() ? KIND_EN[k] || k : k);
const tagLabel = (t) => (isEN() ? TAG_EN[t] || t : t);
const priceFrom = (v) => T('feed.price.from', 'De R$ ') + v;
const priceTo = (v) => T('feed.price.to', 'por R$ ') + v;

const state = { stores: [], deals: [], q: '', tag: 'Todas' };

const gridEl = document.getElementById('grid');
const statusEl = document.getElementById('status');
const chipsEl = document.getElementById('chips');
const footEl = document.getElementById('foot');
const qEl = document.getElementById('q');

function allTags() {
  const set = new Set();
  state.stores.forEach((s) => (s.tags || []).forEach((t) => set.add(t)));
  state.deals.forEach((d) => (d.tags || []).forEach((t) => set.add(t)));
  return ['Todas', ...set];
}

function renderChips() {
  chipsEl.textContent = '';
  allTags().forEach((tag) => {
    const label = tag === 'Todas' ? T('feed.all', 'Todas') : tagLabel(tag);
    const b = el('button', 'chip', label);
    b.type = 'button';
    b.setAttribute('aria-pressed', String(tag === state.tag));
    b.addEventListener('click', () => { state.tag = tag; renderChips(); renderGrid(); });
    chipsEl.appendChild(b);
  });
}

function storeCard(s) {
  const url = safeUrl(s.url);
  const card = el(url ? 'a' : 'div', 'deal-card');
  if (url) { card.href = url; card.target = '_blank'; card.rel = 'noopener noreferrer'; }

  const logo = el('span', 'logo', (s.name || '?').trim().charAt(0).toUpperCase());
  logo.style.background = safeColor(s.accent);
  card.appendChild(logo);

  const body = el('div', 'body');
  body.appendChild(el('h3', null, s.name || s.domain || T('feed.store.fallback', 'Loja')));
  body.appendChild(el('p', 'kind', kindLabel(s.kind || '')));
  const tags = el('div', 'tags');
  (s.tags || []).forEach((t) => tags.appendChild(el('span', 'tag', tagLabel(t))));
  body.appendChild(tags);
  body.appendChild(el('span', 'cta', T('feed.cta.store', 'Ver ofertas →')));
  card.appendChild(body);
  return card;
}

function dealCard(d) {
  const url = safeUrl(d.url);
  const card = el(url ? 'a' : 'div', 'deal-card');
  if (url) { card.href = url; card.target = '_blank'; card.rel = 'noopener noreferrer'; }
  const acc = el('span', 'logo', d.discount ? '-' + d.discount + '%' : 'OF');
  acc.style.background = 'linear-gradient(135deg,#8b5cf6,#5b21b6)';
  acc.style.fontSize = '.8rem';
  card.appendChild(acc);
  const body = el('div', 'body');
  body.appendChild(el('h3', null, d.title || T('feed.deal.fallback', 'Oferta')));
  const price = [d.store, d.priceOld ? priceFrom(d.priceOld) : '', d.price ? priceTo(d.price) : ''].filter(Boolean).join(' · ');
  body.appendChild(el('p', 'kind', price));
  body.appendChild(el('span', 'cta', T('feed.cta.deal', 'Ver oferta →')));
  card.appendChild(body);
  return card;
}

function renderGrid() {
  const q = state.q.trim().toLowerCase();
  const match = (s) => {
    if (state.tag !== 'Todas' && !(s.tags || []).includes(state.tag)) return false;
    if (!q) return true;
    return [s.name, s.kind, s.domain].filter(Boolean).join(' ').toLowerCase().includes(q);
  };
  gridEl.textContent = '';

  const deals = state.deals.filter((d) => {
    if (state.tag !== 'Todas' && !(d.tags || []).includes(state.tag)) return false;
    if (!q) return true;
    return [d.title, d.store].filter(Boolean).join(' ').toLowerCase().includes(q);
  });
  deals.forEach((d) => gridEl.appendChild(dealCard(d)));

  const stores = state.stores.filter(match);
  stores.forEach((s) => gridEl.appendChild(storeCard(s)));

  if (!gridEl.children.length) {
    gridEl.appendChild(el('div', 'empty', T('feed.empty', 'Nenhuma loja encontrada para essa busca.')));
  }
  if (statusEl) statusEl.style.display = 'none';
}

function setData(feed, sourceLabel) {
  state.stores = Array.isArray(feed.stores) ? feed.stores.filter((s) => s && s.url) : DEFAULT_FEED.stores;
  state.deals = Array.isArray(feed.deals) ? feed.deals.filter((d) => d && d.url) : [];
  renderChips();
  renderGrid();
  const upd = feed.updated ? T('feed.updated', ' · Atualizado em ') + feed.updated : '';
  footEl.textContent = T('feed.foot', 'Os links levam às páginas oficiais de ofertas das lojas.') + upd + (sourceLabel ? ' (' + sourceLabel + ')' : '');
}

async function load() {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(FEED_URL, { cache: 'no-store', signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const feed = await res.json();
    setData(feed, '');
  } catch (e) {
    setData(DEFAULT_FEED, 'offline');
  }
}

if (qEl) qEl.addEventListener('input', () => { state.q = qEl.value; renderGrid(); });
document.addEventListener('pod:langchange', () => {
  if (!state.stores.length) return;
  renderChips();
  renderGrid();
});
load();
