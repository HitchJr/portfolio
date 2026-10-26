# Dante Persson – portfolio

Personal portfolio under the DP.IO brand (logo: "dp" with a signal head): a dark page with one amber "signal" accent and bold condensed headlines. Projects are shown on a railway departure board whose letters and numbers roll like split-flap displays. Then the career route (each role a stop on the line, with its results), AI and coding, about, CV downloads, and contact as the last departure.

Plain HTML, CSS and JavaScript with no build step, so it deploys anywhere static files are served.

## Files

- `index.html` – page structure and all the text, including the departure board rows
- `styles.css` – DP.IO design tokens (colours, fonts, spacing) at the top, then the layout
- `main.js` – only adds effects on top of the HTML: opening and closing board rows, the split-flap roll, the Malmö and Tokyo clocks, and the train on "How a build runs". The page still works if it fails to load.
- `brand/` – the dp logo (dp + signal head) for dark and light backgrounds, the full version with name and route line (`dp-lockup-*`), the app icon, and the favicon (signal head only, also `favicon.svg`). All letters are outlined paths, so no font is needed.
- `fonts/` – self-hosted Barlow, Barlow Condensed and JetBrains Mono (SIL Open Font License)

## Add or edit a project

Projects live on the departure board in `index.html`. Copy one `<li class="row">` block and change the text. Each visible board text (`.flap`) has a matching hidden text (`.sr`) that screen readers use, so update both. Give the button's `aria-controls` and the panel's `id` the same new name. Put the `is-change` class on the status cell to light it up in amber (used for "Paused").

## Run locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Deploy

Import the repo in Vercel and accept the defaults. There's no framework or build command.

## Token tracking

This project tracks how many AI tokens it took to build. The current totals are in `TOKENS.md`.
