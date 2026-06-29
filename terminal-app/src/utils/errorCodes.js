export const ERROR_CODES = {
  EMPLOYEE_NOT_FOUND: {
    code: "ERROR-01",
    message: "CONTACTE RRHH",
    cause: "Persona ingresada no esta registrada en el sistema."
  },
  PIN_INCORRECT: {
    code: "ERROR-02",
    message: "PIN INCORRECTO",
    cause: "Clave invalida."
  },
  EMPLOYEE_INACTIVE: {
    code: "ERROR-03",
    message: "EMP INACTIVO",
    cause: "Trabajador desactivado."
  },
  TERMINAL_UNAUTHORIZED: {
    code: "ERROR-04",
    message: "TERM INVALIDO",
    cause: "Terminal no existe o esta inactivo."
  },
  MARK_NOT_ALLOWED: {
    code: "ERROR-05",
    message: "MARC NO PERMIT",
    cause: "Duplicidad o secuencia incorrecta."
  },
  RUN_INVALID: {
    code: "ERROR-06",
    message: "RUT INVALIDO",
    cause: "RUT mal ingresado o QR sin RUN extraible."
  },
  API_COMMUNICATION: {
    code: "ERROR-07",
    message: "SIN COMUNIC",
    cause: "API no responde, sin internet o timeout."
  },
  SYNC_ERROR: {
    code: "ERROR-08",
    message: "ERROR SYNC",
    cause: "Evento offline no pudo sincronizarse."
  },
  TERMINAL_CONFIG: {
    code: "ERROR-09",
    message: "CONFIG TERMINAL",
    cause: "Falta terminalCode, apiBaseUrl o modo valido."
  },
  INTERNAL: {
    code: "ERROR-10",
    message: "ERROR INTERNO",
    cause: "Error no controlado."
  },
  ADMIN_PIN: {
    code: "ERROR-11",
    message: "PIN ADMIN",
    cause: "PIN tecnico invalido."
  }
};

const API_ERROR_MAP = new Map([
  ["EMPLEADO NO ENCONTRADO", ERROR_CODES.EMPLOYEE_NOT_FOUND],
  ["PIN INCORRECTO", ERROR_CODES.PIN_INCORRECT],
  ["EMPLEADO INACTIVO", ERROR_CODES.EMPLOYEE_INACTIVE],
  ["TERMINAL NO ENCONTRADO", ERROR_CODES.TERMINAL_UNAUTHORIZED],
  ["TERMINAL INACTIVO", ERROR_CODES.TERMINAL_UNAUTHORIZED],
  ["INGRESO YA REGISTRADO", ERROR_CODES.MARK_NOT_ALLOWED],
  ["NO EXISTE INGRESO PREVIO", ERROR_CODES.MARK_NOT_ALLOWED],
  ["ALMUERZO YA INICIADO", ERROR_CODES.MARK_NOT_ALLOWED],
  ["NO EXISTE INICIO DE ALMUERZO", ERROR_CODES.MARK_NOT_ALLOWED],
  ["TIPO DE EVENTO INVALIDO", ERROR_CODES.MARK_NOT_ALLOWED],
  ["TIPO DE EVENTO INVÁLIDO", ERROR_CODES.MARK_NOT_ALLOWED],
  ["EVENTO INVALIDO", ERROR_CODES.MARK_NOT_ALLOWED],
  ["VALE YA REGISTRADO HOY", ERROR_CODES.MARK_NOT_ALLOWED]
]);

export function mapApiMessageToError(message) {
  const normalizedMessage = String(message ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();

  return API_ERROR_MAP.get(normalizedMessage) ?? ERROR_CODES.INTERNAL;
}

export function createErrorResult(error, apiMessage = "") {
  return {
    ok: false,
    errorCode: error.code,
    errorMessage: error.message,
    message: `${error.code} ${error.message}`,
    apiMessage
  };
}
