import { findEmployeeByRun, validateEmployeePin } from "./mockEmployeeService";
import { getTerminalConfig } from "./terminalConfigService";
import { createTimestampParts } from "../utils/dateTime";
import { EVENT_LABELS, EVENT_TYPES, getSuccessMessage } from "../utils/eventTypes";

const EVENTS_STORAGE_KEY = "cubo.terminal.attendanceEvents";

function createId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `evt-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getLocalEvents() {
  const storedEvents = window.localStorage.getItem(EVENTS_STORAGE_KEY);

  if (!storedEvents) {
    return [];
  }

  try {
    return JSON.parse(storedEvents);
  } catch {
    return [];
  }
}

export function saveLocalEvents(events) {
  window.localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
}

export function clearLocalEvents() {
  saveLocalEvents([]);
}

function appendLocalEvent(event) {
  const events = getLocalEvents();
  saveLocalEvents([event, ...events]);
}

function findLastEvent(employeeRun, eventTypes) {
  return getLocalEvents().find(
    (event) => event.employeeRun === employeeRun && eventTypes.includes(event.eventType)
  );
}

function hasEventToday(employeeRun, eventType, localDate) {
  return getLocalEvents().some(
    (event) =>
      event.employeeRun === employeeRun &&
      event.eventType === eventType &&
      event.localDate === localDate
  );
}

function validateEventRules(employeeRun, eventType, localDate) {
  if (eventType === EVENT_TYPES.INGRESO) {
    const lastAttendance = findLastEvent(employeeRun, [EVENT_TYPES.INGRESO, EVENT_TYPES.SALIDA]);
    if (lastAttendance?.eventType === EVENT_TYPES.INGRESO) {
      return "INGRESO YA REGISTRADO";
    }
  }

  if (eventType === EVENT_TYPES.SALIDA) {
    const lastAttendance = findLastEvent(employeeRun, [EVENT_TYPES.INGRESO, EVENT_TYPES.SALIDA]);
    if (!lastAttendance || lastAttendance.eventType === EVENT_TYPES.SALIDA) {
      return "NO EXISTE INGRESO PREVIO";
    }
  }

  if (eventType === EVENT_TYPES.INICIO_ALMUERZO) {
    const lastLunch = findLastEvent(employeeRun, [
      EVENT_TYPES.INICIO_ALMUERZO,
      EVENT_TYPES.FIN_ALMUERZO
    ]);
    if (lastLunch?.eventType === EVENT_TYPES.INICIO_ALMUERZO) {
      return "ALMUERZO YA INICIADO";
    }
  }

  if (eventType === EVENT_TYPES.FIN_ALMUERZO) {
    const lastLunch = findLastEvent(employeeRun, [
      EVENT_TYPES.INICIO_ALMUERZO,
      EVENT_TYPES.FIN_ALMUERZO
    ]);
    if (!lastLunch || lastLunch.eventType === EVENT_TYPES.FIN_ALMUERZO) {
      return "NO EXISTE INICIO DE ALMUERZO";
    }
  }

  if (eventType === EVENT_TYPES.VALE_ALMUERZO && hasEventToday(employeeRun, eventType, localDate)) {
    return "VALE YA REGISTRADO HOY";
  }

  return null;
}

function buildAttendanceEvent({ employee, eventType, terminalConfig, syncStatus = "PENDING" }) {
  const timestampParts = createTimestampParts();

  return {
    id: createId(),
    employeeRun: employee.run,
    employeeName: employee.name,
    employeeArea: employee.area,
    terminalCode: terminalConfig.terminalCode,
    terminalName: terminalConfig.terminalName,
    eventType,
    eventLabel: EVENT_LABELS[eventType],
    ...timestampParts,
    source: "TERMINAL_PC",
    inputMethod: "QR_CEDULA_SCANNER",
    deviceMode: "KIOSK",
    syncStatus
  };
}

async function postEventToApi(event, apiBaseUrl) {
  const response = await fetch(`${apiBaseUrl}/attendance/mark`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(event)
  });

  if (!response.ok) {
    throw new Error("API attendance request failed");
  }

  return response.json();
}

export async function registerAttendanceEvent({ run, pin, eventType, terminalCode }) {
  const normalizedRun = String(run ?? "").trim().toUpperCase();
  const normalizedPin = String(pin ?? "");
  const terminalConfig = getTerminalConfig();
  const effectiveTerminalConfig = {
    ...terminalConfig,
    terminalCode: terminalCode || terminalConfig.terminalCode
  };
  const currentDate = createTimestampParts().localDate;

  if (!normalizedRun) {
    return { ok: false, message: "RUN NO DETECTADO" };
  }

  if (!effectiveTerminalConfig.terminalCode) {
    return { ok: false, message: "TERMINAL SIN CONFIGURACION" };
  }

  if (!EVENT_LABELS[eventType]) {
    return { ok: false, message: "EVENTO INVALIDO" };
  }

  const employee = findEmployeeByRun(normalizedRun);
  if (!employee) {
    return { ok: false, message: "EMPLEADO NO ENCONTRADO" };
  }

  if (!employee.active) {
    return { ok: false, message: "EMPLEADO INACTIVO" };
  }

  if (!validateEmployeePin(normalizedRun, normalizedPin)) {
    return { ok: false, message: "PIN INCORRECTO" };
  }

  const ruleMessage = validateEventRules(normalizedRun, eventType, currentDate);
  if (ruleMessage) {
    return { ok: false, message: ruleMessage };
  }

  const event = buildAttendanceEvent({
    employee,
    eventType,
    terminalConfig: effectiveTerminalConfig,
    syncStatus: effectiveTerminalConfig.mode === "API" ? "PENDING" : "LOCAL_ONLY"
  });

  if (effectiveTerminalConfig.mode === "API") {
    try {
      await postEventToApi(event, effectiveTerminalConfig.apiBaseUrl);
      const syncedEvent = { ...event, syncStatus: "SYNCED" };
      appendLocalEvent(syncedEvent);
      return { ok: true, message: getSuccessMessage(eventType), event: syncedEvent };
    } catch {
      appendLocalEvent(event);
      return { ok: true, message: `${getSuccessMessage(eventType)} - PENDIENTE`, event };
    }
  }

  appendLocalEvent(event);
  return { ok: true, message: getSuccessMessage(eventType), event };
}
