import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();
const PORT = process.env.PORT || 4000;

// -----------------------------
// CORS — THIS FIXES YOUR ERROR
// -----------------------------
app.use(
  cors({
    origin: [
      "https://harrydavidbowyer-ai.github.io", // your GitHub Pages frontend
      "http://localhost:3000",                 // local dev
      "http://localhost:4000"
    ],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
  })
);

// -----------------------------
// Middleware
// -----------------------------
app.use(bodyParser.json());

// -----------------------------
// In-memory store (Render resets on redeploy)
// -----------------------------
let memory = {
  sessions: [],
  identity: [],
  trajectory: [],
  meta: {
    total_cycles: 0,
    last_cycle: null
  }
};

// -----------------------------
// POST /api/session
// Store a new cycle
// -----------------------------
app.post("/api/session", (req, res) => {
  const cycle = req.body;

  // Store session
  memory.sessions.push(cycle);

  // Identity drift
  if (cycle.identity) {
    memory.identity.push(cycle.identity);
  }

  // Trajectory (pulse → reflection → identity)
  const trajectoryPoint = `${cycle.pulse} → ${cycle.reflection} → ${cycle.identity}`;
  memory.trajectory.push(trajectoryPoint);

  // Meta
  memory.meta.total_cycles = memory.sessions.length;
  memory.meta.last_cycle = cycle;

  res.json({ status: "ok", stored: cycle });
});

// -----------------------------
// GET /api/memory
// Return the entire memory object
// -----------------------------
app.get("/api/memory", (req, res) => {
  res.json(memory);
});

// -----------------------------
// Root
// -----------------------------
app.get("/", (req, res) => {
  res.send("FeelForm Memory Engine is running.");
});

// -----------------------------
// Start server
// -----------------------------
app.listen(PORT, () => {
  console.log(`Memory Engine running on port ${PORT}`);
});
