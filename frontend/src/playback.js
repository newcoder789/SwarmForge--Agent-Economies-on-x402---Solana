export function playLedger(ledger, { speed = 1, onEvent }) {
  const base = 700; // ms per event at 1x
  ledger.forEach((evt, i) => {
    const delay = Math.round((base / speed) * i);
    setTimeout(() => onEvent(evt, i), delay);
  });
}


