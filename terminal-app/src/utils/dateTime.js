export function padTime(value) {
  return String(value).padStart(2, "0");
}

export function formatClock(date = new Date()) {
  return `${padTime(date.getHours())}:${padTime(date.getMinutes())}:${padTime(date.getSeconds())}`;
}

export function formatLocalDate(date = new Date()) {
  return `${date.getFullYear()}-${padTime(date.getMonth() + 1)}-${padTime(date.getDate())}`;
}

export function createTimestampParts(date = new Date()) {
  return {
    timestamp: date.toISOString(),
    localDate: formatLocalDate(date),
    localTime: formatClock(date)
  };
}

export function formatEventDateTime(event) {
  return `${event.localDate} ${event.localTime}`;
}
