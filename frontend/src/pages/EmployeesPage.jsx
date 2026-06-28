import { Edit, Plus, ToggleLeft, ToggleRight } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useFetch } from "../hooks/useFetch.js";

export default function EmployeesPage() {
  const { data: employees = [], reload } = useFetch("/employees", []);

  async function toggle(employee) {
    await api(`/employees/${employee.id}/${employee.active ? "deactivate" : "activate"}`, { method: "PATCH" });
    reload();
  }

  return (
    <section>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Empleados</h1>
        <Link className="btn-primary" to="/employees/new"><Plus className="h-4 w-4" /> Nuevo</Link>
      </div>
      <div className="mt-5 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="table">
          <thead><tr><th>Nombre</th><th>RUT</th><th>Cargo</th><th>Departamento</th><th>Turno</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee.id}>
                <td>{employee.name}<div className="text-xs text-slate-500">{employee.email}</div></td>
                <td>{employee.rut}</td>
                <td>{employee.position}</td>
                <td>{employee.department}</td>
                <td>{employee.shift?.name || "Sin turno"}</td>
                <td>{employee.active ? "Activo" : "Inactivo"}</td>
                <td className="flex gap-2">
                  <Link className="btn-secondary px-2" to={`/employees/${employee.id}/edit`} title="Editar"><Edit className="h-4 w-4" /></Link>
                  <button className="btn-secondary px-2" onClick={() => toggle(employee)} title="Activar o desactivar">{employee.active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
