# Contributing

Thanks for helping. This project is intentionally small and dependency-free, so most contributions are a single HTML, CSS or JS file plus a test run.

## Setup

```bash
git clone https://github.com/Pega-O-Desconto/Pega-O-Desconto.git
cd Pega-O-Desconto
npm ci --prefix tools
npm run serve --prefix tools
```

Open http://127.0.0.1:8090. Node.js 20+ is required. Browser checks need Chrome or Chromium; set `CHROME_BIN` if it is not auto-detected.

## Before opening a pull request

Run the full suite:

```bash
npm test --prefix tools
npm run check:i18n --prefix tools
npm run check:motion --prefix tools
```

All three must pass. If you changed layout or copy, review the screenshots in `dist/screenshots/` — they are the evidence the checks assert against.

## What we accept

- **Translations and copy fixes.** Portuguese is the source language; English lives in `landing/js/i18n.js`. See [docs/I18N.md](docs/I18N.md).
- **Accessibility fixes.** Keyboard navigation, focus states, contrast, semantic landmarks, `prefers-reduced-motion`.
- **Curated deal sources.** Every entry in `landing/deals.json` must link to an official store page. Never add scraped prices, affiliate redirects or invented promotions.
- **Performance and correctness.** Smaller CSS, fewer bytes, safer DOM code.

## What we do not accept

- Third-party scripts, fonts, pixels, analytics or CDN assets. The site must keep rendering with zero external requests.
- Cookie banners or tracking of any kind.
- Content that promises discounts, prices or savings the extension cannot verify.
- Bundled code from other products. Contributions must be your own work or compatibly licensed.

## Style

- Match the existing formatting: two-space indentation, single quotes in JS, no semicolons in HTML attributes beyond what is required.
- Keep CSS custom properties in `:root` instead of hard-coded colors.
- New user-visible text needs a PT string in the HTML and an EN entry in `i18n.js`.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `test:`, `chore:`.

## Pull request checklist

- [ ] The three test suites pass locally
- [ ] New text exists in both PT and EN
- [ ] No external network requests were introduced
- [ ] Screenshots reviewed for the pages I touched
- [ ] The change is focused; unrelated refactors are separate PRs

Maintainers aim to review within 72 hours. If a PR goes quiet, comment on it — no contribution is ignored on purpose.
