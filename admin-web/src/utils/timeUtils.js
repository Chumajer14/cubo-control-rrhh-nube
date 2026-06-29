export function parseDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

export function minutesBetween(start, end) {
  const startDate = parseDate(start);
  const endDate = parseDate(end);
  if (!startDate || !endDate || endDate < startDate) return 0;
  return Math.round((endDate.getTime() - startDate.getTime()) / 60000);
}

export function formatTime(value) {
  const date = parseDate(value);
  if (!date) return "-";
  return new Intl.DateTimeFormat("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatMinutes(totalMinutes) {
  const minutes = Math.max(0, Number(totalMinutes || 0));
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) return `${remainder}m`;
  if (!remainder) return `${hours}h`;
  return `${hours}h ${remainder}m`;
}

export function isToday(value) {
  const date = parseDate(value);
  if (!date) return false;
  return date.toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10);
}
