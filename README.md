# SwarmForge MVP (x402 + Solana Devnet)

Browser arena where 3 deterministic agents (Oracle, Trader, Strategist) run 10-round simulations under seven pre-set hypotheses. Every interaction follows an x402-style payment flow (mocked by default; devnet-ready), producing a live ledger, metrics, and exportable JSON for replays. Built for Encode x Solana Winter Build Challenge (x402 track).

## What This Project Shows
- x402-native A2A payments: request → 402 invoice → pay (mock txSig) → fulfill.
- Emergent agent behavior: paywalls, bribes/cartels, whistleblower chill.
- Deterministic runs: seedable RNG; export JSON for replay/research.
- Demo-ready UX: hypothesis buttons, round controls, timeline, ledger, metrics, export.

## Repo Layout
- `backend/` – Express simulation API with x402 mock/ready flow.
- `frontend/` – Vite + React SPA for arena runs, timeline, ledger, metrics.

## One-Time Setup
```bash
cd backend && npm install
cd ../frontend && npm install
```

## Run Locally
Backend:
```bash
cd backend
npm run dev   # starts on :8080
```
Frontend (new shell):
```bash
cd frontend
npm run dev   # Vite prints http://localhost:5173
```
If backend URL differs, set `VITE_API_BASE` in `frontend/.env` (e.g., `http://localhost:8080`).

## Deploy (Fast, Free)
- Frontend: `cd frontend && npm run build` then deploy `frontend/dist` to Vercel/Netlify.
- Backend: Deploy `backend/` to Render.com/any Node host. Env:
  - `PORT` (default 8080)
  - `USE_MOCK_TX` (`true` keeps mock txSigs)
  - `SOLANA_RPC` (devnet URL when wiring real transfers)

## API Quick Reference
- `POST /api/arena/start` body: `{ hypId: number (1-7), seed?: number, rounds?: number, mockTx?: boolean }`
- Response: `{ seed, config, ledger, metrics, balances }`

## Hypotheses (7)
1) Spontaneous Alliance — bribe budget drives Trader–Strategist partnerships.  
2) Collusion Threshold — cheap Oracle data triggers private side-deals.  
3) Hallucination Reduction — paid vs free data quality gap.  
4) Strategy Fragility — aggressive Trader goes bankrupt under low budgets.  
5) Whistleblower Impact — reveal event chills bribes post-round.  
6) Cartel Formation — price hike sparks side-deals mid-run.  
7) Free-Rider Penalty — early free access ends; strict x402 widens earnings gap.

## What We Are Building (and What’s Simulated)
- Deterministic agent behavior  
- Real budget depletion  
- Mandatory payments via x402 logic  
- Replayable runs with identical outcomes  
- Observable emergent effects (collusion, failure, alliances)

Simulated on purpose:
1. Payment settlement (mock txSig instead of real USDC)  
2. “Intelligence” level (heuristics instead of expensive LLM calls)  
3. Market environment (toy world, not live markets)

Why this matters for builders/researchers:
- The question isn’t “Is the agent smart?” but “What happens when agents must pay each other under constraints?”  
- Our answers: Does paying improve outcomes? ✅ Do agents stop cooperating when broke? ✅ Does cheap info create collusion? ✅ Can alliances emerge without hardcoding? ✅ That’s behavioral evidence, not narrative.

## Current Mock vs Real Gaps
- Payments/Tx: Mock txSig + explorer URL; no real SPL transfer yet (`backend/src/x402.js`).  
- Wallets/Funding: Synthetic wallet strings; balances are in-memory.  
- 402 Handshake: Paywall toggle but not a true HTTP 402 retry flow.  
- Latency/Finality: Instant in sim; no measured settle times.

## Submission Checklist (hackathon)
- Public GitHub repo with this README, code, configs, and mock tx logs (export JSON from UI).  
- 2–3 min video: “Pick Hyp1 → watch bribe round ~4 → click tx link → export metrics.”  
- Devpost/Encode form: project name, x402 track, repo link, video, team, Solana wallet.  
- Live deploy (nice-to-have): Vercel frontend + Render backend with mock txs.  
- License + contact (optional bonus).

## What the UI Delivers
- Hypothesis grid + config preview.  
- Controls: mock toggle, rounds input, start run, export JSON.  
- Timeline: per-round event chips (payments, bribes, reveals).  
- Ledger: round-by-round transfers with txSig links.  
- Metrics: tx counts, collusion ratio, bribes, bankrupt rate.  
- Balances: per-agent USDC view.

## How to use it
- Standard hypotheses: unchanged – pick a predefined hypothesis and click Start Arena.
- Custom builder:
  - Use JSON or Visual Form; click Sync to keep them aligned.
  - Click Validate JSON to run ajv schema check (pill shows result).
  - Click Use Template to reset to a sane baseline.
  - Click Run Custom / Run Hypothesis to fire a staged run and then see the full results below (timeline, auto report, metrics, thoughts, ledger, exports) as before, plus the live playback count in the builder.