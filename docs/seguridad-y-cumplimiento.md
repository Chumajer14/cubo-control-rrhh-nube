# Seguridad y cumplimiento

Este MVP esta alineado con buenas practicas de seguridad y marcos de referencia. No declara certificacion ISO, autorizacion de la Direccion del Trabajo ni cumplimiento legal total.

## NIST CSF 2.0

| Funcion | Aplicacion en CUBO |
| --- | --- |
| Govern | Roles administrativos, finalidad documentada del tratamiento, documentacion tecnica y politicas operativas sugeridas. |
| Identify | Identificacion de empleados, terminales, turnos, usuarios administrativos y activos de informacion. |
| Protect | Login, JWT, bcrypt, roles, minimo privilegio, validacion de entradas y CORS configurable. |
| Detect | Auditoria, registros de intentos fallidos, intentos de marcaje invalido y estados observados. |
| Respond | Correccion de incidencias con motivo obligatorio, revision por RR.HH. y trazabilidad. |
| Recover | Propuesta de backups en AWS, restauracion RDS y continuidad operativa documentada. |

## ISO/IEC 27001

El MVP se alinea educativamente con controles generales:

- Control de acceso mediante roles.
- Gestion de activos: empleados, terminales, turnos y registros.
- Registro de eventos con `audit_logs`.
- Seguridad en desarrollo con validacion y manejo de errores.
- Gestion de incidentes mediante correcciones justificadas.
- Continuidad operacional proyectada con backups AWS.
- Proteccion de informacion con hashing y no exposicion de secretos.
- Gestion de respaldos propuesta con AWS Backup y snapshots.

## Proteccion de datos chilena

El sistema esta disenado considerando finalidad especifica de control de asistencia, acceso restringido, minimizacion de datos sensibles expuestos y trazabilidad de acciones administrativas.

## Resolucion Exenta N.38

Las funciones estan inspiradas en requisitos tipicos de sistemas electronicos de control de asistencia:

- Registro de entrada y salida.
- Identificacion del trabajador.
- Fecha y hora automatica.
- Reportabilidad.
- Trazabilidad.
- Correcciones justificadas.
- Acceso administrativo controlado.
- Integridad del registro.
- Identificacion del terminal de marcaje.

No se afirma autorizacion de la Direccion del Trabajo.
