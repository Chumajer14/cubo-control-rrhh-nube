import Badge from "../Badge.jsx";
import { formatDateTime } from "../../utils/dateTime.js";
import { severityTone } from "../../utils/formatters.js";

export default function AlertList({ alerts }) {
  if (!alerts?.length) {
    return <div className="empty-state">Sin alertas operativas para mostrar</div>;
  }

  return (
    <div className="alert-list">
      {alerts.map((alert, index) => (
        <article className="alert-item" key={`${alert.type}-${alert.target}-${index}`}>
          <div className="alert-item-head">
            <Badge tone={severityTone(alert.severity)}>{alert.severity}</Badge>
            <strong>{alert.title}</strong>
            <span>{formatDateTime(alert.timestamp)}</span>
          </div>
          <p>{alert.description}</p>
          <small>Accion sugerida: {alert.recommendedAction}</small>
        </article>
      ))}
    </div>
  );
}
