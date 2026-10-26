// DP.IO portfolio
// The page works without this file. It only adds open and close for the
// project rows. A closed row's details are also made "inert", so keyboard
// users can't tab into links they can't see.
// (The train line's draw-in is plain CSS, in styles.css.)

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
