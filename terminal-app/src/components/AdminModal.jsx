import { useMemo, useState } from "react";
import {
  clearOfflineQueue,
  getOfflineQueue,
  getOfflineQueueStats,
  removeOfflineEvent
} from "../services/offlineQueueService";
import { checkApiHealth } from "../services/syncService";
import {
  normalizeApiBaseUrl,
  resetTerminalConfig,
  updateTerminalConfig
} from "../services/terminalConfigService";
import { formatEventDateTime } from "../utils/dateTime";
import { maskRun } from "../utils/runParser";

export default function AdminModal({
  terminalConfig,
  connectionStatus,
  onClose,
  onConfigChange,
  onAuthenticated,
  onSync
}) {
  const [pin, setPin] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState("");
  const [configDraft, setConfigDraft] = useState(terminalConfig);
  const [queue, setQueue] = useState(() => getOfflineQueue());
  const [stats, setStats] = useState(() => getOfflineQueueStats());
  const [adminNotice, setAdminNotice] = useState("");
  const pendingEvents = useMemo(
    () => queue.filter((event) => event.syncStatus === "PENDING" || event.syncStatus === "FAILED"),
    [queue]
  );

  function refreshQueue() {
    setQueue(getOfflineQueue());
    setStats(getOfflineQueueStats());
  }

  function submitPin(event) {
    event.preventDefault();

    if (pin === terminalConfig.adminPin) {
      setAuthenticated(true);
      setError("");
      onAuthenticated();
      return;
    }

    setError("PIN ADMIN INVALIDO");
  }

  function saveConfig(event) {
    event.preventDefault();
    const updatedConfig = updateTerminalConfig({
      ...configDraft,
      apiBaseUrl: normalizeApiBaseUrl(configDraft.apiBaseUrl)
    });
    setConfigDraft(updatedConfig);
    onConfigChange(updatedConfig);
    setAdminNotice("CONFIGURACION GUARDADA");
  }

  async function testConnection() {
    const health = await checkApiHealth(configDraft);
    setAdminNotice(health.online ? "API ONLINE" : "API OFFLINE O SIN /HEALTH");
  }

  async function retrySync() {
    await onSync();
    refreshQueue();
    setAdminNotice("SINCRONIZACION EJECUTADA");
  }

  function clearQueue() {
    clearOfflineQueue();
    refreshQueue();
    setAdminNotice("COLA OFFLINE LIMPIA");
  }

  function removePending(offlineEventId) {
    removeOfflineEvent(offlineEventId);
    refreshQueue();
    setAdminNotice("EVENTO OFFLINE ELIMINADO");
  }

  function restoreDefaults() {
    const defaultConfig = resetTerminalConfig();
    setConfigDraft(defaultConfig);
    onConfigChange(defaultConfig);
    setAdminNotice("CONFIGURACION POR DEFECTO RESTAURADA");
  }

  return (
    <div className="modal-backdrop">
      <div className="admin-modal" role="dialog" aria-modal="true" aria-label="Modo administrador">
        <div className="admin-header">
          <div>
            <span className="eyebrow">F6 ADMIN</span>
            <h2>MODO ADMINISTRADOR</h2>
          </div>
          <button className="icon-action" onClick={onClose} aria-label="Cerrar modo administrador">
            X
          </button>
        </div>

        {!authenticated ? (
          <form className="admin-pin-panel" onSubmit={submitPin}>
            <label htmlFor="admin-pin">PIN TECNICO</label>
            <input
              autoFocus
              id="admin-pin"
              inputMode="numeric"
              maxLength={12}
              onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))}
              type="password"
              value={pin}
            />
            {error ? <div className="admin-error">{error}</div> : null}
            <button className="admin-primary-button" type="submit">
              INGRESAR
            </button>
          </form>
        ) : (
          <div className="admin-grid">
            <form className="admin-panel" onSubmit={saveConfig}>
              <h3>CONFIGURACION</h3>
              <label>
                API Base URL
                <input
                  value={configDraft.apiBaseUrl}
                  onChange={(event) =>
                    setConfigDraft((current) => ({
                      ...current,
                      apiBaseUrl: event.target.value
                    }))
                  }
                />
              </label>
              <label>
                Terminal Code
                <input
                  value={configDraft.terminalCode}
                  onChange={(event) =>
                    setConfigDraft((current) => ({
                      ...current,
                      terminalCode: event.target.value.trim().toUpperCase()
                    }))
                  }
                />
              </label>
              <label>
                Terminal Name
                <input
                  value={configDraft.terminalName}
                  onChange={(event) =>
                    setConfigDraft((current) => ({
                      ...current,
                      terminalName: event.target.value
                    }))
                  }
                />
              </label>
              <label>
                Modo
                <select
                  value={configDraft.mode}
                  onChange={(event) =>
                    setConfigDraft((current) => ({
                      ...current,
                      mode: event.target.value
                    }))
                  }
                >
                  <option value="API">API</option>
                  <option value="LOCAL_MOCK">LOCAL_MOCK</option>
                </select>
              </label>
              {adminNotice ? <div className="admin-notice">{adminNotice}</div> : null}
              <button className="admin-primary-button" type="submit">
                GUARDAR CONFIGURACION
              </button>
              <button className="admin-secondary-button" type="button" onClick={restoreDefaults}>
                RESTAURAR DEFAULT
              </button>
            </form>

            <section className="admin-panel">
              <h3>CONEXION AWS</h3>
              <div className="admin-kv">
                <span>Estado</span>
                <strong>{connectionStatus}</strong>
              </div>
              <div className="admin-kv">
                <span>Modo actual</span>
                <strong>{configDraft.mode}</strong>
              </div>
              <div className="admin-kv">
                <span>Pendientes</span>
                <strong>{stats.pending}</strong>
              </div>
              <div className="admin-kv">
                <span>Terminal</span>
                <strong>{configDraft.terminalCode}</strong>
              </div>
              <button className="admin-primary-button" type="button" onClick={testConnection}>
                PROBAR /HEALTH
              </button>
              <button className="admin-primary-button" type="button" onClick={retrySync}>
                REINTENTAR SINCRONIZACION
              </button>
              <button className="admin-secondary-button" type="button" onClick={clearQueue}>
                LIMPIAR COLA OFFLINE DEMO
              </button>
            </section>

            <section className="admin-panel event-panel">
              <h3>COLA OFFLINE</h3>
              <div className="event-table">
                <div className="event-row event-row-head">
                  <span>Fecha/hora</span>
                  <span>RUT</span>
                  <span>Evento</span>
                  <span>Estado</span>
                  <span>Accion</span>
                </div>
                {pendingEvents.length === 0 ? (
                  <div className="event-empty">SIN EVENTOS PENDIENTES</div>
                ) : (
                  pendingEvents.map((event) => (
                    <div className="event-row" key={event.offlineEventId}>
                      <span>{formatEventDateTime(event)}</span>
                      <span>{maskRun(event.run)}</span>
                      <span>{event.eventType}</span>
                      <span>{event.syncStatus}</span>
                      <button
                        className="inline-danger-button"
                        onClick={() => removePending(event.offlineEventId)}
                        type="button"
                      >
                        ELIMINAR
                      </button>
                    </div>
                  ))
                )}
              </div>
              <div className="event-hint">La cola offline no guarda PIN, QR completo, MRZ ni serial.</div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
