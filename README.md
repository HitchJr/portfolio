# Dante Persson – portfolio

Personal portfolio. The page opens with a train ticket from Malmö C to Vietnam, followed by a timeline of where I've worked, the projects I've built (each with its own case study page) and contact details. Light by default, with a dark mode toggle.

Plain HTML, CSS and JavaScript with no build step, so it deploys anywhere static files are served.

## Files

- `index.html` – home page: ticket, experience timeline, projects and contact
- `projects/` – one case study page per project
- `styles.css` – colours, fonts and spacing at the top, then the layout
- `site.js` – dark mode toggle, scroll fade-ins, the waveform on the VoiceReader card and the Malmö and Hanoi clocks
- `img/` – project screenshots
- `cv/` – CV PDFs (the Download CV buttons link to `cv/Dante_Persson_CV_Standard.pdf`)
- `brand/` – the dp logo files and favicon

Fonts are Fraunces (headings), Geist and Geist Mono, loaded from Google Fonts.

## Add or edit a project

Add a card in the "Things I've built" section of `index.html`, then copy one of the pages in `projects/` and change the text.

## Run locally

Open `index.html` in a browser.

## Deploy

The Vercel project deploys `main` to production automatically. Every other branch gets its own preview link. There's no framework or build command.

## Token tracking

This project tracks how many AI tokens it took to build. The current totals are in `TOKENS.md`.
