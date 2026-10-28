# CV design standard

Every CV follows one design, one layout and one way of writing. All versions are built from the files in this folder, so a change here changes every CV.

## Build

```bash
node cv/source/build_cvs.mjs
```

Needs Node 18 or newer and Microsoft Edge or Google Chrome, which prints the PDFs. The light PDFs are written to `cv/` with the same file names the site links to, and the dark ones to `cv/dark/`.

## Files

- `build_cvs.mjs` – all the content and the layout. Shared text (contact, jobs, languages, interests) is at the top, and each version is one entry in `CVS`.
- `style.css` – the "forest signal" design, the same as the website: IBM Plex Sans and IBM Plex Mono, a green-black header, deep green accents in light mode and signal green in dark mode.
- `photo.jpg` – the photo in the header.

## Design rules

- **One A4 page.** If a version runs onto a second page, shorten it rather than shrinking the type.
- **Two variants.** Light (paper page, dark header) for printing and most applications. Dark (the whole page is the control screen) for sending as a PDF when it suits the company.
- **Header.** Dark in both variants. It holds the role icon and an eyebrow line, the name with "Persson" in green, and a contact line. Below that is the Portfolio button, and the photo sits small on the right with a green border. Under the header runs a track with block joints and one green signal.
- **Experience as a route line.** Each job is a stop on a vertical line, and the current job is the green stop. Older, less relevant jobs go under "Earlier roles" as one line each.
- **Sidebar, in this order:** Skills, Languages, Projects, Education, Interests.
- **Key skills line** at the end of About me: about ten standard terms that CV screening software (ATS and AI screeners) searches for, set per version in `keywords`. Only terms for things Dante has actually done, no Swedish-only terms.
- **Text order for screening software:** the PDF must read About me, Key skills, Work experience, then the sidebar. The sidebar is positioned in `style.css` for this; check the order after layout changes.
- **Role icon.** Each version has its own icon in the eyebrow, drawn like a signal: dark body, one part lit green.
  - `signal`: railway (a signal head)
  - `server`: IT and operations (a server rack)
  - `plan`: project management (a task timeline)

  To add an icon, add it to `ICONS` in `build_cvs.mjs`.

## Writing rules

- Plain, short sentences in Dante's own voice. No buzzwords, no "core competencies" lists, no headline slogans.
- Only facts Dante has stated. Don't add claims to fit a job ad.
- "About me" describes him in general. It is not written at a specific job.
- Each version changes only the eyebrow and icon, the second paragraph of About me, the order of bullets, which jobs get full entries, and the skills it leads with.

## Add a new version

Copy an entry in `CVS`, give it a new `file`, `label`, `icon` and `eyebrow`, adjust the parts listed above, run the build, and check that it is still one page.
