# Dante Persson – portfolio

Personal portfolio built like a Swedish station departure board. Each project is a departure; select one to see the details. My career runs below it as a route line from Trelleborg to Vietnam.

Plain HTML, CSS and JavaScript with no build step, so it deploys anywhere static files are served.

## Files

- `index.html` – page structure and text
- `styles.css` – design tokens, layout and the board styling
- `main.js` – project data for the board, the split-flap load effect and the Malmö/Hanoi clocks
- `fonts/` – self-hosted Barlow (SIL Open Font License)

## Add or edit a project

Edit the `departures` array at the top of `main.js`. Each entry has a time, name, one-line description, stack ("via"), track (1 web apps, 2 data, 3 work tools), status and an HTML details block. Set `change: true` to show the status in board yellow.

## Run locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Deploy

Import the repo in Vercel and accept the defaults. There's no framework or build command.

## Token tracking

This project tracks how many AI tokens it took to build. The current totals are in `TOKENS.md`.
