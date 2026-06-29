import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { fetchEmployees, updateEmployeeStatus } from "../api/employeesApi.js";
import DataTable from "../components/DataTable.jsx";
import Badge from "../components/Badge.jsx";
import LoadingState from "../components/LoadingState.jsx";

export default function EmployeesPage() {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    fetchEmployees({ query })
      .then((payload) => setRows(payload.items || payload.employees || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function toggleStatus(row) {
    await updateEmployeeStatus(row.employeeRun, !row.active);
    load();
  }

  return (
    <div className="page-stack">
      <div className="page-title-row">
        <h2>Empleados</h2>
        <Link className="primary-button" to="/employees/new"><Plus size={17} /> Nuevo</Link>
      </div>
      <div className="filters-grid compact">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por RUT o nombre" />
        <button className="primary-button" onClick={load}>Buscar</button>
      </div>
      {error && <div className="alert warning">{error}</div>}
      {loading ? <LoadingState /> : (
        <DataTable rows={rows} columns={[
          { key: "employeeRun", label: "RUT" },
          { key: "name", label: "Nombre" },
          { key: "area", label: "Area" },
          { key: "role", label: "Cargo" },
          { key: "email", label: "Email" },
          { key: "active", label: "Estado", render: (row) => <Badge tone={row.active ? "success" : "danger"}>{row.active ? "Activo" : "Inactivo"}</Badge> },
          { key: "actions", label: "Acciones", render: (row) => <div className="table-actions"><Link to={`/employees/${encodeURIComponent(row.employeeRun)}/edit`}>Editar</Link><button onClick={() => toggleStatus(row)}>{row.active ? "Desactivar" : "Activar"}</button></div> },
        ]} />
      )}
    </div>
  );
}
