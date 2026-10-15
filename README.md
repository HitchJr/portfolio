# Dante Persson – portfolio

Personal portfolio under the DP.IO brand: a dark page with one amber "signal" accent, bold condensed headlines, an example-brief box in the hero, proof numbers, a five-step build process, project cards, a career timeline and CV downloads.

Plain HTML, CSS and JavaScript with no build step, so it deploys anywhere static files are served.

## Files

- `index.html` – page structure and all the text
- `styles.css` – DP.IO design tokens (colours, fonts, spacing) at the top, then the layout
- `main.js` – the example-brief chips in the hero (swaps the text and pre-fills the email)
- `brand/` – DP.IO logo: white wordmark for dark backgrounds, black wordmark for light ones, and the square mark (also used as `favicon.svg`)
- `fonts/` – self-hosted Barlow, Barlow Condensed and JetBrains Mono (SIL Open Font License)

## Add or edit a project

Copy one `<article class="card project">` block in the Projects section of `index.html` and change the text. Status pills: `pill--go` (green, live or in use), `pill--signal` (amber, in progress) or plain `pill` (grey). Add `project--draft` to the article for a dashed outline.

## Run locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Deploy

Import the repo in Vercel and accept the defaults. There's no framework or build command.

## Token tracking

This project tracks how many AI tokens it took to build. The current totals are in `TOKENS.md`.
