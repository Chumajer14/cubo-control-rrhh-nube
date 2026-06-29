export default function ConnectionStatus({ status, pendingCount }) {
  const apiActive = status === "ONLINE" || status === "LOCAL_MOCK" || status === "SYNCING";
  const offlineActive = status === "OFFLINE";
  const pendingActive = pendingCount > 0 || status === "SYNCING";

  return (
    <div className="connection-status" aria-label="Estado de conexion">
      <span className="status-indicator">
        <span className={`status-dot ${apiActive ? "status-dot-online" : ""}`} />
        API
      </span>
      <span className="status-indicator">
        <span className={`status-dot ${offlineActive ? "status-dot-offline" : ""}`} />
        OFF
      </span>
      <span className="status-indicator">
        <span className={`status-dot ${pendingActive ? "status-dot-pending" : ""}`} />
        PEND
      </span>
    </div>
  );
}
