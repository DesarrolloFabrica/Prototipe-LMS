const DEFAULT_IDLE_TIMEOUT_MS = 4 * 60 * 60 * 1000;

export const SESSION_IDLE_TIMEOUT_MS = readPositiveNumber(
  import.meta.env.VITE_SESSION_IDLE_TIMEOUT_MS,
  DEFAULT_IDLE_TIMEOUT_MS,
);

export const SESSION_ACTIVITY_THROTTLE_MS = 60 * 1000;
export const SESSION_REFRESH_INTERVAL_MS = readPositiveNumber(
  import.meta.env.VITE_SESSION_REFRESH_INTERVAL_MS,
  30 * 60 * 1000,
);

export function isSessionIdleExpired(lastActivityAt: number | null, now = Date.now()) {
  return lastActivityAt !== null && now - lastActivityAt >= SESSION_IDLE_TIMEOUT_MS;
}

export function shouldRefreshSession(lastSessionRefreshAt: number | null, now = Date.now()) {
  return lastSessionRefreshAt === null || now - lastSessionRefreshAt >= SESSION_REFRESH_INTERVAL_MS;
}

function readPositiveNumber(value: unknown, fallback: number) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : fallback;
}
