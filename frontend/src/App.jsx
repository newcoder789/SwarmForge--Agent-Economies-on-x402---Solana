import { useEffect, useMemo, useRef, useState } from "react";
import { health, listHypotheses, startArena } from "./api.js";
import { CustomBuilder } from "./CustomBuilder.jsx";
import { typewriter } from "./typewriter.js";

function StatCard({ label, value, note }) {
  return (
    <div className="card">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {note ? <div className="note">{note}</div> : null}
    </div>
  );
}

function LedgerTable({ ledger }) {
  if (!ledger?.length) return <div className="muted">No events yet.</div>;
  return (
    <div className="table">
      <div className="table-head">
        <span>Round</span>
        <span>Kind</span>
        <span>From → To</span>
        <span>Amount</span>
        <span>Tx</span>
        <span>Thought</span>
      </div>
      {ledger.map((e, idx) => (
        <div className="table-row" key={`${e.round}-${idx}`}>
          <span>{e.round}</span>
          <span>{e.kind}</span>
          <span>
            {e.from} → {e.to}
          </span>
          <span>{e.amount ? `${e.amount} USDC` : "-"}</span>
          <span>
            {e.txSig ? (
              <a href={e.explorer} target="_blank" rel="noreferrer">
                {e.txSig}
              </a>
            ) : (
              e.summary || "—"
            )}
          </span>
          <span className="muted small">{e.comment || "—"}</span>
        </div>
      ))}
    </div>
  );
}

function ThoughtLine({ round, comment }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current || !comment) return undefined;
    const id = typewriter(ref.current, comment, 25);
    return () => clearInterval(id);
  }, [comment]);
  return (
    <li>
      <span className="pill subtle">R{round}</span> <span ref={ref} />
    </li>
  );
}

