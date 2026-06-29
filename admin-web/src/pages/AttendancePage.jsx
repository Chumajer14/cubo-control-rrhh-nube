import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { fetchAttendance } from "../api/attendanceApi.js";
import DataTable from "../components/DataTable.jsx";
import Badge from "../components/Badge.jsx";
import LoadingState from "../components/LoadingState.jsx";
import { downloadCsv } from "../utils/csvExport.js";
import { formatDateTime } from "../utils/dateTime.js";
import { eventLabel, statusTone } from "../utils/formatters.js";

const initialFilters = { from: "", to: "", employeeRun: "", employeeName: "", terminalCode: "", eventType: "", status: "", onlineMode: "" };

export default function AttendancePage() {
  const [filters, setFilters] = useState(initialFilters);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    setError("");
    fetchAttendance(filters)
      .then((payload) => setRows(payload.items || payload.attendance || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const columns = [
    { key: "date", label: "Fecha", render: (row) => (row.timestamp || "").slice(0, 10) },
    { key: "time", label: "Hora", render: (row) => formatDateTime(row.timestamp).split(", ").pop() },
    { key: "employeeRun", label: "RUT" },
    { key: "employeeName", label: "Empleado" },
    { key: "employeeArea", label: "Area" },
    { key: "eventType", label: "Accion", render: (row) => eventLabel(row.eventType) },
    { key: "terminalCode", label: "Terminal" },
    { key: "status", label: "Estado", render: (row) => <Badge tone={statusTone(row.status)}>{row.status}</Badge> },
    { key: "source", label: "Origen" },
    { key: "online", label: "Offline/Online", render: (row) => row.wasOffline ? "Offline" : "Online" },
    { key: "inputMethod", label: "Metodo" },
    { key: "timestamp", label: "Timestamp" },
  ];

  return (
    <div className="page-stack">
      <div className="page-title-row">
        <h2>Marcajes</h2>
        <button className="secondary-button" onClick={() => downloadCsv("cubo-marcajes.csv", rows)}><Download size={17} /> CSV</button>
      </div>
      <div className="filters-grid">
        {Object.keys(initialFilters).map((key) => (
          <input key={key} value={filters[key]} onChange={(e) => setFilters({ ...filters, [key]: e.target.value })} placeholder={key} type={key === "from" || key === "to" ? "date" : "text"} />
        ))}
        <button className="primary-button" onClick={load}>Filtrar</button>
      </div>
      {error && <div className="alert warning">{error}</div>}
      {loading ? <LoadingState /> : <DataTable rows={rows} columns={columns} />}
    </div>
  );
}
