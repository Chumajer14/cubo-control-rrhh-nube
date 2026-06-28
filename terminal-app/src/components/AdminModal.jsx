import { useMemo, useState } from "react";
import { clearLocalEvents, deleteLocalEvent, getLocalEvents, getPendingEvents } from "../services/attendanceService";
import {
  normalizeApiBaseUrl,
  resetTerminalConfig,
  updateTerminalConfig
} from "../services/terminalConfigService";
import { formatEventDateTime } from "../utils/dateTime";
import { maskRun } from "../utils/runParser";

export default function AdminModal({ terminalConfig, onClose, onConfigChange, onAuthenticated }) {
  const [pin, setPin] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState("");
  const [configDraft, setConfigDraft] = useState(terminalConfig);
  const [events, setEvents] = useState(() => getLocalEvents());
  const [adminNotice, setAdminNotice] = useState("");
  const latestEvents = useMemo(() => events.slice(0, 12), [events]);
  const pendingEvents = useMemo(() => events.filter((event) => event.syncStatus === "PENDING"), [events]);

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

  function clearEvents() {
    clearLocalEvents();
    setEvents([]);
    setAdminNotice("EVENTOS LOCALES ELIMINADOS");
  }

  function removeEvent(eventId) {
    deleteLocalEvent(eventId);
    setEvents(getLocalEvents());
    setAdminNotice("EVENTO PENDIENTE ELIMINADO");
  }

  function testConnection() {
    const normalizedUrl = normalizeApiBaseUrl(configDraft.apiBaseUrl);
    try {
      const parsedUrl = new URL(normalizedUrl);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error("Invalid protocol");
      }
      setAdminNotice("API CONFIGURADA. PRUEBA REAL REQUIERE ENDPOINT DE HEALTH");
    } catch {
      setAdminNotice("URL API INVALIDA");
    }
  }

  function changeMode(mode) {
    setConfigDraft((current) => ({
      ...current,
      mode
    }));
  }

  function restoreDefaults() {
    const defaultConfig = resetTerminalConfig();
    setConfigDraft(defaultConfig);
    onConfigChange(defaultConfig);
    setAdminNotice("CONFIGURACION POR DEFECTO RESTAURADA");
  }

  function refreshPendingEvents() {
    const pending = getPendingEvents();
    setEvents(getLocalEvents());
    setAdminNotice(
      pending.length
        ? "EVENTO PENDIENTE REQUIERE REVALIDACION DE PIN"
        : "SIN EVENTOS PENDIENTES"
    );
  }

  function retrySync() {
    setEvents(getLocalEvents());
    setAdminNotice("EVENTO PENDIENTE REQUIERE REVALIDACION DE PIN");
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
              id="admin-pin"
              autoFocus
              inputMode="numeric"
              maxLength={12}
              type="password"
              value={pin}
              onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))}
            />
            {error ? <div className="admin-error">{error}</div> : null}
            <button className="admin-primary-button" type="submit">
              INGRESAR
            </button>
          </form>
        ) : (
          <div className="admin-grid">
            <form className="admin-panel" onSubmit={saveConfig}>
              <h3>CONFIGURACION DEL TERMINAL</h3>
              <label>
                Codigo del terminal
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
                Nombre del terminal
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
                URL base API
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
                  <option value="LOCAL_MOCK">LOCAL_MOCK</option>
                  <option value="API">API</option>
                </select>
              </label>
              {adminNotice ? <div className="admin-notice">{adminNotice}</div> : null}
              <button className="admin-primary-button" type="submit">
                GUARDAR CONFIGURACION
              </button>
              <button className="admin-secondary-button" type="button" onClick={restoreDefaults}>
                RESTAURAR CONFIGURACION POR DEFECTO
              </button>
              <button className="admin-secondary-button" type="button" onClick={clearEvents}>
                LIMPIAR EVENTOS LOCALES DEMO
              </button>
            </form>

            <section className="admin-panel">
              <h3>CONEXION AWS</h3>
              <div className="admin-kv">
                <span>Modo actual</span>
                <strong>{configDraft.mode}</strong>
              </div>
              <div className="admin-kv">
                <span>API Base URL</span>
                <strong>{configDraft.apiBaseUrl}</strong>
              </div>
              <div className="admin-kv">
                <span>Terminal Code</span>
                <strong>{configDraft.terminalCode}</strong>
              </div>
              <div className="admin-kv">
                <span>Terminal Name</span>
                <strong>{configDraft.terminalName}</strong>
              </div>
              <button className="admin-primary-button" type="button" onClick={testConnection}>
                PROBAR CONEXION
              </button>
              <button className="admin-secondary-button" type="button" onClick={() => changeMode("LOCAL_MOCK")}>
                CAMBIAR A LOCAL_MOCK
              </button>
              <button className="admin-primary-button" type="button" onClick={() => changeMode("API")}>
                CAMBIAR A API
              </button>
              <button className="admin-secondary-button" type="button" onClick={refreshPendingEvents}>
                VER EVENTOS PENDIENTES
              </button>
              <button className="admin-secondary-button" type="button" onClick={retrySync}>
                REINTENTAR SINCRONIZACION
              </button>
            </section>

            <section className="admin-panel event-panel">
              <h3>EVENTOS LOCALES PENDIENTES</h3>
              <div className="event-table">
                <div className="event-row event-row-head">
                  <span>Fecha/hora</span>
                  <span>RUN</span>
                  <span>Evento</span>
                  <span>Estado</span>
                  <span>Accion</span>
                </div>
                {pendingEvents.length === 0 ? (
                  <div className="event-empty">SIN EVENTOS PENDIENTES</div>
                ) : (
                  pendingEvents.map((event) => (
                    <div className="event-row" key={event.id}>
                      <span>{formatEventDateTime(event)}</span>
                      <span>{event.employeeRun ? maskRun(event.employeeRun) : maskRun(event.run)}</span>
                      <span>{event.eventLabel || event.eventType}</span>
                      <span>{event.syncStatus}</span>
                      <button className="inline-danger-button" type="button" onClick={() => removeEvent(event.id)}>
                        ELIMINAR DEMO
                      </button>
                    </div>
                  ))
                )}
              </div>
              <div className="event-hint">EVENTO PENDIENTE REQUIERE REVALIDACION DE PIN</div>
              {latestEvents.length > pendingEvents.length ? (
                <div className="event-hint">Eventos locales totales: {events.length}</div>
              ) : null}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
