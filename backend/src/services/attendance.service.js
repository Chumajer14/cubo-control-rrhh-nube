import bcrypt from "bcrypt";
import { prisma } from "../config/prisma.js";
import { audit } from "../utils/audit.js";

function startOfDay(date = new Date()) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfDay(date = new Date()) {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

function currentTime() {
  return new Intl.DateTimeFormat("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Santiago"
  }).format(new Date());
}

function minutesFromTime(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function computeStatus(type, employee) {
  if (type !== "ENTRADA" || !employee.shift) return "VALIDO";
  const allowed = minutesFromTime(employee.shift.startTime) + employee.shift.toleranceMinutes;
  return minutesFromTime(currentTime()) > allowed ? "ATRASO" : "VALIDO";
}

export async function markAttendance({ terminalCode, rut, pin, type, req }) {
  const terminal = await prisma.terminal.findUnique({ where: { code: terminalCode } });
  if (!terminal || terminal.status !== "ACTIVE") {
    await audit({ action: "INVALID_ATTENDANCE_ATTEMPT", entity: "Terminal", entityId: terminalCode, detail: "Terminal inexistente o inactivo", req });
    const error = new Error("Terminal inexistente o inactivo.");
    error.status = 400;
    throw error;
  }

  const employee = await prisma.employee.findUnique({ where: { rut }, include: { shift: true } });
  const validPin = employee ? await bcrypt.compare(pin, employee.pinHash) : false;
  if (!employee || !employee.active || !validPin) {
    await audit({ action: "INVALID_ATTENDANCE_ATTEMPT", entity: "Employee", entityId: rut, detail: "Empleado inactivo, inexistente o PIN incorrecto", req });
    const error = new Error("Empleado no autorizado o PIN incorrecto.");
    error.status = 400;
    throw error;
  }

  const lastRecord = await prisma.attendanceRecord.findFirst({
    where: { employeeId: employee.id },
    orderBy: { createdAt: "desc" }
  });

  if (lastRecord?.type === type) {
    await audit({ action: "INVALID_ATTENDANCE_ATTEMPT", entity: "AttendanceRecord", entityId: employee.id, detail: `Marcaje consecutivo no permitido: ${type}`, req });
    const error = new Error(`No se permite registrar dos marcajes consecutivos de tipo ${type}.`);
    error.status = 409;
    throw error;
  }

  const now = new Date();
  const record = await prisma.attendanceRecord.create({
    data: {
      employeeId: employee.id,
      terminalId: terminal.id,
      type,
      date: startOfDay(now),
      time: currentTime(),
      status: computeStatus(type, employee)
    },
    include: { employee: true, terminal: true }
  });

  await prisma.terminal.update({ where: { id: terminal.id }, data: { lastUsedAt: now } });
  await audit({ action: "ATTENDANCE_MARKED", entity: "AttendanceRecord", entityId: record.id, detail: `${type} registrada para ${employee.rut}`, req });

  return {
    record,
    lastRecord
  };
}

export async function listAttendance(query) {
  const where = {};
  if (query.employeeId) where.employeeId = Number(query.employeeId);
  if (query.terminalId) where.terminalId = Number(query.terminalId);
  if (query.status) where.status = query.status;
  if (query.type) where.type = query.type;
  if (query.from || query.to || query.date) {
    where.date = {};
    if (query.date) {
      where.date.gte = startOfDay(query.date);
      where.date.lte = endOfDay(query.date);
    } else {
      if (query.from) where.date.gte = startOfDay(query.from);
      if (query.to) where.date.lte = endOfDay(query.to);
    }
  }

  return prisma.attendanceRecord.findMany({
    where,
    include: { employee: { select: { id: true, rut: true, name: true } }, terminal: true, correctedBy: { select: { id: true, name: true, role: true } } },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }]
  });
}

export async function todayAttendance() {
  return listAttendance({ from: new Date(), to: new Date() });
}

export async function correctAttendance(id, data, user, req) {
  const record = await prisma.attendanceRecord.update({
    where: { id: Number(id) },
    data: {
      status: data.status,
      notes: data.notes,
      correctionReason: data.correctionReason,
      correctedById: user.id
    },
    include: { employee: true, terminal: true }
  });

  await audit({
    userId: user.id,
    action: "ATTENDANCE_CORRECTED",
    entity: "AttendanceRecord",
    entityId: record.id,
    detail: data.correctionReason,
    req
  });

  return record;
}

export const dateHelpers = { startOfDay, endOfDay };
