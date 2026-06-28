import bcrypt from "bcrypt";
import { prisma } from "../config/prisma.js";
import { audit } from "../utils/audit.js";
import { sanitizeEmployee } from "../utils/sanitize.js";

const includeShift = { shift: true };

export async function listEmployees(req, res) {
  const search = req.query.search;
  const employees = await prisma.employee.findMany({
    where: search
      ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { rut: { contains: search, mode: "insensitive" } }] }
      : undefined,
    include: includeShift,
    orderBy: { name: "asc" }
  });
  res.json(employees.map(sanitizeEmployee));
}

export async function getEmployee(req, res) {
  const employee = await prisma.employee.findUnique({ where: { id: Number(req.params.id) }, include: includeShift });
  if (!employee) return res.status(404).json({ message: "Empleado no encontrado." });
  res.json(sanitizeEmployee(employee));
}

export async function createEmployee(req, res) {
  const { pin = "1234", ...data } = req.body;
  const employee = await prisma.employee.create({
    data: { ...data, pinHash: await bcrypt.hash(pin, 10) },
    include: includeShift
  });
  await audit({ userId: req.user.id, action: "EMPLOYEE_CREATED", entity: "Employee", entityId: employee.id, detail: `Empleado creado: ${employee.rut}`, req });
  res.status(201).json(sanitizeEmployee(employee));
}

export async function updateEmployee(req, res) {
  const { pin, ...data } = req.body;
  const updateData = { ...data };
  if (pin) updateData.pinHash = await bcrypt.hash(pin, 10);

  const employee = await prisma.employee.update({ where: { id: Number(req.params.id) }, data: updateData, include: includeShift });
  await audit({ userId: req.user.id, action: "EMPLOYEE_UPDATED", entity: "Employee", entityId: employee.id, detail: `Empleado actualizado: ${employee.rut}`, req });
  res.json(sanitizeEmployee(employee));
}

export async function setEmployeeActive(req, res) {
  const active = req.path.endsWith("/activate");
  const employee = await prisma.employee.update({ where: { id: Number(req.params.id) }, data: { active }, include: includeShift });
  await audit({ userId: req.user.id, action: active ? "EMPLOYEE_ACTIVATED" : "EMPLOYEE_DEACTIVATED", entity: "Employee", entityId: employee.id, detail: `Estado activo=${active}`, req });
  res.json(sanitizeEmployee(employee));
}
