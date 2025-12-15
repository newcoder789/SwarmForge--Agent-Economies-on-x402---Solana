import { v4 as uuid } from "uuid";

export function mockPayment({ from, to, amount, rng }) {
  const txSig = `mock-${uuid().split("-")[0]}`;
  const explorer = `https://explorer.solana.com/tx/${txSig}?cluster=devnet`;
  return {
    from: from.id,
    to: to.id,
    amount,
    txSig,
    explorer,
    verified: true,
    mock: true
  };
}

export async function processPayment({ from, to, amount, useMock, rng }) {
  if (useMock) {
    return mockPayment({ from, to, amount, rng });
  }
  // Placeholder for real Solana devnet transfer (SPL USDC).
  // Wire in @solana/web3.js here if time allows.
  return mockPayment({ from, to, amount, rng });
}