function AgentThoughts({ ledger }) {
  if (!ledger?.length) return null;
  const byAgent = ledger.reduce((acc, e) => {
    if (!e.comment) return acc;
    const pushTo = (id) => {
      acc[id] = acc[id] || [];
      acc[id].push({ round: e.round, comment: e.comment });
    };
    if (e.from) pushTo(e.from);
    if (e.to) pushTo(e.to);
    return acc;
  }, {});
  const agents = Object.keys(byAgent);
  if (!agents.length) return null;
  return (
    <div className="thoughts">
      {agents.map((id) => {
        const last = byAgent[id].slice(-3);
        return (
          <div key={id} className="thought-card">
            <div className="thought-head">
              <span className="pill">{id}</span>
              <span className="muted small">Latest thoughts</span>
            </div>
            <ul>
              {last.map((item, i) => (
                <ThoughtLine key={`${id}-${i}`} round={item.round} comment={item.comment} />
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function Timeline({ ledger, roundsHint }) {
  if (!ledger?.length) return <div className="muted">Run a hypothesis to populate the timeline.</div>;
  const maxRound =
    roundsHint || Math.max(...ledger.map((e) => e.round || 0), 0) || 0;
  const rounds = Array.from({ length: maxRound }, (_, i) => i + 1);
  return (
    <div className="timeline">
      {rounds.map((r) => {
        const events = ledger.filter((e) => e.round === r);
        const tags = Array.from(new Set(events.map((e) => e.kind)));
        return (
          <div className="tick" key={r}>
            <div className="tick-head">
              <span className="pill">Round {r}</span>
              <span className="muted small">{events.length} ev</span>
            </div>
            <div className="tag-row">
              {tags.length ? tags.map((t) => <span key={t} className="tag">{t}</span>) : <span className="muted small">—</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function App() {
  const [status, setStatus] = useState("Connecting...");
  const [hypotheses, setHypotheses] = useState([]);
  const [selected, setSelected] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [rounds, setRounds] = useState(10);
  const [mockTx, setMockTx] = useState(true);

  useEffect(() => {
    health()
      .then((res) => setStatus(`Backend live (mock tx: ${res.mock})`))
      .catch(() => setStatus("Backend not reachable"));
    listHypotheses()
      .then((res) => setHypotheses(res.items))
      .catch(() => setHypotheses([]));
  }, []);

  const selectedHyp = useMemo(
    () => hypotheses.find((h) => h.id === selected),
    [hypotheses, selected]
  );

  const onStart = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await startArena({ hypId: selected, rounds, mockTx });
      setResult(res);
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `swarmforge-h${selected}-seed${result.seed}.json`;
    link.click();
  };

  const onShare = () => {
    if (!result?.runId) return;
    const url = `${window.location.origin}/api/run/${result.runId}`;
    navigator.clipboard.writeText(url).catch(() => {});
    alert("Run link copied to clipboard");
  };

  return (
    <div className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">Encode x Solana Winter Build – x402 Track</p>
          <h1>SwarmForge: Agent Economies on x402 + Solana</h1>
          <p className="muted">
            Pick a hypothesis, run a 10-round arena, and watch deterministic agent-to-agent payments
            settle over Solana-style x402 flows (mock or devnet-ready).
          </p>
          <div className="status">{status}</div>
        </div>
        <div className="hero-actions">
          <label className="toggle">
            <input
              type="checkbox"
              checked={mockTx}
              onChange={(e) => setMockTx(e.target.checked)}
            />
            <span>Use mock tx (fast)</span>
          </label>
          <input
            type="number"
            value={rounds}
            min={5}
            max={25}
            onChange={(e) => setRounds(Number(e.target.value))}
          />
          <button className="primary" onClick={onStart} disabled={loading}>
            {loading ? "Running..." : "Start Arena"}
          </button>
          <button className="ghost" onClick={download} disabled={!result}>
            Export JSON
          </button>
          <button className="ghost" onClick={onShare} disabled={!result?.runId}>
            Share run link
          </button>
        </div>
      </header>

      <section>
        <h2>Hypotheses</h2>
        <div className="hyp-grid">
          {hypotheses.map((h) => (
            <button
              key={h.id}
              className={`hyp ${selected === h.id ? "active" : ""}`}
              onClick={() => setSelected(h.id)}
            >
              <div className="hyp-title">
                <span className="pill">Hyp {h.id}</span> {h.name}
              </div>
              <p className="muted small">{h.description}</p>
            </button>
          ))}
        </div>
      </section>

      {selectedHyp ? (
        <section className="panel">
          <h3>Config Preview</h3>
          <div className="config-grid">
            <StatCard label="Price" value={`${selectedHyp.price} USDC`} note="Per data request" />
            <StatCard
              label="Bribe budget"
              value={`${selectedHyp.bribeBudget} USDC`}
              note={`Round ${selectedHyp.bribeRound}+`}
            />
            <StatCard label="Cartel chance" value={`${Math.round(selectedHyp.cartelChance * 100)}%`} />
            <StatCard
              label="Paywall strict?"
              value={selectedHyp.paywallStrict ? "Yes" : "Free first"}
              note="x402 gating"
            />
          </div>
        </section>
      ) : null}

      <CustomBuilder onRunComplete={setResult} />

      <section className="panel">
        <h2>Arena Results</h2>
        {result?.error && <div className="error">Error: {result.error}</div>}
        {result && !result.error ? (
          <>
            <Timeline ledger={result.ledger} roundsHint={result.metrics?.rounds || rounds} />
            {result.summary?.text ? (
              <div className="summary">
                <strong>Auto Report:</strong> {result.summary.text}
              </div>
            ) : null}
            <div className="metrics">
              <StatCard label="Seed" value={result.seed} />
              <StatCard label="Txs" value={result.metrics.totalTx} />
              <StatCard label="Collusion" value={result.metrics.collusionRatio} note="Private / total" />
              <StatCard label="Bribes" value={result.metrics.bribeCount} />
              <StatCard label="Bankrupt rate" value={result.metrics.bankruptRate} />
            </div>
            <AgentThoughts ledger={result.ledger} />
            <div className="balances">
              {Object.entries(result.balances || {}).map(([id, bal]) => (
                <div key={id} className="balance">
                  <div className="label">{id}</div>
                  <div className="value">{bal} USDC</div>
                </div>
              ))}
            </div>
            <LedgerTable ledger={result.ledger} />
          </>
        ) : (
          <div className="muted">Run a hypothesis to see the ledger.</div>
        )}
      </section>

      <footer className="footer">
        <div>
          <strong>Why x402?</strong> Agents can pay each other over HTTP natively. Solana gives
          sub-second finality and tiny fees, making emergent swarms possible.
        </div>
        <div className="muted">Repo includes mock tx logs; devnet wiring ready in backend.</div>
      </footer>
    </div>
  );
}


