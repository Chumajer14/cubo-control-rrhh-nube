import { formatClock } from "../utils/dateTime";

const EVENT_OPTIONS = ["F1 INGRESO", "F2 SALIDA", "F3 VALE ALMUERZO", "F4 INICIO ALMUERZO", "F5 FIN ALMUERZO"];

export default function LedDisplay({
  now,
  terminalConfig,
  terminalState,
  selectedEventLabel,
  maskedRun,
  pinLength,
  statusMessage,
  lastEvent
}) {
  const isIdle = terminalState === "IDLE";
  const isWaitingScan = terminalState === "WAITING_SCAN";
  const isWaitingPin = terminalState === "WAITING_PIN";
  const isProcessing = terminalState === "PROCESSING";
  const isSuccess = terminalState === "SUCCESS";
  const isError = terminalState === "ERROR";

  return (
    <section className="led-display" aria-label="Pantalla LED del terminal">
      <div className="led-header">
        <span>CUBO CONTROL</span>
        <small>
          {terminalConfig.terminalCode || "SIN CODIGO"} -{" "}
          {(terminalConfig.terminalName || "SIN CONFIGURACION").toUpperCase()}
        </small>
      </div>

      <div className="led-clock">{formatClock(now)}</div>

      {isIdle ? (
        <div className="led-action-list">
          <strong>SELECCIONE ACCION</strong>
          <div>
            {EVENT_OPTIONS.map((option) => (
              <span key={option}>{option}</span>
            ))}
          </div>
        </div>
      ) : null}

      {isWaitingScan ? (
        <div className="led-code">
          <span>ACCION:</span>
          <strong>{selectedEventLabel.toUpperCase()}</strong>
        </div>
      ) : null}

      {isWaitingPin ? (
        <div className="led-pin-panel">
          <div>
            <span>ACCION:</span>
            <strong>{selectedEventLabel.toUpperCase()}</strong>
          </div>
          <div>
            <span>RUN:</span>
            <strong>{maskedRun}</strong>
          </div>
          <div>
            <span>PIN:</span>
            <strong>{pinLength ? "*".repeat(pinLength) : "----"}</strong>
          </div>
        </div>
      ) : null}

      {isProcessing ? <div className="led-single-message">REGISTRANDO...</div> : null}

      {isSuccess && lastEvent ? (
        <div className="led-result">
          <strong>{statusMessage}</strong>
          <span>{lastEvent.employeeName}</span>
          <span>{lastEvent.eventLabel}</span>
        </div>
      ) : null}

      {isError ? <div className="led-single-message led-error-text">{statusMessage}</div> : null}

      <div className="led-selected">
        {isWaitingScan ? "ESCANEE CEDULA" : null}
        {isWaitingPin ? "INGRESE PIN Y CONFIRME CON ENTER" : null}
        {isIdle ? "F6 ADMIN" : null}
        {isProcessing || isSuccess || isError ? statusMessage : null}
      </div>
    </section>
  );
}
