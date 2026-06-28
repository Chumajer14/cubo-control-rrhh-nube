import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { audit } from "../utils/audit.js";
import { sanitizeUser } from "../utils/sanitize.js";

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  const validPassword = user ? await bcrypt.compare(password, user.passwordHash) : false;

  if (!user || !user.active || !validPassword) {
    await audit({ action: "FAILED_LOGIN", entity: "User", entityId: email, detail: "Intento fallido de login administrativo", req });
    return res.status(401).json({ message: "Credenciales invalidas." });
  }

  const token = jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
  await audit({ userId: user.id, action: "ADMIN_LOGIN", entity: "User", entityId: user.id, detail: "Login administrativo exitoso", req });
  res.json({ token, user: sanitizeUser(user) });
}

export function me(req, res) {
  res.json({ user: req.user });
}
