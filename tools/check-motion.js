// Verifies the moving background, scroll typography and parallax in a real browser.
// Usage: node tools/check-motion.js
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');
const { findChrome, killTree } = require('./chrome');

const ROOT = path.resolve(__dirname, '..');
const LANDING = path.join(ROOT, 'landing');
const CFT = findChrome();
const OUT = path.join(ROOT, 'dist/screenshots/motion');
const PORT = 8093;

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
  const profile = path.join(os.tmpdir(), 'pod-motion-' + port + '-' + Date.now());
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

async function newPage(b, url, width, height, reduceMotion) {
  const res = await fetch('http://127.0.0.1:' + b.port + '/json/new?' + encodeURIComponent('about:blank'), { method: 'PUT' });
  const t = await res.json();
  const cdp = await CDP.connect(t.webSocketDebuggerUrl);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 700 });
  if (reduceMotion) await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await cdp.send('Page.navigate', { url });
  await waitFor(() => cdp.eval('document.readyState === "complete"'), 20000);
  await cdp.eval('document.fonts.ready.then(() => true)');
  await waitFor(() => cdp.eval('[...document.images].every((i) => i.complete)'), 10000);
  await sleep(1800);
  return cdp;
}

async function shot(cdp, file, quality = 82) {
  const res = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality, fromSurface: true });
  const buf = Buffer.from(res.data, 'base64');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, buf);
  console.log('  ', path.basename(file), Math.round(buf.length / 1024) + ' KB');
}

