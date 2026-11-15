# Security policy

## Reporting a vulnerability

Email **dev@x-os.org** with:

- A description of the issue and its impact
- Steps to reproduce, or a minimal proof of concept
- The page or file affected

Please do **not** open a public issue for security problems. We acknowledge reports within 72 hours and will keep you updated until a fix ships.

## Scope

This repository contains a static website: HTML, CSS, vanilla JavaScript and a JSON data file. There is no server-side code, no database and no user accounts on the site itself.

In scope:

- Cross-site scripting through the deals feed or query parameters
- Open redirects or unsafe URL handling
- Content injection through `deals.json`
- Dependency issues in `tools/`

Out of scope:

- Reports that require a compromised browser or extension
- Missing security headers on hosting that is outside this repository's control
- Social engineering
- Automated scanner output without a reproducible impact

## Supported versions

The deployed site and the latest commit on `main` are supported. Older forks are not.
