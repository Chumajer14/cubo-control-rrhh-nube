export function formatDateTime(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}
