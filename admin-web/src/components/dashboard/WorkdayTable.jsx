import Badge from "../Badge.jsx";
import DataTable from "../DataTable.jsx";
import { formatMinutes, formatTime } from "../../utils/timeUtils.js";
import { statusTone } from "../../utils/formatters.js";

export default function WorkdayTable({ rows }) {
  return (
    <DataTable
      rows={rows}
      emptyText="Sin jornadas calculadas para hoy"
      columns={[
        { key: "run", label: "RUT" },
        { key: "employeeName", label: "Empleado" },
        { key: "firstEntryAt", label: "Ingreso", render: (row) => formatTime(row.firstEntryAt) },
        { key: "lastExitAt", label: "Salida", render: (row) => formatTime(row.lastExitAt) },
        { key: "workedMinutes", label: "Horas trabajadas", render: (row) => formatMinutes(row.workedMinutes) },
        { key: "lunchMinutes", label: "Colacion", render: (row) => formatMinutes(row.lunchMinutes) },
        { key: "status", label: "Estado", render: (row) => <Badge tone={statusTone(row.status)}>{row.status}</Badge> },
        { key: "observation", label: "Observacion" },
      ]}
    />
  );
}
