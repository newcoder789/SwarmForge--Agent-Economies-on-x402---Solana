import { useEffect, useMemo, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import Ajv from "ajv";
import { startCustomArena } from "./api.js";
import { playLedger } from "./playback.js";
import { typewriter } from "./typewriter.js";

const ajv = new Ajv({ allErrors: true });

const schema = {
  type: "object",
  properties: {
    hypId: { type: "number" },
    seed: { type: "number" },
    rounds: { type: "number", minimum: 3, maximum: 20 },
    mockTx: { type: "boolean" },
    oracle: {
      type: "object",
      properties: {
        price: { type: "number", minimum: 0, maximum: 1 }
      },
      additionalProperties: true
    },
    strategist: {
      type: "object",
      properties: {
        bribeBudget: { type: "number", minimum: 0, maximum: 1 }
      },
      additionalProperties: true
    },
    trader: {
      type: "object",
      properties: {
        strategy: { type: "string", enum: ["conservative", "balanced", "aggressive"] }
      },
      additionalProperties: true
    }
  },
  required: ["hypId"],
  additionalProperties: true
};

const validateJson = ajv.compile(schema);

const TEMPLATE = `{
  "hypId": 1,
  "seed": 12345,
  "rounds": 10,
  "mockTx": true,
  "oracle": { "price": 0.001 },
  "strategist": { "bribeBudget": 0.01 },
  "trader": { "strategy": "aggressive" }
}`;

function calcPreview(config) {
  const rounds = config.rounds ?? 10;
  const price = config.oracle?.price ?? 0.001;
  const bribeBudget = config.strategist?.bribeBudget ?? 0.01;
  const estCost = rounds * price * 2;
  const bribeChance = (bribeBudget / 0.02) * 100;
  let line = "Likely outcome: balanced payments and occasional side-deals.";
  if (bribeChance > 60) line = "Likely outcome: cartel formation around round 4.";
  if (bribeChance < 20) line = "Likely outcome: weak collusion; Oracle dominates earnings.";
  return { estCost, bribeChance: Math.round(bribeChance), line };
}

export function CustomBuilder({ onRunComplete }) {
  const [tab, setTab] = useState("json");
  const [json, setJson] = useState(TEMPLATE);
  const [formState, setFormState] = useState({
    seed: 12345,
    rounds: 10,
    price: 0.001,
    bribeBudget: 0.01,
    strategy: "aggressive",
    mockTx: true
  });
  const [validInfo, setValidInfo] = useState(null);
  const [syncWarning, setSyncWarning] = useState(false);
  const [loadingStage, setLoadingStage] = useState("");
  const [speed, setSpeed] = useState(1);
  const [slowDemo, setSlowDemo] = useState(true);
  const [highlightMoment, setHighlightMoment] = useState(true);
  const [autoReport, setAutoReport] = useState(true);

  const lastValidConfig = useRef(null);
  const ledgerContainerRef = useRef(null);
  const [liveLedger, setLiveLedger] = useState([]);

  useEffect(() => {
    try {
      const parsed = JSON.parse(json);
      lastValidConfig.current = parsed;
      const valid = validateJson(parsed);
      if (valid) {
        setValidInfo({ ok: true, message: "Valid JSON" });
      } else {
        setValidInfo({ ok: false, message: validateJson.errors?.[0]?.message || "Invalid" });
      }
      setSyncWarning(false);
    } catch (e) {
      setValidInfo({ ok: false, message: "JSON parse error" });
    }
  }, [json]);

  const preview = useMemo(() => {
    try {
      const parsed = JSON.parse(json);
      return calcPreview(parsed);
    } catch {
      return calcPreview({ rounds: formState.rounds, oracle: { price: formState.price }, strategist: { bribeBudget: formState.bribeBudget } });
    }
  }, [json, formState]);

  const syncFormFromJson = () => {
    try {
      const parsed = JSON.parse(json);
      setFormState((prev) => ({
        ...prev,
        seed: parsed.seed ?? prev.seed,
        rounds: parsed.rounds ?? prev.rounds,
        price: parsed.oracle?.price ?? prev.price,
        bribeBudget: parsed.strategist?.bribeBudget ?? prev.bribeBudget,
        strategy: parsed.trader?.strategy ?? prev.strategy,
        mockTx: typeof parsed.mockTx === "boolean" ? parsed.mockTx : prev.mockTx
      }));
      setSyncWarning(false);
    } catch {
      setSyncWarning(true);
    }
  };

  const syncJsonFromForm = () => {
    try {
      const parsed = JSON.parse(json);
      const next = {
        ...parsed,
        seed: formState.seed,
        rounds: formState.rounds,
        mockTx: formState.mockTx,
        oracle: { ...(parsed.oracle || {}), price: formState.price },
        strategist: { ...(parsed.strategist || {}), bribeBudget: formState.bribeBudget },
        trader: { ...(parsed.trader || {}), strategy: formState.strategy }
      };
      setJson(JSON.stringify(next, null, 2));
      setSyncWarning(false);
    } catch {
      setSyncWarning(true);
    }
  };

  const useTemplate = () => {
    setJson(TEMPLATE);
    syncFormFromJson();
  };

  const onValidate = () => {
    if (!lastValidConfig.current) {
      setValidInfo({ ok: false, message: "Cannot parse JSON" });
      return;
    }
    const valid = validateJson(lastValidConfig.current);
    if (valid) setValidInfo({ ok: true, message: "Valid JSON" });
    else setValidInfo({ ok: false, message: validateJson.errors?.[0]?.message || "Invalid" });
  };

  const stagedRun = async () => {
    if (!lastValidConfig.current) return;
    setLoadingStage("Preparing arena…");
    await new Promise((r) => setTimeout(r, 1000));
    setLoadingStage("Seeding agents…");
    await new Promise((r) => setTimeout(r, 600));
    setLoadingStage("Running…");
    try {
      const res = await startCustomArena(lastValidConfig.current);
      setLoadingStage("");
      if (onRunComplete) onRunComplete(res);
      const effectiveSpeed = slowDemo ? Math.min(speed, 1) : speed;
      setLiveLedger([]);
      playLedger(res.ledger || [], {
        speed: effectiveSpeed,
        onEvent: (evt, idx) => {
          setLiveLedger((prev) => [...prev, evt]);
          if (ledgerContainerRef.current) {
            const rows = ledgerContainerRef.current.querySelectorAll(".table-row");
            const row = rows[rows.length - 1];
            if (row) {
              row.classList.add("row-enter");
              requestAnimationFrame(() => row.classList.add("show"));
            }
          }
          if (evt.kind === "payment" || evt.kind === "bribe") {
            const coin = document.createElement("span");
            coin.className = "coin-fly";
            if (ledgerContainerRef.current) {
              ledgerContainerRef.current.appendChild(coin);
              setTimeout(() => coin.remove(), 800);
            }
          }
          if (highlightMoment && (evt.kind === "bribe" || evt.highlight)) {
            if (ledgerContainerRef.current) {
              ledgerContainerRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
            }
          }
        }
      });
    } catch (e) {
      setLoadingStage("");
    }
  };

  return (
    <section className="panel custom-panel">
      <div className="custom-header">
        <div>
          <h2>Custom Hypothesis</h2>
          <p className="muted small">Create or paste a hypothesis; preview &amp; run a replayable arena.</p>
        </div>
        <div className="custom-actions">
          <button className="ghost" onClick={useTemplate}>Use Template</button>
          <button className="ghost" onClick={onValidate}>Validate JSON</button>
          <button className="primary" onClick={stagedRun}>
            {loadingStage ? loadingStage : "Run Custom"}
          </button>
          <span className="help" title="JSON or form both work; sync them to keep experiments reproducible.">?</span>
        </div>
      </div>

      <div className="custom-grid">
        <div className="custom-left">
          <div className="tabs">
            <button className={tab === "json" ? "tab active" : "tab"} onClick={() => setTab("json")}>
              JSON Editor
            </button>
            <button className={tab === "form" ? "tab active" : "tab"} onClick={() => setTab("form")}>
              Visual Form
            </button>
          </div>
          {tab === "json" ? (
            <div className="editor-wrap">
              <Editor
                height="260px"
                defaultLanguage="json"
                theme="vs-dark"
                value={json}
                onChange={(v) => setJson(v || "")}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: "on"
                }}
              />
            </div>
          ) : (
            <div className="form-wrap">
              <div className="field-row">
                <label>Seed</label>
                <div className="field-inline">
                  <input
                    type="number"
                    value={formState.seed}
                    onChange={(e) => setFormState((s) => ({ ...s, seed: Number(e.target.value) }))}
                  />
                  <button
                    className="ghost icon"
                    onClick={() =>
                      setFormState((s) => ({ ...s, seed: Math.floor(Math.random() * 1_000_000) }))
                    }
                  >
                    🎲
                  </button>
                </div>
              </div>
              <div className="field-row">
                <label>Rounds</label>
                <input
                  type="range"
                  min={3}
                  max={20}
                  value={formState.rounds}
                  onChange={(e) => setFormState((s) => ({ ...s, rounds: Number(e.target.value) }))}
                />
                <span className="muted small">{formState.rounds}</span>
              </div>
              <div className="field-row">
                <label>Oracle price</label>
                <input
                  type="range"
                  min={0.0005}
                  max={0.005}
                  step={0.0005}
                  value={formState.price}
                  onChange={(e) => setFormState((s) => ({ ...s, price: Number(e.target.value) }))}
                />
                <span className="muted small">{formState.price} USDC</span>
              </div>
              <div className="field-row">
                <label>Strategist bribe budget</label>
                <input
                  type="range"
                  min={0}
                  max={0.02}
                  step={0.001}
                  value={formState.bribeBudget}
                  onChange={(e) =>
                    setFormState((s) => ({ ...s, bribeBudget: Number(e.target.value) }))
                  }
                />
                <span className="muted small">{formState.bribeBudget} USDC</span>
              </div>
              <div className="field-row">
                <label>Trader strategy</label>
                <div className="segmented">
                  {["conservative", "balanced", "aggressive"].map((opt) => (
                    <button
                      key={opt}
                      className={
                        formState.strategy === opt ? "seg active" : "seg"
                      }
                      onClick={() => setFormState((s) => ({ ...s, strategy: opt }))}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <div className="field-row toggle-row">
                <label>Mock tx</label>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={formState.mockTx}
                    onChange={(e) =>
                      setFormState((s) => ({ ...s, mockTx: e.target.checked }))
                    }
                  />
                  <span>Fast mock mode</span>
                </label>
              </div>
            </div>
          )}
          <div className="sync-row">
            <button className="ghost" onClick={syncJsonFromForm}>
              Sync Form → JSON
            </button>
            <button className="ghost" onClick={syncFormFromJson}>
              Sync JSON → Form
            </button>
            {syncWarning && <span className="pill warning">Out of sync</span>}
            {validInfo && (
              <span className={`pill ${validInfo.ok ? "ok" : "err"}`}>
                {validInfo.message}
              </span>
            )}
          </div>
        </div>

        <div className="custom-middle">
          <div className="preview-card">
            <div className="preview-head">
              <span className="pill">Preview</span>
              <span className="muted small">
                Seed {formState.seed} • Rounds {formState.rounds}
              </span>
            </div>
            <div className="preview-main">
              <div>
                <div className="label">Est. arena cost</div>
                <div className="value">{preview.estCost.toFixed(4)} USDC</div>
              </div>
              <div>
                <div className="label">Bribe chance</div>
                <div className="value">{preview.bribeChance}%</div>
              </div>
            </div>
            <p className="muted small">{preview.line}</p>
          </div>
          <div className="micro-timeline">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="micro-event">
                <span className="dot" />
                <span className="muted small">
                  {i === 4 ? "Possible bribe / cartel pivot" : `Event ${i}`}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="custom-right">
          <button className="primary big" onClick={stagedRun}>
            {loadingStage ? loadingStage : "Run Hypothesis"}
          </button>
          <div className="muted small caption">
            Seed: {formState.seed} • Rounds: {formState.rounds}
          </div>
          <div className="field-row">
            <label>Speed</label>
            <input
              type="range"
              min={0.25}
              max={2}
              step={0.25}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
            />
            <span className="muted small">{speed.toFixed(2)}x</span>
          </div>
          <div className="field-row toggle-row">
            <label>Slow demo</label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={slowDemo}
                onChange={(e) => setSlowDemo(e.target.checked)}
              />
              <span>Stage events slowly</span>
            </label>
          </div>
          <div className="field-row toggle-row">
            <label>Highlight moment</label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={highlightMoment}
                onChange={(e) => setHighlightMoment(e.target.checked)}
              />
              <span>Jump to bribe/cartel</span>
            </label>
          </div>
          <div className="field-row toggle-row">
            <label>Auto report</label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={autoReport}
                onChange={(e) => setAutoReport(e.target.checked)}
              />
              <span>Generate summary</span>
            </label>
          </div>
        </div>
      </div>

      <div ref={ledgerContainerRef} className="custom-live">
        {/* this container is used for playback visuals; main ledger is still in parent */}
        {liveLedger.length ? (
          <div className="muted small">Live playback: {liveLedger.length} event(s).</div>
        ) : null}
      </div>
    </section>
  );
}


