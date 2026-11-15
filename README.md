# Pega O Desconto — landing page

[![CI](https://github.com/jonypeixoto/landing/actions/workflows/ci.yml/badge.svg)](https://github.com/jonypeixoto/landing/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-6d5bd0.svg)](LICENSE)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-22c55e.svg)](CONTRIBUTING.md)

The public website for **Pega O Desconto**, a browser extension that finds prices, promos and coupons while you shop.

**Live:** https://pegaodesconto.x-os.org · **Extension:** [Chrome Web Store](https://chromewebstore.google.com/detail/pega-o-desconto/nkjhgolgbhlejnagekgpfadmhadejgfm)

![Pega O Desconto](landing/assets/img/hero.jpg)

<details>
<summary><strong>Português (BR)</strong></summary>

Site estático da extensão Pega O Desconto: HTML/CSS/JS puro, bilíngue (PT/EN), sem dependências de runtime e sem rastreadores. 318 verificações automatizadas rodam em navegador real. Licença MIT — contribuições são bem-vindas.

</details>

## Why this repo is different

- **Zero runtime dependencies.** No framework, no bundler, no CDN. The page is plain HTML, CSS and ES modules, served from any static host.
- **No third-party requests.** Self-hosted fonts, local images, no analytics or ad scripts. Open DevTools and count the requests.
- **318 automated checks.** Static validation, a bilingual UI audit and a parallax/motion audit, all reproducible with `npm test`.
- **Bilingual by design.** PT-BR is the source language; English lives in a dictionary and is applied through `data-i18n` attributes, with a persisted language switch.
- **Real-browser verification.** The checks drive Chrome over the DevTools Protocol instead of mocking a DOM, so layout, fonts and scroll behaviour are actually exercised.

## Quick start

```bash
git clone https://github.com/jonypeixoto/landing.git
cd landing
npm ci --prefix tools
npm run serve --prefix tools
```

Open http://127.0.0.1:8090. Clean URLs (`/politica-de-privacidade`, `/termos-e-condicoes`) are mirrored locally, exactly like the Apache rules in production.

Requirements: Node.js 20+ and a local Chrome/Chromium for the browser checks (`CHROME_BIN` is auto-detected, or set it explicitly).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run serve --prefix tools` | Local preview with the production clean URLs |
| `npm test --prefix tools` | 210 static checks: links, anchors, assets, JSON, SEO, legal content |
| `npm run check:i18n --prefix tools` | 68 checks in real Chrome: PT/EN switch, layout, mobile, screenshots |
| `npm run check:motion --prefix tools` | 40 checks: animated background, scroll typography, parallax, reduced motion |
| `npm run zip --prefix tools` | Builds `dist/pegaodesconto-landing.zip` ready to upload |

The browser checks write screenshots to `dist/screenshots/` so you can review what was asserted.

## Project structure

```
landing/
  index.html          hero, features, deals, points, FAQ
  ofertas.html        game deals feed rendered from deals.json
  privacidade.html    privacy policy
  termos.html         terms of use
  css/style.css       design tokens, layout, motion
  js/main.js          navigation, language switch, CTA wiring
  js/i18n.js          EN dictionary + PT/EN switch logic
  js/motion.js        parallax, reveal-on-scroll, marquee
  js/ofertas.js       deals feed rendering and filtering
  deals.json          curated store list and official deal links
  .htaccess           clean URLs, caching, compression
tools/
  check-landing.js    static audit (no dependencies)
  check-i18n.js       CDP-driven bilingual audit
  check-motion.js     CDP-driven motion audit
  chrome.js           browser discovery and process cleanup
  zip.js              production packaging
  serve.js            local preview server
docs/
  DEPLOY.md           hosting, DNS and clean-URL setup
  I18N.md             how the translation system works
```

## How it works

**i18n.** Portuguese is written directly in the HTML. English lives in `landing/js/i18n.js`. Elements opt in with `data-i18n`, `data-i18n-html`, `data-i18n-content` or `data-i18n-aria`; the chosen language is persisted in `localStorage` and can be forced with `?lang=en`. Details in [docs/I18N.md](docs/I18N.md).

**Motion.** `js/motion.js` combines IntersectionObserver reveals with a requestAnimationFrame loop for parallax, and respects `prefers-reduced-motion` by disabling transforms and the animated background.

**Deals.** `deals.json` is the single source of truth for the offers page: store names, official deal-page URLs and dates. No prices are scraped or invented; every link points to the store's own page.

**Privacy.** No cookies, no analytics, no fingerprinting. The policy in `privacidade.html` describes exactly what the site and the extension do — nothing aspirational.

## Deploy

```bash
npm ci --prefix tools
npm run zip --prefix tools
```

Upload `dist/pegaodesconto-landing.zip` to any static host with `.htaccess` support (Apache/cPanel). The zip has `index.html` at its root. Clean URLs depend on the rewrite rules already included. Full checklist: [docs/DEPLOY.md](docs/DEPLOY.md).

## Contributing

Issues and pull requests are welcome — translations, accessibility fixes, copy improvements and new curated deal sources especially. Start with [CONTRIBUTING.md](CONTRIBUTING.md) and look for the `good first issue` label.

- Report a bug: [new issue](https://github.com/jonypeixoto/landing/issues/new/choose)
- Security report: see [SECURITY.md](SECURITY.md)
- Community standards: [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

## License

[MIT](LICENSE) © Pega O Desconto. Brand assets (logo, wordmark and product imagery) are not covered by the code license.
