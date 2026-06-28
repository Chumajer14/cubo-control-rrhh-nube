# Modelo de datos

## Entidades

- `User`: usuarios administrativos con rol y contrasena hasheada.
- `Employee`: trabajadores con RUT, datos laborales, turno y PIN hasheado.
- `Shift`: turnos con horario y tolerancia.
- `Terminal`: relojes control autorizados.
- `AttendanceRecord`: marcajes de entrada/salida y estado.
- `AuditLog`: eventos tecnicos y administrativos auditables.

## Enums

- `Role`: `ADMIN`, `RRHH`, `SUPERVISOR`.
- `AttendanceType`: `ENTRADA`, `SALIDA`.
- `AttendanceStatus`: `VALIDO`, `ATRASO`, `OBSERVADO`, `CORREGIDO`.
- `TerminalStatus`: `ACTIVE`, `INACTIVE`.

## Reglas principales

- Un empleado puede tener un turno asignado.
- Cada marcaje pertenece a un empleado y a un terminal.
- No se elimina asistencia desde la interfaz.
- Las correcciones requieren motivo y usuario corrector.
- Auditoria registra acciones relevantes y errores de acceso o marcaje.
