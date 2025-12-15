export function summarizeRun(runId, ledger, agents) {
  const payments = ledger.filter(
    (e) => e.kind === "payment" || e.kind === "bribe" || e.kind === "side-pay"
  );
  const totalTxs = payments.length;
  const totalVolume = payments.reduce((s, e) => s + (Number(e.amount) || 0), 0);

  const bribeCount = ledger.filter(
    (e) => e.kind === "bribe" || (e.kind === "payment" && e.public === false)
  ).length;
  const privatePayments = payments.filter((e) => e.public === false);
  const collusionRatio = totalTxs ? privatePayments.length / totalTxs : 0;

  const earnings = agents.reduce((acc, a) => {
    acc[a.id] = Number(a.balance || 0);
    return acc;
  }, {});
  const topEarner = Object.keys(earnings).reduce((a, b) =>
    earnings[a] > earnings[b] ? a : b
  );

  const pairCounts = {};
  for (const p of privatePayments) {
    const k = `${p.from}->${p.to}`;
    pairCounts[k] = (pairCounts[k] || 0) + 1;
  }
  let cartelPair = null;
  for (const k in pairCounts) {
    if (pairCounts[k] >= 3) {
      cartelPair = k;
      break;
    }
  }

  let betrayalDetected = false;
  const bribes = ledger.filter((e) => e.kind === "bribe");
  for (const b of bribes) {
    const agent = b.to;
    const later = ledger.filter(
      (e) =>
        e.round > b.round &&
        e.from === agent &&
        (e.kind === "payment" || e.kind === "bribe")
    );
    if (later.some((l) => l.to !== b.from)) {
      betrayalDetected = true;
      break;
    }
  }

  const bankruptAgents = agents
    .filter((a) => (a.balance || 0) <= 0)
    .map((a) => a.id);

  const parts = [];
  parts.push(`Run ${runId}: ${totalTxs} payments totaling ${totalVolume.toFixed(4)} USDC.`);
  if (bribeCount) parts.push(`${bribeCount} bribe(s) observed.`);
  parts.push(`Collusion ratio (private/total) = ${collusionRatio.toFixed(2)}.`);
  if (cartelPair) parts.push(`Cartel-like behavior detected between ${cartelPair.replace("->", " ↔ ")}.`);
  if (betrayalDetected) parts.push(`A betrayal event occurred (partner switched after a side-deal).`);
  parts.push(`Top earner: ${topEarner} (${earnings[topEarner].toFixed(4)} USDC).`);
  if (bankruptAgents.length) parts.push(`Bankrupt agents: ${bankruptAgents.join(", ")}.`);

  const narrative = parts.join(" ");
  return {
    text: narrative,
    metrics: {
      totalTxs,
      totalVolume,
      bribeCount,
      collusionRatio,
      cartelPair,
      betrayalDetected,
      topEarner,
      bankruptAgents
    }
  };
}


