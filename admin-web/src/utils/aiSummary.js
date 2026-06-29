export function buildAiSummary(attendance = []) {
  const total = attendance.length;
  const ingresos = attendance.filter((event) => event.eventType === "INGRESO").length;
  const observados = attendance.filter((event) => event.status === "OBSERVADO").length;
  const offline = attendance.filter((event) => event.wasOffline || event.status === "OFFLINE_SYNCED").length;

  if (!total) {
    return "Aun no hay eventos administrativos para resumir en el rango consultado.";
  }

  return `Hoy se registraron ${total} eventos de asistencia. La mayoria corresponde a ${ingresos} ingresos de turno. Existen ${observados} marcajes observados y ${offline} eventos sincronizados desde modo offline. Se recomienda revisar los casos observados antes del cierre diario.`;
}

export function summarizeBy(items, key) {
  return items.reduce((acc, item) => {
    const value = item[key] || "Sin dato";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}
