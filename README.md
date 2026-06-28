# CUBO - MVP control RR.HH. en nube

CUBO es un MVP educativo de una plataforma SaaS para control de asistencia laboral. Permite marcar entrada y salida desde terminales tipo reloj control y consultar registros desde un panel web para RR.HH., supervisores y administradores.

El proyecto esta disenado para una evaluacion universitaria de Computacion en la Nube. No declara certificacion legal, autorizacion administrativa ni cumplimiento total de normas; esta alineado con buenas practicas cloud, seguridad, NIST CSF 2.0, principios ISO/IEC 27001 y requisitos funcionales inspirados en la Resolucion Exenta N.38 de la Direccion del Trabajo de Chile.

## Funcionalidades principales

- Login administrativo con JWT y roles `ADMIN`, `RRHH`, `SUPERVISOR`.
- Terminal publica `/terminal/:terminalCode` para marcajes con RUT y PIN.
- CRUD de empleados, turnos y terminales.
- Registro de asistencia con estados `VALIDO`, `ATRASO`, `OBSERVADO`, `CORREGIDO`.
- Correccion administrativa con motivo obligatorio y auditoria.
- Dashboard con metricas del dia y Resumen IA simulado.
- Exportacion CSV por rango de fechas.
- Auditoria consultable por usuarios `ADMIN`.
- Pantalla educativa de privacidad y cumplimiento.

## Stack tecnico

- Frontend: React, Vite, Tailwind CSS, React Router.
- Backend: Node.js, Express, Prisma, JWT, bcrypt, Zod.
- Base de datos: PostgreSQL local con Docker Compose.
- Reportes: CSV generado desde API.
- Variables de entorno: dotenv.

## Instalacion local

1. Levantar PostgreSQL:

```bash
docker compose up -d
```

2. Configurar backend:

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

3. Configurar frontend:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

4. Abrir:

- Panel: `http://localhost:5173/login`
- Terminal demo: `http://localhost:5173/terminal/TERM-001`
- API health: `http://localhost:4000/api/health`

## Usuarios demo

- `admin@cubo.cl` / `Admin123*`
- `rrhh@cubo.cl` / `Rrhh123*`

PIN demo de empleados: `1234`.

## Variables de entorno

Backend:

- `DATABASE_URL`: conexion PostgreSQL.
- `PORT`: puerto API.
- `JWT_SECRET`: secreto local para firmar tokens.
- `JWT_EXPIRES_IN`: expiracion del token.
- `CORS_ORIGIN`: origen permitido del frontend.
- `NODE_ENV`: entorno de ejecucion.

Frontend:

- `VITE_API_URL`: URL base de la API.

## Comandos Prisma

```bash
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

## Estructura

```text
backend/
  prisma/
  src/config/
  src/controllers/
  src/middleware/
  src/routes/
  src/services/
  src/utils/
  src/validators/
frontend/
  src/api/
  src/components/
  src/context/
  src/hooks/
  src/layouts/
  src/pages/
docs/
```

## Arquitectura AWS propuesta

- Frontend: Amazon S3 + CloudFront.
- Backend: Elastic Beanstalk, EC2 o Lambda/API Gateway.
- Base de datos: Amazon RDS PostgreSQL.
- Autenticacion futura: Amazon Cognito.
- Reportes: Amazon S3.
- Monitoreo: Amazon CloudWatch.
- Auditoria cloud: AWS CloudTrail.
- Seguridad: IAM, WAF, GuardDuty, Security Hub, KMS y Secrets Manager.
- Backups: AWS Backup y S3 Versioning.
- Costos: AWS Budgets y Cost Explorer.

## Seguridad aplicada

El MVP usa bcrypt para contrasenas y PIN, JWT con expiracion, middleware de autenticacion/autorizacion, validacion Zod, CORS configurable, `.env.example` sin secretos reales, auditoria de acciones relevantes y respuestas sin exposicion de datos sensibles como `passwordHash` o `pinHash`.

## Marcos de referencia

- NIST CSF 2.0: ver [docs/seguridad-y-cumplimiento.md](docs/seguridad-y-cumplimiento.md).
- ISO/IEC 27001: alineacion educativa con controles generales, sin declarar certificacion.
- Proteccion de datos chilena: finalidad, acceso restringido, trazabilidad y minimizacion razonable.
- Resolucion Exenta N.38: funciones inspiradas en registro de entrada/salida, identificacion, fecha/hora, reportabilidad, trazabilidad e integridad.

## Uso de IA

El dashboard incluye un Resumen IA simulado con reglas simples. Es apoyo administrativo educativo: no sanciona, no bloquea trabajadores, no decide descuentos y requiere supervision humana.

## Limitaciones del MVP

- No reemplaza un sistema certificado de asistencia.
- No incluye biometria ni integracion con hardware real.
- No usa Cognito, KMS ni Secrets Manager en local.
- El resumen IA no consume un modelo externo.
- Los reportes CSV son basicos y orientados a demostracion.

## Proximas mejoras

- Integrar Amazon Cognito.
- Desplegar backend en AWS y base en RDS.
- Guardar reportes en S3.
- Agregar pruebas automatizadas.
- Agregar filtros avanzados persistentes y paginacion.
- Implementar notificaciones de incidencias.
