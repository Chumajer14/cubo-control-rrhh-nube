import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client.js";
import { useFetch } from "../hooks/useFetch.js";

const empty = { rut: "", name: "", email: "", position: "", department: "", shiftId: "", pin: "" };

export default function EmployeeFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const { data: shifts = [] } = useFetch("/shifts", []);

  useEffect(() => {
    if (id) api(`/employees/${id}`).then((employee) => setForm({ ...employee, shiftId: employee.shiftId || "", pin: "" }));
  }, [id]);

  function setField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    const payload = { ...form, shiftId: form.shiftId ? Number(form.shiftId) : null };
    if (!payload.pin) delete payload.pin;
    await api(id ? `/employees/${id}` : "/employees", { method: id ? "PUT" : "POST", body: JSON.stringify(payload) });
    navigate("/employees");
  }

  return (
    <section className="max-w-3xl">
      <h1 className="text-2xl font-semibold">{id ? "Editar empleado" : "Nuevo empleado"}</h1>
      <form className="mt-5 grid gap-4 rounded-lg border border-slate-200 bg-white p-5 md:grid-cols-2" onSubmit={submit}>
        {["rut", "name", "email", "position", "department"].map((field) => (
          <label key={field} className="text-sm font-medium capitalize">{field}<input className="field mt-1" value={form[field] || ""} onChange={(event) => setField(field, event.target.value)} /></label>
        ))}
        <label className="text-sm font-medium">Turno<select className="field mt-1" value={form.shiftId || ""} onChange={(event) => setField("shiftId", event.target.value)}><option value="">Sin turno</option>{shifts.map((shift) => <option key={shift.id} value={shift.id}>{shift.name}</option>)}</select></label>
        <label className="text-sm font-medium">PIN<input className="field mt-1" type="password" value={form.pin || ""} onChange={(event) => setField("pin", event.target.value)} placeholder={id ? "Mantener actual" : "1234"} /></label>
        <button className="btn-primary md:col-span-2"><Save className="h-4 w-4" /> Guardar</button>
      </form>
    </section>
  );
}
