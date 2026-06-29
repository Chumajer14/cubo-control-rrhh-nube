# CUBO Terminal

CUBO Terminal es una aplicacion de escritorio Electron + React que simula un reloj control fisico simple: carcasa gris, pantalla LCD verde, botones F1-F6 al costado, teclado numerico, tecla `C`, tecla `K` y tecla `OK`.

No es un dashboard. La interfaz esta pensada para uso tipo kiosco en un PC con scanner QR de cedula o ingreso manual de RUT.

## Teclas F1-F6

- `F1`: INGRESO / ENTRA A TURNO.
- `F2`: SALIDA / SALE DE TURNO.
- `F3`: VALE_ALMUERZO / VALE COLACION.
- `F4`: INICIO_ALMUERZO / INICIO COLACION.
- `F5`: FIN_ALMUERZO / FIN COLACION.
- `F6`: ADMIN.

## Flujo QR

1. Presionar `F1` a `F5`.
2. La pantalla muestra la accion y `RUT:`.
3. Escanear QR de cedula.
4. El terminal extrae solo el RUN/RUT.
5. El texto completo del QR se descarta; no se guarda URL, MRZ ni serial.
6. La pantalla solicita `PIN:`.
7. Confirmar con `OK` o `Enter`.

## Flujo Manual RUT

1. Presionar `F1` a `F5`.
2. Ingresar RUT con numeros y `K` si corresponde.
3. Puede ingresarse con o sin guion.
4. Confirmar con `OK` o `Enter`.
5. El terminal normaliza internamente a formato `12345678-5`.
6. Si el formato o digito verificador no es valido, muestra `ERROR-06 RUT INVALIDO`.

## Flujo PIN

El PIN se ingresa despues de identificar el RUT. En modo `API`, el PIN viaja por HTTPS a AWS para validacion. En modo offline no se guarda PIN en la cola local.

## Boucher Impreso Simulado

Despues de una marcacion online u offline exitosa, aparece un papel termico simulado con:

- CUBO CONTROL.
- BOUCHER IMPRESO.
- Empleado.
- RUT.
- Fecha.
- Hora.
- Accion.
- Terminal.
- Estado.
- Sincronizacion, si queda pendiente.

El boucher es solo visual. No integra impresora real.

## Errores ERROR-XX

- `ERROR-01 CONTACTE A RRHH`: empleado no encontrado.
- `ERROR-02 PIN INCORRECTO`: clave invalida.
- `ERROR-03 EMPLEADO INACTIVO`: trabajador desactivado.
- `ERROR-04 TERMINAL NO AUTORIZADO`: terminal no existe o esta inactivo.
- `ERROR-05 MARCACION NO PERMITIDA`: duplicidad o secuencia incorrecta.
- `ERROR-06 RUT INVALIDO`: RUT mal ingresado o QR sin RUN extraible.
- `ERROR-07 SIN COMUNICACION API`: API sin respuesta; se registra offline.
- `ERROR-08 ERROR DE SINCRONIZACION`: fallo de sincronizacion offline.
- `ERROR-09 CONFIGURACION TERMINAL`: falta `terminalCode`, `apiBaseUrl` o modo valido.
- `ERROR-10 ERROR INTERNO`: error no controlado.

Los errores de validacion online bloquean la marcacion. La falta de comunicacion con API no bloquea: registra offline y emite boucher.

## Modo Offline

Si no hay internet, hay timeout de 5 segundos, falla `fetch`, cae la API o responde `5xx`, el terminal:

1. Guarda un evento offline local.
2. No guarda PIN.
3. No guarda QR completo, MRZ ni serial.
4. Muestra mensaje OK offline en LCD.
5. Emite boucher con estado `REGISTRADO OFFLINE`.

La cola guarda:

- `offlineEventId`
- `run`
- `eventType`
- `terminalCode`
- `timestamp`
- `localDate`
- `localTime`
- `syncStatus`
- `source`
- `inputMethod`
- `offline`

## Cola Offline

La cola esta aislada en `src/services/offlineQueueService.js` y usa `localStorage` para el MVP. Funciones disponibles:

- `enqueueOfflineEvent(event)`
- `getPendingEvents()`
- `markEventAsSynced(offlineEventId)`
- `markEventAsFailed(offlineEventId, reason)`
- `removeOfflineEvent(offlineEventId)`
- `clearOfflineQueue()`
- `getOfflineQueueStats()`

## Sincronizacion Progresiva

`src/services/syncService.js` intenta sincronizar cada 15 segundos en lotes pequenos. No bloquea la interfaz. El indicador muestra:

- `ONLINE`
- `OFFLINE`
- `SINCRONIZANDO`
- `PENDIENTES: N`

Los eventos offline se envian sin PIN usando `POST /attendance/sync` y header `x-terminal-token`.

## Conexion AWS

API base:

```text
https://cs0w4vtu5a.execute-api.us-east-1.amazonaws.com
```

