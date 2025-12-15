import seedrandom from "seedrandom";
import { createAgents, adjustBalance, clampToBalance, summarizeBalances } from "./agents.js";
import { processPayment } from "./x402.js";
import { computeMetrics } from "./metrics.js";
import { getHypothesisById } from "./hypotheses.js";
import { summarizeRun } from "./summarize.js";

function commentForPayment({ from, to, amount, freeWindow }) {
  if (freeWindow) {
    return `${from.name}: taking free data window before strict x402.`;
  }
  return `${from.name}: paying ${amount} USDC to ${to.name} for data.`;
}

function commentForBribe({ strategist, trader, amount }) {
  return `${strategist.name}: side-paying ${trader.name} (${amount} USDC) to favor my signals.`;
}

function commentForReveal() {
  return "Auditor: whistleblower exposes side-payments; expect chilled bribes.";
}

function commentForSkip({ from }) {
  return `${from.name}: cannot pay now (budget exhausted).`;
}

function maybePayForData({ from, to, config, round, useMock, rng, ledger }) {
  const freeWindow = !config.paywallStrict && round <= 2;
  const amount = freeWindow ? 0 : config.price;
  if (amount === 0) {
    ledger.push({
      round,
      kind: "free-data",
      from: from.id,
      to: to.id,
      amount,
      public: true,
      summary: "Free access before strict x402 kicks in",
      comment: commentForPayment({ from, to, amount, freeWindow: true })
    });
    return;
  }
  const payable = clampToBalance(from, amount);
  if (payable <= 0) {
    ledger.push({
      round,
      kind: "skipped",
      from: from.id,
      to: to.id,
      amount: 0,
      public: true,
      summary: "Insufficient balance",
      comment: commentForSkip({ from })
    });
    return;
  }
  return processPayment({ from, to, amount: payable, useMock, rng }).then((tx) => {
    adjustBalance(from, -payable);
    adjustBalance(to, payable);
    ledger.push({
      round,
      kind: "payment",
      from: from.id,
      to: to.id,
      amount: payable,
      txSig: tx.txSig,
      explorer: tx.explorer,
      public: true,
      summary: "Paid data via x402",
      comment: commentForPayment({ from, to, amount: payable, freeWindow: false })
    });
  });
}

function maybeBribe({ strategist, trader, config, round, useMock, rng, ledger }) {
  if (round < config.bribeRound) return Promise.resolve();
  if (rng() > config.cartelChance) return Promise.resolve();
  const bribe = Math.min(config.bribeAmount, strategist.bribeBudget || 0);
  const amount = clampToBalance(strategist, bribe);
  if (amount <= 0) return Promise.resolve();
  strategist.bribeBudget = Math.max(0, (strategist.bribeBudget || 0) - amount);
  return processPayment({ from: strategist, to: trader, amount, useMock, rng }).then((tx) => {
    adjustBalance(strategist, -amount);
    adjustBalance(trader, amount);
    ledger.push({
      round,
      kind: "bribe",
      from: strategist.id,
      to: trader.id,
      amount,
      txSig: tx.txSig,
      explorer: tx.explorer,
      public: false,
      summary: "Side deal to secure future data sharing",
      comment: commentForBribe({ strategist, trader, amount })
    });
  });
}

function maybeWhistleblow({ config, round, ledger }) {
  if (!config.whistleblower || !config.whistleblowerRound) return;
  if (round !== config.whistleblowerRound) return;
  ledger.push({
    round,
    kind: "reveal",
    from: "auditor",
    to: "public",
    amount: 0,
    public: true,
    summary: "Whistleblower exposes bribes; chill expected",
    comment: commentForReveal()
  });
}

export async function runArena({ hypId, seed, rounds = 10, useMock = true }) {
  const config = getHypothesisById(hypId);
  if (!config) {
    throw new Error("Unknown hypothesis");
  }
  const seedToUse = seed ?? Math.floor(Math.random() * 1_000_000);
  const rng = seedrandom(String(seedToUse));
  const agents = createAgents(config, rng);
  const ledger = [];
  const runId = `run-${Date.now()}-${Math.floor(rng() * 1e6)}`;

  for (let round = 1; round <= rounds; round++) {
    const oracle = agents.find((a) => a.id === "oracle");
    const trader = agents.find((a) => a.id === "trader");
    const strategist = agents.find((a) => a.id === "strategist");

    await maybePayForData({ from: trader, to: oracle, config, round, useMock, rng, ledger });
    await maybePayForData({ from: strategist, to: oracle, config, round, useMock, rng, ledger });
    await maybeBribe({ strategist, trader, config, round, useMock, rng, ledger });
    maybeWhistleblow({ config, round, ledger });
  }

  const metrics = computeMetrics(ledger, agents, rounds);
  const summary = summarizeRun(runId, ledger, agents);
  return {
    runId,
    seed: seedToUse,
    config,
    ledger,
    metrics,
    balances: summarizeBalances(agents),
    summary
  };
}


