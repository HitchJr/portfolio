// Hero background: a slow amber aurora behind the headline, made with the
// Shaders library (shaders.com, MIT licence). It loads from a CDN, so the
// site still needs no build step.
//
// How it works:
// 1. index.html has an empty <canvas class="hero__glow"> inside the hero.
// 2. This file checks the browser can run it (WebGPU) and that the visitor
//    hasn't asked for less motion. If either check fails, it does nothing
//    and the hero keeps its plain dark background.
// 3. Otherwise it draws the aurora into the canvas and fades it in.

import { createShader, isWebGPUSupported } from "https://cdn.jsdelivr.net/npm/shaders@4.0.5/dist/js/index.js/+esm";

const canvas = document.querySelector(".hero__glow");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (canvas && !reduceMotion && isWebGPUSupported()) {
  try {
    await createShader(
      canvas,
      {
        components: [
          {
            type: "Aurora",
            props: {
              colorA: "#FFB547", // --signal (amber lamp)
              colorB: "#C9781F", // darker amber
              colorC: "#5A4417", // --signal-line (deep amber)
              intensity: 70,     // visible but soft, so the text stays readable
              speed: 2,          // slow drift, not a light show
              curtainCount: 3,
              height: 140,
              center: { x: 0.5, y: 0 },
            },
          },
        ],
      },
      {
        disableTelemetry: true, // don't send visitor data to shaders.com
        onReady: () => canvas.classList.add("is-on"),
        onError: () => canvas.remove(),
      }
    );
  } catch {
    canvas.remove();
  }
}
