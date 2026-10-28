// Build every CV version, in a light and a dark variant, from one template.
//
// All versions share the same design (style.css), layout (page() below) and
// wording. Each version only changes the eyebrow icon and label, the About me
// text, which jobs get full entries, and the skills it leads with.
//
// Run from the repo root:  node cv/source/build_cvs.mjs
// Needs: Node 18+ and Microsoft Edge or Google Chrome (used to print the PDFs).
import { writeFileSync, unlinkSync, existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "..");

// ---------- Shared content (the same on every CV) ----------

const CONTACT = [
  { text: "Malmö, Sweden" },
  { text: "+46 72 235 20 02" },
  { text: "dantep@live.se", href: "mailto:dantep@live.se" },
  { text: "linkedin.com/in/dante-persson", href: "https://www.linkedin.com/in/dante-persson" },
];
const GITHUB = { text: "github.com/HitchJr", href: "https://github.com/HitchJr" };

const LANGUAGES = [["Swedish", "Native"], ["English", "Fluent"], ["Danish", "Good"], ["Norwegian", "Good"], ["German", "Basic"]];

const INTERESTS = "I travel whenever I get the chance, and I always try to find somewhere to surf. " +
  "At home I play football with friends, and I'm trying to become a better cook.";

const INTRO = "I have worked in operations for most of my career, mostly on the railway. For almost four " +
  "years I controlled rail traffic at Trafikverket, and since May 2026 I've worked as a Chief " +
  "Track Work Supervisor, leading track work projects on the railway.";

const HTSM = {
  title: "Chief Track Work Supervisor (Huvudtillsyningsman)",
  org: "LD Järnväg & Planering AB",
  when: "May 2026 – present · Malmö",
  bullets: [
    "Lead safety on railway worksites from planning to hand-back, often on several projects at the same time",
    "Plan each project with Trafikverket (Swedish Transport Administration) and coordinate all " +
      "the protection on the track",
    "Keep traffic control updated until the track is ready for trains again",
    "Cut the paperwork with Excel and VBA tools I built, which save a team of 6 people 2–4 hours a day",
  ],
};
const TRAFIKVERKET = {
  title: "Train Traffic Controller",
  org: "Trafikverket",
  when: "Sep 2022 – May 2026 · Malmö",
  bullets: [
    "Controlled trains, shunting and track inspection runs through remote signalling systems in the " +
      "24/7 control centre, working shifts around the clock",
    "Handled accidents, technical faults and other disruptions by rerouting trains, changing " +
      "timetables or stopping traffic, together with the police, fire service or ambulance when needed",
    "Constant contact with train drivers, other traffic controllers and passenger information",
    "Part of the team that programmed the train automation system",
  ],
};
const POSTNORD = {
  title: "Customer Service and Invoicing",
  org: "Postnord",
  note: "employed through Randstad the first 6 months",
  when: "Oct 2020 – Sep 2022 · Malmö",
  bullets: [
    "Handled invoice disputes, credit notes and payouts",
    "Became Salesforce superuser after one year and helped improve how the team used it",
    "Import and export control in Citrix NCM",
  ],
};
const BREDBAND2 = {
  title: "IT Support and Customer Service",
  org: "Bredband2",
  when: "Jun 2020 – Sep 2020 · Malmö",
  bullets: ["Troubleshooting for broadband, routers, telephony and antivirus", "IT advice to private customers by phone"],
};
const BREDBAND2_SHORT = { title: "IT Support and Customer Service", org: "Bredband2", when: "Jun – Sep 2020 · Malmö",
  line: "Troubleshooting for broadband, routers, telephony and antivirus" };
const METSO_SHORT = { title: "Machine Operator", org: "Metso", when: "Sep 2018 – Sep 2019 · Trelleborg",
  line: "Machine operation and quality control in mineral processing production" };

const RAIL_PULSE = ["Rail Pulse", "a dashboard of train punctuality, delays and their causes, built on Trafikverket's open data"];
const TOKENWISE = ["TokenWise AI", 'a website that explains to companies what AI costs and what it can do ' +
  '<a href="https://tokenwise-ai.vercel.app">tokenwise-ai.vercel.app</a>'];

const SCHOOL = { what: "IT – Networking and Media", where: "Sundsgymnasiet", when: "2014 – 2018 · Vellinge" };
const ODIN = { what: "Full-stack web development", where: "The Odin Project (self-study)", when: "2026 – ongoing" };

// ---------- Role icons (inline SVG, 24x24; the lit part is the brand green) ----------

