import { useEffect, useState } from "react";
import { fetchAuditLogs } from "../api/auditApi.js";
import DataTable from "../components/DataTable.jsx";
import LoadingState from "../components/LoadingState.jsx";
import { formatDateTime } from "../utils/dateTime.js";

export default function AuditPage() {
  const [filters, setFilters] = useState({ date: "", action: "", entity: "", source: "" });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    fetchAuditLogs(filters)
      .then((payload) => setRows(payload.items || payload.logs || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="page-stack">
      <h2>Auditoria</h2>
      <div className="filters-grid compact">
        <input type="date" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })} />
        <input placeholder="Accion" value={filters.action} onChange={(e) => setFilters({ ...filters, action: e.target.value })} />
        <input placeholder="Entidad" value={filters.entity} onChange={(e) => setFilters({ ...filters, entity: e.target.value })} />
        <input placeholder="Fuente" value={filters.source} onChange={(e) => setFilters({ ...filters, source: e.target.value })} />
        <button className="primary-button" onClick={load}>Filtrar</button>
      </div>
      {error && <div className="alert warning">{error}</div>}
      {loading ? <LoadingState /> : (
        <DataTable rows={rows} columns={[
          { key: "timestamp", label: "Fecha", render: (row) => formatDateTime(row.timestamp) },
          { key: "action", label: "Accion" },
          { key: "entity", label: "Entidad" },
          { key: "detail", label: "Detalle" },
          { key: "source", label: "Fuente" },
          { key: "user", label: "Usuario" },
          { key: "terminalCode", label: "Terminal" },
        ]} />
      )}
    </div>
  );
}
