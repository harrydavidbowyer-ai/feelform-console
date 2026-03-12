/* ============================================================
   FeelForm OS — Memory Engine Front-End Integration
   COMPLETE DROP-IN FILE
   ============================================================ */

const API_BASE = "https://YOUR-RENDER-URL.onrender.com"; 
// Replace with your actual Render URL after deployment


/* ------------------------------------------------------------
   1. WRITE A SESSION (POST)
   ------------------------------------------------------------ */
async function sendCycle(data) {
  try {
    const res = await fetch(`${API_BASE}/api/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    return await res.json();
  } catch (err) {
    console.error("Error writing session:", err);
    return null;
  }
}


/* ------------------------------------------------------------
   2. READ MEMORY (GET)
   ------------------------------------------------------------ */
async function loadMemory() {
  try {
    const res = await fetch(`${API_BASE}/api/memory`);
    return await res.json();
  } catch (err) {
    console.error("Error loading memory:", err);
    return null;
  }
}


/* ------------------------------------------------------------
   3. RENDER MEMORY TAB
   ------------------------------------------------------------ */
async function refreshMemoryTab() {
  const memory = await loadMemory();
  if (!memory) return;

  // These IDs should match your Console's MEMORY tab elements
  const identityEl = document.querySelector("#identity-view");
  const trajectoryEl = document.querySelector("#trajectory-view");
  const metaEl = document.querySelector("#meta-view");

  if (identityEl) identityEl.textContent = JSON.stringify(memory.identity, null, 2);
  if (trajectoryEl) trajectoryEl.textContent = JSON.stringify(memory.trajectory, null, 2);
  if (metaEl) metaEl.textContent = JSON.stringify(memory.meta, null, 2);
}


/* ------------------------------------------------------------
   4. HOOK INTO UI EVENTS
   ------------------------------------------------------------ */
document.addEventListener("DOMContentLoaded", () => {
  // MEMORY tab click → refresh data
  const memoryTab = document.querySelector("#memory-tab");
  if (memoryTab) {
    memoryTab.addEventListener("click", () => {
      refreshMemoryTab();
    });
  }

  // Example: cycle completion button → sendCycle()
  const completeBtn = document.querySelector("#complete-cycle");
  if (completeBtn) {
    completeBtn.addEventListener("click", () => {
      const payload = collectCycleData();
      sendCycle(payload).then(result => {
        console.log("Cycle saved:", result);
      });
    });
  }
});


/* ------------------------------------------------------------
   5. COLLECT CYCLE DATA FROM UI
   ------------------------------------------------------------ */
function collectCycleData() {
  // Replace these selectors with your actual Console inputs
  const pulse = document.querySelector("#pulse-input")?.value || "";
  const somatic = document.querySelector("#somatic-input")?.value || "";
  const reflection = document.querySelector("#reflection-input")?.value || "";
  const decision = document.querySelector("#decision-input")?.value || "";
  const identity = document.querySelector("#identity-input")?.value || "";
  const amplitude = parseFloat(document.querySelector("#amplitude-input")?.value || 0);

  return { pulse, somatic, reflection, decision, identity, amplitude };
}
