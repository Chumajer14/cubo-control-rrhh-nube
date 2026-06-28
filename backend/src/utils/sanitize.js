export function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

export function sanitizeEmployee(employee) {
  if (!employee) return null;
  const { pinHash, ...safeEmployee } = employee;
  return safeEmployee;
}
