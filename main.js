// DP.IO portfolio
// The page works without this file. It adds:
// 1. Light / dark switch (remembered on this device).
// 2. The train run: on load, a train drives along the career line, drawing
//    it behind itself, and each station lights up as the train passes.
// 3. The route line under the header: sections are stations, and a train
//    shows how far down the page you are. The nav marks the current section.
// 4. A live Malmö clock in the header.
// 5. Open and close for the project rows (closed rows are "inert", so the
//    keyboard can't land on links you can't see).

const root = document.documentElement;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- 1. Light / dark ----------
const themeBtn = document.querySelector(".theme");
const systemDark = window.matchMedia("(prefers-color-scheme: dark)");
const isDark = () => (root.dataset.theme ? root.dataset.theme === "dark" : systemDark.matches);
function showTheme() {
  themeBtn.setAttribute("aria-pressed", String(isDark()));
  themeBtn.setAttribute("aria-label", isDark() ? "Light mode" : "Dark mode");
}
themeBtn.addEventListener("click", () => {
  const next = isDark() ? "light" : "dark";
  root.dataset.theme = next;
  try { localStorage.setItem("theme", next); } catch (e) {}
  showTheme();
});
systemDark.addEventListener("change", showTheme);
showTheme();

// ---------- 2. The train run ----------
// The red line is several SVG paths in a 0–100 box stretched over the plot.
// The train follows them in order; the line is revealed up to the train.
const plot = document.querySelector(".graph__plot");
const svg = plot.querySelector("svg");
const loco = plot.querySelector(".loco");
const paths = [...svg.querySelectorAll(".seg:not(.seg--next)")];
const rows = [...document.querySelectorAll(".st")];
// Which station row each path ends at (same order as the paths)
const rowFor = ["su", "me", "bb", "pn", "tv", "ld"];

function pointAt(dist) {
  for (const p of paths) {
    const len = p.getTotalLength();
    if (dist <= len) return p.getPointAtLength(dist);
    dist -= len;
  }
  const last = paths[paths.length - 1];
  return last.getPointAtLength(last.getTotalLength());
}
const total = paths.reduce((sum, p) => sum + p.getTotalLength(), 0);

function lightStations(x) {
  // A station lights once the train has reached the start of its stay
  paths.forEach((p, i) => {
    const start = p.getPointAtLength(0).x;
    const passed = x >= start - 0.01;
    document.querySelector(`.st--${rowFor[i]}`).classList.toggle("is-passed", passed);
  });
}

function placeTrain(pt) {
  loco.style.setProperty("--x", pt.x);
  loco.style.setProperty("--y", pt.y);
  svg.style.clipPath = `inset(-10px ${Math.max(0, 100 - pt.x)}% -10px 0)`;
}

function finishRun() {
  svg.style.clipPath = "";
  plot.classList.add("is-arrived");
  lightStations(100);
  document.querySelector(".st--ld").classList.add("is-current");
}

if (reduceMotion) {
  finishRun();
} else {
  plot.classList.add("is-running");
  const duration = 3200;
  // Smooth start and stop, like a train pulling away and braking
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  let startTime = null;
  function frame(now) {
    if (startTime === null) startTime = now;
    const t = Math.min(1, (now - startTime) / duration);
    const pt = pointAt(ease(t) * total);
    placeTrain(pt);
    lightStations(pt.x);
    if (t < 1) requestAnimationFrame(frame);
    else { plot.classList.remove("is-running"); finishRun(); }
  }
  // Start when the graph is on screen (on phones it starts below the first
  // screen), and only after fonts have settled so the plot keeps its size.
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  new IntersectionObserver((entries, obs) => {
    if (!entries[0].isIntersecting) return;
    obs.disconnect();
    fontsReady.then(() => setTimeout(() => requestAnimationFrame(frame), 250));
  }, { threshold: 0.5 }).observe(plot);
}

// ---------- 3. Route line and current section ----------
const routeTrack = document.querySelector(".route__track");
const routeTrain = document.querySelector(".route__train");
const sections = [...document.querySelectorAll("main section[id]")];
const navLinks = [...document.querySelectorAll(".nav a[href^='#']")];

// One station tick per section, placed by where the section starts on the page
const ticks = sections.map((sec) => {
  const tick = document.createElement("span");
  tick.className = "route__stop";
  routeTrack.appendChild(tick);
  return tick;
});

function layoutRoute() {
  const max = document.documentElement.scrollHeight - innerHeight;
  sections.forEach((sec, i) => {
    const at = max > 0 ? Math.min(1, Math.max(0, (sec.offsetTop - 80) / max)) : 0;
    ticks[i].style.setProperty("--at", at);
    ticks[i].dataset.at = at;
  });
}

let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const progress = max > 0 ? scrollY / max : 0;
    routeTrain.style.setProperty("--p", progress);
    ticks.forEach((t) => t.classList.toggle("is-passed", progress >= Number(t.dataset.at) - 0.001));
    ticking = false;
  });
}
layoutRoute();
onScroll();
addEventListener("scroll", onScroll, { passive: true });
addEventListener("resize", () => { layoutRoute(); onScroll(); });
document.fonts && document.fonts.ready.then(() => { layoutRoute(); onScroll(); });

// Mark the nav link of the section in the middle of the screen
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

// ---------- 4. Clock ----------
const clock = document.querySelector(".clock");
function tick() {
  const now = new Date();
  clock.textContent = new Intl.DateTimeFormat("sv-SE", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: clock.dataset.tz }).format(now);
  clock.dateTime = now.toISOString();
}
tick();
setInterval(tick, 1000);

// ---------- 5. Project rows ----------
document.querySelectorAll(".dep__btn").forEach((btn) => {
  const panel = document.getElementById(btn.getAttribute("aria-controls"));
  function setOpen(open) {
    btn.setAttribute("aria-expanded", String(open));
    panel.dataset.open = String(open);
    panel.inert = !open;
  }
  setOpen(false);
  btn.addEventListener("click", () => setOpen(btn.getAttribute("aria-expanded") !== "true"));
});
