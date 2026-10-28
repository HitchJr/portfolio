// Colours for the two themes. Logos are drawn with these, so light and dark stay in step.
const THEMES = {
  light: { bg: "#F0F0EA", ink: "#18221C", accent: "#1E6B47", lit: "#1E8A4C", off: "#C9CDBF", track: "#B3BBAA" },
  dark:  { bg: "#0D1410", ink: "#E7EEE8", accent: "#6FD49A", lit: "#6FD49A", off: "#2B3D32", track: "#3A4E41" },
};

// The four logo directions, each drawn on a 64 x 64 grid.
const CONCEPTS = [
  {
    id: "signal", name: "1 · Signal",
    note: "A two-lamp signal head with the lower lamp lit green: go. Carries on from your current dp logo, so it is the safest change.",
    svg: (t) => `<rect x="2" y="2" width="60" height="60" rx="14" fill="${t.ink}"/>
      <rect x="22" y="9" width="20" height="46" rx="10" fill="${t.bg}" opacity=".08"/>
      <rect x="22" y="9" width="20" height="46" rx="10" fill="none" stroke="${t.bg}" stroke-opacity=".35" stroke-width="1.5"/>
      <circle cx="32" cy="22" r="6" fill="${t.bg}" fill-opacity=".18"/>
      <circle cx="32" cy="42" r="6" fill="${t.lit}"/>`,
  },
  {
    id: "monogram", name: "2 · DP monogram",
    note: "Your initials drawn as one line, where the bowl of the P is a green signal lamp. Works small, and reads as a name first.",
    svg: (t) => `<path d="M7 13v38h6a19 19 0 0 0 0-38z" fill="none" stroke="${t.ink}" stroke-width="5.5" stroke-linejoin="round"/>
      <path d="M39 51V13h7.5a10.5 10.5 0 0 1 0 21H39" fill="none" stroke="${t.ink}" stroke-width="5.5" stroke-linejoin="round" stroke-linecap="round"/>
      <circle cx="46" cy="23.5" r="4.2" fill="${t.lit}"/>`,
  },
  {
    id: "ticket", name: "3 · Ticket",
    note: "The ticket from the top of your website, with your initials on it. Ties the logo to the Malmö to Vietnam story.",
    svg: (t) => `<path d="M8 15h48a4 4 0 0 1 4 4v8a5 5 0 0 0 0 10v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-8a5 5 0 0 0 0-10v-8a4 4 0 0 1 4-4z" fill="${t.ink}"/>
      <path d="M44 18v28" stroke="${t.bg}" stroke-width="1.6" stroke-dasharray="2.5 2.5" stroke-opacity=".6"/>
      <text x="25" y="38" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-weight="500" font-size="15" fill="${t.bg}">DP</text>
      <circle cx="52" cy="32" r="3.6" fill="${t.lit}"/>`,
  },
  {
    id: "track", name: "4 · Track and signal",
    note: "Two rails, sleepers and a signal showing green. The most railway of the four; better as an icon next to your name than on its own.",
    svg: (t) => `<rect x="2" y="2" width="60" height="60" rx="14" fill="${t.bg === "#F0F0EA" ? "#E5E6DD" : "#15201A"}"/>
      ${[12, 20, 28, 36, 44, 52].map((x) => `<path d="M${x} 40v12" stroke="${t.track}" stroke-width="2.4" stroke-linecap="round"/>`).join("")}
      <path d="M7 43h50M7 49h50" stroke="${t.ink}" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M44 43V24" stroke="${t.ink}" stroke-width="2.6" stroke-linecap="round"/>
      <rect x="38" y="8" width="12" height="20" rx="6" fill="${t.ink}"/>
      <circle cx="44" cy="14" r="2.8" fill="${t.off}"/>
      <circle cx="44" cy="22" r="2.8" fill="${t.lit}"/>`,
  },
];

function svgFile(concept, theme, withBg) {
  const t = THEMES[theme];
  const bg = withBg ? `<rect width="64" height="64" fill="${t.bg}"/>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="256" height="256">${bg}${concept.svg(t)}</svg>`;
}
function download(svg) {
  return URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
}

document.getElementById("logos").innerHTML = CONCEPTS.map((c) => {
  const icon = (theme) => `<svg class="icon" viewBox="0 0 64 64" aria-label="${c.name} logo, ${theme}">${c.svg(THEMES[theme])}</svg>`;
  const lockup = (theme) => `<div class="lockup"><svg viewBox="0 0 64 64">${c.svg(THEMES[theme])}</svg><div><b>Dante Persson</b><span>Operations · Projects · IT</span></div></div>`;
  const link = (theme) => `<a class="dl" download="dante-persson-logo-${c.id}-${theme}.svg" href="${download(svgFile(c, theme, false))}">SVG</a>`;
  return `<section class="card concept">
    <header><h3>${c.name}</h3><p>${c.note}</p></header>
    <div class="tiles">
      <div class="tile light">${icon("light")}${link("light")}</div>
      <div class="tile dark">${icon("dark")}${link("dark")}</div>
      <div class="tile light wide">${lockup("light")}</div>
      <div class="tile dark wide">${lockup("dark")}</div>
    </div>
  </section>`;
}).join("");

// Swatches
const SW = {
  light: [["Paper", "#F0F0EA"], ["Card", "#FBFBF8"], ["Ink", "#18221C"], ["Forest", "#1E6B47"], ["Go", "#1E8A4C"], ["Stop", "#C2412D"], ["Rule", "#D5D8CC"], ["Track", "#B3BBAA"]],
  dark: [["Screen", "#0D1410"], ["Card", "#15201A"], ["Ink", "#E7EEE8"], ["Signal green", "#6FD49A"], ["Go", "#6FD49A"], ["Stop", "#FF7A62"], ["Rule", "#223128"], ["Track", "#2B3D32"]],
};
for (const [k, list] of Object.entries(SW)) {
  document.getElementById("sw-" + k).innerHTML = list.map(([n, hex]) =>
    `<div class="sw-wrap"><div class="sw" style="background:${hex}"></div><p>${n}</p><p class="mono">${hex}</p></div>`).join("");
}
