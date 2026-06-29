export const eventLabel = (value) => ({
  INGRESO: "Ingreso",
  SALIDA: "Salida",
  VALE_ALMUERZO: "Vale colacion",
  INICIO_ALMUERZO: "Inicio colacion",
  FIN_ALMUERZO: "Fin colacion",
}[value] || value || "-");

export const statusTone = (status) => {
  if (["VALIDO", "ACTIVE", true].includes(status)) return "success";
  if (["OBSERVADO", "OFFLINE_SYNCED"].includes(status)) return "warning";
  if (["RECHAZADO", "INACTIVE", false].includes(status)) return "danger";
  return "neutral";
};
