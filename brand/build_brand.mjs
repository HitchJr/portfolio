// Writes the brand logo files: the "track and signal" mark in light and dark.
// SVGs are written directly; PNGs (for LinkedIn, email and the like) are
// rendered with Edge or Chrome so the lockups get real IBM Plex type.
// Run: node brand/build_brand.mjs
import { writeFileSync, unlinkSync, existsSync, rmSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

// Same colours as the website and CVs
const THEMES = {
  light: { page: "#F0F0EA", tile: "#E5E6DD", ink: "#18221C", lit: "#1E8A4C", off: "#C9CDBF", track: "#B3BBAA", dim: "#46524A" },
  dark:  { page: "#0D1410", tile: "#15201A", ink: "#E7EEE8", lit: "#6FD49A", off: "#2B3D32", track: "#3A4E41", dim: "#A5B4AA" },
};

// The mark on a 64 x 64 grid: two rails with sleepers, and a signal showing green
export function mark(t) {
  const sleepers = [12, 20, 28, 36, 44, 52]
    .map((x) => `<path d="M${x} 40v12" stroke="${t.track}" stroke-width="2.4" stroke-linecap="round"/>`).join("");
  return `<rect x="2" y="2" width="60" height="60" rx="14" fill="${t.tile}"/>${sleepers}` +
    `<path d="M7 43h50M7 49h50" stroke="${t.ink}" stroke-width="2.6" stroke-linecap="round"/>` +
    `<path d="M44 43V24" stroke="${t.ink}" stroke-width="2.6" stroke-linecap="round"/>` +
    `<rect x="38" y="8" width="12" height="20" rx="6" fill="${t.ink}"/>` +
    `<circle cx="44" cy="14" r="2.8" fill="${t.off}"/><circle cx="44" cy="22" r="2.8" fill="${t.lit}"/>`;
}

const svg = (body, size = 256) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}" role="img" aria-label="Dante Persson">${body}</svg>\n`;

for (const name of ["light", "dark"]) writeFileSync(join(HERE, `logo-${name}.svg`), svg(mark(THEMES[name])));

// Favicon follows the browser's light or dark mode
const darkCss = Object.entries({ [THEMES.light.tile]: THEMES.dark.tile, [THEMES.light.ink]: THEMES.dark.ink,
  [THEMES.light.lit]: THEMES.dark.lit, [THEMES.light.off]: THEMES.dark.off, [THEMES.light.track]: THEMES.dark.track });
let fav = mark(THEMES.light);
darkCss.forEach(([from], i) => { fav = fav.replaceAll(`"${from}"`, `"${from}" class="c${i}"`); });
const style = `<style>@media (prefers-color-scheme: dark){${darkCss.map(([, to], i) =>
  `.c${i}[fill]{fill:${to}}.c${i}[stroke]{stroke:${to}}`).join("")}}</style>`;
writeFileSync(join(HERE, "..", "favicon.svg"), svg(style + fav, 64));

// PNGs: icon and lockup per theme
const html = (t, lockup) => `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500&family=IBM+Plex+Sans:wght@600&display=swap" rel="stylesheet">
<style>html,body{margin:0;background:${lockup ? t.page : "transparent"}}
.l{display:flex;align-items:center;gap:40px;padding:0 64px;height:320px}
.l b{display:block;font:600 84px/1 "IBM Plex Sans";letter-spacing:-.02em;color:${t.ink}}
.l span{display:block;margin-top:16px;font:500 30px "IBM Plex Mono";color:${t.dim}}</style></head><body>
${lockup ? `<div class="l"><svg viewBox="0 0 64 64" width="200" height="200">${mark(t)}</svg><div><b>Dante Persson</b><span>Operations · Projects · IT</span></div></div>`
         : `<svg viewBox="0 0 64 64" width="512" height="512" style="display:block">${mark(t)}</svg>`}
</body></html>`;

const browser = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
].find((b) => existsSync(b));
if (!browser) throw new Error("No Edge or Chrome found to render the PNGs.");
// Own profile, so an open Edge window does not take over the job
const profile = mkdtempSync(join(tmpdir(), "brand-"));
const wait = (file) => { for (let i = 0; i < 200 && !existsSync(file); i++) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100); };

for (const name of ["light", "dark"]) {
  for (const [file, lockup, size] of [[`logo-${name}.png`, false, "512,512"], [`lockup-${name}.png`, true, "980,320"]]) {
    const tmp = join(HERE, `_${file}.html`);
    writeFileSync(tmp, html(THEMES[name], lockup), "utf8");
    execFileSync(browser, ["--headless=new", "--disable-gpu", `--user-data-dir=${profile}`, "--hide-scrollbars", "--default-background-color=00000000",
      "--virtual-time-budget=8000", `--window-size=${size}`, `--screenshot=${join(HERE, file)}`, pathToFileURL(tmp).href],
      { stdio: "ignore" });
    wait(join(HERE, file));
    unlinkSync(tmp);
    console.log("built", file);
  }
}
try { rmSync(profile, { recursive: true, force: true, maxRetries: 10 }); } catch {} // Edge may still hold it; the OS temp folder clears it later
