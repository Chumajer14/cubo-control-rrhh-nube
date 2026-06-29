import Badge from "../Badge.jsx";
import DataTable from "../DataTable.jsx";
import { formatMinutes, formatTime } from "../../utils/timeUtils.js";
import { statusTone } from "../../utils/formatters.js";

export default function LunchAnalysisTable({ rows }) {
  return (
    <DataTable
      rows={rows}
      emptyText="Sin colaciones registradas para hoy"
      columns={[
        { key: "employeeName", label: "Empleado" },
        { key: "lunchStartAt", label: "Inicio colacion", render: (row) => formatTime(row.lunchStartAt) },
        { key: "lunchEndAt", label: "Fin colacion", render: (row) => formatTime(row.lunchEndAt) },
        { key: "lunchMinutes", label: "Duracion", render: (row) => formatMinutes(row.lunchMinutes) },
        { key: "status", label: "Estado", render: (row) => <Badge tone={statusTone(row.status)}>{row.status}</Badge> },
      ]}
    />
  );
}
