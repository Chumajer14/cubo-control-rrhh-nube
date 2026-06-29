export const eventLabel = (value) => ({
  INGRESO: "Ingreso",
  SALIDA: "Salida",
  VALE_COLACION: "Vale colacion",
  INICIO_COLACION: "Inicio colacion",
  FIN_COLACION: "Fin colacion",
  VALE_ALMUERZO: "Vale colacion",
  INICIO_ALMUERZO: "Inicio colacion",
  FIN_ALMUERZO: "Fin colacion",
}[value] || value || "-");

export const statusTone = (status) => {
  if (["VALIDO", "ACTIVE", "ONLINE", "JORNADA_COMPLETA", "NORMAL", true].includes(status)) return "success";
  if (["OBSERVADO", "OFFLINE_SYNCED", "EN_COLACION", "COLACION_EXTENDIDA", "DEGRADADO", "COLACION_BREVE"].includes(status)) return "warning";
  if (["RECHAZADO", "INACTIVE", "SIN_SALIDA", "OFFLINE", "REQUIERE_REVISION", "COLACION_ABIERTA", false].includes(status)) return "danger";
  if (["EN_TURNO", "SIN_ACTIVIDAD", "VALE_SIN_USO_REGISTRADO"].includes(status)) return "info";
  return "neutral";
};

export const severityTone = (severity) => {
  if (["CRITICAL", "HIGH", "ALTO"].includes(severity)) return "danger";
  if (["MEDIUM", "MEDIO"].includes(severity)) return "warning";
  if (["LOW", "INFO", "BAJO"].includes(severity)) return "info";
  return "neutral";
};
