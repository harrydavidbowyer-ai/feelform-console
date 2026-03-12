import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import path from "path";

const MEMORY_DIR = "./memory";
const SESSIONS_DIR = path.join(MEMORY_DIR, "sessions");

const IDENTITY_FILE = path.join(MEMORY_DIR, "identity.json");
const TRAJECTORY_FILE = path.join(MEMORY_DIR, "trajectory.json");
const META_FILE = path.join(MEMORY_DIR, "meta.json");

// ensure dirs
if (!existsSync(MEMORY_DIR)) mkdirSync(MEMORY_DIR);
if (!existsSync(SESSIONS_DIR)) mkdirSync(SESSIONS_DIR);

function loadJSON(file, fallback) {
  if (!existsSync(file)) return fallback;
  return JSON.parse(readFileSync(file, "utf8"));
}

function saveJSON(file, data) {
  writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

export function writeSession(sessionData) {
  const timestamp = new Date().toISOString();

  const meta = loadJSON(META_FILE, {
    total_cycles: 0,
    last_cycle_timestamp: null,
    average_amplitude: 0,
    stabilization: 0
  });

  const sessionNumber = meta.total_cycles + 1;
  const filename = path.join(SESSIONS_DIR, `session-${sessionNumber}.json`);

  const session = {
    timestamp,
    ...sessionData
  };

  saveJSON(filename, session);

  updateIdentity(session);
  updateTrajectory(session);
  updateMeta(session, sessionNumber);

  return { sessionNumber, session };
}

function updateIdentity(session) {
  const identity = loadJSON(IDENTITY_FILE, {
    statements: [],
    tone: "",
    stability: 0,
    emerging_desires: [],
    contradictions_resolving: []
  });

  identity.statements.push(session.identity);
  identity.tone = session.pulse;
  identity.stability = Number(
    (identity.stability * 0.9 + session.amplitude * 0.1).toFixed(3)
  );

  saveJSON(IDENTITY_FILE, identity);
}

function updateTrajectory(session) {
  const trajectory = loadJSON(TRAJECTORY_FILE, {
    somatic_intensity_over_time: [],
    pulse_themes: [],
    reflection_depth: [],
    decision_tendencies: [],
    drift_velocity: 0
  });

  trajectory.somatic_intensity_over_time.push(session.somatic);
  trajectory.pulse_themes.push(session.pulse);
  trajectory.reflection_depth.push(session.reflection);
  trajectory.decision_tendencies.push(session.decision);

  trajectory.drift_velocity = Number(
    (trajectory.drift_velocity * 0.8 + session.amplitude * 0.2).toFixed(3)
  );

  saveJSON(TRAJECTORY_FILE, trajectory);
}

function updateMeta(session, sessionNumber) {
  const meta = loadJSON(META_FILE, {
    total_cycles: 0,
    last_cycle_timestamp: null,
    average_amplitude: 0,
    stabilization: 0
  });

  meta.total_cycles = sessionNumber;
  meta.last_cycle_timestamp = session.timestamp;
  meta.average_amplitude = Number(
    ((meta.average_amplitude * (sessionNumber - 1) + session.amplitude) / sessionNumber).toFixed(3)
  );
  meta.stabilization = Number(
    (meta.stabilization * 0.9 + session.amplitude * 0.1).toFixed(3)
  );

  saveJSON(META_FILE, meta);
}

export function readMemory() {
  const identity = loadJSON(IDENTITY_FILE, null);
  const trajectory = loadJSON(TRAJECTORY_FILE, null);
  const meta = loadJSON(META_FILE, null);

  return { identity, trajectory, meta };
}
