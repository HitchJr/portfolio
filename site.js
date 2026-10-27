// Shared behaviour for every page: theme toggle, scroll reveals,
// the VoiceReader waveform and the clocks. Further down: the motion layer
// (split-flap ticket, live track display, route line, experience train,
// card light). Every page works without it, and reduced motion turns it off.
const root = document.documentElement;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function store(key, value) {
  try { localStorage.setItem(key, value); } catch (e) { /* private mode: setting just isn't remembered */ }
}

// Light / dark toggle. Light is the default; the choice is remembered.
document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
  const sync = () => btn.setAttribute("aria-pressed", String(root.dataset.theme === "dark"));
  sync();
  btn.addEventListener("click", () => {
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
    store("theme", root.dataset.theme);
    sync();
    if (window.readTrackColors) window.readTrackColors();
  });
});

// Fade sections in as they scroll into view.
const reveals = document.querySelectorAll(".reveal");
if (reduceMotion || !("IntersectionObserver" in window)) {
  reveals.forEach((el) => el.classList.add("is-in"));
} else {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-in");
      io.unobserve(entry.target);
    });
  }, { threshold: 0.15 });
  reveals.forEach((el) => io.observe(el));
}

// VoiceReader waveform: a row of bars that "plays" on hover.
document.querySelectorAll(".wave").forEach((wave) => {
  const heights = [30, 55, 40, 80, 62, 95, 70, 45, 85, 60, 100, 75, 50, 88, 66, 40, 72, 92, 58, 35, 68, 84, 48, 76, 56, 90, 64, 38, 52, 28];
  wave.innerHTML = heights.map((h, i) => `<span style="--h:${h}%;--i:${i}"></span>`).join("");
});

// Local time in Malmö and Hanoi.
function tick() {
  document.querySelectorAll("time[data-tz]").forEach((el) => {
    el.textContent = new Intl.DateTimeFormat("sv-SE", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: el.dataset.tz }).format(new Date());
  });
}
tick();
setInterval(tick, 1000);


// ---------- Split-flap: ticket text rolls in like a departure board ----------
// Each character spins through characters of the same kind and case, then
// locks, left to right. Screen readers get the real text from aria-label.
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ", LOWER = "abcdefghijklmnopqrstuvwxyz", DIGITS = "0123456789";
const pick = (set) => set[Math.floor(Math.random() * set.length)];
function randomLike(c) {
  if (/[0-9]/.test(c)) return pick(DIGITS);
  if (/[A-ZÅÄÖ]/.test(c)) return pick(UPPER);
  if (/[a-zåäöé]/.test(c)) return pick(LOWER);
  return c;
}
function flap(el, delay) {
  const final = [...el.textContent];
  el.setAttribute("aria-label", el.textContent);
  el.classList.add("flap");
  const stops = final.map((_, i) => 5 + Math.round(i * 1.5) + Math.floor(Math.random() * 3));
  const last = Math.max(...stops);
  let frame = 0;
  el.textContent = final.map(randomLike).join("");
  setTimeout(function step() {
    frame++;
    el.textContent = final.map((c, i) => (frame >= stops[i] ? c : randomLike(c))).join("");
    if (frame < last) setTimeout(step, 45);
  }, delay);
}
if (!reduceMotion) {
  document.querySelectorAll(".ticket .city, .ticket__date").forEach((el, i) => flap(el, 250 + i * 200));
}

// ---------- Route line under the top bar ----------
const nav = document.querySelector(".nav");
const sections = [...document.querySelectorAll("main section[id]")];
const navLinks = [...document.querySelectorAll(".nav__links a")];
if (nav) {
  const bar = document.createElement("div");
  bar.className = "progress";
  bar.setAttribute("aria-hidden", "true");
  bar.innerHTML = '<span class="progress__fill"></span><span class="progress__train"></span>';
  nav.appendChild(bar);
  const stops = sections.map(() => { const s = document.createElement("span"); s.className = "progress__stop"; bar.appendChild(s); return s; });
  const layout = () => {
    const max = root.scrollHeight - innerHeight;
    sections.forEach((sec, i) => {
      const at = max > 0 ? Math.min(1, Math.max(0, (sec.offsetTop - 80) / max)) : 0;
      stops[i].style.setProperty("--at", at); stops[i].dataset.at = at;
    });
  };
  let queued = false;
  const update = () => {
    if (queued) return; queued = true;
    requestAnimationFrame(() => {
      const max = root.scrollHeight - innerHeight;
      const p = max > 0 ? Math.min(1, scrollY / max) : 0;
      bar.style.setProperty("--p", p);
      stops.forEach((s) => s.classList.toggle("is-passed", p >= Number(s.dataset.at) - 0.001));
      updateRoute();
      queued = false;
    });
  };
  layout(); update();
  addEventListener("scroll", update, { passive: true });
  addEventListener("resize", () => { layout(); update(); });
  document.fonts && document.fonts.ready.then(() => { layout(); update(); });
}
// Mark the nav link for the section in the middle of the screen
if ("IntersectionObserver" in window) {
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((a) => {
        if (a.hash === `#${entry.target.id}`) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
      });
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  sections.forEach((s) => spy.observe(s));
}

