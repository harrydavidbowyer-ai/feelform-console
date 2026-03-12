import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 4000;

// -----------------------------
// CORS — REQUIRED FOR GITHUB PAGES
// -----------------------------
app.use(
  cors({
    origin: [
      "https://harrydavidbowyer-ai.github.io", // your frontend
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
app.use(express.json());

// -----------------------------
// In-memory memory engine
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
// Store a new emotional cycle
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
