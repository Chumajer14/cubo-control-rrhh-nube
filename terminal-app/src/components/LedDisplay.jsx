import { formatClock } from "../utils/dateTime";

export default function LedDisplay({ code, now, terminalConfig, selectedEventLabel }) {
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

      <div className="led-code">
        <span>CODIGO:</span>
        <strong>[ {code || "-----"} ]</strong>
      </div>

      <div className="led-selected">
        {selectedEventLabel ? `ACCION: ${selectedEventLabel.toUpperCase()}` : "SELECCIONE F1-F5"}
      </div>
    </section>
  );
}