// ---------- Experience: the line fills as you scroll, with a train at the front ----------
const route = document.querySelector(".route");
let routeItems = [];
if (route) {
  route.insertAdjacentHTML("afterbegin", '<span class="route__fill" aria-hidden="true"></span><span class="route__loco" aria-hidden="true"></span>');
  routeItems = [...route.querySelectorAll(".route__item")];
}
function updateRoute() {
  if (!route) return;
  const r = route.getBoundingClientRect();
  // Full when the bottom of the list reaches 60% down the screen
  const fill = reduceMotion ? 1 : Math.min(1, Math.max(0, (innerHeight * 0.6 - r.top) / r.height));
  route.style.setProperty("--fill", fill);
  routeItems.forEach((li) => {
    const dot = li.querySelector(".route__dot").getBoundingClientRect();
    li.classList.toggle("is-passed", dot.top - r.top <= fill * (r.height - 44) + 12);
  });
}
updateRoute();

// ---------- Cards: a soft light follows the pointer ----------
document.querySelectorAll(".card, .feature").forEach((el) => {
  el.addEventListener("pointermove", (e) => {
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  });
});

// ---------- Live track display behind the ticket ----------
// A simplified traffic control screen: parallel tracks with crossovers, train
// blocks moving along them, and signals that turn red behind each train and
// green again once it has gone. Decoration only; the trains are made up.
const hero = document.querySelector(".hero");
if (hero) {
  const canvas = document.createElement("canvas");
  canvas.className = "tracks";
  canvas.setAttribute("aria-hidden", "true");
  hero.prepend(canvas);
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0, lines = [], trains = [], signals = [], colors = {};
  const rand = (a, b) => a + Math.random() * (b - a);

  window.readTrackColors = function () {
    const cs = getComputedStyle(root);
    colors = { track: cs.getPropertyValue("--line").trim(), train: cs.getPropertyValue("--accent").trim(), go: cs.getPropertyValue("--green").trim(), stop: cs.getPropertyValue("--stop").trim() };
    draw();
  };
  function build() {
    const dpr = Math.min(2, devicePixelRatio || 1);
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = H < 520 ? 5 : 7;
    lines = Array.from({ length: count }, (_, i) => ({ y: Math.round(H * (0.08 + (0.84 * i) / (count - 1))) + 0.5, dir: i % 2 ? 1 : -1 }));
    trains = [];
    lines.forEach((_, i) => { for (let k = 0; k < (W > 900 ? 2 : 1); k++) trains.push({ line: i, len: rand(60, 160), speed: rand(30, 80), x: rand(-150, W + 150) }); });
    signals = [];
    lines.forEach((_, i) => { for (let x = rand(40, 180); x < W; x += rand(190, 280)) signals.push({ line: i, x }); });
  }
  function draw() {
    if (!W) return;
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = colors.track; ctx.lineWidth = 1.5; ctx.beginPath();
    lines.forEach((ln) => { ctx.moveTo(0, ln.y); ctx.lineTo(W, ln.y); });
    for (let i = 0; i < lines.length - 1; i++) { const x = (i % 2 ? 0.7 : 0.22) * W; ctx.moveTo(x, lines[i].y); ctx.lineTo(x + 70, lines[i + 1].y); }
    ctx.stroke();
    signals.forEach((sg) => {
      const ln = lines[sg.line];
      const red = trains.some((t) => {
        if (t.line !== sg.line) return false;
        const past = ln.dir > 0 ? t.x - sg.x : sg.x - t.x;     // how far the front is past the signal
        return past >= 0 && past < t.len + 220;
      });
      ctx.globalAlpha = red ? 1 : 0.6; ctx.fillStyle = red ? colors.stop : colors.go;
      ctx.beginPath(); ctx.arc(sg.x, ln.y - 8, 2.5, 0, Math.PI * 2); ctx.fill();
    });
    trains.forEach((t) => {
      const ln = lines[t.line];
      const x0 = ln.dir > 0 ? t.x - t.len : t.x;
      ctx.fillStyle = colors.train; ctx.globalAlpha = 0.55; ctx.fillRect(x0, ln.y - 2.5, t.len, 5);
      ctx.globalAlpha = 1; ctx.fillRect(ln.dir > 0 ? t.x - 7 : t.x, ln.y - 2.5, 7, 5);
    });
    ctx.globalAlpha = 1;
  }
  let running = false, last = 0, visible = true;
  function frame(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
    trains.forEach((t) => {
      const ln = lines[t.line];
      t.x += ln.dir * t.speed * dt;
      if (ln.dir > 0 && t.x - t.len > W + 40) { t.x = -rand(40, 400); t.len = rand(60, 160); }
      if (ln.dir < 0 && t.x + t.len < -40) { t.x = W + rand(40, 400); t.len = rand(60, 160); }
    });
    draw();
    requestAnimationFrame(frame);
  }
  function setRunning() {
    const go = visible && !document.hidden && !reduceMotion;
    if (go && !running) { running = true; last = 0; requestAnimationFrame(frame); }
    if (!go) running = false;
  }
  build(); window.readTrackColors();
  if ("IntersectionObserver" in window) new IntersectionObserver((e) => { visible = e[0].isIntersecting; setRunning(); }).observe(hero);
  document.addEventListener("visibilitychange", setRunning);
  let t; addEventListener("resize", () => { clearTimeout(t); t = setTimeout(() => { build(); draw(); }, 150); });
  setRunning();
}
