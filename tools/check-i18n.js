// Real PT/EN switch verification with screenshots, driven by Chrome DevTools Protocol.
// Usage: node tools/check-i18n.js
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');
const { findChrome, killTree } = require('./chrome');

const ROOT = path.resolve(__dirname, '..');
const LANDING = path.join(ROOT, 'landing');
const CFT = findChrome();
const OUT = path.join(ROOT, 'dist/screenshots/i18n');
const PORT = 8092;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.txt': 'text/plain', '.xml': 'application/xml' };

let pass = 0;
let fail = 0;
const check = (cond, label, extra) => {
  if (cond) { pass++; console.log('  ok   ' + label); }
  else { fail++; console.log('  FAIL ' + label + (extra ? ' → ' + extra : '')); }
};

function serve() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = decodeURIComponent(req.url.split('?')[0]);
      let file = path.join(LANDING, url);
      if (url.endsWith('/')) file = path.join(file, 'index.html');
      if (!file.startsWith(LANDING) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        res.writeHead(404); res.end('not found'); return;
      }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    });
    server.listen(PORT, '127.0.0.1', () => resolve(server));
  });
}

class CDP {
  static async connect(url) { const c = new CDP(url); await c.ready; return c; }
  constructor(url) {
    this.id = 0; this.pending = new Map();
    this.ws = new WebSocket(url);
    this.ready = new Promise((res, rej) => { this.ws.onopen = res; this.ws.onerror = rej; });
    this.ws.onmessage = (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id && this.pending.has(m.id)) {
        const p = this.pending.get(m.id); this.pending.delete(m.id);
        clearTimeout(p.timer);
        m.error ? p.reject(new Error(m.error.message)) : p.resolve(m.result);
      }
    };
  }
  send(method, params = {}, ms = 45000) {
    const id = ++this.id;
    return new Promise((res, rej) => {
      const timer = setTimeout(() => { this.pending.delete(id); rej(new Error('timeout ' + method)); }, ms);
      this.pending.set(id, { resolve: res, reject: rej, timer });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async eval(expression) {
    const r = await this.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception || {}).description || r.exceptionDetails.text);
    return r.result.value;
  }
}

async function waitFor(fn, timeout = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try { const v = await fn(); if (v) return v; } catch (e) {}
    await sleep(250);
  }
  return null;
}

async function launch(port) {
  const profile = path.join(os.tmpdir(), 'pod-i18n-' + port + '-' + Date.now());
  fs.mkdirSync(profile, { recursive: true });
  const child = spawn(CFT, [
    '--headless=new', '--no-sandbox', '--remote-debugging-port=' + port,
    '--user-data-dir=' + profile, '--no-first-run', '--no-default-browser-check',
    '--disable-background-networking', '--window-size=1500,1000'
  ], { stdio: ['ignore', 'ignore', 'ignore'] });
  await waitFor(async () => {
    try { const r = await fetch('http://127.0.0.1:' + port + '/json/version'); return r.ok; } catch (e) { return false; }
  }, 25000);
  return { child, profile, port };
}

async function newPage(b, url, width, height) {
  const res = await fetch('http://127.0.0.1:' + b.port + '/json/new?' + encodeURIComponent(url), { method: 'PUT' });
  const t = await res.json();
  const cdp = await CDP.connect(t.webSocketDebuggerUrl);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 700 });
  await waitFor(() => cdp.eval('document.readyState === "complete"'), 20000);
  await cdp.eval('document.fonts.ready.then(() => true)');
  await waitFor(() => cdp.eval('[...document.images].every((i) => i.complete)'), 10000);
  await sleep(1800);
  await cdp.eval(`(() => {
    const s = document.createElement('style');
    s.textContent = '::-webkit-scrollbar{display:none!important}html{scrollbar-width:none!important}' +
      '.reveal{opacity:1!important;transform:none!important;transition:none!important}' +
      '*,*::before,*::after{animation:none!important}';
    document.head.appendChild(s);
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));
    return true;
  })()`);
  await sleep(300);
  return cdp;
}

async function shot(cdp, file, quality = 82, clip) {
  const params = { format: 'jpeg', quality, fromSurface: true, captureBeyondViewport: false };
  if (clip) params.clip = { ...clip, scale: 1 };
  const res = await cdp.send('Page.captureScreenshot', params);
  const buf = Buffer.from(res.data, 'base64');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, buf);
  console.log('  ', path.basename(file), Math.round(buf.length / 1024) + ' KB');
}