async function scrollTo(cdp, selector, wait = 1700) {
  await cdp.eval(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return false; window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 80); return true; })()`);
  await sleep(wait);
}

// Scrolls to a section and polls until the reveal predicate holds. Fixed sleeps
// are not enough on slow CI runners, where letter transitions finish late.
async function revealAfterScroll(cdp, selector, predicate, timeout = 10000) {
  await scrollTo(cdp, selector, 700);
  return waitFor(() => cdp.eval(predicate), timeout);
}

function visibleChars(selector) {
  return `(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return false;
    const chars = [...el.querySelectorAll('.ch')];
    return el.classList.contains('in') && chars.length > 0 && chars.every((c) => parseFloat(getComputedStyle(c).opacity) > 0.99);
  })()`;
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
  const b = await launch(9412);
  try {
    console.log('\nFundo e divisão tipográfica');
    const p = await newPage(b, base + '/index.html', 1440, 950);
    const baseState = await p.eval(`(() => {
      const h1 = document.querySelector('.hero h1');
      const violet = h1.querySelector('.violet');
      const vs = getComputedStyle(violet);
      return {
        blobs: document.querySelectorAll('.aurora__blob').length,
        layers: document.querySelectorAll('.aurora__layer').length,
        depths: [...document.querySelectorAll('.aurora__layer')].map((l) => l.dataset.depth || (l.dataset.speed ? 'v' + l.dataset.speed : 's' + l.dataset.scroll)).join(','),
        photos: document.querySelectorAll('.aurora__photo').length,
        photoBg: [...document.querySelectorAll('.aurora__photo')].map((el) => getComputedStyle(el).backgroundImage).join(','),
        photoH: document.querySelector('.aurora__photo.a').offsetHeight,
        photoOpacity: getComputedStyle(document.querySelector('.aurora__photo.a')).opacity,
        photoY: parseFloat((document.querySelector('.aurora__photo').parentElement.style.transform.match(/, (-?[\\d.]+)px/) || [0, 0])[1]),
        grid: !!document.querySelector('.aurora__grid'),
        sweep: !!document.querySelector('.aurora__sweep'),
        auroraAnim: getComputedStyle(document.querySelector('.aurora__blob')).animationName,
        motion: document.documentElement.classList.contains('motion'),
        h1Text: h1.textContent.trim(),
        chars: h1.querySelectorAll('.ch').length,
        h1In: h1.classList.contains('in'),
        violetGrad: vs.backgroundImage !== 'none',
        violetColor: vs.color,
        h2Text: document.querySelector('#recursos h2').textContent,
        h2Chars: document.querySelectorAll('#recursos h2 .ch').length,
        progress: getComputedStyle(document.querySelector('.scroll-progress')).getPropertyValue('--scroll').trim(),
        external: performance.getEntriesByType('resource').filter((r) => /^https?:/.test(r.name) && !r.name.startsWith(location.origin)).map((r) => r.name)
      };
    })()`);
    check(baseState.blobs === 3, '3 glows de gradiente', String(baseState.blobs));
    check(baseState.layers === 7 && baseState.grid && baseState.sweep, 'fundo em 7 camadas (2 fotos, grade, glows e clarão)', String(baseState.layers));
    check(baseState.photos === 2 && /bg-drift\.jpg/.test(baseState.photoBg) && /bg-bokeh\.jpg/.test(baseState.photoBg), 'duas fotografias de fundo locais', baseState.photoBg);
    check(baseState.photoH > 3000 && parseFloat(baseState.photoOpacity) > 0.2, 'fotografias altas e visíveis para nunca descobrir a tela', baseState.photoH + 'px @' + baseState.photoOpacity);
    check(new Set(baseState.depths.split(',')).size === 7, 'camadas com profundidades distintas', baseState.depths);
    check(/aurora-a/.test(baseState.auroraAnim), 'gradiente animando', baseState.auroraAnim);
    check(baseState.motion, 'classe motion aplicada');
    check(baseState.h1Text === 'Pega O Desconto', 'h1 preservado', baseState.h1Text);
    check(baseState.chars >= 13, 'h1 dividido em letras', String(baseState.chars));
    check(baseState.h1In, 'h1 revelado ao carregar');
    check(baseState.violetGrad && baseState.violetColor === 'rgba(0, 0, 0, 0)', 'gradiente do "Desconto" mantido');
    check(baseState.h2Text === 'Tudo para pagar menos, sem esforço', 'h2 preservado', baseState.h2Text);
    check(baseState.h2Chars >= 24, 'h2 dividido em letras', String(baseState.h2Chars));
    check(baseState.external.length === 0, 'nenhum request externo', baseState.external.join(', '));
    const fonts = await waitFor(() => p.eval(`[...document.querySelectorAll('.hero h1 .ch')].every((c) => getComputedStyle(c).opacity === '1')`), 5000);
    check(fonts, 'letras do hero visíveis após o reveal');

    const heroOverflow = await p.eval('document.documentElement.scrollWidth - window.innerWidth');
    check(heroOverflow <= 1, 'sem overflow horizontal no hero', String(heroOverflow));
    const topLayers = await p.eval(`[...document.querySelectorAll('.aurora__layer')].map((l) => getComputedStyle(l).transform).join(' | ')`);
    await shot(p, path.join(OUT, 'desk-hero.jpg'));

    console.log('\nScroll: letras entrando e parallax');
    await scrollTo(p, '#recursos');
    await waitFor(() => p.eval(`document.querySelector('#recursos h2').classList.contains('in')`), 6000);
    const rec = await p.eval(`(() => {
      const h2 = document.querySelector('#recursos h2');
      return {
        in: h2.classList.contains('in'),
        charsIn: [...h2.querySelectorAll('.ch')].every((c) => getComputedStyle(c).opacity === '1'),
        progress: parseFloat(getComputedStyle(document.querySelector('.scroll-progress')).getPropertyValue('--scroll')),
        headingShift: document.querySelector('.chapter-head').style.getPropertyValue('--sp'),
        headTransform: getComputedStyle(document.querySelector('.chapter-head')).transform,
        layers: [...document.querySelectorAll('.aurora__layer')].map((l) => getComputedStyle(l).transform).join(' | '),
        zoom: parseFloat(getComputedStyle(document.querySelector('.aurora')).getPropertyValue('--az')),
        photoY: parseFloat((document.querySelector('.aurora__photo').parentElement.style.transform.match(/, (-?[\\d.]+)px/) || [0, 0])[1]),
        heroImg: getComputedStyle(document.querySelector('.hero-media img')).transform
      };
    })()`);
    check(rec.in, 'h2 marcado como visível no scroll');
    const charsIn = await waitFor(() => p.eval(`[...document.querySelectorAll('#recursos h2 .ch')].every((c) => getComputedStyle(c).opacity === '1')`), 5000);
    check(charsIn, 'letras do h2 terminam visíveis');
    check(rec.progress > 0.02, 'barra de progresso avança', String(rec.progress));
    check(rec.headingShift !== '', 'deslocamento de rolagem aplicado');
    check(rec.headTransform !== 'none', 'transform de parallax ativo', rec.headTransform);
    check(rec.layers !== topLayers, 'camadas do fundo se deslocam no scroll');
    check(Math.abs(rec.photoY - baseState.photoY) > 150, 'fotografias de fundo viajam com a rolagem', baseState.photoY + ' → ' + rec.photoY);
    check(rec.zoom > 1, 'dolly do fundo acompanha a rolagem', String(rec.zoom));
    check(rec.heroImg !== 'none', 'imagem do hero também em parallax', rec.heroImg);
    await shot(p, path.join(OUT, 'desk-recursos.jpg'));

    const bandReady = await revealAfterScroll(p, '.scene-band', visibleChars('.scene-word'));
    const band = await p.eval(`(() => {
      const img = document.querySelector('.scene-band img');
      const word = document.querySelector('.scene-word');
      return { tf: getComputedStyle(img).transform, wordIn: word.classList.contains('in'), chars: [...word.querySelectorAll('.ch')].every((c) => parseFloat(getComputedStyle(c).opacity) > 0.99) };
    })()`);
    check(band.tf !== 'none', 'imagem da cena com parallax', band.tf);
    check(bandReady, 'palavra da cena revelada em letras', JSON.stringify(band));
    await shot(p, path.join(OUT, 'desk-scene.jpg'));

    await scrollTo(p, 'section.cta');
    const ctaState = await p.eval(`(() => {
      const el = document.querySelector('.aurora__photo');
      const r = el.getBoundingClientRect();
      return { tf: el.parentElement.style.transform, top: r.top, bottom: r.bottom, vh: innerHeight };
    })()`);
    const smokeY = parseFloat((ctaState.tf.match(/, (-?[\d.]+)px/) || [0, 0])[1]);
    check(Math.abs(smokeY) > 800, 'fumaça percorre a página com a rolagem', ctaState.tf + ' → ' + smokeY);
    check(ctaState.top <= 0 && ctaState.bottom >= ctaState.vh, 'fotografia cobre a tela durante todo o percurso', JSON.stringify({ top: Math.round(ctaState.top), bottom: Math.round(ctaState.bottom), vh: ctaState.vh }));
    await shot(p, path.join(OUT, 'desk-cta.jpg'));

    console.log('\nQuadro em movimento');
    await scrollTo(p, '#recursos', 300);
    await p.send('Page.navigate', { url: base + '/index.html' });
    await waitFor(() => p.eval('document.readyState === "complete"'), 20000);
    await sleep(350);
    await shot(p, path.join(OUT, 'desk-motion-frame.jpg'), 78);

    console.log('\nTroca de idioma refaz o movimento');
    await p.eval('window.scrollTo(0,0)');
    await sleep(300);
    await p.eval(`document.querySelector('[data-lang-btn="en"]').click()`);
    await sleep(600);
    const enReady = await revealAfterScroll(p, '#recursos', visibleChars('#recursos h2'));
    const en = await p.eval(`(() => {
      const h2 = document.querySelector('#recursos h2');
      return {
        text: h2.textContent,
        split: h2.classList.contains('split-chars'),
        chars: h2.querySelectorAll('.ch').length,
        h1: document.querySelector('.hero h1').textContent.trim(),
        h1Split: document.querySelector('.hero h1').classList.contains('split-chars'),
        h1Chars: document.querySelectorAll('.hero h1 .ch').length,
        violet: document.querySelector('.hero h1 .violet').textContent
      };
    })()`);
    check(en.text === 'Everything to pay less, effortlessly', 'h2 em inglês após troca', en.text);
    check(en.split && en.chars >= 24, 'h2 inglês redividido em letras', String(en.chars));
    check(enReady, 'letras em inglês visíveis');
    check(en.h1 === 'Get The Discount' && en.violet === 'Discount', 'marca vira Get The Discount', en.h1);
    check(en.h1Split && en.h1Chars >= 14, 'h1 inglês redividido em letras', String(en.h1Chars));

    console.log('\nCelular');
    const m = await newPage(b, base + '/index.html?lang=pt', 390, 844);
    const mobReady = await revealAfterScroll(m, '#pontos', visibleChars('#pontos h2'));
    const mob = await m.eval(`(() => ({
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      blob: getComputedStyle(document.querySelector('.aurora__blob')).filter
    }))()`);
    check(mob.overflow <= 1, 'sem overflow horizontal no celular', String(mob.overflow));
    check(mobReady, 'h2 visível no celular');
    check(/blur/.test(mob.blob), 'gradiente com blur reduzido', mob.blob);
    await shot(m, path.join(OUT, 'mob-pontos.jpg'));

    console.log('\nMovimento reduzido');
    const r = await newPage(b, base + '/index.html', 1280, 900, true);
    const reduced = await r.eval(`(() => ({
      motion: document.documentElement.classList.contains('motion'),
      split: document.querySelectorAll('.split').length,
      aurora: getComputedStyle(document.querySelector('.aurora')).display,
      h1: document.querySelector('.hero h1').textContent.trim(),
      h1Visible: getComputedStyle(document.querySelector('.hero h1')).visibility
    }))()`);
    check(!reduced.motion && reduced.split === 0, 'sem divisão de texto com movimento reduzido');
    check(reduced.aurora === 'none', 'fundo animado oculto');
    check(reduced.h1 === 'Pega O Desconto' && reduced.h1Visible === 'visible', 'texto normal e visível');

    console.log('\n' + (fail ? 'FALHAS: ' + fail : 'TUDO OK') + ' (' + (pass + fail) + ' verificações)');
  } finally {
    await close(b);
    server.close();
  }
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('ERRO:', e.message); process.exit(1); });
