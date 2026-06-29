import { findEmployeeByRun, validateEmployeePin } from "./mockEmployeeService";
import { enqueueOfflineEvent } from "./offlineQueueService";
import { fetchWithTimeout } from "./syncService";
import { getTerminalConfig, normalizeApiBaseUrl } from "./terminalConfigService";
import { createTimestampParts } from "../utils/dateTime";
import { ERROR_CODES, createErrorResult, mapApiMessageToError } from "../utils/errorCodes";
import {
  EVENT_LABELS,
  EVENT_TYPES,
  getOfflineSuccessMessage,
  getSuccessMessage
} from "../utils/eventTypes";

const EVENTS_STORAGE_KEY = "cubo.terminal.attendanceEvents";
const REQUEST_TIMEOUT_MS = 5000;

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
  saveLocalEvents([event, ...getLocalEvents()]);
}

function findLastEvent(employeeRun, eventTypes) {
  return getLocalEvents().find(
    (event) => event.employeeRun === employeeRun && eventTypes.includes(event.eventType)
  );
}

function findLastWorkShiftEvent(employeeRun) {
  return findLastEvent(employeeRun, [EVENT_TYPES.INGRESO, EVENT_TYPES.SALIDA]);
}

function hasActiveWorkShift(employeeRun) {
  return findLastWorkShiftEvent(employeeRun)?.eventType === EVENT_TYPES.INGRESO;
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
  const workShiftRequiredEvents = [
    EVENT_TYPES.SALIDA,
    EVENT_TYPES.VALE_ALMUERZO,
    EVENT_TYPES.INICIO_ALMUERZO,
    EVENT_TYPES.FIN_ALMUERZO
  ];

  if (workShiftRequiredEvents.includes(eventType) && !hasActiveWorkShift(employeeRun)) {
    return "NO EXISTE INGRESO PREVIO";
  }

  if (eventType === EVENT_TYPES.INGRESO) {
    const lastAttendance = findLastWorkShiftEvent(employeeRun);
    if (lastAttendance?.eventType === EVENT_TYPES.INGRESO) {
      return "INGRESO YA REGISTRADO";
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

function buildLocalEvent({ employee, eventType, terminalConfig, inputMethod, syncStatus = "LOCAL_ONLY" }) {
  return {
    id: createId(),
    employeeRun: employee.run,
    employeeName: employee.name,
    employeeArea: employee.area,
    terminalCode: terminalConfig.terminalCode,
    terminalName: terminalConfig.terminalName,
    eventType,
    eventLabel: EVENT_LABELS[eventType],
    ...createTimestampParts(),
    source: "TERMINAL_PC",
    inputMethod,
    deviceMode: "KIOSK",
    syncStatus
  };
}

function buildMirrorEvent({ run, employeeName, eventType, terminalCode, timestamp, inputMethod, source, syncStatus }) {
  const timestampDate = timestamp ? new Date(timestamp) : new Date();
  const timestampParts = createTimestampParts(Number.isNaN(timestampDate.getTime()) ? new Date() : timestampDate);

  return {
    id: createId(),
    employeeRun: run,
    employeeName: employeeName || "NO DISPONIBLE",
    terminalCode,
    eventType,
    eventLabel: EVENT_LABELS[eventType],
    ...timestampParts,
    source,
    inputMethod,
    deviceMode: "KIOSK",
    syncStatus
  };
}

function buildOfflineResult({ run, eventType, terminalCode, timestamp, inputMethod }) {
  const ruleMessage = validateEventRules(run, eventType, createTimestampParts(new Date(timestamp)).localDate);
  if (ruleMessage) {
    return createErrorResult(mapApiMessageToError(ruleMessage), ruleMessage);
  }

  const offlineEvent = enqueueOfflineEvent({
    run,
    eventType,
    terminalCode,
    timestamp,
    inputMethod
  });

  appendLocalEvent(
    buildMirrorEvent({
      run,
      eventType,
      terminalCode,
      timestamp,
      inputMethod,
      source: "OFFLINE_QUEUE",
      syncStatus: "PENDING"
    })
  );

  return {
    ok: true,
    offline: true,
    message: getOfflineSuccessMessage(eventType),
    employeeName: "NO DISPONIBLE",
    eventType,
    timestamp,
    source: "OFFLINE_QUEUE",
    event: offlineEvent
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
  const response = await fetchWithTimeout(
    `${normalizeApiBaseUrl(apiBaseUrl)}/attendance/mark`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    },
    REQUEST_TIMEOUT_MS
  );
  const data = await readJsonResponse(response);

  if (response.ok && data.ok === true) {
    appendLocalEvent(
      buildMirrorEvent({
        run: payload.run,
        employeeName: data.employeeName,
        eventType: data.eventType || payload.eventType,
        terminalCode: payload.terminalCode,
        timestamp: data.timestamp || payload.timestamp,
        inputMethod: payload.inputMethod,
        source: "AWS_API",
        syncStatus: "SYNCED"
      })
    );

    return {
      ok: true,
      message: data.message || getSuccessMessage(payload.eventType),
      employeeName: data.employeeName,
      eventType: data.eventType || payload.eventType,
      timestamp: data.timestamp || payload.timestamp,
      source: "AWS_API"
    };
  }

  if (response.status >= 500) {
    return { networkFailure: true };
  }

  return createErrorResult(mapApiMessageToError(data.message), data.message);
}

export async function registerAttendanceEventApi({
  run,
  pin,
  eventType,
  terminalCode,
  apiBaseUrl,
  inputMethod
}) {
  const normalizedRun = String(run ?? "").trim().toUpperCase();
  const normalizedPin = String(pin ?? "");
  const normalizedTerminalCode = String(terminalCode ?? "").trim().toUpperCase();
  const normalizedApiBaseUrl = normalizeApiBaseUrl(apiBaseUrl);

  if (!normalizedRun || !EVENT_LABELS[eventType]) {
    return createErrorResult(ERROR_CODES.RUN_INVALID);
  }

  if (!normalizedPin) {
    return createErrorResult(ERROR_CODES.PIN_INCORRECT);
  }

  if (!normalizedTerminalCode || !normalizedApiBaseUrl) {
    return createErrorResult(ERROR_CODES.TERMINAL_CONFIG);
  }

  const timestampParts = createTimestampParts();
  const timestamp = timestampParts.timestamp;
  const payload = {
    run: normalizedRun,
    pin: normalizedPin,
    eventType,
    terminalCode: normalizedTerminalCode,
    timestamp,
    localDate: timestampParts.localDate,
    localTime: timestampParts.localTime,
    inputMethod
  };

  try {
    const result = await postMarkToApi({ payload, apiBaseUrl: normalizedApiBaseUrl });
    if (result.networkFailure) {
      return buildOfflineResult({
        run: normalizedRun,
        eventType,
        terminalCode: normalizedTerminalCode,
        timestamp,
        inputMethod
      });
    }

    return result;
  } catch {
    return buildOfflineResult({
      run: normalizedRun,
      eventType,
      terminalCode: normalizedTerminalCode,
      timestamp,
      inputMethod
    });
  }
}

export function registerAttendanceEventLocal({ run, pin, eventType, terminalCode, inputMethod }) {
  const normalizedRun = String(run ?? "").trim().toUpperCase();
  const normalizedPin = String(pin ?? "");
  const terminalConfig = getTerminalConfig();
  const effectiveTerminalConfig = {
    ...terminalConfig,
    terminalCode: terminalCode || terminalConfig.terminalCode
  };
  const currentDate = createTimestampParts().localDate;

  if (!normalizedRun || !EVENT_LABELS[eventType]) {
    return createErrorResult(ERROR_CODES.RUN_INVALID);
  }

  if (!effectiveTerminalConfig.terminalCode) {
    return createErrorResult(ERROR_CODES.TERMINAL_CONFIG);
  }

  const employee = findEmployeeByRun(normalizedRun);
  if (!employee) {
    return createErrorResult(ERROR_CODES.EMPLOYEE_NOT_FOUND, "EMPLEADO NO ENCONTRADO");
  }

  if (!employee.active) {
    return createErrorResult(ERROR_CODES.EMPLOYEE_INACTIVE, "EMPLEADO INACTIVO");
  }

  if (!validateEmployeePin(normalizedRun, normalizedPin)) {
    return createErrorResult(ERROR_CODES.PIN_INCORRECT, "PIN INCORRECTO");
  }

  const ruleMessage = validateEventRules(normalizedRun, eventType, currentDate);
  if (ruleMessage) {
    return createErrorResult(mapApiMessageToError(ruleMessage), ruleMessage);
  }

  const event = buildLocalEvent({
    employee,
    eventType,
    terminalConfig: effectiveTerminalConfig,
    inputMethod
  });

  appendLocalEvent(event);
  return {
    ok: true,
    message: getSuccessMessage(eventType),
    employeeName: employee.name,
    eventType,
    timestamp: event.timestamp,
    source: "LOCAL_MOCK",
    event
  };
}

export async function registerAttendanceEvent({ run, pin, eventType, inputMethod }) {
  const config = getTerminalConfig();

  if (config.mode === "API") {
    return registerAttendanceEventApi({
      run,
      pin,
      eventType,
      terminalCode: config.terminalCode,
      apiBaseUrl: config.apiBaseUrl,
      inputMethod
    });
  }

  return registerAttendanceEventLocal({
    run,
    pin,
    eventType,
    terminalCode: config.terminalCode,
    inputMethod
  });
}
