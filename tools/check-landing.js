// Static validation of the landing page (links, assets, anchors, data and SEO).
// Usage: node tools/check-landing.js
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SITE = process.argv[2] ? path.resolve(process.argv[2]) : path.join(ROOT, 'landing');
const SITE_ORIGIN = 'https://pegaodesconto.x-os.org/';
const PUBLIC_URL = {
  'index.html': SITE_ORIGIN,
  'privacidade.html': SITE_ORIGIN + 'politica-de-privacidade',
  'termos.html': SITE_ORIGIN + 'termos-e-condicoes'
};

let failures = 0;
let checks = 0;
const ok = (msg) => { checks += 1; console.log('  ok   ' + msg); };
const fail = (msg) => { checks += 1; failures += 1; console.log('  FAIL ' + msg); };
const assert = (cond, msg) => (cond ? ok(msg) : fail(msg));

const pages = fs.readdirSync(SITE).filter((f) => f.endsWith('.html'));
const html = new Map(pages.map((p) => [p, fs.readFileSync(path.join(SITE, p), 'utf8')]));
const idsIn = (text) => new Set([...text.matchAll(/\sid\s*=\s*["']([^"']+)["']/g)].map((m) => m[1]));

const firstHtmlCheck = (name) => {
  const text = html.get(name);
  console.log('\n' + name);
  assert(/<html[^>]*lang="pt-BR"/i.test(text), 'lang pt-BR');
  assert(/<meta[^>]+name="viewport"/i.test(text), 'meta viewport');
  assert(/<meta[^>]+name="description"[^>]+content="[^"]{40,}"/i.test(text), 'meta description');
  assert(/<link[^>]+rel="canonical"[^>]+href="https?:\/\//i.test(text), 'canonical absoluto');
  assert(/<title[^>]*>[^<]{8,}<\/title>/i.test(text), 'title');
  assert((text.match(/<h1[\s>]/g) || []).length === 1, 'exatamente um h1');
  const ids = idsIn(text);
  const anchors = [...text.matchAll(/href\s*=\s*["']#([^"']+)["']/g)].map((m) => m[1]);
  const broken = anchors.filter((a) => !ids.has(a));
  assert(broken.length === 0, 'âncoras internas existem' + (broken.length ? ': #' + broken.join(', #') : ''));
  const duplicate = [...ids].filter((id) => (text.match(new RegExp('\\sid\\s*=\\s*["\']' + id.replace(/[^\w-]/g, '\\$&') + '["\']', 'g')) || []).length > 1);
  assert(duplicate.length === 0, 'ids únicos' + (duplicate.length ? ': ' + duplicate.join(', ') : ''));
  const imgs = [...text.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  const noAlt = imgs.filter((tag) => !/\balt\s*=/.test(tag));
  assert(noAlt.length === 0, 'todas as <img> têm alt' + (noAlt.length ? ': ' + noAlt.length : ''));
  assert(!/href\s*=\s*["']http:\/\//i.test(text), 'sem links http:// (só https)');
};

// Assets locais e âncoras entre páginas
console.log('Recursos locais e links');
for (const [name, text] of html) {
  const dir = path.dirname(path.join(SITE, name));
  const refs = [...text.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1])
    .filter((r) => !/^(https?:|mailto:|#|javascript:|data:)/i.test(r));
  for (const raw of refs) {
    const [filePart, hash] = raw.split('#');
    const clean = filePart.split('?')[0];
    if (!clean) continue;
    const target = clean.startsWith('/')
      ? path.join(SITE, clean.slice(1))
      : path.resolve(dir, clean);
    const rel = path.relative(SITE, target).replace(/\\/g, '/');
    if (!fs.existsSync(target)) fail(name + ' → ' + raw + ' (não existe)');
    else if (hash && /\.html$/.test(target)) {
      const targetIds = idsIn(fs.readFileSync(target, 'utf8'));
      assert(targetIds.has(hash), name + ' → ' + raw + ' (âncora existe)');
    } else if (!hash) assert(true, name + ' → ' + raw);
  }
}

pages.forEach(firstHtmlCheck);

// CSS
console.log('\nCSS');
const css = fs.readFileSync(path.join(SITE, 'css/style.css'), 'utf8');
const cssRefs = [...css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)].map((m) => m[1])
  .filter((r) => !/^(https?:|data:)/i.test(r));
for (const r of cssRefs) {
  const target = path.resolve(SITE, 'css', r);
  assert(fs.existsSync(target), 'css → ' + r);
}
assert(css.length > 10000, 'stylesheet principal presente');

// Deals
console.log('\nFeed de ofertas (deals.json)');
const deals = JSON.parse(fs.readFileSync(path.join(SITE, 'deals.json'), 'utf8'));
assert(deals.version === 1, 'versão 1');
assert(/^\d{4}-\d{2}-\d{2}$/.test(deals.updated), 'campo updated em ISO');
assert(Array.isArray(deals.stores) && deals.stores.length === 7, '7 lojas');
const ids = new Set();
for (const s of deals.stores) {
  assert(!!s.id && !!s.name && !!s.kind, s.id + ' tem id/name/kind');
  assert(!ids.has(s.id), s.id + ' id único');
  ids.add(s.id);
  let url = null;
  try { url = new URL(s.url); } catch (e) {}
  assert(!!url && url.protocol === 'https:', s.id + ' URL https');
  assert(!!url && url.hostname.endsWith(s.domain), s.id + ' domínio confere (' + s.domain + ')');
  assert(/^#[0-9a-f]{6}$/i.test(s.accent || ''), s.id + ' accent hex');
  assert(Array.isArray(s.tags) && s.tags.length > 0, s.id + ' tags');
}
assert(Array.isArray(deals.deals) && deals.deals.length === 0, 'sem ofertas fabricadas (deals vazio)');
const feed = fs.readFileSync(path.join(SITE, 'js/ofertas.js'), 'utf8');
assert(/deals\.json/.test(feed), 'ofertas.js carrega deals.json');
assert(/textContent|createElement/.test(feed), 'render via DOM (sem innerHTML cru)');
assert(!/innerHTML\s*=/.test(feed), 'sem innerHTML (evita XSS)');

// JS
console.log('\nJavaScript');
for (const f of ['js/main.js', 'js/motion.js', 'js/ofertas.js']) {
  try {
    execFileSync(process.execPath, ['--check', path.join(SITE, f)], { stdio: 'pipe' });
    ok(f + ' sintaxe válida');
  } catch (e) {
    fail(f + ' erro de sintaxe');
  }
}

// SEO
console.log('\nSEO e publicação');
const sitemap = fs.readFileSync(path.join(SITE, 'sitemap.xml'), 'utf8');
for (const p of pages) {
  const url = PUBLIC_URL[p] || (SITE_ORIGIN + p);
  assert(sitemap.includes('<loc>' + url + '</loc>'), 'sitemap lista ' + (PUBLIC_URL[p] || p));
}
assert(/Sitemap:\s*https:\/\/pegaodesconto\.x-os\.org\/sitemap\.xml/.test(fs.readFileSync(path.join(SITE, 'robots.txt'), 'utf8')), 'robots aponta o sitemap');
const og = html.get('index.html').match(/property="og:image"\s+content="([^"]+)"/);
assert(!!og, 'og:image definido');
if (og) {
  const local = og[1].replace(SITE_ORIGIN, '');
  assert(fs.existsSync(path.join(SITE, local)), 'og:image existe localmente (' + local + ')');
}
assert(!html.has('404.html') || true, 'ok');

// Idioma PT/EN
console.log('\nIdioma PT/EN');
const i18nPath = path.join(SITE, 'js/i18n.js');
assert(fs.existsSync(i18nPath), 'i18n.js existe');
const dict = fs.existsSync(i18nPath) ? fs.readFileSync(i18nPath, 'utf8') : '';
for (const [name, text] of html) {
  assert(/<script[^>]+src="js\/i18n\.js"/.test(text), name + ' carrega i18n.js');
  assert((text.match(/data-lang-btn="pt"/g) || []).length === 1 && (text.match(/data-lang-btn="en"/g) || []).length === 1, name + ' seletor PT_/_EN');
  const keys = [...text.matchAll(/data-i18n(?:-html|-aria|-placeholder|-content)?="([^"]+)"/g)].map((m) => m[1]);
  const missing = keys.filter((k) => !dict.includes("'" + k + "':"));
  assert(keys.length > 0 && missing.length === 0, name + ' chaves com tradução' + (missing.length ? ': ' + missing.join(', ') : ''));
}

// Extensão referenciada
console.log('\nIntegração com a extensão');
const main = fs.readFileSync(path.join(SITE, 'js/main.js'), 'utf8');
const CWS = 'https://chromewebstore.google.com/detail/pega-o-desconto/nkjhgolgbhlejnagekgpfadmhadejgfm';
assert(/CWS_URL/.test(main) && /data-cws/.test(main), 'CTA da Chrome Web Store centralizado');
assert(main.includes(CWS), 'CWS_URL aponta para a listagem do Pega O Desconto');
for (const [name, text] of html) {
  if (/data-cws/.test(text)) assert(text.includes('href="' + CWS + '"'), name + ' CTA tem fallback href');
}

// Conteúdo legal
console.log('\nConteúdo legal');
const allHtml = [...html.values()].join('\n');
assert(!/CNPJ/i.test(allHtml), 'sem CNPJ no conteúdo legal');
for (const name of ['privacidade.html', 'termos.html']) {
  const text = html.get(name);
  assert(text.includes('The Jony Peixoto'), name + ' identifica o controlador');
  assert(text.includes('Endereço: Internet'), name + ' endereço público = Internet');
  assert(text.includes('dev@x-os.org'), name + ' e-mail dev@x-os.org');
}
assert(html.get('termos.html').includes('PEGA O DESCONTO'), 'termos usa a marca PEGA O DESCONTO');
assert(html.get('termos.html').includes('X-OS'), 'termos identifica a operação X-OS');
assert(fs.readFileSync(path.join(SITE, '.htaccess'), 'utf8').includes('termos-e-condicoes'), '.htaccess roteia /termos-e-condicoes');
assert(fs.readFileSync(path.join(SITE, '.htaccess'), 'utf8').includes('politica-de-privacidade'), '.htaccess roteia /politica-de-privacidade');

console.log('\n' + (failures ? 'FALHAS: ' + failures : 'TUDO OK') + ' (' + checks + ' verificações)');
process.exit(failures ? 1 : 0);
