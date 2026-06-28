import { Download } from "lucide-react";
import { useState } from "react";
import { csvUrl, getToken } from "../api/client.js";

export default function ReportsPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  function download() {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const token = getToken();
    fetch(csvUrl(`?${params}`), { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => response.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "cubo-asistencia.csv";
        link.click();
        URL.revokeObjectURL(url);
      });
  }

  return (
    <section className="max-w-3xl">
      <h1 className="text-2xl font-semibold">Reportes CSV</h1>
      <div className="mt-5 grid gap-3 rounded-lg border border-slate-200 bg-white p-5 sm:grid-cols-3">
        <label className="text-sm font-medium">Desde<input className="field mt-1" type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label>
        <label className="text-sm font-medium">Hasta<input className="field mt-1" type="date" value={to} onChange={(event) => setTo(event.target.value)} /></label>
        <button className="btn-primary self-end" onClick={download}><Download className="h-4 w-4" /> Exportar</button>
      </div>
    </section>
  );
}
