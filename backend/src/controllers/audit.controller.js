import { prisma } from "../config/prisma.js";

export async function listAuditLogs(req, res) {
  const where = {};
  if (req.query.action) where.action = { contains: req.query.action, mode: "insensitive" };
  if (req.query.userId) where.userId = Number(req.query.userId);
  if (req.query.date) {
    const start = new Date(req.query.date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(req.query.date);
    end.setHours(23, 59, 59, 999);
    where.createdAt = { gte: start, lte: end };
  }

  const logs = await prisma.auditLog.findMany({
    where,
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
    orderBy: { createdAt: "desc" },
    take: 200
  });
  res.json(logs);
}
