# CUBO Terminal

CUBO Terminal es la aplicacion de escritorio del reloj control de CUBO. Funciona como una aplicacion para Windows construida con Electron, React y Vite, con interfaz de terminal fisico, pantalla LED simulada, pad numerico, teclas F1-F6 y soporte para modo `API` o `LOCAL_MOCK`.

Por defecto, el terminal opera en modo `API` y envia marcajes a AWS API Gateway. Si no hay conexion, guarda un evento pendiente local sin PIN, QR completo, MRZ ni serial. El modo `LOCAL_MOCK` sigue disponible para pruebas sin AWS.

## Objetivo del MVP

- Ejecutar un terminal de marcaje local en un PC.
- Simular un reloj control fisico en modo kiosco.
- Registrar ingreso, salida, vale de almuerzo, inicio de almuerzo y fin de almuerzo.
- Validar empleados ficticios y reglas minimas de duplicidad.
- Enviar eventos reales a AWS API Gateway en modo `API`.
- Guardar pendientes locales solo ante fallos de conexion.
- Mantener modo `LOCAL_MOCK` para validacion demo sin AWS.

## Instalacion

```bash
cd terminal-app
npm install
```

## Desarrollo

Ejecutar solo la interfaz React:

```bash
npm run dev
```

Ejecutar Electron con Vite:

```bash
npm run electron:dev
```

## Build y ejecutable Windows

```bash
npm run build
npm run dist
```

`npm run dist` compila el renderer en `terminal-app/dist/renderer/` y genera un ejecutable Windows desempaquetado en `terminal-app/dist/win-unpacked/CUBO Control Terminal.exe` usando `electron-builder`.

## Teclas funcionales

- `F1`: selecciona ingreso.
- `F2`: selecciona salida.
- `F3`: selecciona vale de almuerzo.
- `F4`: selecciona inicio de almuerzo.
- `F5`: selecciona fin de almuerzo.
- `F6`: modo administrador.
- `0` a `9`: ingresan PIN solo cuando el terminal lo solicita.
- `Backspace`: borra el ultimo digito del PIN.
- `Escape`: cancela la operacion actual.
- `Enter`: confirma el PIN.

## Escaneo de QR de cedula

La pistola scanner actua como teclado fisico. El flujo de marcaje es:

1. Seleccionar accion con `F1` a `F5`.
2. Escanear el QR de cedula.
3. Extraer solo el RUN desde el texto recibido.
4. Ingresar PIN del empleado.
5. Enviar el evento a AWS o registrar localmente si el modo es `LOCAL_MOCK`.

El terminal no consulta Registro Civil, no guarda la URL completa, no guarda MRZ, no guarda numero de serie y no persiste el texto crudo del QR. El buffer de scanner se usa solo para extraer el RUN y se limpia inmediatamente.

Los datos usados en este MVP son ficticios. En produccion, el RUN debe tratarse como dato personal; el backend debe validar permisos, cifrar datos en transito y aplicar controles de proteccion de datos. El PIN tampoco debe almacenarse en texto plano: debe validarse contra un backend seguro usando hash y politicas de rotacion.

## Datos demo

La lista mock esta en `src/data/mockEmployees.js` e incluye seis empleados ficticios con RUN valido y PIN demo:

- `12345678-5` Juan Perez, Administracion, activo, PIN `1234`.
- `11111111-1` Maria Gonzalez, RR.HH., activo, PIN `2345`.
- `22222222-2` Carlos Rojas, Operaciones, activo, PIN `3456`.
- `33333333-3` Ana Soto, Finanzas, activo, PIN `4567`.
- `44444444-4` Pedro Morales, Soporte, inactivo, PIN `5678`.
- `55555555-5` Camila Herrera, Bodega, activo, PIN `6789`.

No se usan RUN reales, cedulas, numeros de serie reales, MRZ ni datos personales reales.

## Modo administrador

`F6` abre el modo administrador. El PIN tecnico demo es `123456`.

Opciones disponibles:

- Ver configuracion del terminal.
- Cambiar codigo del terminal.
- Cambiar nombre del terminal.
- Cambiar URL base de API.
- Cambiar modo entre `LOCAL_MOCK` y `API`.
- Probar que la URL de API tenga formato valido.
- Ver eventos locales pendientes.
- Reintentar sincronizacion muestra que el pendiente requiere revalidacion de PIN.
- Limpiar eventos locales demo.
- Restaurar configuracion por defecto.
- Salir del modo admin.

El PIN demo no es un secreto real y solo existe para el MVP local.

## Eventos locales

Los eventos se guardan en `localStorage` con esta estructura:

