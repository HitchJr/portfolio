# Dante Persson – portfolio

Personal portfolio under the DP.IO brand (logo: "dp" with a signal head). The page is a railway planning sheet: pale sage paper (or a night-shift dark mode), black ink, and a train graph (the time–distance chart railway traffic is planned with) where my career is one red train line through my workplaces as stations. Then experience, projects, AI and coding, about, CV downloads and contact, all lined up on the graph's station column.

Plain HTML, CSS and JavaScript with no build step, so it deploys anywhere static files are served.

## Files

- `index.html` – page structure and all the text, including the train graph and the project rows
- `styles.css` – design tokens for light and dark mode (colours, fonts, the station column width) at the top, then the layout. Red is for the train; green and red signal lamps mark project status. Sections draw in as you scroll (in browsers that support scroll-driven animation). Everything respects the visitor's reduced-motion setting.
- `main.js` – the motion and small extras: the light/dark switch, the train that drives along the career line, the route line under the header that follows your scrolling, the live Malmö clock, and opening project rows. The page works without it.
- `brand/` – the dp logo (dp + signal head) for dark and light backgrounds, the full version with name and route line (`dp-lockup-*`), the app icon, and the favicon (signal head only, also `favicon.svg`). All letters are outlined paths, so no font is needed.
- `fonts/` – self-hosted Familjen Grotesk (headlines) and Schibsted Grotesk (text), both SIL Open Font License

## Add or edit a project

Projects are in `index.html`, in the Projects section. Copy one `<li class="dep">` block and change the text. Give the button's `aria-controls` and the panel's `id` the same new name.

## Change the train graph

The graph is in `index.html` near the top. Each workplace is one `<li class="st">` row, and the red line is the `<path>` elements in the SVG. Positions are percentages: across, the plot runs from mid-2014 (0) to mid-2027 (100), so one year is about 7.69; down, each of the 7 rows is 14.29 tall, with row centres at 7.14, 21.43, 35.71 and so on. To move "now" later, change the last numbers in `seg--ld`, the start of `seg--next`, and `--x` on `.now` and `.now-line`.

## Run locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Deploy

Import the repo in Vercel and accept the defaults. There's no framework or build command.

## Token tracking

This project tracks how many AI tokens it took to build. The current totals are in `TOKENS.md`.
