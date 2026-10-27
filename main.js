// DP.IO portfolio
// 1. The departure board: one row per project, built from the list below.
// 2. Split-flap effect: letters and numbers roll before they settle.
// 3. Malmö and Tokyo clocks on the board.
// 4. The train on "How a build runs".
// 5. Light / dark switch, the route line under the header, and the live
//    track display behind the headline (further down).

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

// A small two-lamp signal head, like the one in the logo:
// "go" lights the lower lamp green, "stop" lights the upper lamp red.
function signal(aspect) {
  return `<svg class="signal signal--${aspect}" viewBox="0 0 10 20" width="10" height="20" aria-hidden="true"><rect x="0.75" y="0.75" width="8.5" height="18.5" rx="4.25"/><circle cx="5" cy="5.8" r="2.6"/><circle cx="5" cy="14.2" r="2.6"/></svg>`;
}

rowsEl.innerHTML = departures.map((d) => `
  <li class="row">
    <button class="row__btn" type="button" aria-expanded="false" aria-controls="panel-${d.id}">
      <span class="cell cell--time">${flap(d.time)}</span>
      <span class="cell cell--dest">${flap(d.name)}<small>${d.line}</small></span>
      <span class="cell cell--via col-via">${d.via}</span>
      <span class="cell cell--track col-track">${flap(d.track)}</span>
      <span class="cell cell--status${d.change ? " is-change" : ""}">${signal(d.change ? "stop" : "go")}${flap(d.status)}</span>
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
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";
const pick = (set) => set[Math.floor(Math.random() * set.length)];

// Spins through characters of the same kind and case, so "May 26" rolls
// through small letters and digits, never capitals.
function randomLike(c) {
  if (/[0-9]/.test(c)) return pick(DIGITS);
  if (/[A-ZÅÄÖ]/.test(c)) return pick(UPPER);
  if (/[a-zåäö]/.test(c)) return pick(LOWER);
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

  // Live board: every few seconds one row refreshes, like a real departure
  // board updating. Only while the board is on screen and the tab is visible.
  let boardVisible = false;
  new IntersectionObserver((entries) => { boardVisible = entries[0].isIntersecting; }).observe(rowsEl);
  setInterval(() => {
    if (!boardVisible || document.hidden) return;
    const row = rows[Math.floor(Math.random() * rows.length)];
    if (row.querySelector(".row__btn").getAttribute("aria-expanded") === "true") return;
    row.classList.add("is-refreshing");
    row.querySelectorAll(".flap").forEach((el) => settle(el, 0));
    setTimeout(() => row.classList.remove("is-refreshing"), 900);
  }, 6000);

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
    el.textContent = new Intl.DateTimeFormat("sv-SE", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: el.dataset.tz }).format(now);
    el.dateTime = now.toISOString();
  });
}
tickClocks();
setInterval(tickClocks, 1000);

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

// When the steps scroll into view, the train drives through them once,
// 01 to 05, stopping briefly at each. A visitor's hover takes over.
let touring = false;
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
async function tour() {
  touring = true;
  for (let i = 1; i < steps.length && touring; i++) {
    await pause(i === 1 ? 300 : 500);
    if (!touring) break;
    wanted = i;
    await go();
  }
  touring = false;
}
if (!reduceMotion) {
  new IntersectionObserver((entries, obs) => {
    if (!entries[0].isIntersecting || !oneLine()) return;
    obs.disconnect();
    tour();
  }, { threshold: 0.6 }).observe(stepsWrap);
}

steps.forEach((li, i) => {
  li.addEventListener("pointerenter", (e) => {
    if (e.pointerType !== "mouse" || !oneLine()) return;
    touring = false;
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

// ---------- 5. Light / dark switch ----------
// Dark is the site's default look; light is an option, remembered on this device.
const root = document.documentElement;
const themeBtn = document.querySelector(".theme");
function showTheme() {
  const light = root.dataset.theme === "light";
  themeBtn.setAttribute("aria-pressed", String(light));
  themeBtn.setAttribute("aria-label", light ? "Dark mode" : "Light mode");
}
themeBtn.addEventListener("click", () => {
  const light = root.dataset.theme !== "light";
  if (light) root.dataset.theme = "light"; else delete root.dataset.theme;
  try { localStorage.setItem("theme", light ? "light" : "dark"); } catch (e) {}
  showTheme();
  readColors();
});
showTheme();

// ---------- 6. Route line under the header ----------
// Each section is a stop on a thin line; the train shows how far down the
// page you are, and the nav link of the section you're in is marked.
const progTrack = document.querySelector(".progress__track");
const progTrain = document.querySelector(".progress__train");
const sections = [...document.querySelectorAll("main section[id]")];
const navLinks = [...document.querySelectorAll(".nav a[href^='#']")];
const stops = sections.map(() => {
  const stop = document.createElement("span");
  stop.className = "progress__stop";
  progTrack.appendChild(stop);
  return stop;
});

function layoutStops() {
  const max = root.scrollHeight - innerHeight;
  sections.forEach((sec, i) => {
    const at = max > 0 ? Math.min(1, Math.max(0, (sec.offsetTop - 90) / max)) : 0;
    stops[i].style.setProperty("--at", at);
    stops[i].dataset.at = at;
  });
}
let scrollQueued = false;
function onScroll() {
  if (scrollQueued) return;
  scrollQueued = true;
  requestAnimationFrame(() => {
    const max = root.scrollHeight - innerHeight;
    const p = max > 0 ? scrollY / max : 0;
    progTrain.style.setProperty("--p", p);
    stops.forEach((s) => s.classList.toggle("is-passed", p >= Number(s.dataset.at) - 0.001));
    scrollQueued = false;
  });
}
layoutStops(); onScroll();
addEventListener("scroll", onScroll, { passive: true });
addEventListener("resize", () => { layoutStops(); onScroll(); });
document.fonts && document.fonts.ready.then(() => { layoutStops(); onScroll(); });

const spy = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navLinks.forEach((a) => {
      if (a.getAttribute("href") === `#${entry.target.id}`) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
  });
}, { rootMargin: "-45% 0px -50% 0px" });
sections.forEach((sec) => spy.observe(sec));

