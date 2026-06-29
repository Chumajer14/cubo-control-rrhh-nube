import { formatMinutes, isToday, minutesBetween, parseDate } from "./timeUtils.js";

const eventAliases = {
  INGRESO: "INGRESO",
  ENTRADA: "INGRESO",
  SALIDA: "SALIDA",
  VALE_COLACION: "VALE_COLACION",
  VALE_ALMUERZO: "VALE_COLACION",
  INICIO_COLACION: "INICIO_COLACION",
  INICIO_ALMUERZO: "INICIO_COLACION",
  FIN_COLACION: "FIN_COLACION",
  FIN_ALMUERZO: "FIN_COLACION",
};

const severityRank = {
  CRITICAL: 5,
  HIGH: 4,
  MEDIUM: 3,
  LOW: 2,
  INFO: 1,
};

export function normalizeEventType(value) {
  const normalized = String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  return eventAliases[normalized] || normalized;
}

function sortByTime(items) {
  return [...items].sort((a, b) => (parseDate(a.timestamp)?.getTime() || 0) - (parseDate(b.timestamp)?.getTime() || 0));
}

function pickEmployeeName(events, employeeRun) {
  return events.find((event) => event.employeeRun === employeeRun && event.employeeName)?.employeeName || "-";
}

function buildEmployeeWorkday(events) {
  const byEmployee = events.reduce((acc, event) => {
    const key = event.employeeRun || "SIN_RUT";
    acc[key] = acc[key] || [];
    acc[key].push(event);
    return acc;
  }, {});

  return Object.entries(byEmployee).map(([run, employeeEvents]) => {
    const ordered = sortByTime(employeeEvents);
    const entries = ordered.filter((event) => normalizeEventType(event.eventType) === "INGRESO");
    const exits = ordered.filter((event) => normalizeEventType(event.eventType) === "SALIDA");
    const lunchStart = ordered.find((event) => normalizeEventType(event.eventType) === "INICIO_COLACION");
    const lunchEnd = ordered.find((event) => normalizeEventType(event.eventType) === "FIN_COLACION");
    const firstEntryAt = entries[0]?.timestamp || null;
    const lastExitAt = exits[exits.length - 1]?.timestamp || null;
    const lunchMinutes = lunchStart && lunchEnd ? minutesBetween(lunchStart.timestamp, lunchEnd.timestamp) : 0;
    const grossWorkedMinutes = firstEntryAt && lastExitAt ? minutesBetween(firstEntryAt, lastExitAt) : 0;
    const workedMinutes = Math.max(0, grossWorkedMinutes - lunchMinutes);
    const hasOpenLunch = Boolean(lunchStart && !lunchEnd);
    const hasMissingExit = Boolean(firstEntryAt && !lastExitAt);
    const hasExtendedLunch = lunchMinutes > 60;
    const observed = ordered.some((event) => event.status === "OBSERVADO");

    let status = "VALIDO";
    let observation = "Sin observaciones";
    if (hasOpenLunch) {
      status = "EN_COLACION";
      observation = "Colacion iniciada sin cierre registrado";
    } else if (hasExtendedLunch) {
      status = "OBSERVADO";
      observation = "Colacion superior a 60 minutos";
    } else if (hasMissingExit) {
      status = "SIN_SALIDA";
      observation = "Jornada con ingreso y sin salida registrada";
    } else if (firstEntryAt && lastExitAt) {
      status = "JORNADA_COMPLETA";
      observation = "Jornada cerrada";
    } else if (firstEntryAt) {
      status = "EN_TURNO";
      observation = "Empleado en turno";
    } else if (observed) {
      status = "OBSERVADO";
      observation = "Registro observado para revision RR.HH.";
    }

    return {
      run,
      employeeName: pickEmployeeName(ordered, run),
      firstEntryAt,
      lastExitAt,
      workedMinutes,
      lunchMinutes,
      status,
      observation,
    };
  });
}

function buildLunchAnalysis(events) {
  const workdays = buildEmployeeWorkday(events);
  return workdays.map((workday) => {
    const employeeEvents = sortByTime(events.filter((event) => event.employeeRun === workday.run));
    const lunchStart = employeeEvents.find((event) => normalizeEventType(event.eventType) === "INICIO_COLACION");
    const lunchEnd = employeeEvents.find((event) => normalizeEventType(event.eventType) === "FIN_COLACION");
    const lunchVoucher = employeeEvents.find((event) => normalizeEventType(event.eventType) === "VALE_COLACION");
    const lunchMinutes = lunchStart && lunchEnd ? minutesBetween(lunchStart.timestamp, lunchEnd.timestamp) : 0;
    let status = "SIN_COLACION";

    if (lunchStart && !lunchEnd) status = "COLACION_ABIERTA";
    else if (lunchMinutes > 60) status = "COLACION_EXTENDIDA";
    else if (lunchMinutes >= 45) status = "NORMAL";
    else if (lunchMinutes > 0 && lunchMinutes < 20) status = "COLACION_BREVE";
    else if (lunchVoucher && !lunchStart) status = "VALE_SIN_USO_REGISTRADO";

    return {
      run: workday.run,
      employeeName: workday.employeeName,
      lunchStartAt: lunchStart?.timestamp || null,
      lunchEndAt: lunchEnd?.timestamp || null,
      lunchMinutes,
      status,
    };
  }).filter((row) => row.status !== "SIN_COLACION");
}