async function scrollTo(cdp, selector, offset = 88) {
  await cdp.eval(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return false; window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - ${offset}); return true; })()`);
  await sleep(1700);
}

async function close(b) {
  killTree(b.child);
  await sleep(600);
  try { fs.rmSync(b.profile, { recursive: true, force: true }); } catch (e) {}
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const server = await serve();
  const base = 'http://127.0.0.1:' + PORT;
  const b = await launch(9411);
  try {
    console.log('\nPT (padrão)');
    const p = await newPage(b, base + '/index.html', 1440, 950);
    const pt = await p.eval(`(() => ({
      lang: document.documentElement.lang,
      title: document.title,
      mode: [...document.querySelectorAll('.lang button')].map((x) => x.dataset.langBtn + '=' + x.getAttribute('aria-pressed')).join(' '),
      h2: document.querySelector('#recursos h2').textContent,
      made: document.querySelector('[data-i18n="footer.made"]').textContent,
      heroLead: document.querySelector('.hero-lead').textContent,
      h1: document.querySelector('.hero h1').textContent.trim(),
      brand: document.querySelector('.site-header .brand span').textContent,
      footBrand: document.querySelector('.footer-note [data-i18n="brand"]').textContent,
      mockBrand: document.querySelector('.mock-head strong').textContent,
      linkHtml: document.querySelector('a.link-arrow').textContent.trim(),
      dashAria: document.querySelector('.points-dash').getAttribute('aria-label'),
      mockAria: document.querySelector('.mock[role="img"]').getAttribute('aria-label'),
      langAria: document.querySelector('.lang').getAttribute('aria-label'),
      chips: document.querySelectorAll('.tags .chip').length,
      external: performance.getEntriesByType('resource').filter((r) => /^https?:/.test(r.name) && !r.name.startsWith(location.origin)).map((r) => r.name)
    }))()`);
    check(pt.lang === 'pt-BR', 'html lang pt-BR', pt.lang);
    check(pt.mode === 'pt=true en=false', 'toggle marca PT', pt.mode);
    check(pt.h2 === 'Tudo para pagar menos, sem esforço', 'h2 em português');
    check(pt.h1 === 'Pega O Desconto' && pt.brand === 'Pega O Desconto', 'marca em português no hero e no header');
    check(pt.footBrand === 'Pega O Desconto' && pt.mockBrand === 'Pega O Desconto', 'marca em português no rodapé e no mock');
    check(pt.made === 'Feito no Brasil.', 'rodapé em português');
    check(pt.linkHtml.startsWith('Ver como funciona'), 'link-arrow em português', pt.linkHtml);
    check(pt.dashAria === 'Exemplo de saldo: 628 PegaPontos, nível Ouro, sequência de 24 dias', 'aria do painel em português', pt.dashAria);
    check(pt.mockAria === 'Ilustração do popup da extensão mostrando cupons encontrados', 'aria do mock em português', pt.mockAria);
    check(pt.langAria === 'Idioma', 'aria do seletor em português', pt.langAria);
    check(pt.chips === 10, '10 chips de lojas', String(pt.chips));
    check(pt.external.length === 0, 'nenhum request externo', pt.external.join(', '));

    console.log('\nTroca para EN (clique no seletor)');
    await p.eval(`document.querySelector('[data-lang-btn="en"]').click()`);
    await sleep(1000);
    const en = await p.eval(`(() => ({
      lang: document.documentElement.lang,
      title: document.title,
      mode: [...document.querySelectorAll('.lang button')].map((x) => x.dataset.langBtn + '=' + x.getAttribute('aria-pressed')).join(' '),
      stored: localStorage.getItem('pod-lang'),
      nav: [...document.querySelectorAll('.nav-links a[data-idx]')].map((a) => a.textContent.trim()).join(' | '),
      kicker: document.querySelector('#recursos .kicker span:last-child').textContent,
      h2: document.querySelector('#recursos h2').textContent,
      lead: document.querySelector('.hero-lead').textContent,
      pointsNext: document.querySelector('.points-next').textContent,
      step2: document.querySelectorAll('.step-list h3')[1].textContent,
      faqA: document.querySelectorAll('.faq details p')[1].textContent,
      chip: document.querySelectorAll('.tags .chip')[2].textContent.trim(),
      made: document.querySelector('[data-i18n="footer.made"]').textContent,
      linkHtml: document.querySelector('a.link-arrow').textContent.trim(),
      dashAria: document.querySelector('.points-dash').getAttribute('aria-label'),
      mockAria: document.querySelector('.mock[role="img"]').getAttribute('aria-label'),
      aria: document.querySelector('.lang').getAttribute('aria-label'),
      h1: document.querySelector('.hero h1').textContent.trim(),
      h1Violet: document.querySelector('.hero h1 .violet') ? document.querySelector('.hero h1 .violet').textContent : '',
      brand: document.querySelector('.site-header .brand span').textContent,
      footBrand: document.querySelector('.footer-note [data-i18n="brand"]').textContent,
      mockBrand: document.querySelector('.mock-head strong').textContent,
      footWord: document.querySelector('.footer-word').textContent,
      ogSite: document.querySelector('meta[property="og:site_name"]').content
    }))()`);
    check(en.lang === 'en', 'html lang en', en.lang);
    check(en.mode === 'pt=false en=true', 'toggle marca EN', en.mode);
    check(en.stored === 'en', 'preferência salva', en.stored);
    check(en.title === 'Get The Discount — coupons, deals and the best price while you shop', 'title em inglês', en.title);
    check(en.h1 === 'Get The Discount' && en.h1Violet === 'Discount', 'marca em inglês no hero (gradiente preservado)', en.h1);
    check(en.brand === 'Get The Discount' && en.footBrand === 'Get The Discount', 'marca em inglês no header e no rodapé', en.brand);
    check(en.mockBrand === 'Get The Discount' && en.footWord === 'GET THE DISCOUNT', 'marca em inglês no mock e no rodapé gigante');
    check(en.ogSite === 'Get The Discount', 'og:site_name em inglês', en.ogSite);
    check(en.nav === 'Features | Points | How it works | Stores | FAQ | Deals', 'nav em inglês', en.nav);
    check(en.kicker === '01 — Features', 'kicker em inglês', en.kicker);
    check(en.h2 === 'Everything to pay less, effortlessly', 'h2 em inglês', en.h2);
    check(en.lead.startsWith('Coupons, deals, cashback'), 'lead em inglês', en.lead);
    check(en.pointsNext === '13% to Diamond level', 'PegaPontos em inglês', en.pointsNext);
    check(en.step2 === 'Open the store and click the icon', 'passos em inglês', en.step2);
    check(en.faqA.includes('symbolic score'), 'FAQ em inglês', en.faqA.slice(0, 40));
    check(en.chip === 'Phones', 'chips em inglês', en.chip);
    check(en.made === 'Made in Brazil.', 'rodapé em inglês', en.made);
    check(en.linkHtml.startsWith('See how it works'), 'link-arrow em inglês', en.linkHtml);
    check(en.dashAria.startsWith('Balance example: 628 PegaPoints'), 'aria do painel em inglês', en.dashAria);
    check(en.mockAria.startsWith('Illustration of the extension popup'), 'aria do mock em inglês', en.mockAria);
    check(en.aria === 'Language', 'aria do seletor em inglês', en.aria);

    await p.eval('window.scrollTo(0,0)');
    await sleep(300);
    await shot(p, path.join(OUT, 'desk-hero-en.jpg'));
    await shot(p, path.join(OUT, 'desk-header-en.jpg'), 90, { x: 0, y: 0, width: 1440, height: 120 });
    for (const [sel, name] of [['#recursos', 'desk-recursos-en'], ['#pontos', 'desk-pontos-en'], ['#como-funciona', 'desk-como-en'], ['#faq', 'desk-faq-en']]) {
      await scrollTo(p, sel);
      await shot(p, path.join(OUT, name + '.jpg'));
    }

    console.log('\nVolta para PT');
    await p.eval(`document.querySelector('[data-lang-btn="pt"]').click()`);
    await sleep(800);
    const back = await p.eval(`(() => ({
      lang: document.documentElement.lang,
      h2: document.querySelector('#recursos h2').textContent,
      lead: document.querySelector('.hero-lead').textContent,
      made: document.querySelector('[data-i18n="footer.made"]').textContent,
      linkHtml: document.querySelector('a.link-arrow').textContent.trim(),
      dashAria: document.querySelector('.points-dash').getAttribute('aria-label'),
      langAria: document.querySelector('.lang').getAttribute('aria-label'),
      h1: document.querySelector('.hero h1').textContent.trim(),
      brand: document.querySelector('.site-header .brand span').textContent,
      stored: localStorage.getItem('pod-lang')
    }))()`);
    check(back.lang === 'pt-BR', 'volta para pt-BR', back.lang);
    check(back.h2 === pt.h2 && back.lead === pt.heroLead && back.made === pt.made, 'textos PT restaurados sem resíduo');
    check(back.h1 === 'Pega O Desconto' && back.brand === 'Pega O Desconto', 'marca PT restaurada no hero e no header');
    check(back.linkHtml === pt.linkHtml && back.dashAria === pt.dashAria && back.langAria === pt.langAria, 'html e aria PT restaurados');
    check(back.stored === 'pt', 'preferência volta para pt', back.stored);
    await p.eval('window.scrollTo(0,0)');
    await sleep(900);
    await shot(p, path.join(OUT, 'desk-hero-pt.jpg'));

    console.log('\nPersistência entre páginas');
    await p.eval(`document.querySelector('[data-lang-btn="en"]').click()`);
    await sleep(250);
    await p.send('Page.navigate', { url: base + '/ofertas.html' });
    await waitFor(() => p.eval('document.readyState === "complete"'), 20000);
    await waitFor(() => p.eval('document.querySelectorAll("#grid .deal-card").length > 0'), 12000);
    await sleep(1200);
    const feed = await p.eval(`(() => ({
      lang: document.documentElement.lang,
      title: document.title,
      h1: document.querySelector('h1').textContent,
      search: document.querySelector('#q').placeholder,
      chips: [...document.querySelectorAll('#chips .chip')].map((c) => c.textContent).join(' | '),
      kind: document.querySelector('#grid .deal-card .kind').textContent,
      tag: document.querySelector('#grid .deal-card .tag').textContent,
      cta: document.querySelector('#grid .deal-card .cta').textContent,
      foot: document.querySelector('#foot').textContent,
      word: document.querySelector('.footer-word').textContent
    }))()`);
    check(feed.lang === 'en', 'ofertas herda EN', feed.lang);
    check(feed.title === 'Game Deals — Get The Discount', 'title do feed', feed.title);
    check(feed.h1 === 'Game Deals', 'h1 do feed', feed.h1);
    check(feed.search === 'Search store (e.g. Nuuvem, Eneba)', 'busca traduzida', feed.search);
    check(feed.chips.startsWith('All | Brazil | Store'), 'chips traduzidos', feed.chips);
    check(feed.kind === 'Game store (Brazil)', 'categoria da loja traduzida', feed.kind);
    check(feed.tag === 'Brazil', 'tag traduzida', feed.tag);
    check(feed.cta === 'See deals →', 'CTA da loja traduzido', feed.cta);
    check(feed.foot.includes("stores' official deals pages") && feed.foot.includes('Updated on'), 'rodapé do feed', feed.foot);
    check(feed.word === 'DEALS', 'wordmark do feed', feed.word);
    await p.eval('window.scrollTo(0,0)');
    await sleep(300);
    await shot(p, path.join(OUT, 'desk-ofertas-en.jpg'));

    await p.send('Page.navigate', { url: base + '/privacidade.html' });
    await waitFor(() => p.eval('document.readyState === "complete"'), 20000);
    await sleep(1500);
    const priv = await p.eval(`(() => ({
      lang: document.documentElement.lang,
      title: document.title,
      h1: document.querySelector('h1').textContent,
      brand: document.querySelector('.site-header .brand span').textContent,
      intro: document.querySelector('.legal .card p').textContent,
      updated: document.querySelector('.updated').textContent,
      th: [...document.querySelectorAll('.legal th')].map((x) => x.textContent).join(' | '),
      codes: document.querySelectorAll('.legal code').length,
      back: document.querySelector('.btn-ghost').textContent.trim(),
      word: document.querySelector('.footer-word').textContent
    }))()`);
    check(priv.lang === 'en', 'política herda EN', priv.lang);
    check(priv.title === 'Privacy Policy — Get The Discount', 'title da política', priv.title);
    check(priv.h1 === 'Privacy Policy', 'h1 da política', priv.h1);
    check(priv.brand === 'Get The Discount' && priv.intro.includes('Get The Discount'), 'marca em inglês na política', priv.brand);
    check(priv.updated.startsWith('Last updated: November 13, 2026'), 'data da política', priv.updated);
    check(priv.th === 'Category | Examples | Purpose', 'tabela traduzida', priv.th);
    check(priv.codes === 4, 'códigos preservados', String(priv.codes));
    check(priv.back === '← Back to home', 'voltar traduzido', priv.back);
    check(priv.word === 'PRIVACY', 'wordmark da política', priv.word);
    await shot(p, path.join(OUT, 'desk-privacidade-en.jpg'));

    console.log('\nVolta para PT no feed');
    await p.send('Page.navigate', { url: base + '/ofertas.html?lang=pt' });
    await waitFor(() => p.eval('document.readyState === "complete"'), 20000);
    await waitFor(() => p.eval('document.querySelectorAll("#grid .deal-card").length > 0'), 12000);
    await sleep(500);
    const feedPt = await p.eval(`(() => ({
      lang: document.documentElement.lang,
      h1: document.querySelector('h1').textContent,
      search: document.querySelector('#q').placeholder,
      searchAria: document.querySelector('#q').getAttribute('aria-label'),
      chipsAria: document.querySelector('#chips').getAttribute('aria-label'),
      chips: [...document.querySelectorAll('#chips .chip')].map((c) => c.textContent).join(' | ')
    }))()`);
    check(feedPt.lang === 'pt-BR', 'feed volta para pt-BR', feedPt.lang);
    check(feedPt.h1 === 'Ofertas de Jogos', 'h1 do feed em português', feedPt.h1);
    check(feedPt.search === 'Buscar loja (ex.: Nuuvem, Eneba)', 'placeholder PT restaurado', feedPt.search);
    check(feedPt.searchAria === 'Buscar loja', 'aria da busca restaurado', feedPt.searchAria);
    check(feedPt.chipsAria === 'Filtrar por categoria', 'aria dos filtros restaurado', feedPt.chipsAria);
    check(feedPt.chips.startsWith('Todas | Brasil | Loja'), 'chips PT restaurados', feedPt.chips);

    console.log('\nHeader em tablet e celular');
    const t = await newPage(b, base + '/index.html?lang=en', 834, 1112);
    check(await t.eval('document.documentElement.lang') === 'en', 'tablet abre em EN');
    await shot(t, path.join(OUT, 'tab-hero-en.jpg'));
    await t.eval(`document.querySelector('.nav-toggle').click()`);
    await sleep(500);
    await shot(t, path.join(OUT, 'tab-menu-en.jpg'));

    const m = await newPage(b, base + '/index.html?lang=en', 390, 844);
    await shot(m, path.join(OUT, 'mob-hero-en.jpg'));
    await m.eval(`document.querySelector('.nav-toggle').click()`);
    await sleep(500);
    await shot(m, path.join(OUT, 'mob-menu-en.jpg'));
    check(await m.eval(`!!document.querySelector('.nav-links.open .lang')`), 'seletor visível no menu mobile');
    await m.eval(`document.querySelector('.nav-toggle').click()`);
    await sleep(500);
    await m.eval(`window.scrollTo(0, document.body.scrollHeight)`);
    await sleep(1200);
    const mobFit = await m.eval(`(() => ({
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      word: document.querySelector('.footer-word').getBoundingClientRect().width,
      vw: window.innerWidth,
      brand: document.querySelector('.footer-note [data-i18n="brand"]').textContent
    }))()`);
    check(mobFit.overflow <= 1, 'sem overflow horizontal em EN no celular', String(mobFit.overflow));
    check(mobFit.word <= mobFit.vw, 'wordmark em inglês cabe na tela', Math.round(mobFit.word) + '/' + mobFit.vw);
    check(mobFit.brand === 'Get The Discount', 'marca em inglês no rodapé do celular', mobFit.brand);
    await shot(m, path.join(OUT, 'mob-rodape-en.jpg'));

    await m.eval(`document.querySelector('.nav-toggle').click()`);
    await sleep(500);
    await m.eval(`document.querySelector('[data-lang-btn="pt"]').click()`);
    await sleep(500);
    await shot(m, path.join(OUT, 'mob-menu-pt.jpg'));

    console.log('\n' + (fail ? 'FALHAS: ' + fail : 'TUDO OK') + ' (' + (pass + fail) + ' verificações)');
  } finally {
    await close(b);
    server.close();
  }
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('ERRO:', e.message); process.exit(1); });
