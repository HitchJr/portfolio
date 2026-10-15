// Example-brief chips in the hero.
// Clicking a chip swaps the text in the brief box and pre-fills the email,
// so "Send brief" opens a mail to Dante with that brief already written.

const chips = document.querySelectorAll(".chip");
const briefText = document.getElementById("brief-text");
const sendLink = document.getElementById("brief-send");
const caret = briefText.querySelector(".caret");

function useBrief(text) {
  // Replace the words but keep the blinking caret at the end.
  briefText.textContent = text;
  briefText.append(caret);
  const subject = encodeURIComponent("Brief via DP.IO");
  const body = encodeURIComponent(text + "\n\n");
  sendLink.href = `mailto:dantep@live.se?subject=${subject}&body=${body}`;
}

chips.forEach((chip) => {
  chip.addEventListener("click", () => {
    chips.forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
    useBrief(chip.dataset.brief);
  });
});

// Start with the first chip's brief so the email link is filled in from the start.
useBrief(chips[0].dataset.brief);
