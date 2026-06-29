import { useEffect, useState } from "react";
import { fetchDashboard } from "../api/dashboardApi.js";
import { fetchAttendance } from "../api/attendanceApi.js";
import StatCard from "../components/StatCard.jsx";
import DataTable from "../components/DataTable.jsx";
import LoadingState from "../components/LoadingState.jsx";
import Badge from "../components/Badge.jsx";
import { buildAiSummary } from "../utils/aiSummary.js";
import { formatDateTime } from "../utils/dateTime.js";
import { eventLabel, statusTone } from "../utils/formatters.js";

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([fetchDashboard(), fetchAttendance({ limit: 10 })])
      .then(([summary, events]) => {
        setDashboard(summary);
        setAttendance(events.items || events.attendance || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;

  const metrics = dashboard?.metrics || {};
  const latest = dashboard?.latestAttendance || attendance;

  return (
    <div className="page-stack">
      {error && <div className="alert warning">API: {error}</div>}
      <div className="stats-grid">
        <StatCard label="Empleados activos" value={metrics.activeEmployees} />
        <StatCard label="Marcajes hoy" value={metrics.todayEvents || latest.length} tone="teal" />
        <StatCard label="Ingresos" value={metrics.todayEntries} />
        <StatCard label="Salidas" value={metrics.todayExits} />
        <StatCard label="Atrasos" value={metrics.lateEvents} tone="amber" />
        <StatCard label="Offline sincronizados" value={metrics.offlineSynced} tone="teal" />
        <StatCard label="Terminales activos" value={metrics.activeTerminals} />
        <StatCard label="Pendientes/rechazados" value={metrics.pendingOrRejected} tone="red" />
      </div>

      <section className="content-band">
        <h2>Resumen asistido</h2>
        <p className="ai-summary">{dashboard?.aiSummary || buildAiSummary(latest)}</p>
      </section>

      <section className="content-band">
        <h2>Ultimos marcajes</h2>
        <DataTable
          rows={latest}
          columns={[
            { key: "timestamp", label: "Fecha y hora", render: (row) => formatDateTime(row.timestamp) },
            { key: "employeeRun", label: "RUT" },
            { key: "employeeName", label: "Empleado" },
            { key: "eventType", label: "Accion", render: (row) => eventLabel(row.eventType) },
            { key: "terminalCode", label: "Terminal" },
            { key: "status", label: "Estado", render: (row) => <Badge tone={statusTone(row.status)}>{row.status}</Badge> },
          ]}
        />
      </section>
    </div>
  );
}
