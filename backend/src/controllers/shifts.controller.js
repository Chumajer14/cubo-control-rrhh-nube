import { prisma } from "../config/prisma.js";
import { audit } from "../utils/audit.js";

export async function listShifts(req, res) {
  const shifts = await prisma.shift.findMany({ orderBy: { name: "asc" } });
  res.json(shifts);
}

export async function createShift(req, res) {
  const shift = await prisma.shift.create({ data: req.body });
  await audit({ userId: req.user.id, action: "SHIFT_CREATED", entity: "Shift", entityId: shift.id, detail: `Turno creado: ${shift.name}`, req });
  res.status(201).json(shift);
}

export async function updateShift(req, res) {
  const shift = await prisma.shift.update({ where: { id: Number(req.params.id) }, data: req.body });
  await audit({ userId: req.user.id, action: "SHIFT_UPDATED", entity: "Shift", entityId: shift.id, detail: `Turno actualizado: ${shift.name}`, req });
  res.json(shift);
}

export async function deactivateShift(req, res) {
  const shift = await prisma.shift.update({ where: { id: Number(req.params.id) }, data: { active: false } });
  res.json(shift);
}
