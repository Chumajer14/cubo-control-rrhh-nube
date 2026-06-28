import { useFetch } from "../hooks/useFetch.js";

export default function AuditPage() {
  const { data: logs = [] } = useFetch("/audit-logs", []);

  return (
    <section>
      <h1 className="text-2xl font-semibold">Auditoria</h1>
      <div className="mt-5 overflow-auto rounded-lg border border-slate-200 bg-white">
        <table className="table">
          <thead><tr><th>Fecha</th><th>Usuario</th><th>Accion</th><th>Entidad</th><th>Detalle</th></tr></thead>
          <tbody>{logs.map((log) => <tr key={log.id}><td>{new Date(log.createdAt).toLocaleString("es-CL")}</td><td>{log.user?.email || "Sistema"}</td><td>{log.action}</td><td>{log.entity}</td><td>{log.detail}</td></tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}
