const trackingSessionKey = "bank_club_tracking_session_id";

function fallbackSessionId() {
  return `bc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

export function getTrackingSessionId() {
  if (typeof window === "undefined") return "";
  try {
    const existing = window.localStorage.getItem(trackingSessionKey);
    if (existing) return existing;
    const next =
      typeof window.crypto?.randomUUID === "function"
        ? window.crypto.randomUUID()
        : fallbackSessionId();
    window.localStorage.setItem(trackingSessionKey, next);
    return next;
  } catch {
    return fallbackSessionId();
  }
}
