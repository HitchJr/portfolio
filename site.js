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
// Every character flips through its row of the board (A, B, C... in order)
// and they land strictly left to right, so the settled text sweeps across.
// Landed characters are full colour, the ones still flipping are dimmed.
// Screen readers get the real text from aria-label.
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ", LOWER = "abcdefghijklmnopqrstuvwxyz", DIGITS = "0123456789";
const setFor = (c) => (/[0-9]/.test(c) ? DIGITS : /[A-ZÅÄÖ]/.test(c) ? UPPER : /[a-zåäöé]/.test(c) ? LOWER : null);
function flap(el, delay) {
  const final = [...el.textContent];
  el.setAttribute("aria-label", el.textContent);
  el.classList.add("flap");
  const sets = final.map(setFor);
  const pos = sets.map((s) => (s ? Math.floor(Math.random() * s.length) : 0));
  const stops = final.map((_, i) => 8 + i * 3); // one character lands every third flip
  const last = Math.max(...stops);
  const done = document.createElement("span"), rolling = document.createElement("span");
  rolling.className = "flap__rolling";
  el.replaceChildren(done, rolling);
  let frame = 0;
  const render = () => {
    const landed = final.filter((_, i) => frame >= stops[i]).length;
    done.textContent = final.slice(0, landed).join("");
    rolling.textContent = final.slice(landed).map((c, j) => {
      const i = landed + j;
      return sets[i] ? sets[i][(pos[i] + frame) % sets[i].length] : c;
    }).join("");
  };
  render();
  setTimeout(function step() {
    frame++;
    render();
    if (frame < last) setTimeout(step, 55);
    else el.textContent = final.join("");
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
  bar.innerHTML = '<span class="progress__fill"></span>';
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
  // A miniature electric train in one colour: windows and the gap under the
  // body are cut out, so it reads as a train at any size. Drawn side-on and
  // turned in CSS so its nose points down the line.
  const train = `<svg class="route__loco" viewBox="0 0 80 31" aria-hidden="true">
    <path d="M24 6.5l6-5.5h10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    <path class="loco__body" d="M3 6.5h52c10 0 18 6 21 14l1 3v1H3z"/>
    <g class="loco__cut"><rect x="9" y="10" width="9" height="6" rx="1.2"/><rect x="21" y="10" width="9" height="6" rx="1.2"/><rect x="33" y="10" width="9" height="6" rx="1.2"/><path d="M48 10h7c4.2 0 8 2.4 10.2 6H48z"/><rect x="3" y="19.2" width="71" height="1.4"/></g>
    <g class="loco__wheels"><circle cx="11" cy="27.3" r="3"/><circle cx="19" cy="27.3" r="3"/><circle cx="51" cy="27.3" r="3"/><circle cx="59" cy="27.3" r="3"/></g>
  </svg>`;
  route.insertAdjacentHTML("afterbegin", `<span class="route__fill" aria-hidden="true"></span>${train}`);
  routeItems = [...route.querySelectorAll(".route__item")];
}
function updateRoute() {
  if (!route) return;
  const r = route.getBoundingClientRect();
  // Full when the bottom of the list reaches 60% down the screen
  const fill = reduceMotion ? 1 : Math.min(1, Math.max(0, (innerHeight * 0.6 - r.top) / r.height));
  route.style.setProperty("--fill", fill);
  route.classList.toggle("is-moving", fill > 0.02);   // the train only shows once the line starts filling
  routeItems.forEach((li) => {
    const dot = li.querySelector(".route__dot").getBoundingClientRect();
    li.classList.toggle("is-passed", dot.top - r.top <= fill * (r.height - 44) + 12);
  });
}
updateRoute();

// ---------- Cards: a soft light follows the pointer ----------
document.querySelectorAll(".card, .feature, .route__card").forEach((el) => {
  el.addEventListener("pointermove", (e) => {
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  });
});


// ---------- Live track display behind the ticket ----------
// A simplified traffic control screen that follows block signalling rules:
// - Each track is split into blocks by signals. Only one train may be in a block.
// - A signal turns red as soon as a train passes it, and back to green once
//   the whole train has left the block behind it.
// - A train that sees a red signal ahead brakes and waits in front of it,
//   so two trains can never overlap on a track.
// Decoration only; the trains are made up.
const hero = document.querySelector(".hero");
if (hero) {
  const canvas = document.createElement("canvas");
  canvas.className = "tracks";
  canvas.setAttribute("aria-hidden", "true");
  hero.prepend(canvas);
  const ctx = canvas.getContext("2d");
  const rand = (a, b) => a + Math.random() * (b - a);
  const GAP = 24;            // minimum distance kept to the train ahead
  const ACCEL = 22, BRAKE = 45;
  let W = 0, H = 0, lines = [], colors = {};

  window.readTrackColors = function () {
    const cs = getComputedStyle(root);
    const v = (name) => cs.getPropertyValue(name).trim();
    colors = { track: v("--track") || v("--line"), train: v("--accent"), go: v("--green"), stop: v("--stop") };
    draw();
  };

  // Positions along a line are measured in the direction of travel ("s"),
  // so the same rules work for trains going left and right.
  const toX = (ln, s) => (ln.dir > 0 ? s : W - s);
  const tail = (t) => t.s - t.len;
  const occupies = (t, from, to) => t.s > from && tail(t) < to;

  function build() {
    const dpr = Math.min(2, devicePixelRatio || 1);
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = H < 520 ? 5 : 7;
    const perLine = W > 900 ? 2 : 1;
    lines = Array.from({ length: count }, (_, i) => {
      const ln = { y: Math.round(H * (0.08 + (0.84 * i) / (count - 1))) + 0.5, dir: i % 2 ? 1 : -1, signals: [], trains: [] };
      for (let s = rand(60, 160); s < W - 60; s += rand(200, 290)) ln.signals.push(s);
      // Place trains from the front backwards, each one block apart
      let front = rand(W * 0.5, W);
      for (let k = 0; k < perLine; k++) {
        const len = rand(60, 150);
        ln.trains.push({ s: front, len, v: 0, vmax: rand(35, 75) });
        front = front - len - rand(260, 420);
      }
      return ln;
    });
  }

  // Block i runs from signal i to signal i + 1 (the last one to the screen edge)
  function blockEnd(ln, i) { return i + 1 < ln.signals.length ? ln.signals[i + 1] : W + 400; }
  function isRed(ln, i, except) {
    return ln.trains.some((t) => t !== except && occupies(t, ln.signals[i], blockEnd(ln, i)));
  }

  function step(dt) {
    lines.forEach((ln) => {
      ln.trains.sort((a, b) => b.s - a.s);              // leader first
      ln.trains.forEach((t, k) => {
        // Movement authority: stop before the next red signal, and never
        // closer than GAP to the tail of the train ahead.
        let limit = Infinity;
        const next = ln.signals.findIndex((sig) => sig > t.s);
        for (let i = next; i >= 0 && i < ln.signals.length; i++) {
          if (isRed(ln, i, t)) { limit = ln.signals[i] - 6; break; }
          if (ln.signals[i] - t.s > 400) break;          // far enough to see
        }
        if (k > 0) limit = Math.min(limit, tail(ln.trains[k - 1]) - GAP);
        const room = Math.max(0, limit - t.s);
        const target = Math.min(t.vmax, Math.sqrt(2 * BRAKE * room));
        t.v = target > t.v ? Math.min(target, t.v + ACCEL * dt) : target;
        t.s = Math.min(t.s + t.v * dt, limit);
      });
      // A train that has left the screen re-enters at the back of the queue
      ln.trains.forEach((t) => {
        if (tail(t) <= W + 40) return;
        const lastTail = Math.min(...ln.trains.filter((o) => o !== t).map(tail), 0);
        t.len = rand(60, 150); t.vmax = rand(35, 75); t.v = t.vmax * 0.6;
        t.s = Math.min(-rand(40, 260), lastTail - GAP - rand(80, 300));
      });
    });
  }

  function draw() {
    if (!W) return;
    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = colors.track;
    ctx.beginPath();
    lines.forEach((ln) => { ctx.moveTo(0, ln.y); ctx.lineTo(W, ln.y); });
    for (let i = 0; i < lines.length - 1; i++) { const x = (i % 2 ? 0.7 : 0.22) * W; ctx.moveTo(x, lines[i].y); ctx.lineTo(x + 70, lines[i + 1].y); }
    ctx.stroke();

    lines.forEach((ln) => {
      const side = ln.dir > 0 ? -1 : 1;                  // signals stand on the driver's side
      ln.signals.forEach((sig, i) => {
        const x = toX(ln, sig);
        const red = isRed(ln, i);
        // Occupied block: drawn as a coloured section of track, like a control screen
        if (red) {
          ctx.strokeStyle = colors.stop; ctx.globalAlpha = 0.18; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(x, ln.y); ctx.lineTo(toX(ln, Math.min(blockEnd(ln, i), W)), ln.y); ctx.stroke();
        }
        // Block joint and signal
        ctx.globalAlpha = 0.9; ctx.strokeStyle = colors.track; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(x, ln.y - 4); ctx.lineTo(x, ln.y + 4); ctx.moveTo(x, ln.y + side * 4); ctx.lineTo(x, ln.y + side * 9); ctx.stroke();
        ctx.globalAlpha = 1; ctx.fillStyle = red ? colors.stop : colors.go;
        ctx.beginPath(); ctx.arc(x, ln.y + side * 11, 2.6, 0, Math.PI * 2); ctx.fill();
      });
      ln.trains.forEach((t) => {
        const a = toX(ln, tail(t)), b = toX(ln, t.s);
        ctx.fillStyle = colors.train;
        ctx.globalAlpha = 0.55; ctx.fillRect(Math.min(a, b), ln.y - 2.5, Math.abs(b - a), 5);
        ctx.globalAlpha = 1; ctx.fillRect(ln.dir > 0 ? b - 7 : b, ln.y - 2.5, 7, 5);   // the cab at the front
      });
    });
    ctx.globalAlpha = 1;
  }

  let running = false, last = 0, visible = true;
  function frame(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
    step(dt);
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
  // Rebuild when the hero changes size (window resize, or fonts loading in)
  let resizeTimer, lastSize = `${W}x${H}`;
  const rebuild = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const r = canvas.getBoundingClientRect();
      if (`${r.width}x${r.height}` === lastSize) return;
      build(); draw(); lastSize = `${W}x${H}`;
    }, 150);
  };
  if ("ResizeObserver" in window) new ResizeObserver(rebuild).observe(hero); else addEventListener("resize", rebuild);
  setRunning();
}