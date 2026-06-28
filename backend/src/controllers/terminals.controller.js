import { prisma } from "../config/prisma.js";
import { audit } from "../utils/audit.js";

export async function listTerminals(req, res) {
  res.json(await prisma.terminal.findMany({ orderBy: { code: "asc" } }));
}

export async function getTerminalByCode(req, res) {
  const terminal = await prisma.terminal.findUnique({ where: { code: req.params.code } });
  if (!terminal) return res.status(404).json({ message: "Terminal no encontrado." });
  res.json(terminal);
}

export async function createTerminal(req, res) {
  const terminal = await prisma.terminal.create({ data: req.body });
  await audit({ userId: req.user.id, action: "TERMINAL_CREATED", entity: "Terminal", entityId: terminal.id, detail: `Terminal creado: ${terminal.code}`, req });
  res.status(201).json(terminal);
}

export async function updateTerminal(req, res) {
  const terminal = await prisma.terminal.update({ where: { id: Number(req.params.id) }, data: req.body });
  await audit({ userId: req.user.id, action: "TERMINAL_UPDATED", entity: "Terminal", entityId: terminal.id, detail: `Terminal actualizado: ${terminal.code}`, req });
  res.json(terminal);
}

export async function updateTerminalStatus(req, res) {
  const terminal = await prisma.terminal.update({ where: { id: Number(req.params.id) }, data: { status: req.body.status } });
  await audit({ userId: req.user.id, action: "TERMINAL_STATUS_UPDATED", entity: "Terminal", entityId: terminal.id, detail: `Estado terminal: ${terminal.status}`, req });
  res.json(terminal);
}
