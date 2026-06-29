import { useEffect, useState } from "react";
import { fetchDashboard } from "../api/dashboardApi.js";
import { fetchAttendance } from "../api/attendanceApi.js";
import { fetchTerminals } from "../api/terminalsApi.js";
import DataTable from "../components/DataTable.jsx";
import LoadingState from "../components/LoadingState.jsx";
import Badge from "../components/Badge.jsx";
import MetricCard from "../components/dashboard/MetricCard.jsx";
import WorkdayTable from "../components/dashboard/WorkdayTable.jsx";
import LunchAnalysisTable from "../components/dashboard/LunchAnalysisTable.jsx";
import AlertList from "../components/dashboard/AlertList.jsx";
import AiRagPanel from "../components/dashboard/AiRagPanel.jsx";
import TerminalHealthPanel from "../components/dashboard/TerminalHealthPanel.jsx";
import { buildMockRagInsights } from "../services/mockRagService.js";
import { buildDashboardAnalytics } from "../utils/attendanceAnalytics.js";
import { formatDateTime } from "../utils/dateTime.js";
import { eventLabel, statusTone } from "../utils/formatters.js";

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [terminals, setTerminals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([fetchDashboard(), fetchAttendance({ limit: 500 }), fetchTerminals()])
      .then(([summary, events, terminalResult]) => {
        setDashboard(summary);
        setAttendance(events.items || events.attendance || []);
        setTerminals(terminalResult.items || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;

  const analytics = buildDashboardAnalytics({ dashboard, attendance, terminals });
  const metrics = analytics.summary;
  const latest = analytics.latestAttendance;
  const rag = dashboard?.ragMock || buildMockRagInsights(analytics);

  return (
    <div className="page-stack">
      {error && <div className="alert warning">API: {error}</div>}
      <section className="dashboard-section">
        <h2>Resumen del dia</h2>
        <div className="stats-grid compact">
          <MetricCard label="Empleados activos" value={metrics.activeEmployees} />
          <MetricCard label="Marcajes hoy" value={metrics.marksToday} tone="teal" />
          <MetricCard label="Ingresos" value={metrics.entries} />
          <MetricCard label="Salidas" value={metrics.exits} />
          <MetricCard label="Atrasos" value={metrics.lateCount} tone="amber" />
          <MetricCard label="Offline sincronizados" value={metrics.offlineSynced} tone="teal" />
        </div>
      </section>

      <section className="dashboard-section">
        <h2>Jornada laboral</h2>
        <div className="stats-grid compact">
          <MetricCard label="Horas trabajadas hoy" value={metrics.workedHoursTotalMinutes} />
          <MetricCard label="Promedio horas trabajadas" value={metrics.workedHoursAverageMinutes} />
          <MetricCard label="Empleados sin salida" value={metrics.missingExitCount} tone="red" />
          <MetricCard label="Jornadas incompletas" value={metrics.incompleteShiftCount} tone="amber" />
        </div>
      </section>

      <section className="dashboard-section">
        <h2>Colacion</h2>
        <div className="stats-grid compact">
          <MetricCard label="Colaciones activas" value={metrics.activeLunches} tone="amber" />
          <MetricCard label="Promedio duracion colacion" value={metrics.averageLunchMinutes} detail="Minutos promedio" />
          <MetricCard label="Colaciones sobre 60 minutos" value={metrics.extendedLunchCount} tone="red" />
          <MetricCard label="Eventos observados" value={metrics.observedEvents} tone="amber" />
        </div>
      </section>

      <section className="dashboard-section">
        <h2>Alertas y terminales</h2>
        <div className="stats-grid compact">
          <MetricCard label="Terminales activos" value={metrics.activeTerminals} />
          <MetricCard label="Terminales sin actividad" value={metrics.terminalNoActivityCount} tone="amber" />
          <MetricCard label="Pendientes/rechazados" value={metrics.pendingOrRejected} tone="red" />
          <MetricCard label="Alertas criticas" value={metrics.criticalAlerts} tone="red" />
        </div>
      </section>

      <section className="content-band">
        <div className="section-heading">
          <h2>Control de jornada</h2>
        </div>
        <WorkdayTable rows={analytics.employeeWorkday} />
      </section>

      <section className="content-band">
        <div className="section-heading">
          <h2>Colaciones y pausas</h2>
        </div>
        <LunchAnalysisTable rows={analytics.lunchAnalysis} />
      </section>

      <section className="content-band">
        <div className="section-heading">
          <h2>Alertas operativas</h2>
        </div>
        <AlertList alerts={analytics.alerts} />
      </section>

      <AiRagPanel rag={rag} />

      <section className="content-band">
        <div className="section-heading">
          <h2>Salud de terminales</h2>
        </div>
        <TerminalHealthPanel rows={analytics.terminalHealth} />
      </section>

      <section className="content-band">
        <div className="section-heading">
          <h2>Ultimos eventos relevantes</h2>
        </div>
        <DataTable
          rows={analytics.relevantEvents}
          emptyText="Sin eventos relevantes recientes"
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

      <section className="content-band">
        <div className="section-heading">
          <h2>Ultimos marcajes</h2>
        </div>
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
