export function computeMetrics(ledger, agents, rounds) {
  const totalTx = ledger.length;
  const privateTx = ledger.filter((e) => e.public === false).length;
  const publicTx = totalTx - privateTx;
  const bribeCount = ledger.filter((e) => e.kind === "bribe").length;
  const bankrupt = agents.filter((a) => a.balance <= 0).length;
  const collusionRatio = totalTx === 0 ? 0 : Number((privateTx / totalTx).toFixed(3));
  const bankruptRate = Number((bankrupt / agents.length).toFixed(3));
  return {
    totalTx,
    publicTx,
    privateTx,
    bribeCount,
    collusionRatio,
    bankruptRate,
    rounds
  };
}


