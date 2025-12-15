const USD = 1; // represents 1 USDC; amounts are fractional.

export function createAgents(config, rng) {
  const seedBalance = 0.02; // 2 cents USDC equivalent
  return [
    {
      id: "oracle",
      name: "Oracle",
      role: "data",
      balance: seedBalance,
      price: config.price,
      ledger: []
    },
    {
      id: "trader",
      name: "Trader",
      role: "consumer",
      balance: seedBalance,
      appetite: 0.7,
      ledger: []
    },
    {
      id: "strategist",
      name: "Strategist",
      role: "meta",
      balance: seedBalance + config.bribeBudget,
      bribeBudget: config.bribeBudget,
      ledger: []
    }
  ].map((agent) => ({ ...agent, wallet: `wallet-${agent.id}-${Math.floor(rng() * 1e6)}` }));
}

export function summarizeBalances(agents) {
  return agents.reduce((acc, a) => {
    acc[a.id] = Number(a.balance.toFixed(6));
    return acc;
  }, {});
}

export function clampToBalance(agent, amount) {
  return Math.max(0, Math.min(agent.balance, amount));
}

export function adjustBalance(agent, delta) {
  agent.balance = Math.max(0, Number((agent.balance + delta).toFixed(6)));
}


