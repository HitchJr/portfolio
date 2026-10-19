# Dante Persson – portfolio

Personal portfolio under the DP.IO brand (logo: "dp" with a signal head): a dark page with one amber "signal" accent and bold condensed headlines. Projects are shown on a railway departure board whose letters and numbers roll like split-flap displays. Then results, AI and coding, experience, about, CV downloads and contact.

Plain HTML, CSS and JavaScript with no build step, so it deploys anywhere static files are served.

## Files

- `index.html` – page structure and all the text
- `styles.css` – DP.IO design tokens (colours, fonts, spacing) at the top, then the layout
- `main.js` – the departure board rows (the project list is at the top of this file), the split-flap rolling effect, and the Malmö and Hanoi clocks
- `brand/` – the dp logo (dp + signal head) for dark and light backgrounds, the full version with name and route line (`dp-lockup-*`), the app icon, and the favicon (signal head only, also `favicon.svg`). All letters are outlined paths, so no font is needed.
- `fonts/` – self-hosted Barlow, Barlow Condensed and JetBrains Mono (SIL Open Font License)

## Add or edit a project

Projects live in the `departures` list at the top of `main.js`. Copy one `{ ... }` block and change the text. `track` groups them: 1 is web apps, 2 is data, 3 is work tools. Add `change: true` to light the status up in amber (used for "Paused"). The `details` text is what opens when someone clicks the row.

## Run locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Deploy

Import the repo in Vercel and accept the defaults. There's no framework or build command.

## Token tracking

This project tracks how many AI tokens it took to build. The current totals are in `TOKENS.md`.
