import { useState } from "react";
import { Download } from "lucide-react";
import { fetchAttendance } from "../api/attendanceApi.js";
import DataTable from "../components/DataTable.jsx";
import StatCard from "../components/StatCard.jsx";
import { downloadCsv } from "../utils/csvExport.js";
import { summarizeBy } from "../utils/aiSummary.js";

export default function ReportsPage() {
  const [filters, setFilters] = useState({ from: "", to: "" });
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      const payload = await fetchAttendance(filters);
      setRows(payload.items || payload.attendance || []);
    } catch (err) {
      setError(err.message);
    }
  }

  const byEmployee = summarizeBy(rows, "employeeRun");
  const byType = summarizeBy(rows, "eventType");
  const byTerminal = summarizeBy(rows, "terminalCode");

  return (
    <div className="page-stack">
      <div className="page-title-row">
        <h2>Reportes</h2>
        <button className="secondary-button" onClick={() => downloadCsv("cubo-reporte-asistencia.csv", rows)}><Download size={17} /> Descargar CSV</button>
      </div>
      <div className="filters-grid compact">
        <input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
        <input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
        <button className="primary-button" onClick={load}>Consultar</button>
      </div>
      {error && <div className="alert warning">{error}</div>}
      <div className="stats-grid three">
        <StatCard label="Eventos consultados" value={rows.length} />
        <StatCard label="Empleados con eventos" value={Object.keys(byEmployee).length} tone="teal" />
        <StatCard label="Terminales usados" value={Object.keys(byTerminal).length} />
      </div>
      <section className="content-band">
        <h2>Resumen por tipo</h2>
        <DataTable rows={Object.entries(byType).map(([type, total]) => ({ type, total }))} columns={[{ key: "type", label: "Tipo" }, { key: "total", label: "Total" }]} />
      </section>
      <section className="content-band">
        <h2>Resumen por terminal</h2>
        <DataTable rows={Object.entries(byTerminal).map(([terminal, total]) => ({ terminal, total }))} columns={[{ key: "terminal", label: "Terminal" }, { key: "total", label: "Total" }]} />
      </section>
    </div>
  );
}