function buildTerminalHealth(terminals, events) {
  const terminalCodes = new Set([
    ...terminals.map((terminal) => terminal.terminalCode).filter(Boolean),
    ...events.map((event) => event.terminalCode).filter(Boolean),
  ]);

  return Array.from(terminalCodes).map((terminalCode) => {
    const terminal = terminals.find((item) => item.terminalCode === terminalCode) || {};
    const terminalEvents = events.filter((event) => event.terminalCode === terminalCode);
    const lastAttendanceAt = sortByTime(terminalEvents).at(-1)?.timestamp || null;
    const offlinePending = terminalEvents.filter((event) => event.wasOffline || event.status === "OFFLINE_SYNCED").length;
    const failedAttempts = terminalEvents.filter((event) => ["RECHAZADO", "FALLIDO"].includes(event.status)).length;
    let status = terminal.active === false ? "OFFLINE" : "SIN_ACTIVIDAD";
    let observation = "Sin eventos hoy";

    if (failedAttempts >= 3) {
      status = "REQUIERE_REVISION";
      observation = "Concentra intentos fallidos";
    } else if (offlinePending > 0) {
      status = "DEGRADADO";
      observation = "Registra eventos offline sincronizados";
    } else if (terminalEvents.length > 0) {
      status = "ONLINE";
      observation = "Operativo con eventos registrados";
    }

    return {
      terminalCode,
      status,
      lastHeartbeatAt: terminal.lastSeenAt || terminal.lastHeartbeatAt || null,
      lastAttendanceAt,
      eventsToday: terminalEvents.length,
      offlinePending,
      failedAttempts,
      observation,
    };
  });
}

function buildAlerts(workdays, lunchAnalysis, terminalHealth, events) {
  const alerts = [];
  workdays.forEach((workday) => {
    if (workday.status === "SIN_SALIDA") {
      alerts.push({
        severity: "HIGH",
        type: "MISSING_EXIT",
        title: "Jornada sin salida",
        description: `${workday.employeeName} registra ingreso sin salida asociada.`,
        target: workday.run,
        recommendedAction: "Validar con supervisor si corresponde correccion administrativa.",
        timestamp: workday.firstEntryAt,
      });
    }
  });

  lunchAnalysis.forEach((lunch) => {
    if (lunch.status === "COLACION_EXTENDIDA") {
      alerts.push({
        severity: "HIGH",
        type: "EXTENDED_LUNCH",
        title: "Colacion extendida",
        description: `${lunch.employeeName} registra ${formatMinutes(lunch.lunchMinutes)} de colacion.`,
        target: lunch.run,
        recommendedAction: "Revisar si corresponde autorizacion especial o correccion administrativa.",
        timestamp: lunch.lunchEndAt || lunch.lunchStartAt,
      });
    }
    if (lunch.status === "COLACION_ABIERTA") {
      alerts.push({
        severity: "MEDIUM",
        type: "OPEN_LUNCH",
        title: "Colacion sin cierre",
        description: `${lunch.employeeName} tiene inicio de colacion sin fin registrado.`,
        target: lunch.run,
        recommendedAction: "Contactar al area responsable para completar revision de jornada.",
        timestamp: lunch.lunchStartAt,
      });
    }
  });

  terminalHealth.forEach((terminal) => {
    if (["SIN_ACTIVIDAD", "DEGRADADO", "REQUIERE_REVISION"].includes(terminal.status)) {
      alerts.push({
        severity: terminal.status === "REQUIERE_REVISION" ? "CRITICAL" : terminal.status === "DEGRADADO" ? "MEDIUM" : "LOW",
        type: "TERMINAL_HEALTH",
        title: "Revision de terminal",
        description: `${terminal.terminalCode} presenta estado ${terminal.status}.`,
        target: terminal.terminalCode,
        recommendedAction: "Validar actividad operativa y conectividad del terminal.",
        timestamp: terminal.lastAttendanceAt,
      });
    }
  });

  events.filter((event) => event.wasOffline || event.status === "OFFLINE_SYNCED").forEach((event) => {
    alerts.push({
      severity: "INFO",
      type: "OFFLINE_SYNCED",
      title: "Evento offline sincronizado",
      description: `${event.employeeName || event.employeeRun} registra evento sincronizado desde modo offline.`,
      target: event.terminalCode || event.employeeRun,
      recommendedAction: "Revisar desfase horario y conectividad si se repite.",
      timestamp: event.timestamp,
    });
  });

  return alerts.sort((a, b) => (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0));
}

