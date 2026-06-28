import { Save, ToggleLeft } from "lucide-react";
import { useState } from "react";
import { api } from "../api/client.js";
import { useFetch } from "../hooks/useFetch.js";

const initial = { name: "", startTime: "08:30", endTime: "17:30", toleranceMinutes: 10 };

export default function ShiftsPage() {
  const { data: shifts = [], reload } = useFetch("/shifts", []);
  const [form, setForm] = useState(initial);

  async function submit(event) {
    event.preventDefault();
    await api("/shifts", { method: "POST", body: JSON.stringify({ ...form, toleranceMinutes: Number(form.toleranceMinutes) }) });
    setForm(initial);
    reload();
  }

  return (
    <section>
      <h1 className="text-2xl font-semibold">Turnos</h1>
      <form onSubmit={submit} className="mt-5 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-5">
        <input className="field" placeholder="Nombre" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <input className="field" type="time" value={form.startTime} onChange={(event) => setForm({ ...form, startTime: event.target.value })} />
        <input className="field" type="time" value={form.endTime} onChange={(event) => setForm({ ...form, endTime: event.target.value })} />
        <input className="field" type="number" value={form.toleranceMinutes} onChange={(event) => setForm({ ...form, toleranceMinutes: event.target.value })} />
        <button className="btn-primary"><Save className="h-4 w-4" /> Crear</button>
      </form>
      <div className="mt-5 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="table">
          <thead><tr><th>Nombre</th><th>Entrada</th><th>Salida</th><th>Tolerancia</th><th>Estado</th><th></th></tr></thead>
          <tbody>{shifts.map((shift) => <tr key={shift.id}><td>{shift.name}</td><td>{shift.startTime}</td><td>{shift.endTime}</td><td>{shift.toleranceMinutes} min</td><td>{shift.active ? "Activo" : "Inactivo"}</td><td><button className="btn-secondary px-2" onClick={async () => { await api(`/shifts/${shift.id}/deactivate`, { method: "PATCH" }); reload(); }}><ToggleLeft className="h-4 w-4" /></button></td></tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}
