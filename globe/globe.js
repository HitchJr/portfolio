(() => {
const stage = document.getElementById("globe");
const scope = stage.closest("[data-globe]") || document;     // the board and controls that belong to this globe
const HERE = document.currentScript.src.replace(/[^/]*$/, ""); // data files sit next to this script
const cssColor = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

// The overland route, station by station: [name, lat, lon, country, shown on the globe, km/h on the leg that leaves it,
// and optionally "straight": draw the leg leaving it as a straight line instead of snapping it to the rail data, for the
// Øresund and Great Belt crossings, which the rail data doesn't join up].
// Speeds are approximate maximum line speeds for each section, set by hand (no open dataset covers the whole route).
const STOPS = [
  ["Malmö C", 55.605, 13.003, "Sweden", true, 160, "straight"],
  ["Hyllie", 55.563, 12.976, "Sweden", false, 200, "straight"],
  ["Kastrup", 55.630, 12.649, "Denmark", false, 160, "straight"],
  ["Copenhagen", 55.673, 12.565, "Denmark", true, 180],
  ["Roskilde", 55.639, 12.088, "Denmark", false, 180],
  ["Ringsted", 55.441, 11.790, "Denmark", false, 180],
  ["Korsør", 55.330, 11.140, "Denmark", false, 180, "straight"],
  ["Nyborg", 55.312, 10.789, "Denmark", false, 180],
  ["Odense", 55.401, 10.388, "Denmark", false, 160],
  ["Fredericia", 55.566, 9.752, "Denmark", false, 120],
  ["Padborg", 54.826, 9.363, "Denmark", false, 120],
  ["Flensburg", 54.774, 9.437, "Germany", false, 160],
  ["Hamburg", 53.553, 10.007, "Germany", true, 230],
  ["Berlin", 52.525, 13.369, "Germany", true, 160],
  ["Frankfurt (Oder)", 52.336, 14.546, "Germany", false, 160],
  ["Poznań", 52.402, 16.912, "Poland", false, 160],
  ["Warsaw", 52.229, 21.003, "Poland", true, 160],
  ["Terespol", 52.075, 23.616, "Poland", false, 40],
  ["Brest", 52.098, 23.734, "Belarus", false, 140],
  ["Minsk", 53.890, 27.551, "Belarus", true, 140],
  ["Orsha", 54.509, 30.423, "Belarus", false, 140],
  ["Smolensk", 54.782, 32.045, "Russia", false, 160],
  ["Moscow", 55.776, 37.655, "Russia", true, 160],
  ["Vladimir", 56.129, 40.407, "Russia", false, 140],
  ["Nizhny Novgorod", 56.327, 43.936, "Russia", false, 120],
  ["Kirov", 58.603, 49.668, "Russia", false, 120],
  ["Perm", 58.010, 56.250, "Russia", false, 100],
  ["Yekaterinburg", 56.858, 60.606, "Russia", true, 120],
  ["Tyumen", 57.153, 65.534, "Russia", false, 120],
  ["Omsk", 54.989, 73.368, "Russia", false, 120],
  ["Novosibirsk", 55.035, 82.897, "Russia", true, 100],
  ["Krasnoyarsk", 56.009, 92.852, "Russia", false, 100],
  ["Taishet", 55.940, 98.003, "Russia", false, 100],
  ["Irkutsk", 52.284, 104.281, "Russia", true, 60],
  ["Slyudyanka", 51.657, 103.719, "Russia", false, 80],
  ["Ulan-Ude", 51.834, 107.584, "Russia", false, 80],
  ["Naushki", 50.376, 106.112, "Russia", false, 30],
  ["Sükhbaatar", 50.231, 106.208, "Mongolia", false, 70],
  ["Darkhan", 49.468, 105.969, "Mongolia", false, 70],
  ["Ulaanbaatar", 47.907, 106.883, "Mongolia", true, 60],
  ["Choir", 46.360, 108.360, "Mongolia", false, 70],
  ["Sainshand", 44.892, 110.137, "Mongolia", false, 70],
  ["Zamyn-Üüd", 43.717, 111.901, "Mongolia", false, 20],
  ["Erenhot", 43.652, 111.977, "China", false, 120],
  ["Jining", 41.027, 113.107, "China", false, 120],
  ["Datong", 40.077, 113.300, "China", false, 120],
  ["Zhangjiakou", 40.768, 114.886, "China", false, 120],
  ["Beijing", 39.903, 116.427, "China", true, 350],
  ["Shijiazhuang", 38.042, 114.514, "China", false, 350],
  ["Zhengzhou", 34.747, 113.625, "China", false, 350],
  ["Wuhan", 30.593, 114.305, "China", true, 350],
  ["Changsha", 28.228, 112.939, "China", false, 350],
  ["Hengyang", 26.893, 112.572, "China", false, 250],
  ["Guilin", 25.274, 110.290, "China", false, 250],
  ["Liuzhou", 24.326, 109.411, "China", false, 250],
  ["Nanning", 22.817, 108.366, "China", true, 160],
  ["Pingxiang", 22.097, 106.755, "China", false, 30],
  ["Đồng Đăng", 21.941, 106.700, "Vietnam", false, 40],
  ["Lạng Sơn", 21.853, 106.762, "Vietnam", false, 50],
  ["Hanoi", 21.028, 105.854, "Vietnam", true, 0],
];
const COUNTRIES = { Sweden: [59.5, 15.5], Denmark: [56.2, 8.8], Germany: [51.2, 10.4], Poland: [52.0, 19.4], Belarus: [53.4, 28.2], Russia: [61, 75], Mongolia: [46.8, 102.5], China: [33.5, 104], Vietnam: [16.2, 107.4] };
const JOURNEY_MS = 30000; // the whole trip, real time

// Load Three.js only once the globe is about to be seen: at once if it's
// already on screen, otherwise when it scrolls near.
let started = false;
async function kick() {
  if (started) return;
  started = true;
  io.disconnect();
  try { await start(); } catch (err) { stage.querySelector(".gl-fallback").textContent = "3D isn't available in this browser."; console.error(err); }
}
const io = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) kick(); }, { rootMargin: "200px" });
const r = stage.getBoundingClientRect();
if (r.top < innerHeight + 200 && r.bottom > -200) kick(); else io.observe(stage);

