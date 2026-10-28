# Dante Persson – portfolio

My personal website: **[dante-persson.vercel.app](https://dante-persson.vercel.app)**

I lead safety on railway worksites in Sweden, and before that I spent almost four years controlling train traffic in Trafikverket’s 24/7 control centre. I also like finding faster ways to work, so I build tools: Excel automation my team uses every day, and web apps in my free time. I’m moving to Vietnam and looking for my next role in projects, operations or IT.

## What’s on the site

- **A train ticket** from Malmö C to Vietnam as the opening, with a live track display behind it. The trains follow real signalling rules: no two trains share a block, and signals turn red behind a train until it has moved on.
- **Where I’ve worked**, as a route line with the current job as the green stop.
- **Things I’ve built**, each with its own case study: Rail Pulse, TokenWise AI, VoiceReader and my track work automation.
- **My CV** in three versions, in light and dark, matching the site’s theme.

## How it’s built

Plain HTML, CSS and JavaScript, with no framework and no build step. I decided the design and content, and built it with AI coding tools (Claude Code).

- **Design:** IBM Plex Sans and Mono, and a “forest signal” colour scheme: warm grey paper with deep green in light mode, a green-black control screen in dark mode.
- **Motion:** a split-flap departure board, the track display, a route line that follows your scrolling. Visitors who switch off motion in their device settings get a still page.
- **Accessibility:** all text meets WCAG AA contrast in both themes, images have descriptions, and buttons have labels.
- **Privacy and security:** no cookies, no tracking, fonts self-hosted so no visitor data goes to Google, and security headers set in `vercel.json`. See the [privacy page](https://dante-persson.vercel.app/privacy.html).
- **Hosting:** Vercel. `main` goes live automatically, every other branch gets a preview link.

## Files

- `index.html` – home page; `projects/` – one case study per project; `privacy.html` – privacy notice
- `styles.css` – colours and fonts at the top, then the layout
- `site.js` – theme toggle, scroll fade-ins, departure board, track display, clocks
- `cv/` – the CVs; `cv/source/` builds them (`node cv/source/build_cvs.mjs`)
- `brand/` – logo files and brand sheet; `node brand/build_brand.mjs` rebuilds the logos
- `fonts/` – IBM Plex (SIL Open Font License)

### Notes for changes

- If you add an inline script, add its hash to the Content-Security-Policy in `vercel.json`, or the browser will block it.
- If you ever add analytics, cookies, a form or anything loaded from another site, update `privacy.html` and the security policy.
- To run it locally, open `index.html` in a browser.

## Contact

[dantep@live.se](mailto:dantep@live.se) · [LinkedIn](https://www.linkedin.com/in/dante-persson/)
