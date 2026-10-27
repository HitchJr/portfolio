// Shared behaviour for every page: theme toggle, scroll reveals,
// the VoiceReader waveform and the clocks.
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
    el.textContent = new Intl.DateTimeFormat("sv-SE", { hour: "2-digit", minute: "2-digit", timeZone: el.dataset.tz }).format(new Date());
  });
}
tick();
setInterval(tick, 15000);
