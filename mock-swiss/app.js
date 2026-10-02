const cases = [
  {
    id: "W-07",
    still: "stills/still-01-casino.png",
    stillAlt: "Wrist at a casino table wearing a steel dive watch",
    source: "Casino Royale (2006)",
    subject: "Daniel Craig as James Bond",
    frame: "00:47:12",
    question: "What sits on the left wrist in this still?",
    options: [
      { key: "A", label: "Omega Seamaster Diver 300M" },
      { key: "B", label: "Rolex Submariner Date" },
      { key: "C", label: "Tudor Pelagos" },
    ],
    answer: "Omega Seamaster Diver 300M",
    aliases: ["seamaster", "seamaster 300", "seamaster diver", "omega seamaster", "diver 300m"],
    hint: "Bond returned to Omega in this film. Look at the wave dial and the 300M dive case, not a Submariner crown.",
    title: "Omega Seamaster Diver 300M",
    ref: "168.1623 / 2220.80",
    history:
      "Craig's first Bond film put Omega back on the wrist after a long Rolex era on screen. The Diver 300M with the wave dial was already a tool watch from 1993. Casino Royale made that specific case the public Bond watch for a decade.",
    buyNew: "https://www.omegawatches.com/en-us/watches/seamaster/diver-300m",
    buyUsed: "https://www.chrono24.com/omega/seamaster-diver-300m--cat286.htm",
  },
  {
    id: "W-11",
    still: "stills/still-02-lemans.png",
    stillAlt: "Racing driver wrist on a steering wheel wearing a chronograph",
    source: "Le Mans (1971)",
    subject: "Steve McQueen",
    frame: "01:12:04",
    question: "Name the watch on the driver's wrist.",
    options: [
      { key: "A", label: "Rolex Daytona" },
      { key: "B", label: "TAG Heuer Monaco" },
      { key: "C", label: "Omega Speedmaster" },
    ],
    answer: "TAG Heuer Monaco",
    aliases: ["heuer monaco", "tag heuer monaco", "monaco", "monaco calibre 11"],
    hint: "Square case. Blue dial. McQueen wore Heuer, not Rolex, for this race film.",
    title: "Heuer Monaco Calibre 11",
    ref: "1133B",
    history:
      "Heuer launched the square Monaco in 1969 as one of the first automatic chronographs. McQueen wore it throughout Le Mans. The square case was a racing instrument, not a dress piece, and it is still the McQueen watch collectors hunt.",
    buyNew: "https://www.tagheuer.com/us/en/watches/tag-heuer-monaco/",
    buyUsed: "https://www.chrono24.com/heuer/monaco--mod45.htm",
  },
  {
    id: "W-19",
    still: "stills/still-03-moon.png",
    stillAlt: "Flight-suit wrist wearing a manual chronograph with a tachymeter bezel",
    source: "First Man (2018) / NASA archive",
    subject: "Ryan Gosling as Neil Armstrong",
    frame: "02:04:31",
    question: "Name the watch qualified for EVA.",
    options: [
      { key: "A", label: "Hamilton Khaki Field" },
      { key: "B", label: "Breitling Navitimer" },
      { key: "C", label: "Omega Speedmaster Professional" },
    ],
    answer: "Omega Speedmaster Professional",
    aliases: ["speedmaster", "speedy", "moonwatch", "omega speedmaster", "speedmaster professional"],
    hint: "NASA qualified one civilian chronograph for spaceflight. Manual wind. Tachymeter bezel. No date.",
    title: "Omega Speedmaster Professional",
    ref: "ST 105.012 / 310.30.42.50.01.001",
    history:
      "Omega's Speedmaster was qualified by NASA in 1965 after brutal thermal and vibration tests. Armstrong wore a Speedy on Apollo 11. First Man restaged that hardware. The Moonwatch is still sold as a manual-wind chronograph with a black dial and tachymeter bezel.",
    buyNew: "https://www.omegawatches.com/en-us/watches/speedmaster/moonwatch",
    buyUsed: "https://www.chrono24.com/omega/speedmaster--cat32.htm",
  },
];

