## What changed

<!-- One or two sentences. Link the issue if there is one. -->

## How to verify

<!-- Steps a reviewer can follow, or the command that proves it. -->

## Checklist

- [ ] `npm test --prefix tools` passes
- [ ] `npm run check:i18n --prefix tools` passes (if copy or layout changed)
- [ ] `npm run check:motion --prefix tools` passes (if motion changed)
- [ ] New text exists in both Portuguese and English
- [ ] No third-party scripts, fonts, analytics or external requests added
- [ ] Screenshots reviewed in `dist/screenshots/`
