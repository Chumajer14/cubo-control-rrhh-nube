# CUBO Terminal

CUBO Terminal es la primera version local del reloj control de CUBO. Funciona como una aplicacion de escritorio para Windows construida con Electron, React y Vite, con interfaz de terminal fisico, pantalla LED simulada, pad numerico, teclas F1-F6 y almacenamiento local de eventos.

Esta primera version del terminal CUBO funciona en modo local/mock. Su objetivo es demostrar la experiencia de uso del reloj control fisico mediante una aplicacion de escritorio. En una etapa posterior, los eventos registrados seran enviados a una API desplegada sobre AWS, donde se centralizaran los datos de asistencia, auditoria y reportes administrativos.

## Objetivo del MVP

- Ejecutar un terminal de marcaje local en un PC.
- Simular un reloj control fisico en modo kiosco.
- Registrar ingreso, salida, vale de almuerzo, inicio de almuerzo y fin de almuerzo.
- Validar empleados ficticios y reglas minimas de duplicidad.
- Guardar eventos en `localStorage` mientras no exista backend.
- Dejar preparada la interfaz de servicio para futura integracion con una API en AWS.

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

- `0` a `9`: agregan digitos al codigo de empleado.
- `Backspace`: borra el ultimo digito.
- `Escape`: limpia el codigo ingresado.
- `Enter`: repite la ultima accion F1-F5 seleccionada.
- `F1`: ingreso.
- `F2`: salida.
- `F3`: vale de almuerzo.
- `F4`: inicio de almuerzo.
- `F5`: fin de almuerzo.
- `F6`: modo administrador.

## Datos demo

La lista mock esta en `src/data/mockEmployees.js` e incluye seis empleados ficticios:

- `1001` Juan Perez, Administracion, activo.
- `1002` Maria Gonzalez, RR.HH., activo.
- `1003` Carlos Rojas, Operaciones, activo.
- `1004` Ana Soto, Finanzas, activo.
- `1005` Pedro Morales, Soporte, inactivo.
- `1006` Camila Herrera, Bodega, activo.

No se usan RUN reales, cedulas, numeros de serie reales, MRZ ni datos personales reales.

## Modo administrador

`F6` abre el modo administrador. El PIN tecnico demo es `123456`.

Opciones disponibles:

- Ver configuracion del terminal.
- Cambiar codigo del terminal.
- Cambiar nombre del terminal.
- Cambiar URL base de API.
- Cambiar modo entre `LOCAL_MOCK` y `API`.
- Ver eventos locales pendientes.
- Limpiar eventos locales demo.
- Salir del modo admin.

El PIN demo no es un secreto real y solo existe para el MVP local.

## Eventos locales

Los eventos se guardan en `localStorage` con esta estructura:

```json
{
  "id": "uuid",
  "employeeCode": "1001",
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
  "deviceMode": "KIOSK",
  "syncStatus": "LOCAL_ONLY"
}
```

En modo `LOCAL_MOCK`, el estado queda como `LOCAL_ONLY`. En modo `API`, el servicio intenta publicar en `${apiBaseUrl}/attendance/mark`; si falla, guarda el evento como `PENDING`.

## Reglas de marcaje

- No registra codigo vacio.
- No registra empleados inexistentes.
- No registra empleados inactivos.
- No registra eventos desconocidos.
- No registra si el terminal no tiene codigo configurado.
- No permite dos ingresos seguidos sin salida.
- No permite salida sin ingreso previo.
- No permite dos inicios de almuerzo seguidos sin fin de almuerzo.
- No permite fin de almuerzo sin inicio previo.
- Permite un vale de almuerzo por dia por empleado.

## Preparacion AWS

`src/services/attendanceService.js` ya separa los modos `LOCAL_MOCK` y `API`. La integracion real debe reemplazar la simulacion local por autenticacion, reintentos controlados, cola offline, firma de terminal y endpoints desplegados sobre AWS.

## Limitaciones actuales

- No existe backend real.
- No existe sincronizacion cloud.
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