```json
{
  "id": "uuid",
  "employeeRun": "12345678-5",
  "employeeName": "Juan Perez",
  "employeeArea": "Administracion",
  "terminalCode": "TERM-001",
  "terminalName": "Entrada Principal",
  "eventType": "INGRESO",
  "eventLabel": "Ingreso",
  "timestamp": "2026-06-28T08:45:22.000Z",
  "localDate": "2026-06-28",
  "localTime": "08:45:22",
  "source": "TERMINAL_PC",
  "inputMethod": "QR_CEDULA_SCANNER",
  "deviceMode": "KIOSK",
  "syncStatus": "LOCAL_ONLY"
}
```

En modo `LOCAL_MOCK`, el estado queda como `LOCAL_ONLY`. En modo `API`, el servicio intenta publicar en `${apiBaseUrl}/attendance/mark`; si falla la conexion, guarda un evento como `PENDING` sin PIN. Los pendientes no se reenvian automaticamente porque requieren revalidacion de PIN.

## Reglas de marcaje

- No registra si no hay RUN extraido.
- No registra si el RUN tiene formato o digito verificador invalido.
- No registra empleados inexistentes.
- No registra empleados inactivos.
- No registra PIN incorrecto.
- No registra eventos desconocidos.
- No registra si el terminal no tiene codigo configurado.
- No permite dos ingresos seguidos sin salida.
- No permite salida sin ingreso previo.
- No permite dos inicios de almuerzo seguidos sin fin de almuerzo.
- No permite fin de almuerzo sin inicio previo.
- Permite un vale de almuerzo por dia por empleado.

## Conexion con AWS

El terminal se conecta a AWS API Gateway usando:

```text
POST https://cs0w4vtu5a.execute-api.us-east-1.amazonaws.com/attendance/mark
```

API Gateway invoca una Lambda que valida empleado, PIN, terminal y reglas de evento. DynamoDB guarda el registro de asistencia en la tabla `cubo-dev-attendance-events`.

El terminal no consulta Registro Civil. Solo extrae el RUN desde el texto recibido por el scanner de QR y descarta el contenido crudo. El PIN viaja por HTTPS hacia la API para validacion del backend.

En una version productiva se debe mejorar la autenticacion del terminal con API Key, token de terminal, Cognito o firma segura. El PIN no debe gestionarse en frontend ni aparecer en logs. Tambien deben aplicarse controles formales de proteccion de datos personales, auditoria y retencion.

## Variables/configuracion

La app funciona aunque no exista `.env`, usando configuracion por defecto guardada en `localStorage`.

- `apiBaseUrl`: URL base de API Gateway. Valor por defecto: `https://cs0w4vtu5a.execute-api.us-east-1.amazonaws.com`.
- `terminalCode`: codigo del terminal. Valor por defecto: `TERM-001`.
- `terminalName`: nombre visible del terminal. Valor por defecto: `Entrada Principal`.
- `mode`: `API` o `LOCAL_MOCK`. Valor por defecto: `API`.

Variables Vite opcionales en `terminal-app/.env`:

```env
VITE_API_BASE_URL=https://cs0w4vtu5a.execute-api.us-east-1.amazonaws.com
VITE_TERMINAL_CODE=TERM-001
VITE_TERMINAL_NAME=Entrada Principal
VITE_TERMINAL_MODE=API
```

`apiBaseUrl` se normaliza eliminando `/` finales antes de concatenar `/attendance/mark`.

## Prueba con AWS

1. Ejecutar terminal:

   ```bash
   npm run electron:dev
   ```

2. Verificar que este en modo `API`.
3. Presionar `F1`.
4. Escanear o ingresar un QR de prueba que contenga `run=12345678-5`.
5. Ingresar PIN `1234`.
6. Confirmar con `Enter`.
7. Debe aparecer `INGRESO REGISTRADO`.
8. Verificar en DynamoDB: `cubo-dev-attendance-events`.

Pruebas funcionales esperadas:

- `F1`, RUN `12345678-5`, PIN `1234`: `INGRESO REGISTRADO`.
- Repetir `F1` con el mismo RUN: `INGRESO YA REGISTRADO`.
- `F2` despues de `F1`: `SALIDA REGISTRADA`.
- PIN incorrecto: `PIN INCORRECTO`.
- RUN inexistente: `EMPLEADO NO ENCONTRADO`.
- URL invalida o sin conexion: `SIN CONEXION - EVENTO GUARDADO PENDIENTE`.
- Modo `LOCAL_MOCK`: debe seguir funcionando sin AWS.

## Limitaciones actuales

- No existe endpoint health; la prueba de conexion valida formato de URL y no genera marcajes falsos.
- No existe sincronizacion automatica de pendientes porque no se almacena PIN.
- No existe login RR.HH.
- No existe dashboard administrativo.
- No existe biometria ni lectura de cedulas.
- No declara cumplimiento legal ni certificacion.

## Proximos pasos

- Crear cola offline persistente fuera de `localStorage`.
- Agregar configuracion segura del terminal.
- Implementar API de asistencia y sincronizacion.
- Agregar actualizacion remota de configuracion.
- Endurecer auditoria, logs y monitoreo del terminal.
