// DP.IO portfolio
// 1. The departure board: one row per project, built from the list below.
// 2. Split-flap effect: letters and numbers roll before they settle.
// 3. Malmö and Hanoi clocks on the board.

// ---------- 1. Departures ----------
// Track: 1 = web apps, 2 = data, 3 = work tools.
// To add a project, copy one { ... } block and change the text.
// "change: true" lights the status up in amber, like a changed departure.
const departures = [
  {
    id: "automation",
    time: "May 26",
    name: "Workflow automation",
    line: "Excel and VBA tools for railway track work",
    via: "Excel, VBA, AI-assisted",
    track: "3",
    status: "In daily use",
    details: `
      <p>Planning and safety documentation for track work took hours of manual work in a 24/7 operation. I built Excel tools and VBA macros with AI-assisted development to automate it.</p>
      <ul>
        <li>Used daily by a team of 6 across 5 railway projects</li>
        <li>Saves 2–4 work hours a day</li>
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
    via: "Next.js, React, TypeScript, Prisma",
    track: "1",
    status: "Built",
    details: `
      <p>A full-stack app that pulls chapters of serialized web fiction from websites and turns them into audio you can listen to on your phone.</p>
      <p>I planned the scope and architecture first, then directed the build with Claude Code: site scrapers, sentence segmentation, the API routes and the React interface. The player highlights each sentence as it's read, using the Web Speech API.</p>
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
      <p>Built as a test of whether I can create something of real value with AI.</p>
      <p class="panel__links">
        <a href="https://tokenwise-ai.vercel.app">Open the live site →</a>
        <a href="https://github.com/HitchJr/tokenwise-ai">Source on GitHub</a>
      </p>`
  },
  {
    id: "railpulse",
    time: "Oct 26",
    name: "Rail Pulse",
    line: "Railway disruption dashboard",
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

// A board cell. The visible letters (.flap) are hidden from screen readers,
// which read the plain text in .sr instead, so they never hear the scrambling.
function flap(text) {
  return `<span class="flap" aria-hidden="true" data-final="${text}">${text}</span><span class="sr">${text}</span>`;
}

rowsEl.innerHTML = departures.map((d) => `
  <li class="row">
    <button class="row__btn" type="button" aria-expanded="false" aria-controls="panel-${d.id}">
      <span class="cell cell--time">${flap(d.time)}</span>
      <span class="cell cell--dest">${flap(d.name)}<small>${d.line}</small></span>
      <span class="cell cell--via col-via">${d.via}</span>
      <span class="cell cell--track col-track">${flap(d.track)}</span>
      <span class="cell cell--status${d.change ? " is-change" : ""}">${flap(d.status)}</span>
      <span class="cell cell--chev" aria-hidden="true">+</span>
    </button>
    <div class="row__panel" id="panel-${d.id}" data-open="false" role="region" aria-label="${d.name} details">
      <div><div class="panel">${d.details}</div></div>
    </div>
  </li>`).join("");

// Open and close a departure's details when its row is clicked.
rowsEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".row__btn");
  if (!btn) return;
  const open = btn.getAttribute("aria-expanded") === "true";
  btn.setAttribute("aria-expanded", String(!open));
  document.getElementById(btn.getAttribute("aria-controls")).dataset.open = String(!open);
});

// ---------- 2. Split-flap effect ----------
// Each character spins through random characters of the same kind
// (numbers through numbers, letters through letters) and locks in place.
// Spaces and symbols like "–" or "~" stay put.
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIGITS = "0123456789";

function randomLike(c) {
  if (/[0-9]/.test(c)) return DIGITS[Math.floor(Math.random() * 10)];
  if (/[a-zåäö]/i.test(c)) return LETTERS[Math.floor(Math.random() * 26)];
  return c; // space or symbol: no spin
}

function settle(el, delay) {
  if (el.dataset.running === "true") return; // already spinning, let it finish
  el.dataset.running = "true";
  const final = [...el.dataset.final];
  // Each character locks a little later than the one to its left, so the text
  // settles left to right. The small random part keeps it from looking robotic.
  const stops = final.map((_, i) => 4 + Math.round(i * 1.4) + Math.floor(Math.random() * 3));
  const last = Math.max(...stops);
  let frame = 0;
  el.textContent = final.map(randomLike).join("");
  setTimeout(function tick() {
    frame++;
    el.textContent = final.map((c, i) => (frame >= stops[i] ? c : randomLike(c))).join("");
    if (frame < last) setTimeout(tick, 45);
    else el.dataset.running = "false";
  }, delay);
}

if (!reduceMotion) {
  // Board rows: spin once when the board scrolls into view, row by row,
  // and again on a row whenever the mouse moves onto it.
  const rows = rowsEl.querySelectorAll(".row");
  const boardSeen = new IntersectionObserver((entries, obs) => {
    if (!entries[0].isIntersecting) return;
    rows.forEach((row, r) => row.querySelectorAll(".flap").forEach((el) => settle(el, r * 160)));
    obs.disconnect();
  }, { threshold: 0.25 });
  boardSeen.observe(rowsEl);

  rows.forEach((row) => {
    // Mouse only, so tapping a row on a phone just opens it.
    row.querySelector(".row__btn").addEventListener("pointerenter", (e) => {
      if (e.pointerType !== "mouse") return;
      row.querySelectorAll(".flap").forEach((el) => settle(el, 0));
    });
  });

  // Result numbers: roll when each card scrolls into view.
  const rollSeen = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      settle(entry.target, 0);
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll(".roll").forEach((el) => {
    el.dataset.final = el.textContent;
    rollSeen.observe(el);
  });
}

// ---------- 3. Clocks ----------
function tickClocks() {
  document.querySelectorAll(".clocks__time").forEach((el) => {
    const now = new Date();
    el.textContent = new Intl.DateTimeFormat("sv-SE", { hour: "2-digit", minute: "2-digit", timeZone: el.dataset.tz }).format(now);
    el.dateTime = now.toISOString();
  });
}
tickClocks();
setInterval(tickClocks, 15000);

// ---------- 4. The train on "How a build runs" ----------
// The five steps sit on one track. Hover a step and the train drives to it.
// Trains don't reverse: if the step is behind the train, it drives off the
// right end of the track and comes back in from the left (the track is a loop).
const stepsWrap = document.getElementById("steps");
const train = stepsWrap.querySelector(".train");
const steps = [...stepsWrap.querySelectorAll(".steps li")];
let at = 0;          // the step the train is standing at
let wanted = 0;      // the step the visitor last hovered
let driving = false;

// Where the train stands for a step: on the track, at the step's left edge.
function spot(i) {
  const li = steps[i];
  return { x: li.offsetLeft + 4, y: li.offsetTop + li.offsetHeight - 9 - train.clientHeight };
}

// The train only drives when all five steps are on one line (wide screens).
// On phones they stack, so the train simply stays at step 01.
function oneLine() {
  return steps.every((li) => li.offsetTop === steps[0].offsetTop);
}

function place(i) {
  const p = spot(i);
  train.style.transform = `translate(${p.x}px, ${p.y}px)`;
}

function light(i) {
  steps.forEach((li, n) => li.classList.toggle("steps__now", n === i));
}

// One leg of the journey, from x to x. Returns a promise that resolves on arrival.
function drive(fromX, toX, y, ms, easing) {
  return train.animate(
    [{ transform: `translate(${fromX}px, ${y}px)` }, { transform: `translate(${toX}px, ${y}px)` }],
    { duration: ms, easing, fill: "forwards" }
  ).finished;
}

async function go() {
  if (driving) return;                // already on the way; it will check `wanted` again on arrival
  driving = true;
  while (wanted !== at) {
    const target = wanted;
    const from = spot(at), to = spot(target);
    const perPx = 1.4;                // milliseconds per pixel, so longer trips take longer
    if (reduceMotion) {
      place(target);
    } else if (target > at) {
      // Ahead of us: drive straight there.
      await drive(from.x, to.x, to.y, Math.max(350, (to.x - from.x) * perPx), "ease-in-out");
    } else {
      // Behind us: off the right end, round the loop, in from the left.
      const exit = stepsWrap.clientWidth + 10;
      const enter = -train.clientWidth - 10;
      await drive(from.x, exit, to.y, (exit - from.x) * perPx, "ease-in");
      await drive(enter, to.x, to.y, (to.x - enter) * perPx, "ease-out");
    }
    at = target;
    light(at);
  }
  train.getAnimations().forEach((a) => { a.commitStyles(); a.cancel(); });
  driving = false;
}

steps.forEach((li, i) => {
  li.addEventListener("pointerenter", (e) => {
    if (e.pointerType !== "mouse" || !oneLine()) return;
    wanted = i;
    go();
  });
});

// Put the train in place now, and again if the window is resized
// (back to step 01 if the steps no longer fit on one line).
function reset() {
  if (driving) return;
  if (!oneLine()) { at = wanted = 0; light(0); }
  place(at);
}
reset();
window.addEventListener("resize", reset);
document.fonts && document.fonts.ready.then(reset);   // text size can shift once fonts load
