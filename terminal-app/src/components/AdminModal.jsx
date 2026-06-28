import { useMemo, useState } from "react";
import { clearLocalEvents, getLocalEvents } from "../services/attendanceService";
import { updateTerminalConfig } from "../services/terminalConfigService";
import { formatEventDateTime } from "../utils/dateTime";
import { maskRun } from "../utils/runParser";

export default function AdminModal({ terminalConfig, onClose, onConfigChange, onAuthenticated }) {
  const [pin, setPin] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState("");
  const [configDraft, setConfigDraft] = useState(terminalConfig);
  const [events, setEvents] = useState(() => getLocalEvents());
  const latestEvents = useMemo(() => events.slice(0, 12), [events]);

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
    const updatedConfig = updateTerminalConfig(configDraft);
    setConfigDraft(updatedConfig);
    onConfigChange(updatedConfig);
  }

  function clearEvents() {
    clearLocalEvents();
    setEvents([]);
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
              <button className="admin-primary-button" type="submit">
                GUARDAR CONFIGURACION
              </button>
              <button className="admin-secondary-button" type="button" onClick={clearEvents}>
                LIMPIAR EVENTOS LOCALES DEMO
              </button>
            </form>

            <section className="admin-panel event-panel">
              <h3>EVENTOS LOCALES PENDIENTES</h3>
              <div className="event-table">
                <div className="event-row event-row-head">
                  <span>Fecha/hora</span>
                  <span>RUN</span>
                  <span>Nombre</span>
                  <span>Evento</span>
                  <span>Estado</span>
                </div>
                {latestEvents.length === 0 ? (
                  <div className="event-empty">SIN EVENTOS LOCALES</div>
                ) : (
                  latestEvents.map((event) => (
                    <div className="event-row" key={event.id}>
                      <span>{formatEventDateTime(event)}</span>
                      <span>{event.employeeRun ? maskRun(event.employeeRun) : event.employeeCode}</span>
                      <span>{event.employeeName}</span>
                      <span>{event.eventLabel}</span>
                      <span>{event.syncStatus}</span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
