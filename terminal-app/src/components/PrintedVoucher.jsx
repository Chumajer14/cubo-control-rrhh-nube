export default function PrintedVoucher({ voucher }) {
  if (!voucher) {
    return <div className="voucher-slot" aria-label="Salida de boucher" />;
  }

  return (
    <section className="printed-voucher" aria-label="Boucher impreso simulado">
      <div>CUBO CONTROL</div>
      <strong>BOUCHER IMPRESO</strong>
      <div>Empleado: {voucher.employeeName || "NO DISPONIBLE"}</div>
      <div>RUT: {voucher.run}</div>
      <div>Fecha: {voucher.localDate}</div>
      <div>Hora: {voucher.localTime}</div>
      <div>Accion: {voucher.eventType}</div>
      <div>Terminal: {voucher.terminalCode}</div>
      <div>Estado: {voucher.status}</div>
      {voucher.syncStatus ? <div>Sincronizacion: {voucher.syncStatus}</div> : null}
    </section>
  );
}
