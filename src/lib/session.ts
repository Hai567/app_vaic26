import { appConfig } from "@/config/app.config";

/**
 * Simple session management using LocalStorage.
 * No complex auth per instruction Rule 1.
 */
export function getSessionId(): string {
  if (typeof window === "undefined") return "";

  const key = appConfig.session.storageKey;
  let sessionId = localStorage.getItem(key);

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(key, sessionId);
  }

  return sessionId;
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(appConfig.session.storageKey);
}
