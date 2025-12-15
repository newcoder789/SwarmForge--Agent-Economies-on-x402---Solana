const fallback = "http://localhost:8080";
const base = import.meta.env.VITE_API_BASE || fallback;

async function jsonFetch(path, options = {}) {
  const res = await fetch(`${base}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export function listHypotheses() {
  return jsonFetch("/api/hypotheses");
}

export function startArena(payload) {
  return jsonFetch("/api/arena/start", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function startCustomArena(payload) {
  return jsonFetch("/api/arena/custom", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function fetchRun(runId) {
  return jsonFetch(`/api/run/${runId}`);
}

export function health() {
  return jsonFetch("/health");
}