// ---------- 7. Live track display behind the headline ----------
// A simplified version of a traffic control screen: parallel tracks with
// crossovers, train blocks moving along them, and signals that turn red
// behind each train and back to green once it has gone. Purely decoration:
// the trains and their positions are made up.
const canvas = document.querySelector(".tracks");
const ctx = canvas.getContext("2d");
const hero = canvas.parentElement;
let W = 0, H = 0, lines = [], trains = [], signals = [], colors = {};

function readColors() {
  const cs = getComputedStyle(root);
  colors = {
    track: cs.getPropertyValue("--line-strong").trim(),
    train: cs.getPropertyValue("--signal").trim(),
    go: cs.getPropertyValue("--go").trim(),
    stop: cs.getPropertyValue("--stop").trim(),
  };
  if (reduceMotion) draw();
}

function rand(a, b) { return a + Math.random() * (b - a); }

function buildLayout() {
  const dpr = Math.min(2, devicePixelRatio || 1);
  const r = hero.getBoundingClientRect();
  W = r.width; H = r.height;
  canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const count = H < 560 ? 4 : 6;
  lines = Array.from({ length: count }, (_, i) => ({ y: Math.round(H * (0.1 + (0.82 * i) / (count - 1))) + 0.5, dir: i % 2 ? 1 : -1 }));
  trains = [];
  lines.forEach((ln, i) => {
    const n = W > 900 ? 2 : 1;
    for (let k = 0; k < n; k++) {
      trains.push({ line: i, len: rand(60, 150), speed: rand(28, 70), x: rand(0, W + 300) - 150 });
    }
  });
  signals = [];
  lines.forEach((ln, i) => {
    for (let x = rand(60, 200); x < W; x += rand(200, 300)) signals.push({ line: i, x });
  });
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  // Tracks and crossovers
  ctx.strokeStyle = colors.track; ctx.lineWidth = 1.5;
  ctx.beginPath();
  lines.forEach((ln) => { ctx.moveTo(0, ln.y); ctx.lineTo(W, ln.y); });
  for (let i = 0; i < lines.length - 1; i++) {
    const x = (i % 2 ? 0.68 : 0.24) * W;
    ctx.moveTo(x, lines[i].y); ctx.lineTo(x + 70, lines[i + 1].y);
  }
  ctx.stroke();
  // Signals: red if a train is on, or has just passed, the block behind it
  signals.forEach((sg) => {
    const ln = lines[sg.line];
    const occupied = trains.some((t) => {
      if (t.line !== sg.line) return false;
      const head = t.x, tail = t.x - ln.dir * t.len;
      const behind = ln.dir > 0 ? sg.x - head : head - sg.x; // distance the head is past the signal (negative = not reached)
      return (behind <= 0 && behind > -260) || (Math.min(head, tail) <= sg.x && Math.max(head, tail) >= sg.x);
    });
    ctx.fillStyle = occupied ? colors.stop : colors.go;
    ctx.globalAlpha = occupied ? 0.95 : 0.55;
    ctx.beginPath(); ctx.arc(sg.x, ln.y - 8, 2.5, 0, Math.PI * 2); ctx.fill();
  });
  ctx.globalAlpha = 1;
  // Trains as lit blocks, brighter at the front
  trains.forEach((t) => {
    const ln = lines[t.line];
    const tail = t.x - ln.dir * t.len;
    const x0 = Math.min(t.x, tail);
    ctx.fillStyle = colors.train; ctx.globalAlpha = 0.75;
    ctx.fillRect(x0, ln.y - 2.5, t.len, 5);
    ctx.globalAlpha = 1;
    ctx.fillRect(t.x - (ln.dir > 0 ? 6 : 0), ln.y - 2.5, 6, 5);
  });
}

let last = 0, running = false, heroVisible = true;
function frame(now) {
  if (!running) return;
  const dt = Math.min(0.05, (now - (last || now)) / 1000);
  last = now;
  trains.forEach((t) => {
    const ln = lines[t.line];
    t.x += ln.dir * t.speed * dt;
    if (ln.dir > 0 && t.x - t.len > W + 40) { t.x = -rand(40, 400); t.len = rand(60, 150); }
    if (ln.dir < 0 && t.x + t.len < -40) { t.x = W + rand(40, 400); t.len = rand(60, 150); }
  });
  draw();
  requestAnimationFrame(frame);
}
function setRunning() {
  const should = heroVisible && !document.hidden && !reduceMotion;
  if (should && !running) { running = true; last = 0; requestAnimationFrame(frame); }
  if (!should) running = false;
}

buildLayout(); readColors(); draw();
new IntersectionObserver((entries) => { heroVisible = entries[0].isIntersecting; setRunning(); }).observe(hero);
document.addEventListener("visibilitychange", setRunning);
let resizeTimer;
addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { buildLayout(); draw(); }, 150); });
setRunning();