function load(src) {
  return new Promise((ok, fail) => {
    const s = document.createElement("script");
    s.src = src; s.onload = ok; s.onerror = () => fail(new Error("Could not load " + src));
    document.head.append(s);
  });
}

async function start() {
  // Plain scripts, not ES modules, so the page also works opened straight from disk (file://).
  // Three.js first (OrbitControls needs it), then the rest side by side.
  await load(HERE + "vendor/three.min.js");
  await Promise.all(["OrbitControls.js", "world-eurasia.js", "route-path.js", "rails-eurasia.js"].map((f) => load(HERE + "vendor/" + f)));
  const { OrbitControls } = THREE;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Countries list their rings as edge numbers (~n = edge n reversed); join them into
  // [lon, lat, lon, lat, ...] rings for the fills
  const edgePts = (i) => {
    if (i >= 0) return WORLD.edges[i];
    const e = WORLD.edges[~i], out = [];
    for (let k = e.length - 2; k >= 0; k -= 2) out.push(e[k], e[k + 1]);
    return out;
  };
  const world = WORLD.countries.map((c) => ({ name: c.n, rings: c.r.map((ids) => ids.flatMap((i, k) => (k ? edgePts(i).slice(2) : edgePts(i)))) }));

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  stage.prepend(renderer.domElement);
  stage.querySelector(".gl-fallback").remove();

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 12); // a tight near/far range keeps depth precise enough for lines a few km above the surface
  const R = 1;
  const smooth = (a, b, x) => { const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  // Latitude/longitude to a point on the sphere (matches SphereGeometry's texture layout)
  const toVec = (lat, lon, r = R) => {
    const phi = THREE.MathUtils.degToRad(90 - lat), theta = THREE.MathUtils.degToRad(lon + 180);
    return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
  };

  // Land and sea: country fills painted onto a canvas wrapped round the sphere.
  // Borders and railways are thin lines on top, so they stay sharp up close.
  const map = document.createElement("canvas");
  map.width = 2048; map.height = 1024; // fills only (the coasts are lines), so this is plenty
  const ctx = map.getContext("2d");
  const tex = new THREE.CanvasTexture(map);
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const onRoute = new Set(Object.keys(COUNTRIES));
  const px = ([lon, lat]) => [((lon + 180) / 360) * map.width, ((90 - lat) / 180) * map.height];

  // Three surfaces, three colours: sea in a cool blue-grey, countries you pass through in the
  // brand's soft green, every other country in a plain neutral
  function drawMap() {
    const dark = document.documentElement.dataset.theme === "dark";
    const sea = dark ? "#0A1215" : "#CFDCE0", land = dark ? "#1D2321" : cssColor("--card");
    ctx.fillStyle = sea;
    ctx.fillRect(0, 0, map.width, map.height);
    for (const c of world) {
      ctx.beginPath();
      for (const ring of c.rings) {
        for (let i = 0; i < ring.length; i += 2) {
          const [x, y] = px([ring[i], ring[i + 1]]);
          if (i === 0 || Math.abs(ring[i] - ring[i - 2]) > 180) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
      }
      ctx.fillStyle = onRoute.has(c.name) ? cssColor("--accent-soft") : land;
      ctx.fill("evenodd");
    }
    tex.needsUpdate = true;
  }
  // The surface is pushed back a little in the depth test, so the borders, coasts and
  // railways drawn just above it always win instead of flickering in and out
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(R, 128, 96), new THREE.MeshBasicMaterial({ map: tex, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 8 })));

  // Lines on the sphere from [lon, lat, lon, lat, ...] strips
  function strips(list, r, mat) {
    const pos = [];
    for (const s of list) for (let i = 2; i < s.length; i += 2) {
      if (Math.abs(s[i] - s[i - 2]) > 180) continue;
      const a = toVec(s[i - 1], s[i - 2], r), b = toVec(s[i + 1], s[i], r);
      pos.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    const l = new THREE.LineSegments(g, mat);
    if (mat.isLineDashedMaterial) l.computeLineDistances();
    scene.add(l);
  }
  // Three kinds of line, each with its own look: coastlines soft and solid, land borders
  // dotted (as on most maps), railways solid grey
  const line = (opacity) => new THREE.LineBasicMaterial({ transparent: true, opacity, depthWrite: false });
  const coastMat = line(0.3), railMat = line(0.32);
  const borderMat = new THREE.LineDashedMaterial({ transparent: true, opacity: 0.7, depthWrite: false, dashSize: 0.004, gapSize: 0.005 });
  strips(WORLD.edges.filter((_, i) => !WORLD.border[i]), 1.0002, coastMat);
  strips(RAILS, 1.0003, railMat);
  strips(WORLD.edges.filter((_, i) => WORLD.border[i]), 1.0004, borderMat);

  // The route on real track (snapped to the rail network by build-rails.js)
  const pts = [];
  for (let i = 0; i < ROUTE.pts.length; i += 2) pts.push(toVec(ROUTE.pts[i + 1], ROUTE.pts[i], 1.0006));
  const along = [0];
  for (let i = 1; i < pts.length; i++) along.push(along[i - 1] + pts[i].distanceTo(pts[i - 1]));
  const LEN = along[along.length - 1];
  const KM = LEN * 6371 / 1.0006;
  const TOTAL = Math.round(KM / 100) * 100;
  const stopFrac = ROUTE.stops.map((i) => along[i] / LEN);

  // A smooth curve through the track points, resampled at even spacing, so the train
  // and camera glide round bends instead of snapping at every corner of the line
  const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal");
  curve.arcLengthDivisions = 20000;
  const SAMPLES = curve.getSpacedPoints(12000);
  function pointAt(f) {
    const x = THREE.MathUtils.clamp(f, 0, 1) * (SAMPLES.length - 1), i = Math.min(Math.floor(x), SAMPLES.length - 2);
    return SAMPLES[i].clone().lerp(SAMPLES[i + 1], x - i);
  }
  const legAt = (f) => { let i = 0; while (i < stopFrac.length - 2 && stopFrac[i + 1] <= f) i++; return i; };

  // Line speeds: simulated hours for the whole trip, squeezed into JOURNEY_MS at full pace
  let hours = 0;
  for (let i = 0; i < STOPS.length - 1; i++) hours += ((stopFrac[i + 1] - stopFrac[i]) * KM) / STOPS[i][5];
  const HOURS_PER_MS = hours / JOURNEY_MS;

  // The route line, twice: hair-thin for close up, bolder for far out, crossfaded by height.
  // Each vertex knows how far along the route it is (u, 0 to 1), so the shader can split the
  // line exactly at the journey's position: travelled in solid green, still to come in grey
  // dashes. The split moves continuously, not segment by segment.
  const SEG = 4000, RAD = 6;
  const routeUniforms = { progress: { value: 0 }, lit: { value: new THREE.Color() }, ahead: { value: new THREE.Color() } };
  const routeParts = [[0.00012, 6], [0.0009, 60]].map(([radius, dashKm]) => {
    const geo = new THREE.TubeGeometry(curve, SEG, radius, RAD, false);
    const u = new Float32Array(geo.attributes.position.count);
    for (let i = 0; i < u.length; i++) u[i] = Math.floor(i / (RAD + 1)) / SEG; // vertices come in rings of RAD + 1
    geo.setAttribute("u", new THREE.BufferAttribute(u, 1));
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      // dashes are fixed to the track (dashKm long), so they don't slide about as the camera zooms
      uniforms: { ...routeUniforms, opacity: { value: 1 }, dash: { value: dashKm / KM } },
      vertexShader: "attribute float u; varying float vU; void main() { vU = u; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform float progress, dash, opacity; uniform vec3 lit, ahead; varying float vU;
        void main() {
          if (vU <= progress) { gl_FragColor = vec4(lit, opacity); return; }
          if (fract(vU / dash) > 0.55) discard;
          gl_FragColor = vec4(ahead, 0.8 * opacity);
        }`,
    });
    scene.add(new THREE.Mesh(geo, mat));
    return mat;
  });

  // Where you are: a red marker with a light ring, like an occupied track section on a
  // traffic-control screen. It keeps the same size on screen at any zoom.
  const markCanvas = document.createElement("canvas");
  markCanvas.width = markCanvas.height = 64;
  const markTex = new THREE.CanvasTexture(markCanvas);
  function drawMarker() {
    const g = markCanvas.getContext("2d");
    g.clearRect(0, 0, 64, 64);
    g.beginPath(); g.arc(32, 32, 29, 0, Math.PI * 2); g.fillStyle = cssColor("--card"); g.fill();
    g.lineWidth = 2; g.strokeStyle = cssColor("--faint"); g.stroke();
    g.beginPath(); g.arc(32, 32, 17, 0, Math.PI * 2); g.fillStyle = cssColor("--stop"); g.fill();
    markTex.needsUpdate = true;
  }
  const marker = new THREE.Sprite(new THREE.SpriteMaterial({ map: markTex, sizeAttenuation: false, depthTest: false, transparent: true }));
  marker.scale.set(0.022, 0.022, 1);
  marker.renderOrder = 10;
  scene.add(marker);

  // Main stations: small dots that shrink with the camera, so they never look like blobs
  const stationMat = new THREE.MeshBasicMaterial();
  const dot = new THREE.SphereGeometry(0.0016, 12, 8);
  const dots = [], tags = [];
  STOPS.forEach(([name, , , , major], i) => {
    if (!major) return;
    const m = new THREE.Mesh(dot, stationMat);
    m.position.copy(pts[ROUTE.stops[i]]);
    m.end = i === 0 || i === STOPS.length - 1;
    scene.add(m); dots.push(m);
    tags.push(makeTag(name, m.position, "gl-tag--city"));
  });
  const countryTags = Object.entries(COUNTRIES).map(([name, [lat, lon]]) => Object.assign(makeTag(name, toVec(lat, lon, 1.003)), { name }));

  function makeTag(text, pos, cls = "") {
    const el = document.createElement("span");
    el.className = "gl-tag " + cls;
    el.textContent = text;
    stage.append(el);
    return { el, pos };
  }

  function applyColours() {
    drawMap();
    coastMat.color.set(cssColor("--faint"));
    railMat.color.set(cssColor("--faint"));
    borderMat.color.set(cssColor("--dim"));
    stationMat.color.set(cssColor("--text"));
    // Been: brand green. Still to come: grey. Here: the red marker.
    routeUniforms.lit.value.set(cssColor("--accent"));
    routeUniforms.ahead.value.set(cssColor("--dim"));  // a shade darker than the grey railways you won't use
    drawMarker();
  }
  applyColours();
  new MutationObserver(applyColours).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableZoom = false; controls.enablePan = false; controls.enableDamping = true; controls.rotateSpeed = 0.5;
  controls.enabled = false;

  function resize() {
    const s = stage.clientWidth;
    renderer.setSize(s, s, false);
    camera.aspect = 1; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(stage);
  resize();

  // Controls on the departure board, and the speed tab on the globe
  const out = (k) => scope.querySelector(`[data-out="${k}"]`);
  const playBtn = scope.querySelector('[data-act="play"]');
  const viewBtn = scope.querySelector('[data-act="view"]');
  const scrub = scope.querySelector('[data-act="scrub"]');
  const bar = scope.querySelector(".board__bar");
  const speedEl = stage.querySelector("[data-speed]"), lineEl = stage.querySelector("[data-line]");
  // clock = time spent riding: the trip starts at a gentle pace close in, then speeds up and pulls out
  const RAMP_MS = 14000;
  let f = 0, kmh = 0, clock = 0, playing = !reduced, follow = true, flying = 0;

  const overviewPos = toVec(50, 70).multiplyScalar(3.4);
  function setPlaying(p) { playing = p; playBtn.textContent = p ? "Pause" : f >= 1 ? "Ride again" : "Play"; }
  setPlaying(playing);
  playBtn.addEventListener("click", () => { if (f >= 1) { f = 0; kmh = 0; clock = 0; } setPlaying(!playing); });
  viewBtn.addEventListener("click", () => {
    follow = !follow;
    viewBtn.textContent = follow ? "Overview" : "Ride along";
    stage.classList.toggle("is-overview", !follow);
    controls.enabled = false;
    flying = 1; // ease the camera to its new place, then hand over
  });
  scrub.addEventListener("input", () => { f = scrub.value / 1000; kmh = f >= 1 ? 0 : STOPS[legAt(f)][5]; clock = Math.max(clock, RAMP_MS); });

  let shown = {};
  function updateBoard() {
    const i = f >= 1 ? STOPS.length - 1 : legAt(f);
    const next = STOPS.slice(i + 1).find((s) => s[4]) || STOPS[STOPS.length - 1];
    const leg = STOPS[Math.min(i, STOPS.length - 2)];
    const vals = {
      country: STOPS[i][3],
      next: f >= 1 ? "Arrived in Hanoi" : next[0],
      km: (f >= 1 ? TOTAL : Math.min(Math.round(f * KM), TOTAL)).toLocaleString("en-GB") + " of " + TOTAL.toLocaleString("en-GB") + " km",
      speed: String(Math.round(kmh)),
      line: f >= 1 ? "Arrived in Hanoi" : `${leg[0]} – ${STOPS[i + 1][0]}`,
    };
    for (const k of ["country", "next", "km"]) if (shown[k] !== vals[k]) { out(k).textContent = vals[k]; shown[k] = vals[k]; }
    if (shown.speed !== vals.speed) { speedEl.textContent = vals.speed; shown.speed = vals.speed; }
    if (shown.line !== vals.line) { lineEl.textContent = vals.line; shown.line = vals.line; }
    bar.style.setProperty("--p", f.toFixed(4));
    if (document.activeElement !== scrub) scrub.value = Math.round(f * 1000);
    countryTags.forEach((t) => t.el.classList.toggle("is-here", t.name === vals.country));
  }

  // Labels: while riding, only the country you're in and the stations nearby; in the
  // overview, every country and the main stops. Overlapping labels are hidden.
  const [firstCity, ...midCities] = tags, lastCity = midCities.pop();
  const v = new THREE.Vector3(), toCam = new THREE.Vector3();
  function placeTags() {
    const here = countryTags.find((t) => t.el.classList.contains("is-here"));
    const order = follow
      ? [firstCity, lastCity, here, ...midCities]
      : [firstCity, lastCity, ...countryTags, ...midCities.filter((t) => /Moscow|Beijing|Ulaanbaatar|Irkutsk/.test(t.el.textContent))];
    // Labels already showing are placed first, so they keep their spot instead of
    // flickering against a neighbour that just came into view
    const list = order.filter(Boolean);
    const placed = [];
    for (const t of [...countryTags, ...tags]) { t.was = t.on; t.on = false; }
    for (const t of [...list.filter((t) => t.was), ...list.filter((t) => !t.was)]) {
      toCam.copy(camera.position).sub(t.pos);
      const facing = t.pos.clone().normalize().dot(toCam.normalize());
      v.copy(t.pos).project(camera);
      const city = t.el.classList.contains("gl-tag--city");
      const w = t.w || (t.w = t.el.offsetWidth), h = t.h || (t.h = t.el.offsetHeight);
      const x = ((v.x + 1) / 2) * stage.clientWidth + (city ? 7 : -w / 2), y = ((1 - v.y) / 2) * stage.clientHeight - h / 2;
      const box = [x - 6, y - 4, x + w + 6, y + h + 4];
      const clear = !placed.some((b) => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1]);
      t.on = facing > 0.25 && v.z < 1 && Math.abs(v.x) < 0.92 && Math.abs(v.y) < 0.92 && clear;
      if (t.on) { placed.push(box); t.el.style.transform = `translate(${x}px, ${y}px)`; }
    }
    for (const t of [...countryTags, ...tags]) t.el.style.opacity = t.on ? 1 : 0;
  }

  const camGoal = new THREE.Vector3(), look = new THREE.Vector3(), lookGoal = new THREE.Vector3();
  // Draw only while on screen, and hold the train at Malmö until the globe is at least
  // half in view, so visitors see the slow start instead of scrolling into the middle of it
  let last = performance.now(), visible = true, seen = false;
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (e.intersectionRatio >= 0.5) seen = true;
  }, { threshold: [0, 0.5] }).observe(stage);

  // Start low over Malmö
  const p0 = pointAt(0);
  camera.position.copy(p0.clone().normalize().multiplyScalar(1.03));
  look.copy(p0);

  const tmp = new THREE.Vector3(), south = new THREE.Vector3(), camDir = new THREE.Vector3(), goalDir = new THREE.Vector3();
  let first = true;
  renderer.setAnimationLoop((now) => {
    const dt = Math.min(now - last, 50); last = now;
    if (!visible) return;
    const ramp = smooth(0, RAMP_MS, clock);
    if (playing && seen) {
      clock += dt;
      // Ease towards the line speed, braking before a slower section starts (looks ~60 km ahead)
      const target = Math.min(STOPS[legAt(f)][5], STOPS[legAt(Math.min(f + 60 / KM, 1))][5] || Infinity);
      kmh += (target - kmh) * Math.min(1, dt / (target < kmh ? 250 : 600));
      // Time runs slowly at first (about 1/60 of full pace), then quickens
      const pace = Math.exp(Math.log(1 / 60) * (1 - ramp) + Math.log(1.5) * ramp);
      f = Math.min(f + (Math.max(kmh, 15) * HOURS_PER_MS * pace * dt) / KM, 1);
      if (f >= 1) { kmh = 0; setPlaying(false); }
    }

    // Camera height: from about 190 km up at the start to about 2,000 km once under way,
    // then on out to about 4,000 km over the first half of the trip
    const alt = follow ? 1.03 + 0.3 * ramp + 0.32 * smooth(0.04, 0.5, f) : camera.position.length();
    // Damping that behaves the same at any frame rate: k = share of the way to go this frame
    const ease = (ms) => (reduced ? 1 : 1 - Math.exp(-dt / ms));

    const p = pointAt(f);
    // Sizes that depend on zoom follow where the camera really is, not where it's heading,
    // so nothing jumps when the trip restarts or the slider moves
    const camH = camera.position.length();
    const dotSize = THREE.MathUtils.clamp((camH - 1) / 0.33, 0.06, 1);
    dots.forEach((m) => m.scale.setScalar(dotSize * (m.end ? 1.5 : 1)));

    // Split the route at the journey's position, and put the marker there. The marker is
    // drawn on top of everything, so hide it when it's round the back of the globe.
    const far = smooth(1.06, 1.2, camH);
    borderMat.scale = 1 / (camH - 1); // border dots stay about the same size on screen at any height
    routeUniforms.progress.value = f;
    routeParts.forEach((m, i) => { m.uniforms.opacity.value = i === 0 ? 1 - far : far; });
    marker.position.copy(p);
    marker.visible = tmp.copy(camera.position).sub(p).dot(p) > 0;

    if (follow) {
      // Ride along: float above the journey with north up, tilted a little from the south
      // for depth. The direction never changes, so the map doesn't turn; the camera just
      // drifts along and climbs.
      tmp.copy(p).normalize();
      south.set(0, -1, 0).addScaledVector(tmp, tmp.y).normalize();
      camGoal.copy(tmp).multiplyScalar(1 + 0.92 * (alt - 1)).addScaledVector(south, 0.35 * (alt - 1));
      lookGoal.copy(p);
    } else {
      camGoal.copy(overviewPos);
      lookGoal.set(0, 0, 0);
    }
    if (follow || flying) {
      // Move over the globe, never through it: ease the camera's direction round the
      // sphere and its height separately, and climb a little while there's far to go
      // (as when "Ride again" sends it from Hanoi back to Malmö)
      const k = first ? 1 : ease(600); // a soft, slightly lagging follow
      camDir.copy(camera.position).normalize();
      goalDir.copy(camGoal).normalize();
      const gap = camDir.angleTo(goalDir);
      camDir.lerp(goalDir, k).normalize();
      camera.position.copy(camDir).multiplyScalar(camH + (camGoal.length() + 0.5 * gap - camH) * k);
      look.lerp(lookGoal, k);
      camera.lookAt(look);
      if (flying && camera.position.distanceTo(camGoal) < 0.01) {
        flying = 0;
        if (!follow) { controls.target.set(0, 0, 0); controls.enabled = true; }
      }
    }
    if (controls.enabled) controls.update();

    renderer.render(scene, camera);
    placeTags();
    updateBoard();
    first = false;
  });
}
})();
