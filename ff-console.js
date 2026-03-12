/* ============================================================
   FEELFORM OS v4.1 — FULL CONSOLE + MEMORY ENGINE JS
   (No imports, no modules, no errors)
   ============================================================ */

/* ------------------------------------------------------------
   MEMORY ENGINE (INLINE VERSION)
   ------------------------------------------------------------ */

const FF_API_BASE = "https://feelform-console.onrender.com";

async function ffSendCycleToMemory() {
  const pulse = document.getElementById("ff-pulse-input")?.value || "";
  const somatic = document.getElementById("ff-somatic-location")?.value || "";
  const reflection = document.getElementById("ff-reflect-input")?.value || "";
  const decisionA = document.getElementById("ff-decision-a")?.value || "";
  const decisionB = document.getElementById("ff-decision-b")?.value || "";
  const identity = document.getElementById("ff-identity-input")?.value || "";
  const intensity = parseFloat(document.getElementById("ff-somatic-intensity")?.value || "0");

  const payload = {
    pulse,
    somatic,
    reflection,
    decision: `${decisionA} | ${decisionB}`.trim(),
    identity,
    amplitude: intensity / 100
  };

  const res = await fetch(FF_API_BASE + "/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  return res.json();
}

async function ffLoadMemoryFromServer() {
  const res = await fetch(FF_API_BASE + "/api/memory");
  return res.json();
}

async function ffRefreshMemoryPanel() {
  const data = await ffLoadMemoryFromServer();
  if (!data) return;

  document.getElementById("ff-memory-sessions").textContent =
    data.meta?.total_cycles ? `Total cycles: ${data.meta.total_cycles}` : "No sessions yet.";

  document.getElementById("ff-memory-identity").textContent =
    JSON.stringify(data.identity, null, 2);

  document.getElementById("ff-memory-trajectory").textContent =
    JSON.stringify(data.trajectory, null, 2);

  document.getElementById("ff-memory-meta").textContent =
    JSON.stringify(data.meta, null, 2);
}

/* ------------------------------------------------------------
   AUDIO ENGINE
   ------------------------------------------------------------ */

let ffAudioCtx = null;
let ffSomaticNode = null;
let ffRitualNode = null;
let ffMasterGain = null;
let ffAudioEnabled = false;

function ffInitAudio() {
  if (ffAudioCtx) return;
  ffAudioCtx = new (window.AudioContext || window.webkitAudioContext)();

  ffMasterGain = ffAudioCtx.createGain();
  ffMasterGain.gain.value = 0.7;
  ffMasterGain.connect(ffAudioCtx.destination);
}

function ffStartSomaticBreath() {
  if (!ffAudioCtx) return;
  ffStopSomaticBreath();

  const osc = ffAudioCtx.createOscillator();
  const gain = ffAudioCtx.createGain();

  osc.type = "sine";
  osc.frequency.value = 70;

  gain.gain.value = 0;
  osc.connect(gain);
  gain.connect(ffMasterGain);

  const now = ffAudioCtx.currentTime;
  gain.gain.linearRampToValueAtTime(0.18, now + 0.8);
  gain.gain.linearRampToValueAtTime(0.05, now + 4.0);
  gain.gain.linearRampToValueAtTime(0.18, now + 7.2);

  osc.start();
  ffSomaticNode = { osc, gain };
}

function ffStopSomaticBreath() {
  if (!ffSomaticNode) return;
  const { osc, gain } = ffSomaticNode;
  const now = ffAudioCtx.currentTime;
  gain.gain.cancelScheduledValues(now);
  gain.gain.linearRampToValueAtTime(0, now + 0.6);
  osc.stop(now + 0.7);
  ffSomaticNode = null;
}

function ffStartRitualDrone() {
  if (!ffAudioCtx) return;
  ffStopRitualDrone();

  const osc = ffAudioCtx.createOscillator();
  const gain = ffAudioCtx.createGain();

  osc.type = "sawtooth";
  osc.frequency.value = 48;

  gain.gain.value = 0;
  osc.connect(gain);
  gain.connect(ffMasterGain);

  const now = ffAudioCtx.currentTime;
  gain.gain.linearRampToValueAtTime(0.22, now + 2.0);
  gain.gain.linearRampToValueAtTime(0.28, now + 8.0);

  osc.start();
  ffRitualNode = { osc, gain };
}

function ffStopRitualDrone() {
  if (!ffRitualNode) return;
  const { osc, gain } = ffRitualNode;
  const now = ffAudioCtx.currentTime;
  gain.gain.cancelScheduledValues(now);
  gain.gain.linearRampToValueAtTime(0, now + 1.2);
  osc.stop(now + 1.3);
  ffRitualNode = null;
}

function ffStopAllAudio() {
  ffStopSomaticBreath();
  ffStopRitualDrone();
}

/* ------------------------------------------------------------
   SOUND TOGGLE
   ------------------------------------------------------------ */

function ffSetupSoundControls() {
  const toggle = document.getElementById("ff-sound-toggle");
  const forceBtn = document.getElementById("ff-force-audio");

  if (!toggle) return;

  toggle.addEventListener("click", () => {
    if (!ffAudioCtx) ffInitAudio();

    ffAudioEnabled = !ffAudioEnabled;
    toggle.textContent = ffAudioEnabled ? "ON" : "OFF";

    if (!ffAudioEnabled) {
      ffStopAllAudio();
    }
  });

  if (forceBtn) {
    forceBtn.addEventListener("click", () => {
      if (!ffAudioCtx) ffInitAudio();
      ffAudioEnabled = true;
      toggle.textContent = "ON";
      forceBtn.style.display = "none";
    });
  }

  window.addEventListener(
    "click",
    () => {
      if (!ffAudioCtx) ffInitAudio();
    },
    { once: true }
  );
}

/* ------------------------------------------------------------
   CONSOLE TABS
   ------------------------------------------------------------ */

function ffSetupConsoleTabs() {
  const tabs = Array.from(document.querySelectorAll(".ff-console-tab"));
  const panels = {
    system: document.getElementById("ff-panel-system"),
    coaching: document.getElementById("ff-panel-coaching"),
    identity: document.getElementById("ff-panel-identity"),
    memory: document.getElementById("ff-panel-memory"),
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.tab;
      tabs.forEach((t) => t.classList.remove("ff-active"));
      tab.classList.add("ff-active");

      Object.values(panels).forEach((p) => p && p.classList.remove("ff-active"));
      if (panels[target]) panels[target].classList.add("ff-active");

      if (target === "memory") ffRefreshMemoryPanel();
    });
  });
}