const ICONS = {
  // Railway: the signal head, one lamp lit
  signal: '<svg class="icon" viewBox="0 0 24 24"><rect x="7.5" y="1.5" width="9" height="21" rx="4.5" ' +
    'fill="var(--icon-body)" stroke="var(--icon-line)" stroke-width="1"/><circle cx="12" cy="7.5" r="2.6" fill="var(--lamp-off)"/>' +
    '<circle cx="12" cy="16.5" r="2.6" fill="var(--lamp)"/></svg>',
  // IT and operations: a server rack with one unit's light lit
  server: '<svg class="icon" viewBox="0 0 24 24"><rect x="3" y="1.5" width="18" height="21" rx="2.5" fill="var(--icon-body)" stroke="var(--icon-line)" stroke-width="1"/>' +
    '<rect x="5.5" y="4" width="13" height="4.5" rx="1" fill="none" stroke="var(--icon-line)" stroke-width=".6"/>' +
    '<rect x="5.5" y="9.75" width="13" height="4.5" rx="1" fill="none" stroke="var(--icon-line)" stroke-width=".6"/>' +
    '<rect x="5.5" y="15.5" width="13" height="4.5" rx="1" fill="none" stroke="var(--icon-line)" stroke-width=".6"/>' +
    '<circle cx="16" cy="6.25" r="1.2" fill="var(--lamp)"/><circle cx="16" cy="12" r="1.2" fill="var(--lamp-off)"/>' +
    '<circle cx="16" cy="17.75" r="1.2" fill="var(--lamp-off)"/></svg>',
  // Project management: a timeline of tasks, the current one lit
  plan: '<svg class="icon" viewBox="0 0 24 24"><rect x="1.5" y="1.5" width="21" height="21" rx="3" fill="var(--icon-body)" stroke="var(--icon-line)" stroke-width="1"/>' +
    '<rect x="4.5" y="5.5" width="7" height="2.6" rx="1.3" fill="var(--icon-line)"/>' +
    '<rect x="8.5" y="10.7" width="9" height="2.6" rx="1.3" fill="var(--lamp)"/>' +
    '<rect x="13" y="15.9" width="6.5" height="2.6" rx="1.3" fill="var(--icon-line)"/></svg>',
};

// ---------- The versions ----------

const CVS = [
  {
    file: "Dante_Persson_CV_Standard.pdf",
    // Standard terms CV screening software searches for. Only things Dante has done.
    keywords: ["Railway operations", "Safety-critical operations", "Risk assessment", "Incident management",
      "Project planning", "Project coordination", "Team coordination", "Stakeholder communication",
      "24/7 operations", "Process improvement", "Data analysis", "Excel/VBA"],
    label: "Standard",
    icon: "signal",
    eyebrow: "Railway operations · Project lead",
    about: [
      INTRO,
      "I'm used to safety-critical work with strict rules, and to handling problems quickly and " +
        "calmly when something goes wrong. I like finding more efficient ways to work. At my current " +
        "job I built tools in Excel that my team uses every day.",
    ],
    jobs: [HTSM, TRAFIKVERKET, POSTNORD],
    earlier: [BREDBAND2_SHORT, METSO_SHORT],
    skills: ["Excel and VBA macros", "Salesforce (superuser), SAP, Citrix NCM, Microsoft Office",
      "Train control systems", "AI tools (Claude, ChatGPT), basic JavaScript and Git"],
    projects: [RAIL_PULSE, TOKENWISE],
    education: [SCHOOL],
  },
  {
    file: "Dante_Persson_CV_Project_Management.pdf",
    keywords: ["Project planning", "Project coordination", "Team coordination", "Stakeholder communication",
      "Risk assessment", "Safety compliance", "Incident management", "Process improvement", "Data analysis",
      "Rail infrastructure", "Excel/VBA"],
    label: "Project management",
    icon: "plan",
    eyebrow: "Project management · Railway",
    about: [
      INTRO,
      "In my current job I lead safety on railway worksites, often on several projects at the same " +
        "time, and plan each one with Trafikverket. I'm used to safety-critical work with strict rules, and to solving " +
        "problems calmly when plans change. I like finding more efficient ways to work.",
    ],
    jobs: [HTSM, TRAFIKVERKET, POSTNORD],
    earlier: [BREDBAND2_SHORT, METSO_SHORT],
    skills: ["Excel and VBA macros", "Salesforce (superuser), SAP, Citrix NCM", "Microsoft Office",
      "Train control systems"],
    projects: [RAIL_PULSE, TOKENWISE],
    education: [SCHOOL],
  },
  {
    file: "Dante_Persson_CV_IT_Operations.pdf",
    keywords: ["Process improvement", "Automation", "Excel/VBA", "Incident management", "24/7 operations",
      "Data analysis", "Team coordination", "IT support", "Railway operations"],
    label: "Operations and IT",
    icon: "server",
    eyebrow: "Operations · IT · Automation",
    github: true,
    about: [
      "I have worked in operations for most of my career, mostly on the railway, and I started out " +
        "in IT support. For almost four years I controlled rail traffic at Trafikverket and was part of " +
        "the team that programmed its train automation system. Since May 2026 I've worked as a Chief Track Work " +
        "Supervisor, leading track work projects on the railway.",
      "I like finding more efficient ways to work. At my current job I built tools in Excel and VBA " +
        "that my team uses every day, and in my free time I build web apps with AI coding tools.",
    ],
    jobs: [
      { ...HTSM, bullets: [
        HTSM.bullets[3], HTSM.bullets[0], HTSM.bullets[1], HTSM.bullets[2],
      ] },
      { ...TRAFIKVERKET, bullets: [
        TRAFIKVERKET.bullets[3], TRAFIKVERKET.bullets[0], TRAFIKVERKET.bullets[1],
      ] },
      POSTNORD,
    ],
    earlier: [BREDBAND2_SHORT, METSO_SHORT],
    skills: ["Excel and VBA macros", "AI coding tools: Claude Code, ChatGPT", "JavaScript, React, Git (learning)",
      "Salesforce (superuser), SAP, Citrix NCM"],
    projectsIntro: false,
    projects: [TOKENWISE, RAIL_PULSE],
    education: [ODIN, SCHOOL],
  },
];

