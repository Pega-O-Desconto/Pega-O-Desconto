// Packs the landing page for upload (index.html at the zip root).
// Usage: node tools/zip.js
const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'landing');
const OUT = path.join(ROOT, 'dist/pegaodesconto-landing.zip');

function walk(dir, base, zip) {
  for (const name of fs.readdirSync(dir)) {
    const abs = path.join(dir, name);
    const rel = base ? base + '/' + name : name;
    if (fs.statSync(abs).isDirectory()) walk(abs, rel, zip);
    else zip.file(rel, fs.readFileSync(abs));
  }
}

const zip = new JSZip();
walk(SRC, '', zip);
zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 } })
  .then((buf) => {
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, buf);
    console.log('wrote', path.relative(ROOT, OUT), buf.length, 'bytes');
  });
