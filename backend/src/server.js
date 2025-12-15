import cors from "cors";
import express from "express";
import fs from "fs";
import path from "path";
import { runArena } from "./simulation.js";
import { hypotheses } from "./hypotheses.js";

const RUN_DIR = path.join(process.cwd(), "data", "runs");
if (!fs.existsSync(RUN_DIR)) {
  fs.mkdirSync(RUN_DIR, { recursive: true });
}

const app = express();
const PORT = process.env.PORT || 8080;
const USE_MOCK_TX = (process.env.USE_MOCK_TX || "true").toLowerCase() === "true";

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, track: "x402", mock: USE_MOCK_TX });
});

app.get("/api/hypotheses", (_req, res) => {
  res.json({ count: hypotheses.length, items: hypotheses });
});

app.post("/api/arena/start", async (req, res) => {
  try {
    const { hypId = 1, seed, rounds = 10, mockTx } = req.body || {};
    const useMock = typeof mockTx === "boolean" ? mockTx : USE_MOCK_TX;
    const result = await runArena({ hypId, seed, rounds, useMock });
    const file = path.join(RUN_DIR, `${result.runId}.json`);
    fs.writeFileSync(file, JSON.stringify(result, null, 2));
    res.json({ ok: true, ...result, runUrl: `/api/run/${result.runId}` });
  } catch (err) {
    console.error(err);
    res.status(400).json({ ok: false, error: err.message || "run failed" });
  }
});

app.post("/api/arena/custom", async (req, res) => {
  try {
    const config = req.body || {};
    if (!config.hypId && !config.config) {
      return res.status(400).json({ ok: false, error: "Missing config" });
    }
    const useMock = typeof config.mockTx === "boolean" ? config.mockTx : USE_MOCK_TX;
    const result = await runArena({
      hypId: config.hypId ?? 1,
      seed: config.seed,
      rounds: config.rounds ?? 10,
      useMock
    });
    const file = path.join(RUN_DIR, `${result.runId}.json`);
    fs.writeFileSync(file, JSON.stringify({ ...result, custom: config }, null, 2));
    res.json({ ok: true, ...result, runUrl: `/api/run/${result.runId}` });
  } catch (err) {
    console.error(err);
    res.status(400).json({ ok: false, error: err.message || "run failed" });
  }
});

app.get("/api/run/:runId", (req, res) => {
  const file = path.join(RUN_DIR, `${req.params.runId}.json`);
  if (!fs.existsSync(file)) {
    return res.status(404).json({ ok: false, error: "Run not found" });
  }
  const data = JSON.parse(fs.readFileSync(file, "utf-8"));
  res.json({ ok: true, ...data });
});

app.listen(PORT, () => {
  console.log(`SwarmForge backend listening on :${PORT} (mock tx: ${USE_MOCK_TX})`);
});