// ---------- Layout ----------

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function page(cv, theme) {
  const contact = [...CONTACT, ...(cv.github ? [GITHUB] : [])];
  const joints = [18, 34, 50, 66, 82].map((p) => `<i style="left:${p}%"></i>`).join("");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Dante Persson – CV (${esc(cv.label)})</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css">
</head>
<body class="${theme}">
<header class="head">
  <div class="head__text">
    <p class="eyebrow">${ICONS[cv.icon]}${esc(cv.eyebrow)}</p>
    <h1>Dante <span>Persson</span></h1>
    <div class="contact">${contact.map((c) => (c.href ? `<a href="${c.href}">${esc(c.text)}</a>` : `<span>${esc(c.text)}</span>`)).join("")}</div>
    <a class="portfolio" href="https://dante-persson.vercel.app"><span class="portfolio__label">Portfolio</span><span class="portfolio__text">See my projects and work tools</span><span class="portfolio__url">dante-persson.vercel.app &#8594;</span></a>
  </div>
  <img class="photo" src="photo.jpg" alt="Dante Persson">
</header>
<div class="track">${joints}</div>
<div class="body">
  <div class="main">
    <section class="about">
      <h2>About me</h2>
      ${cv.about.map((p) => `<p>${esc(p)}</p>`).join("\n      ")}
      <p class="keys"><b>Key skills:</b> ${cv.keywords.map(esc).join(" · ")}</p>
    </section>
    <section>
      <h2>Work experience</h2>
      <div class="jobs">
        ${cv.jobs.map((job, i) => `<div class="job${i === 0 ? " now" : ""}">
          <h3>${esc(job.title)}<br><span class="org">${esc(job.org)}</span>${job.note ? ` <span class="note">(${esc(job.note)})</span>` : ""}</h3>
          <p class="when">${esc(job.when)}</p>
          <ul>${job.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>
        </div>`).join("\n        ")}
        ${cv.earlier?.length ? `<div class="job early">
          <h3>Earlier roles</h3>
          ${cv.earlier.map((e) => `<p class="row"><b>${esc(e.title)},</b> ${esc(e.org)} <span class="when">${esc(e.when)}</span></p>
          <p class="sub">${esc(e.line)}</p>`).join("\n          ")}
        </div>` : ""}
      </div>
    </section>
  </div>
  <aside class="side">
    <section>
      <h2>Tools and systems</h2>
      <ul>${cv.skills.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
    </section>
    <section>
      <h2>Languages</h2>
      <ul>${LANGUAGES.map(([n, l]) => `<li class="lang"><span>${n}</span><span>${l}</span></li>`).join("")}</ul>
    </section>
    <section class="proj">
      <h2>Projects</h2>
      ${cv.projectsIntro === false ? "" : "<p>In my free time I build small web apps with AI coding tools.</p>"}
      ${cv.projects.map(([n, t]) => `<p><b>${esc(n)}:</b> ${t}</p>`).join("\n      ")}
    </section>
    <section class="edu">
      <h2>Education</h2>
      ${cv.education.map((e) => `<b>${esc(e.what)}</b><span>${esc(e.where)}</span><p class="when">${esc(e.when)}</p>`).join("\n      ")}
    </section>
    <section>
      <h2>Interests</h2>
      <p>${esc(INTERESTS)}</p>
    </section>
  </aside>
</div>
</body>
</html>`;
}

// ---------- Print ----------

const BROWSERS = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
];
const browser = BROWSERS.find((b) => existsSync(b));
// Own profile, so an open Edge window does not take over the job
const profile = mkdtempSync(join(tmpdir(), "cv-"));
const wait = (file) => { for (let i = 0; i < 200 && !existsSync(file); i++) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100); };
if (!browser) throw new Error("No Edge or Chrome found to print the PDFs.");

for (const theme of ["light", "dark"]) {
  const outDir = theme === "light" ? OUT : join(OUT, "dark");
  mkdirSync(outDir, { recursive: true });
  for (const cv of CVS) {
    const tmp = join(HERE, `_${theme}_${cv.label.replace(/ /g, "_")}.html`);
    writeFileSync(tmp, page(cv, theme), "utf8");
    const out = join(outDir, cv.file);
    rmSync(out, { force: true });
    execFileSync(browser, [
      "--headless=new", "--disable-gpu", `--user-data-dir=${profile}`, "--no-pdf-header-footer", "--virtual-time-budget=10000",
      `--print-to-pdf=${out}`, pathToFileURL(tmp).href,
    ], { stdio: "ignore" });
    wait(out);
    unlinkSync(tmp);
    console.log("built", theme, cv.file);
  }
}