const els = {
  still: document.getElementById("still"),
  casePos: document.getElementById("case-pos"),
  source: document.getElementById("source"),
  subject: document.getElementById("subject"),
  frame: document.getElementById("frame"),
  question: document.getElementById("question"),
  options: document.getElementById("options"),
  command: document.getElementById("command"),
  commit: document.getElementById("commit"),
  hint: document.getElementById("hint"),
  dossier: document.getElementById("dossier"),
  watchTitle: document.getElementById("watch-title"),
  watchRef: document.getElementById("watch-ref"),
  history: document.getElementById("history"),
  buyNew: document.getElementById("buy-new"),
  buyUsed: document.getElementById("buy-used"),
  lock: document.getElementById("lock"),
  score: document.getElementById("score"),
  live: document.getElementById("live"),
  prev: document.getElementById("prev"),
  next: document.getElementById("next"),
  theme: document.getElementById("theme"),
  form: document.getElementById("ident-form"),
};

let index = 0;
let selected = "";
const locked = new Set();

function normalize(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function isMatch(input, item) {
  const n = normalize(input);
  if (!n) return false;
  if (n === normalize(item.answer)) return true;
  return item.aliases.some((a) => n === a || n.includes(a));
}

function preferredTheme() {
  const saved = localStorage.getItem("watcher-theme");
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(mode) {
  document.documentElement.setAttribute("data-theme", mode);
  els.theme.setAttribute("aria-pressed", String(mode === "dark"));
  els.theme.textContent = mode === "dark" ? "Light" : "Dark";
  localStorage.setItem("watcher-theme", mode);
}

function renderCase() {
  const item = cases[index];
  selected = "";
  els.still.src = item.still;
  els.still.alt = item.stillAlt;
  els.casePos.textContent = `${index + 1} of ${cases.length}`;
  els.source.textContent = item.source;
  els.subject.textContent = item.subject;
  els.frame.textContent = item.frame;
  els.question.textContent = item.question;
  els.command.value = "";
  els.hint.classList.remove("is-on");
  els.hint.textContent = "";
  els.options.innerHTML = "";

  item.options.forEach((opt) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "opt";
    btn.setAttribute("aria-pressed", "false");
    btn.innerHTML = `<kbd>${opt.key}</kbd><span>${opt.label}</span>`;
    btn.addEventListener("click", () => {
      selected = opt.label;
      els.command.value = opt.label;
      [...els.options.children].forEach((el) => el.setAttribute("aria-pressed", "false"));
      btn.setAttribute("aria-pressed", "true");
    });
    els.options.appendChild(btn);
  });

  if (locked.has(item.id)) {
    openDossier(item, true);
    els.commit.disabled = true;
  } else {
    els.dossier.classList.remove("is-open");
    els.dossier.hidden = true;
    els.lock.textContent = "Open";
    els.lock.classList.remove("status-lock");
    els.commit.disabled = false;
  }

  els.score.textContent = `${locked.size} / ${cases.length}`;
}

function openDossier(item, already) {
  els.dossier.hidden = false;
  els.dossier.classList.add("is-open");
  els.watchTitle.textContent = item.title;
  els.watchRef.textContent = item.ref;
  els.history.textContent = item.history;
  els.buyNew.href = item.buyNew;
  els.buyUsed.href = item.buyUsed;
  els.lock.textContent = "Identified";
  els.lock.classList.add("status-lock");
  els.live.textContent = already
    ? `${item.title} already identified.`
    : `Correct. ${item.title} locked.`;
}

function commit() {
  const item = cases[index];
  if (locked.has(item.id)) return;
  const guess = els.command.value || selected;
  if (!guess) {
    els.hint.textContent = "Select a line or type a name.";
    els.hint.classList.add("is-on");
    els.live.textContent = "Missing guess.";
    return;
  }
  if (isMatch(guess, item)) {
    locked.add(item.id);
    els.hint.classList.remove("is-on");
    els.commit.disabled = true;
    els.score.textContent = `${locked.size} / ${cases.length}`;
    openDossier(item, false);
    return;
  }
  els.hint.textContent = item.hint;
  els.hint.classList.add("is-on");
  els.live.textContent = "Incorrect. Hint issued.";
}

els.form.addEventListener("submit", (e) => {
  e.preventDefault();
  commit();
});
els.prev.addEventListener("click", () => {
  index = (index - 1 + cases.length) % cases.length;
  renderCase();
});
els.next.addEventListener("click", () => {
  index = (index + 1) % cases.length;
  renderCase();
});
els.theme.addEventListener("click", () => {
  const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
  applyTheme(next);
});

applyTheme(preferredTheme());
renderCase();
