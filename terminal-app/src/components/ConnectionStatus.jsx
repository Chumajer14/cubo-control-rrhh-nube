export default function ConnectionStatus({ status, pendingCount }) {
  const statusLabel = status === "SYNCING" ? "SINCRONIZANDO" : status;

  return (
    <div className="connection-status" aria-label="Estado de conexion">
      <span className={`status-dot status-dot-${String(status).toLowerCase()}`} />
      <span>{statusLabel}</span>
      <span>PENDIENTES: {pendingCount}</span>
    </div>
  );
}
