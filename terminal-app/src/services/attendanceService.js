import { findEmployeeByRun, validateEmployeePin } from "./mockEmployeeService";
import { getTerminalConfig, normalizeApiBaseUrl } from "./terminalConfigService";
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

export function deleteLocalEvent(eventId) {
  saveLocalEvents(getLocalEvents().filter((event) => event.id !== eventId));
}

export function getPendingEvents() {
  return getLocalEvents().filter((event) => event.syncStatus === "PENDING");
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

function buildPendingApiEvent({ run, eventType, terminalCode, timestamp }) {
  const timestampDate = new Date(timestamp);
  const timestampParts = createTimestampParts(Number.isNaN(timestampDate.getTime()) ? new Date() : timestampDate);

  return {
    id: createId(),
    run,
    eventType,
    terminalCode,
    ...timestampParts,
    syncStatus: "PENDING",
    source: "TERMINAL_PC",
    inputMethod: "QR_CEDULA_SCANNER",
    pendingReason: "REQUIRES_PIN_REVALIDATION"
  };
}

async function readJsonResponse(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

async function postMarkToApi({ payload, apiBaseUrl }) {
  const normalizedApiBaseUrl = normalizeApiBaseUrl(apiBaseUrl);
  const response = await fetch(`${normalizedApiBaseUrl}/attendance/mark`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  const data = await readJsonResponse(response);

  if (response.ok && data.ok === true) {
    return {
      ok: true,
      message: data.message || getSuccessMessage(payload.eventType),
      employeeName: data.employeeName,
      eventType: data.eventType,
      timestamp: data.timestamp,
      source: "AWS_API"
    };
  }

  return {
    ok: false,
    message: data.message || "ERROR API"
  };
}

export async function registerAttendanceEventApi({ run, pin, eventType, terminalCode, apiBaseUrl }) {
  const normalizedRun = String(run ?? "").trim().toUpperCase();
  const normalizedPin = String(pin ?? "");
  const normalizedTerminalCode = String(terminalCode ?? "").trim().toUpperCase();
  const normalizedApiBaseUrl = normalizeApiBaseUrl(apiBaseUrl);

  if (!normalizedRun) {
    return { ok: false, message: "RUN NO DETECTADO" };
  }

  if (!normalizedPin) {
    return { ok: false, message: "PIN INCORRECTO" };
  }

  if (!EVENT_LABELS[eventType]) {
    return { ok: false, message: "EVENTO INVALIDO" };
  }

  if (!normalizedTerminalCode) {
    return { ok: false, message: "TERMINAL SIN CONFIGURACION" };
  }

  if (!normalizedApiBaseUrl) {
    return { ok: false, message: "API NO CONFIGURADA" };
  }

  const timestamp = new Date().toISOString();
  const payload = {
    run: normalizedRun,
    pin: normalizedPin,
    eventType,
    terminalCode: normalizedTerminalCode,
    timestamp
  };

  try {
    return await postMarkToApi({ payload, apiBaseUrl: normalizedApiBaseUrl });
  } catch {
    const pendingEvent = buildPendingApiEvent({
      run: normalizedRun,
      eventType,
      terminalCode: normalizedTerminalCode,
      timestamp
    });
    appendLocalEvent(pendingEvent);
    return {
      ok: false,
      message: "SIN CONEXION - EVENTO GUARDADO PENDIENTE",
      pending: true,
      event: pendingEvent
    };
  }
}

export function registerAttendanceEventLocal({ run, pin, eventType, terminalCode }) {
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

  if (!EVENT_LABELS[eventType]) {
    return { ok: false, message: "EVENTO INVALIDO" };
  }

  if (!effectiveTerminalConfig.terminalCode) {
    return { ok: false, message: "TERMINAL SIN CONFIGURACION" };
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

  appendLocalEvent(event);
  return { ok: true, message: getSuccessMessage(eventType), event };
}

export async function registerAttendanceEvent({ run, pin, eventType }) {
  const config = getTerminalConfig();

  if (config.mode === "API") {
    return registerAttendanceEventApi({
      run,
      pin,
      eventType,
      terminalCode: config.terminalCode,
      apiBaseUrl: config.apiBaseUrl
    });
  }

  return registerAttendanceEventLocal({
    run,
    pin,
    eventType,
    terminalCode: config.terminalCode
  });
}
