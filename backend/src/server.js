import cors from "cors";
import express from "express";
import { runArena } from "./simulation.js";
import { hypotheses } from "./hypotheses.js";

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
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error(err);
    res.status(400).json({ ok: false, error: err.message || "run failed" });
  }
});

app.listen(PORT, () => {
  console.log(`SwarmForge backend listening on :${PORT} (mock tx: ${USE_MOCK_TX})`);
});


