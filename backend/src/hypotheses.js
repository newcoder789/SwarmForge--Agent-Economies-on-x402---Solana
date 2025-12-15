export const hypotheses = [
  {
    id: 1,
    name: "Spontaneous Alliance",
    description: "High bribe budget creates repeated Trader-Strategist partnerships.",
    price: 0.001,
    bribeBudget: 0.01,
    bribeAmount: 0.003,
    bribeRound: 3,
    cartelChance: 0.7,
    whistleblower: false,
    paywallStrict: true
  },
  {
    id: 2,
    name: "Collusion Threshold",
    description: "Low Oracle price encourages private side deals.",
    price: 0.0005,
    bribeBudget: 0.006,
    bribeAmount: 0.002,
    bribeRound: 2,
    cartelChance: 0.6,
    whistleblower: false,
    paywallStrict: true
  },
  {
    id: 3,
    name: "Hallucination Reduction",
    description: "Paid data yields higher score vs free fallback.",
    price: 0.0015,
    bribeBudget: 0.004,
    bribeAmount: 0.001,
    bribeRound: 5,
    cartelChance: 0.35,
    whistleblower: false,
    paywallStrict: true
  },
  {
    id: 4,
    name: "Strategy Fragility",
    description: "Aggressive Trader risks bankruptcy under low budgets.",
    price: 0.001,
    bribeBudget: 0.003,
    bribeAmount: 0.001,
    bribeRound: 4,
    cartelChance: 0.4,
    whistleblower: false,
    paywallStrict: true
  },
  {
    id: 5,
    name: "Whistleblower Impact",
    description: "Reveal event chills bribes; volume drops afterward.",
    price: 0.0008,
    bribeBudget: 0.007,
    bribeAmount: 0.002,
    bribeRound: 3,
    cartelChance: 0.55,
    whistleblower: true,
    whistleblowerRound: 6,
    paywallStrict: true
  },
  {
    id: 6,
    name: "Cartel Formation",
    description: "Price hike triggers side-deals in mid rounds.",
    price: 0.0018,
    bribeBudget: 0.009,
    bribeAmount: 0.003,
    bribeRound: 4,
    cartelChance: 0.65,
    whistleblower: false,
    paywallStrict: true
  },
  {
    id: 7,
    name: "Free-Rider Penalty",
    description: "Early free access ends; strict x402 widens earnings gap.",
    price: 0.001,
    bribeBudget: 0.005,
    bribeAmount: 0.0015,
    bribeRound: 2,
    cartelChance: 0.5,
    whistleblower: false,
    paywallStrict: false
  }
];

export function getHypothesisById(hypId) {
  return hypotheses.find((h) => h.id === Number(hypId));
}