export function buildDashboardAnalytics({ dashboard = {}, attendance = [], terminals = [] }) {
  const todayEvents = attendance.filter((event) => isToday(event.timestamp));
  const sourceEvents = todayEvents.length ? todayEvents : (dashboard.latestAttendance || []).filter((event) => isToday(event.timestamp));
  const employeeWorkday = dashboard.employeeWorkday?.length ? dashboard.employeeWorkday : buildEmployeeWorkday(sourceEvents);
  const lunchAnalysis = dashboard.lunchAnalysis?.length ? dashboard.lunchAnalysis : buildLunchAnalysis(sourceEvents);
  const terminalHealth = dashboard.terminalHealth?.length ? dashboard.terminalHealth : buildTerminalHealth(terminals, sourceEvents);
  const alerts = dashboard.alerts?.length ? dashboard.alerts : buildAlerts(employeeWorkday, lunchAnalysis, terminalHealth, sourceEvents);
  const summary = {
    activeEmployees: dashboard.summary?.activeEmployees ?? dashboard.metrics?.activeEmployees ?? 0,
    marksToday: sourceEvents.length || dashboard.summary?.marksToday || dashboard.metrics?.todayEvents || 0,
    entries: sourceEvents.filter((event) => normalizeEventType(event.eventType) === "INGRESO").length || dashboard.summary?.entries || dashboard.metrics?.todayEntries || 0,
    exits: sourceEvents.filter((event) => normalizeEventType(event.eventType) === "SALIDA").length || dashboard.summary?.exits || dashboard.metrics?.todayExits || 0,
    lateCount: dashboard.summary?.lateCount ?? dashboard.metrics?.lateEvents ?? sourceEvents.filter((event) => event.status === "ATRASO").length,
    offlineSynced: sourceEvents.filter((event) => event.wasOffline || event.status === "OFFLINE_SYNCED").length || dashboard.summary?.offlineSynced || dashboard.metrics?.offlineSynced || 0,
    activeTerminals: dashboard.summary?.activeTerminals ?? dashboard.metrics?.activeTerminals ?? terminals.filter((terminal) => terminal.active).length,
    pendingOrRejected: sourceEvents.filter((event) => ["PENDIENTE", "RECHAZADO"].includes(event.status)).length || dashboard.summary?.pendingOrRejected || dashboard.metrics?.pendingOrRejected || 0,
    workedHoursTotalMinutes: employeeWorkday.reduce((total, row) => total + (row.workedMinutes || 0), 0),
    workedHoursAverageMinutes: Math.round(employeeWorkday.reduce((total, row) => total + (row.workedMinutes || 0), 0) / Math.max(1, employeeWorkday.filter((row) => row.workedMinutes).length)),
    activeLunches: lunchAnalysis.filter((row) => row.status === "COLACION_ABIERTA").length,
    averageLunchMinutes: Math.round(lunchAnalysis.reduce((total, row) => total + (row.lunchMinutes || 0), 0) / Math.max(1, lunchAnalysis.filter((row) => row.lunchMinutes).length)),
    extendedLunchCount: lunchAnalysis.filter((row) => row.status === "COLACION_EXTENDIDA").length,
    missingExitCount: employeeWorkday.filter((row) => row.status === "SIN_SALIDA").length,
    incompleteShiftCount: employeeWorkday.filter((row) => ["SIN_SALIDA", "EN_COLACION", "EN_TURNO"].includes(row.status)).length,
    observedEvents: sourceEvents.filter((event) => event.status === "OBSERVADO").length + employeeWorkday.filter((row) => row.status === "OBSERVADO").length,
    terminalNoActivityCount: terminalHealth.filter((row) => row.status === "SIN_ACTIVIDAD").length,
    criticalAlerts: alerts.filter((alert) => alert.severity === "CRITICAL").length,
  };

  return {
    date: new Date().toISOString().slice(0, 10),
    summary,
    employeeWorkday,
    lunchAnalysis,
    alerts,
    terminalHealth,
    latestAttendance: sourceEvents.slice(0, 10),
    relevantEvents: sourceEvents
      .filter((event) => event.status === "OBSERVADO" || event.wasOffline || ["RECHAZADO", "PENDIENTE"].includes(event.status))
      .slice(0, 8),
  };
}
