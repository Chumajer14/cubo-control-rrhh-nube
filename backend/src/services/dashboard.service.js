import { prisma } from "../config/prisma.js";
import { dateHelpers } from "./attendance.service.js";

export async function dashboardSummary() {
  const todayStart = dateHelpers.startOfDay();
  const todayEnd = dateHelpers.endOfDay();
  const [activeEmployees, entries, delays, recordsToday, observed] = await Promise.all([
    prisma.employee.count({ where: { active: true } }),
    prisma.attendanceRecord.groupBy({
      by: ["employeeId"],
      where: { type: "ENTRADA", date: { gte: todayStart, lte: todayEnd } }
    }),
    prisma.attendanceRecord.count({ where: { status: "ATRASO", date: { gte: todayStart, lte: todayEnd } } }),
    prisma.attendanceRecord.count({ where: { date: { gte: todayStart, lte: todayEnd } } }),
    prisma.attendanceRecord.count({ where: { status: "OBSERVADO", date: { gte: todayStart, lte: todayEnd } } })
  ]);

  const presentToday = entries.length;
  const estimatedAbsent = Math.max(activeEmployees - presentToday, 0);

  return {
    activeEmployees,
    presentToday,
    estimatedAbsent,
    delaysToday: delays,
    recordsToday,
    observations: observed
  };
}

export async function aiSummary() {
  const summary = await dashboardSummary();
  const text = `Hoy se registran ${summary.activeEmployees} empleados activos. ${summary.presentToday} marcaron entrada, ${summary.delaysToday} presentan atraso y ${summary.observations} registros quedaron observados. Se recomienda revisar incidencias antes del cierre diario.`;

  return {
    text,
    disclaimer: "Resumen educativo simulado para apoyo administrativo; no toma decisiones laborales automaticas."
  };
}
