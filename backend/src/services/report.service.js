import { listAttendance } from "./attendance.service.js";
import { audit } from "../utils/audit.js";

function csvEscape(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export async function attendanceCsv(query, user, req) {
  const records = await listAttendance(query);
  const headers = ["Empleado", "RUT", "Fecha", "Entrada", "Salida", "Horas trabajadas aproximadas", "Estado", "Terminal", "Sede"];
  const grouped = new Map();

  for (const record of records) {
    const key = `${record.employeeId}-${record.date.toISOString().slice(0, 10)}`;
    const current = grouped.get(key) || { employee: record.employee, terminal: record.terminal, date: record.date, entrada: "", salida: "", status: record.status };
    if (record.type === "ENTRADA") current.entrada = record.time;
    if (record.type === "SALIDA") current.salida = record.time;
    if (record.status !== "VALIDO") current.status = record.status;
    grouped.set(key, current);
  }

  const rows = [...grouped.values()].map((row) => {
    const hours = row.entrada && row.salida ? approximateHours(row.entrada, row.salida) : "";
    return [
      row.employee.name,
      row.employee.rut,
      row.date.toISOString().slice(0, 10),
      row.entrada,
      row.salida,
      hours,
      row.status,
      row.terminal.name,
      row.terminal.branch
    ].map(csvEscape).join(",");
  });

  await audit({ userId: user.id, action: "REPORT_EXPORTED", entity: "AttendanceRecord", detail: "Exportacion CSV de asistencia", req });
  return [headers.map(csvEscape).join(","), ...rows].join("\n");
}

function approximateHours(start, end) {
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  const minutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
  return Math.max(minutes / 60, 0).toFixed(2);
}
