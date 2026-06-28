import { z } from "zod";

const timeSchema = z.string().regex(/^\d{2}:\d{2}$/, "Formato esperado HH:mm");

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const employeeSchema = z.object({
  rut: z.string().min(7),
  name: z.string().min(2),
  email: z.string().email(),
  position: z.string().min(2),
  department: z.string().min(2),
  shiftId: z.coerce.number().int().positive().optional().nullable(),
  pin: z.string().min(4).max(12).optional(),
  active: z.boolean().optional()
});

export const shiftSchema = z.object({
  name: z.string().min(3),
  startTime: timeSchema,
  endTime: timeSchema,
  toleranceMinutes: z.coerce.number().int().min(0).max(120),
  active: z.boolean().optional()
});

export const terminalSchema = z.object({
  code: z.string().min(3),
  name: z.string().min(3),
  location: z.string().min(2),
  branch: z.string().min(2),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional()
});

export const terminalStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE"])
});

export const markAttendanceSchema = z.object({
  terminalCode: z.string().min(3),
  rut: z.string().min(7),
  pin: z.string().min(4),
  type: z.enum(["ENTRADA", "SALIDA"])
});

export const correctionSchema = z.object({
  status: z.enum(["VALIDO", "ATRASO", "OBSERVADO", "CORREGIDO"]),
  notes: z.string().optional(),
  correctionReason: z.string().min(5)
});
