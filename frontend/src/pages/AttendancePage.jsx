import { Save } from "lucide-react";
import { useState } from "react";
import { api } from "../api/client.js";
import { useFetch } from "../hooks/useFetch.js";

export default function AttendancePage() {
  const { data: records = [], reload } = useFetch("/attendance", []);
  const [reason, setReason] = useState("");

  async function correct(record) {
    if (!reason.trim()) return;
    await api(`/attendance/${record.id}/correct`, {
      method: "PUT",
      body: JSON.stringify({ status: "CORREGIDO", notes: record.notes || "", correctionReason: reason })
    });
    setReason("");
    reload();
  }

  return (
    <section>
      <h1 className="text-2xl font-semibold">Registro de asistencia</h1>
      <div className="mt-4 flex max-w-xl gap-3">
        <input className="field" placeholder="Motivo para correccion administrativa" value={reason} onChange={(event) => setReason(event.target.value)} />
      </div>
      <div className="mt-5 overflow-auto rounded-lg border border-slate-200 bg-white">
        <table className="table">
          <thead><tr><th>Fecha</th><th>Hora</th><th>Empleado</th><th>RUT</th><th>Tipo</th><th>Terminal</th><th>Sede</th><th>Estado</th><th></th></tr></thead>
          <tbody>{records.map((record) => <tr key={record.id}><td>{record.date?.slice(0, 10)}</td><td>{record.time}</td><td>{record.employee?.name}</td><td>{record.employee?.rut}</td><td>{record.type}</td><td>{record.terminal?.name}</td><td>{record.terminal?.branch}</td><td>{record.status}</td><td><button className="btn-secondary px-2" onClick={() => correct(record)} title="Corregir"><Save className="h-4 w-4" /></button></td></tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}
