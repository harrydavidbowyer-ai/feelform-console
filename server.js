import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { writeSession, readMemory } from "./memory-engine.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());

// write a new session
app.post("/api/session", (req, res) => {
  try {
    const { pulse, somatic, reflection, decision, identity, amplitude } = req.body;

    if (
      pulse == null ||
      somatic == null ||
      reflection == null ||
      decision == null ||
      identity == null ||
      amplitude == null
    ) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const result = writeSession({
      pulse,
      somatic,
      reflection,
      decision,
      identity,
      amplitude
    });

    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal error" });
  }
});

// read memory
app.get("/api/memory", (req, res) => {
  try {
    const data = readMemory();
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal error" });
  }
});

app.listen(PORT, () => {
  console.log(`Memory Engine API running on port ${PORT}`);
});
