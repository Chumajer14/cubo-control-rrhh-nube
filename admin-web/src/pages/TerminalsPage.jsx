import { useEffect, useState } from "react";
import { createTerminal, fetchTerminals, updateTerminal, updateTerminalStatus } from "../api/terminalsApi.js";
import DataTable from "../components/DataTable.jsx";
import Badge from "../components/Badge.jsx";
import LoadingState from "../components/LoadingState.jsx";

const emptyTerminal = { terminalCode: "", name: "", branch: "", location: "", active: true };

export default function TerminalsPage() {
  const [form, setForm] = useState(emptyTerminal);
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    fetchTerminals()
      .then((payload) => setRows(payload.items || payload.terminals || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function submit(event) {
    event.preventDefault();
    if (editing) await updateTerminal(form.terminalCode, form);
    else await createTerminal(form);
    setForm(emptyTerminal);
    setEditing(false);
    load();
  }

  async function toggle(row) {
    await updateTerminalStatus(row.terminalCode, !row.active);
    load();
  }

  return (
    <div className="page-stack">
      <form className="content-band form-grid" onSubmit={submit}>
        <h2>{editing ? "Editar terminal" : "Nuevo terminal"}</h2>
        <label>Codigo<input value={form.terminalCode} disabled={editing} onChange={(e) => setForm({ ...form, terminalCode: e.target.value })} required /></label>
        <label>Nombre<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
        <label>Sede<input value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} /></label>
        <label>Ubicacion<input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></label>
        <label className="check-row"><input checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} type="checkbox" /> Activo</label>
        <button className="primary-button full">Guardar terminal</button>
      </form>
      {error && <div className="alert warning">{error}</div>}
      {loading ? <LoadingState /> : (
        <DataTable rows={rows} columns={[
          { key: "terminalCode", label: "Codigo" },
          { key: "name", label: "Nombre" },
          { key: "branch", label: "Sede" },
          { key: "location", label: "Ubicacion" },
          { key: "active", label: "Estado", render: (row) => <Badge tone={row.active ? "success" : "danger"}>{row.active ? "Activo" : "Inactivo"}</Badge> },
          { key: "actions", label: "Acciones", render: (row) => <div className="table-actions"><button onClick={() => { setForm(row); setEditing(true); }}>Editar</button><button onClick={() => toggle(row)}>{row.active ? "Desactivar" : "Activar"}</button></div> },
        ]} />
      )}
    </div>
  );
}
