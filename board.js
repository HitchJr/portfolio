// Split-flap departure board in the "At a glance" section (index.html, styles.css).
(() => {
// The flap order on the drum, like a real board: blank, letters, digits, signs
const DRUM = " ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ0123456789·-:/→";
const COLS = [["year", 4], ["to", 10], ["info", 15], ["status", 8]];
const ROWS = 4;
const BOARDS = {
  departures: [
    ["2026", "HANOI", "PROJECTS · OPS", "BOARDING"],
    ["2026", "REMOTE", "OPERATIONS", "OPEN"],
    ["NEXT", "YOUR TEAM", "PLANNING · LEAD", "ON TIME"],
    ["", "", "", ""],
  ],
  arrivals: [
    ["2026", "MALMÖ", "TRACK WORK LEAD", "NOW"],
    ["2022", "MALMÖ", "TRAFFIC CONTROL", "4 YRS"],
    ["2020", "MALMÖ", "POSTNORD", "2 YRS"],
    ["2018", "TRELLEBORG", "METSO", "1 YR"],
  ],
  skills: [
    ["SAFE", "WORKSITES", "SAFETY LEAD", "CHECKED"],
    ["24/7", "CONTROL", "INCIDENTS", "CHECKED"],
    ["XLSX", "AUTOMATION", "2-4 H/DAY SAVED", "CHECKED"],
    ["SV", "EN", "LANGUAGES", "CHECKED"],
  ],
};
const NAMES = { departures: "Departures", arrivals: "Arrivals", skills: "Luggage" };
const STEP_MS = 55;           // how long one flap takes to fall
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

const board = document.getElementById("board");
const cells = []; // cells[row][col] = [cell, ...]

function makeCell() {
  const el = document.createElement("span");
  el.className = "cell";
  el.innerHTML = '<span class="cell__half cell__half--top"><b></b></span><span class="cell__half cell__half--bot"><b></b></span>';
  el.ch = " ";
  return el;
}

for (let r = 0; r < ROWS; r++) {
  const row = document.createElement("div");
  row.className = "fb__row"; row.setAttribute("role", "row");
  cells.push(COLS.map(([key, n]) => {
    const field = document.createElement("span");
    field.className = "fb__field" + (key === "status" ? " fb__field--status" : "");
    field.dataset.col = key; field.style.setProperty("--n", n); field.setAttribute("role", "cell");
    const list = Array.from({ length: n }, makeCell);
    field.append(...list);
    row.append(field);
    return list;
  }));
  board.append(row);
}

const glyph = (el, part) => el.querySelector(part + " b");
function set(el, ch) { glyph(el, ".cell__half--top").textContent = ch; glyph(el, ".cell__half--bot").textContent = ch; el.ch = ch; }

// One flap from the current character to the next one on the drum
function flip(el, next) {
  const prev = el.ch;
  el.querySelectorAll(".cell__leaf").forEach((l) => l.remove()); // a flip still falling is cut short
  glyph(el, ".cell__half--bot").textContent = prev;
  el.ch = next;
  const top = document.createElement("span"); top.className = "cell__leaf cell__leaf--top"; top.innerHTML = `<b>${prev}</b>`;
  const bot = document.createElement("span"); bot.className = "cell__leaf cell__leaf--bot"; bot.innerHTML = `<b>${next}</b>`;
  glyph(el, ".cell__half--top").textContent = next;  // revealed behind the falling top leaf
  el.append(top, bot);
  const half = STEP_MS / 2;
  top.animate([{ transform: "rotateX(0deg)", filter: "brightness(1)" }, { transform: "rotateX(-90deg)", filter: "brightness(0.6)" }], { duration: half, easing: "ease-in", fill: "forwards" });
  bot.animate([{ transform: "rotateX(90deg)", filter: "brightness(1.4)" }, { transform: "rotateX(0deg)", filter: "brightness(1)" }], { duration: half, delay: half, easing: "ease-out", fill: "forwards" })
    .finished.then(() => { if (el.ch === next) glyph(el, ".cell__half--bot").textContent = next; top.remove(); bot.remove(); }, () => {});
}

// Roll a cell round the drum to its target letter. Every cell takes the same ROLL_MS
// however far its letter is on the drum (far letters just flap faster), so cells land
// in the order they start: left to right along each row. Timed by the clock, not by
// counting timers, so the board lands on time even if the browser slows timers down.
const ROLL_MS = 700;
const rolling = new Set();
let timer = 0;
function roll(el, target, delay) {
  target = DRUM.includes(target) ? target : " ";
  if (reduced) { set(el, target); return; }
  const from = DRUM.indexOf(el.ch);
  const steps = (DRUM.indexOf(target) - from + DRUM.length) % DRUM.length;
  if (!steps) { rolling.delete(el); return; }
  el.roll = { from, steps, start: performance.now() + delay };
  rolling.add(el);
  if (!timer) timer = setTimeout(tick, 0);
}
function tick() {
  const now = performance.now();
  for (const el of rolling) {
    const { from, steps, start } = el.roll;
    const n = Math.min(Math.max(Math.floor(((now - start) / ROLL_MS) * steps), 0), steps);
    const ch = DRUM[(from + n) % DRUM.length];
    if (ch !== el.ch) flip(el, ch);
    if (n >= steps) rolling.delete(el);
  }
  timer = rolling.size ? setTimeout(tick, 16) : 0;
}

// Where each column starts, counted in cells from the left edge of the board
const colStart = COLS.map((_, c) => COLS.slice(0, c).reduce((sum, [, n]) => sum + n, 0));

function show(name) {
  BOARDS[name].forEach((row, r) => row.forEach((text, c) => {
    const list = cells[r][c], s = text.toUpperCase().padEnd(list.length).slice(0, list.length);
    list.forEach((el, i) => roll(el, s[i], r * 160 + (colStart[c] + i) * 30));
  }));
  board.querySelector("[data-board-name]").textContent = NAMES[name];
  document.querySelectorAll("[data-show]").forEach((b) => {
    const on = b.dataset.show === name;
    b.setAttribute("aria-pressed", on); b.classList.toggle("btn--ghost", !on);
  });
}

cells.flat(2).forEach((el) => set(el, " "));
document.querySelectorAll("[data-show]").forEach((b) => b.addEventListener("click", () => show(b.dataset.show)));

// Station clock
const clock = board.querySelector("[data-clock]");
const showTime = () => { const d = new Date(); clock.textContent = String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); };
showTime(); setInterval(showTime, 10000);

// Start once the board is on screen
const io = new IntersectionObserver((e) => { if (e[0].isIntersecting) { io.disconnect(); show("departures"); } });
const r = board.getBoundingClientRect();
if (r.top < innerHeight && r.bottom > 0) show("departures"); else io.observe(board);
})();
