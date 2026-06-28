import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const rounds = 10;

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.terminal.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.user.deleteMany();

  const [adminPassword, rrhhPassword, employeePin] = await Promise.all([
    bcrypt.hash("Admin123*", rounds),
    bcrypt.hash("Rrhh123*", rounds),
    bcrypt.hash("1234", rounds)
  ]);

  const admin = await prisma.user.create({
    data: { name: "Administrador CUBO", email: "admin@cubo.cl", passwordHash: adminPassword, role: "ADMIN" }
  });
  const rrhh = await prisma.user.create({
    data: { name: "Equipo RR.HH.", email: "rrhh@cubo.cl", passwordHash: rrhhPassword, role: "RRHH" }
  });

  const morning = await prisma.shift.create({
    data: { name: "Turno Administrativo Manana", startTime: "08:30", endTime: "17:30", toleranceMinutes: 10 }
  });
  const support = await prisma.shift.create({
    data: { name: "Turno Soporte Tarde", startTime: "12:00", endTime: "21:00", toleranceMinutes: 15 }
  });

  const employees = await Promise.all([
    ["11.111.111-1", "Juan Perez", "juan.perez@cubo.cl", "Administrativo", "Administracion", morning.id],
    ["12.222.222-2", "Maria Gonzalez", "maria.gonzalez@cubo.cl", "Analista RR.HH.", "RR.HH.", morning.id],
    ["13.333.333-3", "Carlos Rojas", "carlos.rojas@cubo.cl", "Operador", "Operaciones", morning.id],
    ["14.444.444-4", "Ana Soto", "ana.soto@cubo.cl", "Analista", "Finanzas", morning.id],
    ["15.555.555-5", "Pedro Morales", "pedro.morales@cubo.cl", "Soporte", "Soporte", support.id]
  ].map(([rut, name, email, position, department, shiftId]) =>
    prisma.employee.create({ data: { rut, name, email, position, department, shiftId, pinHash: employeePin } })
  ));

  const term1 = await prisma.terminal.create({
    data: { code: "TERM-001", name: "Reloj Control Entrada Principal", location: "Recepcion", branch: "Casa Matriz", status: "ACTIVE" }
  });
  const term2 = await prisma.terminal.create({
    data: { code: "TERM-002", name: "Reloj Control Patio Operaciones", location: "Patio Operaciones", branch: "Casa Matriz", status: "ACTIVE" }
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const recordData = [
    [employees[0], term1, "ENTRADA", today, "08:28", "VALIDO"],
    [employees[0], term1, "SALIDA", today, "17:32", "VALIDO"],
    [employees[1], term1, "ENTRADA", today, "08:45", "ATRASO"],
    [employees[2], term2, "ENTRADA", today, "08:34", "VALIDO"],
    [employees[3], term1, "ENTRADA", today, "08:31", "VALIDO"],
    [employees[4], term2, "ENTRADA", today, "12:22", "ATRASO"],
    [employees[0], term1, "ENTRADA", yesterday, "08:29", "VALIDO"],
    [employees[0], term1, "SALIDA", yesterday, "17:30", "VALIDO"],
    [employees[1], term1, "ENTRADA", yesterday, "08:35", "VALIDO"],
    [employees[1], term1, "SALIDA", yesterday, "17:29", "VALIDO"]
  ];

  for (const [employee, terminal, type, date, time, status] of recordData) {
    await prisma.attendanceRecord.create({
      data: { employeeId: employee.id, terminalId: terminal.id, type, date, time, status }
    });
  }

  await prisma.auditLog.createMany({
    data: [
      { userId: admin.id, action: "ADMIN_LOGIN", entity: "User", entityId: String(admin.id), detail: "Inicio de sesion administrativo demo" },
      { userId: rrhh.id, action: "EMPLOYEE_CREATED", entity: "Employee", entityId: String(employees[0].id), detail: "Empleado demo creado en seed" },
      { userId: admin.id, action: "SHIFT_CREATED", entity: "Shift", entityId: String(morning.id), detail: "Turno administrativo creado" },
      { userId: admin.id, action: "TERMINAL_CREATED", entity: "Terminal", entityId: String(term1.id), detail: "Terminal principal creado" },
      { userId: rrhh.id, action: "REPORT_EXPORTED", entity: "AttendanceRecord", detail: "Exportacion CSV demo registrada" }
    ]
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
