import { createTimestampParts } from "../utils/dateTime";

const OFFLINE_QUEUE_STORAGE_KEY = "cubo.terminal.offlineQueue";

function createId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `offline-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readQueue() {
  const storedQueue = window.localStorage.getItem(OFFLINE_QUEUE_STORAGE_KEY);

  if (!storedQueue) {
    return [];
  }

  try {
    return JSON.parse(storedQueue);
  } catch {
    return [];
  }
}

function saveQueue(queue) {
  window.localStorage.setItem(OFFLINE_QUEUE_STORAGE_KEY, JSON.stringify(queue));
  window.dispatchEvent(new CustomEvent("cubo:offline-queue-changed"));
}

export function enqueueOfflineEvent(event) {
  const timestamp = event.timestamp || new Date().toISOString();
  const timestampDate = new Date(timestamp);
  const timestampParts = createTimestampParts(Number.isNaN(timestampDate.getTime()) ? new Date() : timestampDate);
  const offlineEvent = {
    offlineEventId: event.offlineEventId || createId(),
    run: event.run,
    eventType: event.eventType,
    terminalCode: event.terminalCode,
    timestamp,
    localDate: timestampParts.localDate,
    localTime: timestampParts.localTime,
    syncStatus: "PENDING",
    source: "TERMINAL_PC",
    inputMethod: event.inputMethod,
    offline: true,
    attempts: 0,
    lastError: "",
    createdAt: new Date().toISOString()
  };

  saveQueue([offlineEvent, ...readQueue()]);
  return offlineEvent;
}

export function getPendingEvents() {
  return readQueue().filter((event) => event.syncStatus === "PENDING" || event.syncStatus === "FAILED");
}

export function getOfflineQueue() {
  return readQueue();
}

export function markEventAsSynced(offlineEventId) {
  saveQueue(
    readQueue().map((event) =>
      event.offlineEventId === offlineEventId
        ? { ...event, syncStatus: "SYNCED", syncedAt: new Date().toISOString(), lastError: "" }
        : event
    )
  );
}

export function markEventAsFailed(offlineEventId, reason) {
  saveQueue(
    readQueue().map((event) =>
      event.offlineEventId === offlineEventId
        ? {
            ...event,
            syncStatus: "FAILED",
            attempts: Number(event.attempts || 0) + 1,
            lastError: String(reason ?? "ERROR DE SINCRONIZACION"),
            lastAttemptAt: new Date().toISOString()
          }
        : event
    )
  );
}

export function removeOfflineEvent(offlineEventId) {
  saveQueue(readQueue().filter((event) => event.offlineEventId !== offlineEventId));
}

export function clearOfflineQueue() {
  saveQueue([]);
}

export function getOfflineQueueStats() {
  const queue = readQueue();
  return {
    total: queue.length,
    pending: queue.filter((event) => event.syncStatus === "PENDING" || event.syncStatus === "FAILED").length,
    synced: queue.filter((event) => event.syncStatus === "SYNCED").length,
    failed: queue.filter((event) => event.syncStatus === "FAILED").length
  };
}
