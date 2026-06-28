import { prisma } from "../config/prisma.js";

export async function audit({ userId, action, entity, entityId, detail, req }) {
  await prisma.auditLog.create({
    data: {
      userId: userId || null,
      action,
      entity,
      entityId: entityId ? String(entityId) : null,
      detail,
      ipAddress: req?.ip
    }
  });
}
