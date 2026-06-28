import { Save } from "lucide-react";
import { useState } from "react";
import { api } from "../api/client.js";
import { useFetch } from "../hooks/useFetch.js";

const initial = { code: "", name: "", location: "", branch: "", status: "ACTIVE" };

export default function TerminalsPage() {
  const { data: terminals = [], reload } = useFetch("/terminals", []);
  const [form, setForm] = useState(initial);

  async function submit(event) {
    event.preventDefault();
    await api("/terminals", { method: "POST", body: JSON.stringify(form) });
    setForm(initial);
    reload();
  }

  return (
    <section>
      <h1 className="text-2xl font-semibold">Terminales</h1>
      <form onSubmit={submit} className="mt-5 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-6">
        {["code", "name", "location", "branch"].map((field) => <input key={field} className="field" placeholder={field} value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} />)}
        <select className="field" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option>ACTIVE</option><option>INACTIVE</option></select>
        <button className="btn-primary"><Save className="h-4 w-4" /> Crear</button>
      </form>
      <div className="mt-5 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="table">
          <thead><tr><th>Codigo</th><th>Nombre</th><th>Ubicacion</th><th>Sede</th><th>Estado</th><th>Ultimo uso</th><th></th></tr></thead>
          <tbody>{terminals.map((terminal) => <tr key={terminal.id}><td>{terminal.code}</td><td>{terminal.name}</td><td>{terminal.location}</td><td>{terminal.branch}</td><td>{terminal.status}</td><td>{terminal.lastUsedAt ? new Date(terminal.lastUsedAt).toLocaleString("es-CL") : "-"}</td><td><button className="btn-secondary" onClick={async () => { await api(`/terminals/${terminal.id}/status`, { method: "PATCH", body: JSON.stringify({ status: terminal.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" }) }); reload(); }}>Cambiar</button></td></tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}
