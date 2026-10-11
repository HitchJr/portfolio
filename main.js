// Departures: one row per project, sorted by when it left the station.
// Track: 1 = web apps, 2 = data, 3 = work tools.
const departures = [
  {
    id: "automation",
    time: "May 26",
    name: "Workflow automation",
    line: "Excel and VBA tools for railway track work",
    via: "Excel, VBA, AI-assisted development",
    track: "3",
    status: "In daily use",
    details: `
      <p>Planning and safety documentation for track work took hours of manual work in a 24/7 operation. I built Excel tools and VBA macros with AI-assisted development to automate it.</p>
      <ul>
        <li>Used daily by a team of 6 across 5 railway projects</li>
        <li>Saves 2–4 work hours a day, roughly 700–1,400 hours a year</li>
        <li>Documentation is generated automatically, saving about 10 work hours per documentation request</li>
        <li>Fewer manual steps, so fewer human errors in safety-critical paperwork</li>
      </ul>
      <p>Internal tool, so there's no public link. Happy to walk through it in an interview.</p>`
  },
  {
    id: "voicereader",
    time: "Aug 26",
    name: "VoiceReader",
    line: "Web fiction, read aloud",
    via: "Next.js, React, TypeScript, Prisma, Web Speech API",
    track: "1",
    status: "Built",
    details: `
      <p>A full-stack app that pulls chapters of serialized web fiction from websites and turns them into audio you can listen to on your phone.</p>
      <p>I planned the scope and architecture first, then directed the build with Claude Code: site scrapers, sentence segmentation, the API routes and the React interface. The player has a waveform scrubber and highlights each sentence as it's read.</p>
      <p>Private repo. Happy to demo it in an interview.</p>`
  },
  {
    id: "tokenwise",
    time: "Oct 26",
    name: "TokenWise AI",
    line: "AI explained for companies",
    via: "Web app on Vercel",
    track: "1",
    status: "Live",
    details: `
      <p>A website that explains AI to companies in plain language: what tokens are, what AI costs compared with what it saves, and a chat that checks whether a business problem is a good fit for AI.</p>
      <p>Built as a test of whether I can create something of real value with AI, with a book-a-call flow for consulting leads.</p>
      <p class="panel__links">
        <a href="https://tokenwise-ai.vercel.app">Open the live site</a>
        <a href="https://github.com/HitchJr/tokenwise-ai">Source on GitHub</a>
      </p>`
  },
  {
    id: "railpulse",
    time: "Oct 26",
    name: "Rail Pulse",
    line: "Live railway disruption dashboard",
    via: "Trafikverket open data",
    track: "2",
    status: "Paused",
    change: true,
    details: `
      <p>A dashboard that shows disruptions on the Swedish rail network, built on Trafikverket's open data. It's the view I wished I had when I worked in traffic control: what's late, where, and why.</p>
      <p>Paused while I work through access issues with Trafikverket's API.</p>`
  }
];

const rowsEl = document.getElementById("rows");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function flapCell(cls, text, extra = "") {
  // Visual characters animate; screen readers get the settled text once.
  return `<span class="cell ${cls}">${extra}<span class="flap" aria-hidden="true" data-final="${text}">${text}</span><span class="sr">${text}</span></span>`;
}

rowsEl.innerHTML = departures.map((d) => `
  <li class="row">
    <button class="row__btn" type="button" aria-expanded="false" aria-controls="panel-${d.id}">
      ${flapCell("cell--time", d.time)}
      <span class="cell cell--dest"><span class="flap" aria-hidden="true" data-final="${d.name}">${d.name}</span><span class="sr">${d.name}</span><small>${d.line}</small></span>
      <span class="cell cell--via col-via">${d.via}</span>
      ${flapCell("cell--track", d.track)}
      ${flapCell("cell--status" + (d.change ? " is-change" : ""), d.status)}
    </button>
    <div class="row__panel" id="panel-${d.id}" data-open="false" role="region" aria-label="${d.name} details">
      <div><div class="panel">${d.details}</div></div>
    </div>
  </li>`).join("");

// Expand and collapse a departure's details.
rowsEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".row__btn");
  if (!btn) return;
  const open = btn.getAttribute("aria-expanded") === "true";
  btn.setAttribute("aria-expanded", String(!open));
  document.getElementById(btn.getAttribute("aria-controls")).dataset.open = String(!open);
});

// The board settles like split-flap displays: once on load, and again
// on a row whenever the mouse moves onto it.
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
function settle(el, delay) {
  if (el.dataset.running === "true") return; // already flipping, let it finish
  el.dataset.running = "true";
  const final = el.dataset.final;
  // Each letter locks a little later than the one to its left, so the text
  // settles left to right. The small random part keeps it from looking robotic.
  const stops = [...final].map((_, i) => 4 + Math.round(i * 1.5) + Math.floor(Math.random() * 3));
  let frame = 0;
  el.textContent = final.replace(/\S/g, " ");
  setTimeout(function tick() {
    frame++;
    el.textContent = [...final].map((c, i) =>
      c === " " || frame >= stops[i] ? c : CHARS[Math.floor(Math.random() * CHARS.length)]
    ).join("");
    if (frame < Math.max(...stops)) setTimeout(tick, 45);
    else el.dataset.running = "false";
  }, delay);
}
if (!reduceMotion) {
  rowsEl.querySelectorAll(".row").forEach((row, r) => {
    row.querySelectorAll(".flap").forEach((el) => settle(el, 250 + r * 160));
    // Mouse only, so tapping a row on a phone just opens it.
    row.querySelector(".row__btn").addEventListener("pointerenter", (e) => {
      if (e.pointerType !== "mouse") return;
      row.querySelectorAll(".flap").forEach((el) => settle(el, 0));
    });
  });
}

// Light/dark toggle. With no saved choice, the site follows the system setting.
const toggle = document.querySelector(".theme-toggle");
const systemDark = window.matchMedia("(prefers-color-scheme: dark)");
function isDark() {
  const t = document.documentElement.dataset.theme;
  return t ? t === "dark" : systemDark.matches;
}
function syncToggle() {
  toggle.querySelector(".theme-toggle__label").textContent = isDark() ? "Light mode" : "Dark mode";
  toggle.setAttribute("aria-label", isDark() ? "Switch to light mode" : "Switch to dark mode");
}
toggle.addEventListener("click", () => {
  const next = isDark() ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem("theme", next); } catch (e) {}
  syncToggle();
});
systemDark.addEventListener("change", syncToggle);
syncToggle();

// Malmö and Hanoi clocks.
function tickClocks() {
  document.querySelectorAll(".clocks__time").forEach((el) => {
    const now = new Date();
    el.textContent = new Intl.DateTimeFormat("sv-SE", { hour: "2-digit", minute: "2-digit", timeZone: el.dataset.tz }).format(now);
    el.dateTime = now.toISOString();
  });
}
tickClocks();
setInterval(tickClocks, 15000);