/* ------------------------------------------------------------
   CHAMBER COLORS
   ------------------------------------------------------------ */

const ffChamberColors = {
  "ff-chamber-baseline": getComputedStyle(document.documentElement).getPropertyValue("--ff-baseline").trim(),
  "ff-chamber-pulse": getComputedStyle(document.documentElement).getPropertyValue("--ff-pulse").trim(),
  "ff-chamber-somatic": getComputedStyle(document.documentElement).getPropertyValue("--ff-somatic").trim(),
  "ff-chamber-reflect": getComputedStyle(document.documentElement).getPropertyValue("--ff-reflect").trim(),
  "ff-chamber-decision": getComputedStyle(document.documentElement).getPropertyValue("--ff-decision").trim(),
  "ff-chamber-identity": getComputedStyle(document.documentElement).getPropertyValue("--ff-identity").trim(),
  "ff-chamber-ritual": getComputedStyle(document.documentElement).getPropertyValue("--ff-ritual").trim(),
};

function ffSetBackgroundForChamber(chamberId) {
  const color = ffChamberColors[chamberId];
  if (!color) return;
  document.documentElement.style.setProperty("--ff-bg", color);
}

/* ------------------------------------------------------------
   CHAMBER NAVIGATION
   ------------------------------------------------------------ */

function ffSetupChambers() {
  const chambers = Array.from(document.querySelectorAll(".ff-chamber"));
  const nextButtons = Array.from(document.querySelectorAll(".ff-next"));
  const ritualGlow = document.getElementById("ff-ritual-glow");
  const ritualButton = document.getElementById("ff-ritual-complete");

  function activateChamber(id) {
    chambers.forEach((c) => c.classList.remove("ff-active"));
    const target = document.getElementById(id);
    if (!target) return;
    target.classList.add("ff-active");

    ffSetBackgroundForChamber(id);

    if (!ffAudioEnabled || !ffAudioCtx) {
      ffStopAllAudio();
      return;
    }

    ffStopAllAudio();

    if (id === "ff-chamber-somatic") {
      ffStartSomaticBreath();
    } else if (id === "ff-chamber-ritual") {
      ffStartRitualDrone();
      if (ritualGlow) ritualGlow.classList.add("ff-active");
    } else {
      if (ritualGlow) ritualGlow.classList.remove("ff-active");
    }
  }

  nextButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const nextId = "ff-chamber-" + btn.dataset.next;
      activateChamber(nextId);
    });
  });

  if (ritualButton) {
    ritualButton.addEventListener("click", async () => {
      await ffSendCycleToMemory();
      await ffRefreshMemoryPanel();
      activateChamber("ff-chamber-baseline");
    });
  }

  const initial = document.getElementById("ff-chamber-baseline");
  if (initial) {
    initial.classList.add("ff-active");
    ffSetBackgroundForChamber("ff-chamber-baseline");
  }
}

/* ------------------------------------------------------------
   BOOT
   ------------------------------------------------------------ */

document.addEventListener("DOMContentLoaded", () => {
  ffSetupSoundControls();
  ffSetupConsoleTabs();
  ffSetupChambers();
  ffRefreshMemoryPanel();
});
