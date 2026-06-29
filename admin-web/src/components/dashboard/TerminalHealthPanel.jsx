import Badge from "../Badge.jsx";
import DataTable from "../DataTable.jsx";
import { formatDateTime } from "../../utils/dateTime.js";
import { statusTone } from "../../utils/formatters.js";

export default function TerminalHealthPanel({ rows }) {
  return (
    <div className="section-stack">
      <DataTable
        rows={rows}
        emptyText="Sin terminales para evaluar"
        columns={[
          { key: "terminalCode", label: "Terminal" },
          { key: "status", label: "Estado", render: (row) => <Badge tone={statusTone(row.status)}>{row.status}</Badge> },
          { key: "lastHeartbeatAt", label: "Ultimo heartbeat", render: (row) => formatDateTime(row.lastHeartbeatAt) },
          { key: "lastAttendanceAt", label: "Ultimo marcaje", render: (row) => formatDateTime(row.lastAttendanceAt) },
          { key: "eventsToday", label: "Eventos hoy" },
          { key: "offlinePending", label: "Offline" },
          { key: "failedAttempts", label: "Fallos" },
          { key: "observation", label: "Observacion" },
        ]}
      />
      <p className="fine-print">
        La salud de terminales se calcula de forma simulada en el MVP a partir de eventos disponibles. En produccion se usaria heartbeat periodico del totem.
      </p>
    </div>
  );
}