Endpoint online existente:

```text
POST /attendance/mark
```

Payload:

```json
{
  "run": "12345678-5",
  "pin": "1234",
  "eventType": "INGRESO",
  "terminalCode": "TERM-001",
  "timestamp": "2026-06-28T08:45:22.000Z"
}
```

Endpoints de soporte requeridos por el terminal:

```text
GET /health
POST /attendance/sync
```

`GET /health` permite probar conexion sin crear marcajes falsos.

`POST /attendance/sync` debe recibir eventos offline sin PIN:

```json
{
  "terminalCode": "TERM-001",
  "events": [
    {
      "offlineEventId": "uuid",
      "run": "12345678-5",
      "eventType": "INGRESO",
      "timestamp": "2026-06-28T08:45:22.000Z",
      "inputMethod": "QR_CEDULA_SCANNER",
      "offline": true
    }
  ]
}
```

Debe validar `x-terminal-token`, terminal activo, empleado y tipo de evento. Debe usar `offlineEventId` para idempotencia y no duplicar registros.

No hay carpeta `infra` en este checkout. El cliente queda listo para `/health` y `/attendance/sync`; los cambios CDK/Lambda deben agregarse en el repositorio de infraestructura correspondiente antes de desplegar.

## Configuracion

Valores por defecto:

```json
{
  "terminalCode": "TERM-001",
  "terminalName": "Entrada Principal",
  "branch": "Casa Matriz",
  "apiBaseUrl": "https://cs0w4vtu5a.execute-api.us-east-1.amazonaws.com",
  "mode": "API",
  "adminPin": "123456",
  "terminalSyncToken": "cubo-dev-terminal-token"
}
```

Variables opcionales:

```env
VITE_API_BASE_URL=https://cs0w4vtu5a.execute-api.us-east-1.amazonaws.com
VITE_TERMINAL_CODE=TERM-001
VITE_TERMINAL_NAME=Entrada Principal
VITE_TERMINAL_MODE=API
VITE_TERMINAL_SYNC_TOKEN=cubo-dev-terminal-token
```

El token demo no es un secreto real. En produccion debe reemplazarse por API Key, token de terminal robusto, Cognito o firma segura.

## Modo Admin

`F6` abre modo admin. PIN demo: `123456`.

Permite:

- Ver API base URL.
- Ver terminal code.
- Ver modo actual.
- Ver estado online/offline.
- Ver cantidad de pendientes.
- Probar `GET /health`.
- Reintentar sincronizacion.
- Limpiar cola offline demo.
- Cambiar API URL.
- Cambiar modo `API` / `LOCAL_MOCK`.

No muestra PIN de trabajador ni QR completo.

## Seguridad y Privacidad

- No consulta Registro Civil.
- No guarda QR completo.
- No guarda MRZ.
- No guarda serial.
- No guarda PIN en cola offline.
- No imprime PIN ni QR completo en consola.
- No contiene secretos reales.

El RUN es dato personal y debe tratarse con controles de proteccion, auditoria, minimizacion y retencion. En produccion el PIN no debe gestionarse en frontend ni en logs.

## Desarrollo

```bash
npm install
npm run electron:dev
```

## Build Windows

```bash
npm run build
npm run dist
```

`npm run dist` genera el ejecutable Windows con `electron-builder`.

## Pruebas Manuales

1. `F1` + QR valido + PIN correcto + API online: muestra `INGRESADO EXITOSAMENTE - OK`, imprime boucher y registra en DynamoDB.
2. `F1` + RUT manual + PIN correcto + API online: mismo flujo que QR.
3. PIN incorrecto: muestra `ERROR-02 PIN INCORRECTO` y no imprime boucher exitoso.
4. RUN no registrado: muestra `ERROR-01 CONTACTE A RRHH`.
5. URL invalida o API caida: muestra `OK INGRESO - REGISTRADO OFFLINE`, imprime boucher offline y guarda pendiente sin PIN.
6. Recuperar conexion: sincroniza pendientes progresivamente y marca `SYNCED` si AWS responde OK.
7. `F2`, `F3`, `F4`, `F5`: mismo flujo.
8. `F6 Admin`: muestra configuracion, conexion y eventos pendientes.
9. `npm run electron:dev` funciona.
10. `npm run dist` genera `.exe`.

## Limitaciones MVP

- No integra impresora real.
- La cola offline usa `localStorage`.
- `/health` y `/attendance/sync` deben existir en AWS para health check y sincronizacion real.
- El token de sincronizacion es demo.
- No incluye dashboard RR.HH.

## Proximos Pasos

- Implementar `/health` y `/attendance/sync` en infraestructura AWS.
- Reemplazar token demo por autenticacion robusta.
- Migrar cola offline a SQLite o almacenamiento local cifrado.
- Agregar auditoria formal de sincronizacion.
- Agregar monitoreo y actualizacion remota de configuracion del terminal.
