// Locates a Chrome/Chromium binary for the browser-based checks.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

function findChrome() {
  const win = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google/Chrome/Application/chrome.exe')
  ];
  const nix = ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
  const candidates = [process.env.CHROME_BIN, ...(process.platform === 'win32' ? win : nix)].filter(Boolean);
  for (const candidate of candidates) {
    if (candidate.includes('/') || candidate.includes('\\')) {
      if (fs.existsSync(candidate)) return candidate;
    } else {
      try { execFileSync(candidate, ['--version'], { stdio: 'ignore' }); return candidate; } catch (e) {}
    }
  }
  console.error('Chrome not found. Set CHROME_BIN to the browser executable path.');
  process.exit(1);
}

function killTree(child) {
  if (!child || child.killed) return;
  try {
    if (process.platform === 'win32') execFileSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    else child.kill('SIGKILL');
  } catch (e) {}
}

module.exports = { findChrome, killTree };
