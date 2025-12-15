# SwarmForge MVP (x402 + Solana Devnet)

Quick-startable demo for the Encode x402 Winter Build Challenge. It simulates 3 deterministic agents (Oracle, Trader, Strategist) running 10-round arenas with mock or real-ready x402-style Solana payments. Frontend (Vite/React) shows hypotheses, live ledger, and metrics; backend (Express) runs the deterministic simulation and exposes a simple API.

## Repo Layout
- `backend/` – Express simulation API with x402 mock/ready flow.
- `frontend/` – Vite + React SPA for arena runs, ledger, metrics.

## One-Time Setup
```bash
cd backend
npm install
cd ../frontend
npm install
```

## Run Locally
Backend:
```bash
cd backend
npm run dev
```

Frontend (in another shell):
```bash
cd frontend
npm run dev
# Vite will print a localhost URL
```

## Deploy (Fast, Free)
- Frontend: `cd frontend && npm run build` then deploy `dist/` to Vercel/Netlify.
- Backend: Deploy `backend/` to Render.com (Node web service). Env vars:
  - `PORT` (optional, default 8080)
  - `USE_MOCK_TX` (`true` to keep mock txSigs)
  - `SOLANA_RPC` (devnet URL if you wire real txs)

## API Quick Reference
- `POST /api/arena/start` body: `{ hypId: number (1-7), seed?: number, rounds?: number, mockTx?: boolean }`
- Response: `{ seed, config, ledger, metrics, balances }`

## Hypotheses Included
Seven pre-set hypes aligned to x402 track: alliance, collusion threshold, hallucination reduction, strategy fragility, whistleblower impact, cartel formation, free-rider penalty.

## Notes
- Currently runs with mock Solana txs for speed; hooks are in place to drop in real devnet transfers (`x402.js`).
- Deterministic via seeded RNG for replays/exports.


