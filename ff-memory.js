/* ============================================================
   FeelForm OS — Memory Engine Front-End Module
   ============================================================ */
import cors from "cors";

app.use(cors({
  origin: [
    "https://harrydavidbowyer-ai.github.io",
    "http://localhost:3000"
  ],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));
const FF_API_BASE = "https://feelform-console.onrender.com";

/* ---------- API LAYER ---------- */

async function ffSendCycle(data) {
  try {
    const res = await fetch(`${FF_API_BASE}/api/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return await res.json();
  } catch (err) {
    console.error("FF Memory: error writing session:", err);
    return null;
  }
}

async function ffLoadMemory() {
  try {
    const res = await fetch(`${FF_API_BASE}/api/memory`);
    return await res.json();
  } catch (err) {
    console.error("FF Memory: error loading memory:", err);
    return null;
  }
}

/* ---------- RENDER LAYER ---------- */

async function ffRefreshMemoryView() {
  const memory = await ffLoadMemory();
  if (!memory) return;

  const identityEl = document.querySelector("[data-ff-memory='identity']");
  const trajectoryEl = document.querySelector("[data-ff-memory='trajectory']");
  const metaEl = document.querySelector("[data-ff-memory='meta']");

  if (identityEl) identityEl.textContent = JSON.stringify(memory.identity, null, 2);
  if (trajectoryEl) trajectoryEl.textContent = JSON.stringify(memory.trajectory, null, 2);
  if (metaEl) metaEl.textContent = JSON.stringify(memory.meta, null, 2);
}

/* ---------- DATA COLLECTION ---------- */

function ffCollectCycleData() {
  const get = sel => document.querySelector(sel)?.value || "";

  return {
    pulse: get("[data-ff-input='pulse']"),
    somatic: get("[data-ff-input='somatic']"),
    reflection: get("[data-ff-input='reflection']"),
    decision: get("[data-ff-input='decision']"),
    identity: get("[data-ff-input='identity']"),
    amplitude: parseFloat(get("[data-ff-input='amplitude']") || 0)
  };
}

/* ---------- WIRING ---------- */

export function initFeelFormMemory() {
  const completeBtn = document.querySelector("[data-ff-action='complete-cycle']");
  const statusEl = document.querySelector("[data-ff-status='memory']");
  const memoryTab = document.querySelector("[data-ff-tab='memory']");

  if (memoryTab) {
    memoryTab.addEventListener("click", () => {
      ffRefreshMemoryView();
    });
  }

  if (completeBtn) {
    completeBtn.addEventListener("click", () => {
      const payload = ffCollectCycleData();
      if (statusEl) statusEl.textContent = "saving";
      completeBtn.disabled = true;

      ffSendCycle(payload).then(result => {
        if (statusEl) statusEl.textContent = result ? "saved" : "error";
        if (result) ffRefreshMemoryView();

        setTimeout(() => {
          if (statusEl) statusEl.textContent = "";
          completeBtn.disabled = false;
        }, 1000);
      });
    });
  }

  // initial load
  ffRefreshMemoryView();
}
