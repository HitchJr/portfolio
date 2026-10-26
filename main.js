// DP.IO portfolio
// The page works without this file: the board rows are written in index.html.
// This file only adds:
// 1. Open and close for the departure board rows.
// 2. Split-flap effect: board letters roll once before they settle.
// 3. Malmö and Tokyo clocks on the board.
// 4. The train on "How a build runs": drives through the steps once.

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const rowsEl = document.getElementById("rows");

// ---------- 1. Open and close ----------
// A closed panel is also made "inert", so keyboard users can't tab into
// links they can't see. Opening the row removes it again.
const buttons = [...rowsEl.querySelectorAll(".row__btn")];

function setOpen(btn, open) {
  const panel = document.getElementById(btn.getAttribute("aria-controls"));
  btn.setAttribute("aria-expanded", String(open));
  panel.dataset.open = String(open);
  panel.inert = !open;
}

buttons.forEach((btn) => {
  setOpen(btn, false);
  btn.addEventListener("click", () => setOpen(btn, btn.getAttribute("aria-expanded") !== "true"));
});

// ---------- 2. Split-flap effect ----------
// Each character spins through random characters of the same kind and case
// (digits through digits, capitals through capitals, small letters through
// small letters) and then locks in place. Spaces and symbols stay put.
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";
const pick = (set) => set[Math.floor(Math.random() * set.length)];

function randomLike(c) {
  if (/[0-9]/.test(c)) return pick(DIGITS);
  if (/[A-ZÅÄÖ]/.test(c)) return pick(UPPER);
  if (/[a-zåäö]/.test(c)) return pick(LOWER);
  return c;
}

function settle(el, delay) {
  if (el.dataset.running === "true") return;
  el.dataset.running = "true";
  const final = [...el.dataset.final];
  // Characters lock left to right, with a little randomness so it isn't robotic.
  const stops = final.map((_, i) => 4 + Math.round(i * 1.4) + Math.floor(Math.random() * 3));
  const last = Math.max(...stops);
  let frame = 0;
  setTimeout(function tick() {
    frame++;
    el.textContent = final.map((c, i) => (frame >= stops[i] ? c : randomLike(c))).join("");
    if (frame < last) setTimeout(tick, 45);
    else el.dataset.running = "false";
  }, delay);
}

const flaps = [...rowsEl.querySelectorAll(".flap")];
flaps.forEach((el) => { el.dataset.final = el.textContent; });

if (!reduceMotion) {
  // Rolls once, row by row, when the board scrolls into view.
  // (The text is already readable before that; the roll is only a flourish.)
  const rows = rowsEl.querySelectorAll(".row");
  new IntersectionObserver((entries, obs) => {
    if (!entries[0].isIntersecting) return;
    rows.forEach((row, r) => row.querySelectorAll(".flap").forEach((el) => settle(el, r * 160)));
    obs.disconnect();
  }, { threshold: 0.25 }).observe(rowsEl);

  // And again on a row when a mouse moves onto it.
  buttons.forEach((btn) => {
    btn.addEventListener("pointerenter", (e) => {
      if (e.pointerType === "mouse") btn.querySelectorAll(".flap").forEach((el) => settle(el, 0));
    });
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
// The five steps sit on one track. When the section scrolls into view, the
// train drives through the steps once, lighting each one, and stops at 05.
// After that, hovering a step with a mouse drives the train there.
// Trains don't reverse: to reach a step behind it, the train leaves the right
// end of the track and comes back in from the left (the track is a loop).
// On phones the steps stack, so there's no shared track: the train is hidden.
const stepsWrap = document.getElementById("steps");
const train = stepsWrap.querySelector(".train");
const steps = [...stepsWrap.querySelectorAll(".steps li")];
let at = 0;          // the step the train is standing at
let wanted = 0;      // the step it should go to next
let driving = false;
let touring = false; // true during the one drive-through

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function spot(i) {
  const li = steps[i];
  return { x: li.offsetLeft + 4, y: li.offsetTop + li.offsetHeight - 9 - train.clientHeight };
}

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

function drive(fromX, toX, y, ms, easing) {
  return train.animate(
    [{ transform: `translate(${fromX}px, ${y}px)` }, { transform: `translate(${toX}px, ${y}px)` }],
    { duration: ms, easing, fill: "forwards" }
  ).finished;
}

async function go() {
  if (driving) return;
  driving = true;
  while (wanted !== at) {
    const target = wanted;
    const from = spot(at), to = spot(target);
    const perPx = 1.4;               // milliseconds per pixel, so longer trips take longer
    if (reduceMotion) {
      place(target);
    } else if (target > at) {
      await drive(from.x, to.x, to.y, Math.max(350, (to.x - from.x) * perPx), "cubic-bezier(.25,.8,.25,1)");
    } else {
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

// The one drive-through: 01 → 02 → 03 → 04 → 05, with a short stop at each.
async function tour() {
  touring = true;
  for (let i = 1; i < steps.length && touring; i++) {
    await wait(i === 1 ? 300 : 450);
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
} else {
  light(steps.length - 1);           // reduced motion: no drive, just stand at 05
  at = wanted = steps.length - 1;
}

steps.forEach((li, i) => {
  li.addEventListener("pointerenter", (e) => {
    if (e.pointerType !== "mouse" || !oneLine()) return;
    touring = false;                 // a visitor takes over from the drive-through
    wanted = i;
    go();
  });
});

function reset() {
  if (driving) return;
  stepsWrap.classList.toggle("has-train", oneLine());
  place(at);
}
reset();
window.addEventListener("resize", reset);
document.fonts && document.fonts.ready.then(reset);
