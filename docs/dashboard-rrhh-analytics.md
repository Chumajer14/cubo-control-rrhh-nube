# Dashboard RR.HH. analitico

El dashboard administrativo consolida metricas de asistencia diaria para RR.HH. y supervision. La vista usa el endpoint `/admin/dashboard` cuando entrega datos enriquecidos y recalcula en frontend como respaldo a partir de `/admin/attendance` y `/admin/terminals`.

## Secciones

- Resumen del dia: empleados activos, marcajes, ingresos, salidas, atrasos y eventos offline sincronizados.
- Jornada laboral: horas trabajadas estimadas, promedio, jornadas sin salida e incompletas.
- Colacion: colaciones activas, promedio, casos sobre 60 minutos y eventos observados.
- Control de jornada: primera entrada, ultima salida, horas trabajadas, colacion, estado y observacion por trabajador.
- Alertas operativas: avisos priorizados con severidad, objetivo y accion sugerida.
- Salud de terminales: estado operativo simulado desde eventos disponibles.
- Asistente IA RAG: recomendaciones de MVP basadas en reglas y base documental mock.

## Reglas principales

- Los tipos de evento se normalizan para aceptar `INGRESO`, `SALIDA`, `VALE_COLACION`, `INICIO_COLACION`, `FIN_COLACION` y variantes historicas con `ALMUERZO`.
- Las horas trabajadas se estiman entre primer ingreso y ultima salida, descontando colacion cerrada.
- Una jornada con ingreso y sin salida queda como `SIN_SALIDA`.
- Una colacion con inicio y sin fin queda como `COLACION_ABIERTA`.
- Una colacion sobre 60 minutos queda como `COLACION_EXTENDIDA`.
- Los terminales sin eventos del dia quedan como `SIN_ACTIVIDAD`; con eventos offline sincronizados quedan como `DEGRADADO`.

## IA RAG simulada

El modulo `Asistente IA RAG - Recomendaciones del dia` no usa servicios externos, OpenAI ni Bedrock. Genera recomendaciones con reglas locales en `admin-web/src/services/mockRagService.js` y textos simulados en `admin-web/src/data/mockKnowledgeBase.js`.

Las recomendaciones son asistivas y requieren revision humana. El sistema no ejecuta sanciones, descuentos ni decisiones laborales automaticas.
