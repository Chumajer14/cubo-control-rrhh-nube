import { knowledgeBase } from "../data/mockKnowledgeBase.js";

const sourceByRisk = {
  lunch: "Politica interna de colacion",
  shift: "Politica de cierre de jornada",
  offline: "Procedimiento de registros offline",
  terminal: "Monitoreo de terminales",
  traceability: "Referencia funcional Resolucion Exenta 38",
};

export function buildMockRagInsights(analytics) {
  const summary = analytics.summary || {};
  const recommendations = [];
  const sources = new Set([sourceByRisk.traceability]);

  if (summary.extendedLunchCount > 0) {
    recommendations.push(
      `Revisar ${summary.extendedLunchCount} colacion(es) superiores a 60 minutos con RR.HH. antes del cierre diario.`
    );
    sources.add(sourceByRisk.lunch);
  }

  if (summary.missingExitCount > 0) {
    recommendations.push(
      `Validar ${summary.missingExitCount} jornada(s) sin salida registrada con la supervision del area.`
    );
    sources.add(sourceByRisk.shift);
  }

  if (summary.offlineSynced > 0) {
    recommendations.push(
      `Confirmar hora local y conectividad de terminales por ${summary.offlineSynced} evento(s) offline sincronizado(s).`
    );
    sources.add(sourceByRisk.offline);
  }

  if (summary.terminalNoActivityCount > 0) {
    recommendations.push(
      `Revisar ${summary.terminalNoActivityCount} terminal(es) sin actividad para descartar problemas de operacion o conectividad.`
    );
    sources.add(sourceByRisk.terminal);
  }

  if (!recommendations.length) {
    recommendations.push("Mantener monitoreo operativo y revisar registros observados antes del cierre diario.");
  }

  const riskLevel = summary.criticalAlerts > 0 || summary.missingExitCount > 2
    ? "ALTO"
    : summary.extendedLunchCount > 0 || summary.missingExitCount > 0 || summary.offlineSynced > 0
      ? "MEDIO"
      : "BAJO";

  const executiveSummary = [
    `Hoy se registraron ${summary.marksToday || 0} eventos de asistencia.`,
    `${summary.workedHoursTotalMinutes ? "Existe calculo de horas trabajadas por jornada." : "Aun no hay horas trabajadas cerradas suficientes."}`,
    summary.observedEvents
      ? `Hay ${summary.observedEvents} evento(s) observado(s) para revision administrativa.`
      : "No se detectan eventos observados relevantes.",
  ].join(" ");

  return {
    riskLevel,
    executiveSummary,
    recommendations,
    prioritizedAlerts: (analytics.alerts || []).slice(0, 4),
    sources: Array.from(sources),
    sourceDocuments: knowledgeBase.filter((doc) => sources.has(doc.title)),
    disclaimer: "Modulo IA RAG simulado para MVP. No toma decisiones laborales automaticas.",
  };
}
