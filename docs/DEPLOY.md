# Deploy

The site is plain static files. Any host that serves Apache with `.htaccess` works — shared cPanel hosting is enough.

## 1. Build the package

```bash
npm ci --prefix tools
npm run zip --prefix tools
```

The archive is written to `dist/pegaodesconto-landing.zip`, with `index.html` at its root.

## 2. Upload

Upload and extract the zip inside the document root of the domain (usually `public_html`). After extraction, the document root must contain `index.html`, `ofertas.html`, `privacidade.html`, `termos.html`, `assets/`, `css/`, `js/` and `.htaccess`.

If your host hides dotfiles in the file manager, upload `.htaccess` separately over FTP/SFTP. Without it, the clean URLs return 404.

## 3. Clean URLs

`landing/.htaccess` contains:

```apache
RewriteRule ^politica-de-privacidade/?$ privacidade.html [L]
RewriteRule ^termos-e-condicoes/?$ termos.html [L]
```

Requirements:

- `mod_rewrite` enabled
- `AllowOverride All` (or at least `AllowOverride FileInfo`) for the document root
- the file uploaded at the document root, not inside a subfolder

Test:

```bash
curl -I https://pegaodesconto.x-os.org/politica-de-privacidade
curl -I https://pegaodesconto.x-os.org/termos-e-condicoes
```

Both must return `200`, not `404`.

## 4. HTTPS

Enable the free certificate in the hosting panel and force HTTPS. The canonical tags and the sitemap use `https://`, so a HTTP-only deploy creates duplicate URLs in search results.

## 5. Verify

```bash
curl -sI https://pegaodesconto.x-os.org/ | head -5
curl -s https://pegaodesconto.x-os.org/sitemap.xml
```

Check that:

- the home page returns `200` and `text/html`
- `/sitemap.xml` lists `/`, `/ofertas.html`, `/politica-de-privacidade` and `/termos-e-condicoes`
- `/robots.txt` points to the sitemap
- the browser console shows no failed requests

## 6. Cache

`.htaccess` sets long-lived caching for fonts, images and styles. Because file names are stable, bump the query string (`style.css?v=1.2`) when you replace an asset that browsers may have cached, or rename the file.

## Rollback

Keep the previous zip. To roll back, re-upload it over the current files; no database or migration is involved.
