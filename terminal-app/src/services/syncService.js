import {
  getOfflineQueueStats,
  getPendingEvents,
  markEventAsFailed,
  markEventAsSynced
} from "./offlineQueueService";
import { getTerminalConfig, normalizeApiBaseUrl } from "./terminalConfigService";

const REQUEST_TIMEOUT_MS = 5000;
const SYNC_BATCH_SIZE = 5;
let syncing = false;

export function fetchWithTimeout(url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  return fetch(url, {
    ...options,
    signal: controller.signal
  }).finally(() => window.clearTimeout(timeoutId));
}

async function readJsonResponse(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export async function checkApiHealth(config = getTerminalConfig()) {
  if (config.mode !== "API") {
    return { online: true, status: "LOCAL_MOCK" };
  }

  const apiBaseUrl = normalizeApiBaseUrl(config.apiBaseUrl);
  if (!apiBaseUrl) {
    return { online: false, status: "OFFLINE" };
  }

  try {
    const response = await fetchWithTimeout(`${apiBaseUrl}/health`, { method: "GET" });
    const data = await readJsonResponse(response);
    return { online: response.ok && data.ok === true, status: response.ok ? "ONLINE" : "OFFLINE" };
  } catch {
    return { online: false, status: "OFFLINE" };
  }
}

export async function syncPendingEvents(config = getTerminalConfig()) {
  if (syncing || config.mode !== "API") {
    return { ok: true, skipped: true, stats: getOfflineQueueStats() };
  }

  const pendingEvents = getPendingEvents().slice(0, SYNC_BATCH_SIZE);
  if (pendingEvents.length === 0) {
    return { ok: true, synced: 0, stats: getOfflineQueueStats() };
  }

  const apiBaseUrl = normalizeApiBaseUrl(config.apiBaseUrl);
  if (!apiBaseUrl || !config.terminalSyncToken) {
    return { ok: false, message: "CONFIGURACION TERMINAL", stats: getOfflineQueueStats() };
  }

  syncing = true;
  try {
    const response = await fetchWithTimeout(`${apiBaseUrl}/attendance/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-terminal-token": config.terminalSyncToken
      },
      body: JSON.stringify({
        terminalCode: config.terminalCode,
        events: pendingEvents.map((event) => ({
          offlineEventId: event.offlineEventId,
          run: event.run,
          eventType: event.eventType,
          timestamp: event.timestamp,
          inputMethod: event.inputMethod,
          offline: true
        }))
      })
    });
    const data = await readJsonResponse(response);

    if (!response.ok || data.ok !== true || !Array.isArray(data.results)) {
      pendingEvents.forEach((event) => markEventAsFailed(event.offlineEventId, data.message || "ERROR API"));
      return { ok: false, message: data.message || "ERROR DE SINCRONIZACION", stats: getOfflineQueueStats() };
    }

    data.results.forEach((result) => {
      if (result.synced === true) {
        markEventAsSynced(result.offlineEventId);
      } else {
        markEventAsFailed(result.offlineEventId, result.message);
      }
    });

    return { ok: true, synced: data.results.filter((result) => result.synced === true).length, stats: getOfflineQueueStats() };
  } catch {
    return { ok: false, message: "SIN COMUNICACION API", stats: getOfflineQueueStats() };
  } finally {
    syncing = false;
  }
}
