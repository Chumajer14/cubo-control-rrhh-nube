import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createEmployee, updateEmployee } from "../api/employeesApi.js";

const RUN_PATTERN = /^[0-9]{7,8}-[0-9kK]$/;

export default function EmployeeFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ employeeRun: id || "", name: "", area: "", role: "", email: "", active: true, pin: "" });
  const [error, setError] = useState("");

  function update(key, value) {
    setForm({ ...form, [key]: value });
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (!RUN_PATTERN.test(form.employeeRun)) {
      setError("RUT invalido. Use formato 12345678-5.");
      return;
    }
    try {
      if (id) {
        await updateEmployee(id, form);
      } else {
        await createEmployee(form);
      }
      navigate("/employees");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form className="content-band form-grid" onSubmit={submit}>
      <h2>{id ? "Editar empleado" : "Nuevo empleado"}</h2>
      {error && <div className="alert danger full">{error}</div>}
      <label>RUT<input value={form.employeeRun} disabled={Boolean(id)} onChange={(e) => update("employeeRun", e.target.value)} required /></label>
      <label>Nombre<input value={form.name} onChange={(e) => update("name", e.target.value)} required /></label>
      <label>Area<input value={form.area} onChange={(e) => update("area", e.target.value)} required /></label>
      <label>Cargo<input value={form.role} onChange={(e) => update("role", e.target.value)} /></label>
      <label>Email<input value={form.email} onChange={(e) => update("email", e.target.value)} type="email" /></label>
      <label>PIN inicial/cambio<input value={form.pin} onChange={(e) => update("pin", e.target.value)} type="password" /></label>
      <label className="check-row"><input checked={form.active} onChange={(e) => update("active", e.target.checked)} type="checkbox" /> Activo</label>
      <button className="primary-button full">Guardar</button>
    </form>
  );
}
