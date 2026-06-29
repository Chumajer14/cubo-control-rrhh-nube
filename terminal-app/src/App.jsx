import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AdminModal from "./components/AdminModal";
import ClockDevice from "./components/ClockDevice";
import { registerAttendanceEvent } from "./services/attendanceService";
import { getOfflineQueueStats } from "./services/offlineQueueService";
import { checkApiHealth, syncPendingEvents } from "./services/syncService";
import { getTerminalConfig } from "./services/terminalConfigService";
import {
  EVENT_LCD_LABELS,
  FUNCTION_KEYS,
  getOfflineLcdLines,
  getOnlineLcdLines
} from "./utils/eventTypes";
import { ERROR_CODES } from "./utils/errorCodes";
import { createTimestampParts } from "./utils/dateTime";
import { extractRunFromScan, formatManualRunInput, parseManualRun } from "./utils/runParser";

const MAX_PIN_LENGTH = 8;
const SCANNER_IDLE_TIMEOUT_MS = 180;
const TERMINAL_STATES = {
  IDLE: "IDLE",
  ACTION_SELECTED: "ACTION_SELECTED",
  WAITING_RUT: "WAITING_RUT",
  WAITING_PIN: "WAITING_PIN",
  PROCESSING_ONLINE: "PROCESSING_ONLINE",
  SUCCESS_ONLINE: "SUCCESS_ONLINE",
  SUCCESS_OFFLINE: "SUCCESS_OFFLINE",
  ERROR: "ERROR",
  ADMIN_AUTH: "ADMIN_AUTH",
  ADMIN_MODE: "ADMIN_MODE",
  SYNCING: "SYNCING"
};

function getFunctionKeyByEvent(eventType) {
  return Object.entries(FUNCTION_KEYS).find(([, value]) => value === eventType)?.[0] || "";
}

function shouldTreatBufferAsScan(buffer) {
  const value = String(buffer ?? "").toLowerCase();
  return value.includes("run") || value.includes("http") || /[?&=¿'/:]/.test(value) || value.length > 12;
}

function createVoucher({ result, run, eventType, terminalCode, offline }) {
  const timestampParts = createTimestampParts(result.timestamp ? new Date(result.timestamp) : new Date());
  return {
    employeeName: result.employeeName || "NO DISPONIBLE",
    run,
    eventType,
    terminalCode,
    localDate: timestampParts.localDate,
    localTime: timestampParts.localTime,
    status: offline ? "REGISTRADO OFFLINE" : "REGISTRADO OK",
    syncStatus: offline ? "PENDIENTE" : ""
  };
}

export default function App() {
  const [now, setNow] = useState(new Date());
  const [terminalState, setTerminalState] = useState(TERMINAL_STATES.IDLE);
  const [terminalConfig, setTerminalConfig] = useState(() => getTerminalConfig());
  const [selectedEventType, setSelectedEventType] = useState(null);
  const [rutInput, setRutInput] = useState("");
  const [detectedRun, setDetectedRun] = useState("");
  const [inputMethod, setInputMethod] = useState("MANUAL_RUT");
  const [pin, setPin] = useState("");
  const [lcdLines, setLcdLines] = useState(["SELECCIONE ACCION"]);
  const [adminOpen, setAdminOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("ONLINE");
  const [pendingCount, setPendingCount] = useState(() => getOfflineQueueStats().pending);
  const [voucher, setVoucher] = useState(null);
  const resetTimerRef = useRef(null);
  const scannerBufferRef = useRef("");
  const scannerTimerRef = useRef(null);

  const selectedFunction = useMemo(() => getFunctionKeyByEvent(selectedEventType), [selectedEventType]);

  const refreshQueueStats = useCallback(() => {
    setPendingCount(getOfflineQueueStats().pending);
  }, []);

  const resetToIdle = useCallback(() => {
    window.clearTimeout(resetTimerRef.current);
    window.clearTimeout(scannerTimerRef.current);
    scannerBufferRef.current = "";
    setTerminalState(TERMINAL_STATES.IDLE);
    setSelectedEventType(null);
    setRutInput("");
    setDetectedRun("");
    setInputMethod("MANUAL_RUT");
    setPin("");
    setLcdLines(["SELECCIONE ACCION"]);
    refreshQueueStats();
  }, [refreshQueueStats]);

  const finishAfterDelay = useCallback(
    (state, lines, nextVoucher = null) => {
      window.clearTimeout(resetTimerRef.current);
      setTerminalState(state);
      setLcdLines(lines);
      if (nextVoucher) {
        setVoucher(nextVoucher);
      }
      resetTimerRef.current = window.setTimeout(resetToIdle, 3600);
    },
    [resetToIdle]
  );

  const showError = useCallback(
    (errorCode = ERROR_CODES.INTERNAL) => {
      finishAfterDelay(TERMINAL_STATES.ERROR, [errorCode.code, errorCode.message]);
    },
    [finishAfterDelay]
  );

  const promptForRut = useCallback((eventType) => {
    setSelectedEventType(eventType);
    setRutInput("");
    setDetectedRun("");
    setPin("");
    setInputMethod("MANUAL_RUT");
    setTerminalState(TERMINAL_STATES.WAITING_RUT);
    setLcdLines([EVENT_LCD_LABELS[eventType], "RUT:", "ESCANEE O DIGITE"]);
  }, []);

  const confirmRut = useCallback(
    (source = "MANUAL_RUT", rawScan = "") => {
      const parsedRun = source === "QR_CEDULA_SCANNER" ? extractRunFromScan(rawScan) : parseManualRun(rutInput);
      scannerBufferRef.current = "";
      window.clearTimeout(scannerTimerRef.current);

      if (!parsedRun.ok) {
        showError(ERROR_CODES.RUN_INVALID);
        return;
      }

      setDetectedRun(parsedRun.run);
      setInputMethod(source);
      setPin("");
      setTerminalState(TERMINAL_STATES.WAITING_PIN);
      setLcdLines(["PIN:"]);
    },
    [rutInput, showError]
  );

  const processScannerBuffer = useCallback(() => {
    const scanText = scannerBufferRef.current;
    if (!shouldTreatBufferAsScan(scanText)) {
      return;
    }

    confirmRut("QR_CEDULA_SCANNER", scanText);
  }, [confirmRut]);

  const appendRutCharacter = useCallback((value) => {
    setRutInput((current) => formatManualRunInput(`${current}${value}`));
  }, []);

  const appendPinDigit = useCallback((digit) => {
    setPin((current) => (current.length >= MAX_PIN_LENGTH ? current : `${current}${digit}`));
  }, []);

  const clearCurrentField = useCallback(() => {
    if (terminalState === TERMINAL_STATES.WAITING_PIN) {
      setPin("");
      return;
    }

    if (terminalState === TERMINAL_STATES.WAITING_RUT || terminalState === TERMINAL_STATES.ACTION_SELECTED) {
      scannerBufferRef.current = "";
      setRutInput("");
    }
  }, [terminalState]);

  const confirmPin = useCallback(async () => {
    if (!selectedEventType || !detectedRun || !pin) {
      showError(ERROR_CODES.PIN_INCORRECT);
      return;
    }

    setTerminalState(TERMINAL_STATES.PROCESSING_ONLINE);
    setLcdLines(["REGISTRANDO", "ESPERE..."]);

    const result = await registerAttendanceEvent({
      run: detectedRun,
      pin,
      eventType: selectedEventType,
      inputMethod
    });
    setPin("");

    if (!result.ok) {
      showError({ code: result.errorCode || ERROR_CODES.INTERNAL.code, message: result.errorMessage || ERROR_CODES.INTERNAL.message });
      return;
    }

    const nextVoucher = createVoucher({
      result,
      run: detectedRun,
      eventType: selectedEventType,
      terminalCode: terminalConfig.terminalCode,
      offline: Boolean(result.offline)
    });
    refreshQueueStats();

    if (result.offline) {
      finishAfterDelay(TERMINAL_STATES.SUCCESS_OFFLINE, getOfflineLcdLines(selectedEventType), nextVoucher);
      return;
    }

    finishAfterDelay(
      TERMINAL_STATES.SUCCESS_ONLINE,
      getOnlineLcdLines(selectedEventType, result.employeeName),
      nextVoucher
    );
  }, [
    detectedRun,
    finishAfterDelay,
    inputMethod,
    pin,
    refreshQueueStats,
    selectedEventType,
    showError,
    terminalConfig.terminalCode
  ]);

  const handleOk = useCallback(() => {
    if (terminalState === TERMINAL_STATES.WAITING_RUT || terminalState === TERMINAL_STATES.ACTION_SELECTED) {
      if (shouldTreatBufferAsScan(scannerBufferRef.current)) {
        confirmRut("QR_CEDULA_SCANNER", scannerBufferRef.current);
        return;
      }
      confirmRut("MANUAL_RUT");
      return;
    }

    if (terminalState === TERMINAL_STATES.WAITING_PIN) {
      confirmPin();
    }
  }, [confirmPin, confirmRut, terminalState]);

  const handleFunction = useCallback(
    (keyName) => {
      if (keyName === "F6") {
        setAdminOpen(true);
        setTerminalState(TERMINAL_STATES.ADMIN_AUTH);
        setLcdLines(["ADMIN", "PIN TECNICO"]);
        return;
      }

      const eventType = FUNCTION_KEYS[keyName];
      if (terminalState === TERMINAL_STATES.IDLE && eventType) {
        setTerminalState(TERMINAL_STATES.ACTION_SELECTED);
        promptForRut(eventType);
      }
    },
    [promptForRut, terminalState]
  );

  const handleDigit = useCallback(
    (digit) => {
      if (terminalState === TERMINAL_STATES.WAITING_PIN) {
        appendPinDigit(digit);
        return;
      }

      if (terminalState === TERMINAL_STATES.WAITING_RUT || terminalState === TERMINAL_STATES.ACTION_SELECTED) {
        appendRutCharacter(digit);
      }
    },
    [appendPinDigit, appendRutCharacter, terminalState]
  );

  const handleK = useCallback(() => {
    if (terminalState === TERMINAL_STATES.WAITING_RUT || terminalState === TERMINAL_STATES.ACTION_SELECTED) {
      appendRutCharacter("K");
    }
  }, [appendRutCharacter, terminalState]);

  useEffect(() => {
    const timerId = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timerId);
  }, []);

  useEffect(() => {
    function handleQueueChanged() {
      refreshQueueStats();
    }

    window.addEventListener("cubo:offline-queue-changed", handleQueueChanged);
    return () => window.removeEventListener("cubo:offline-queue-changed", handleQueueChanged);
  }, [refreshQueueStats]);

  useEffect(() => {
    let stopped = false;

    async function updateConnection() {
      if (terminalConfig.mode !== "API") {
        setConnectionStatus("LOCAL_MOCK");
        return;
      }

      const health = await checkApiHealth(terminalConfig);
      if (!stopped) {
        setConnectionStatus(health.online ? "ONLINE" : "OFFLINE");
      }
    }

    updateConnection();
    const timerId = window.setInterval(updateConnection, 15000);

    return () => {
      stopped = true;
      window.clearInterval(timerId);
    };
  }, [terminalConfig]);

  useEffect(() => {
    if (terminalConfig.mode !== "API") {
      return undefined;
    }

    async function runSync() {
      const stats = getOfflineQueueStats();
      if (stats.pending === 0) {
        refreshQueueStats();
        return;
      }

      setConnectionStatus("SYNCING");
      await syncPendingEvents(terminalConfig);
      refreshQueueStats();
      const health = await checkApiHealth(terminalConfig);
      setConnectionStatus(health.online ? "ONLINE" : "OFFLINE");
    }

    const timerId = window.setInterval(runSync, 15000);
    return () => window.clearInterval(timerId);
  }, [refreshQueueStats, terminalConfig]);

  useEffect(() => {
    return () => {
      window.clearTimeout(resetTimerRef.current);
      window.clearTimeout(scannerTimerRef.current);
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event) {
      if (adminOpen) {
        return;
      }

      if (/^F[1-6]$/.test(event.key)) {
        event.preventDefault();
        handleFunction(event.key);
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        resetToIdle();
        return;
      }

      if (terminalState === TERMINAL_STATES.WAITING_RUT || terminalState === TERMINAL_STATES.ACTION_SELECTED) {
        if (event.key === "Enter") {
          event.preventDefault();
          handleOk();
          return;
        }

        if (event.key === "Backspace") {
          event.preventDefault();
          setRutInput((current) => formatManualRunInput(current.slice(0, -1)));
          return;
        }

        if (event.key.length === 1) {
          event.preventDefault();
          scannerBufferRef.current += event.key;
          if (/^[0-9kK-]$/.test(event.key)) {
            appendRutCharacter(event.key);
          }
          window.clearTimeout(scannerTimerRef.current);
          scannerTimerRef.current = window.setTimeout(processScannerBuffer, SCANNER_IDLE_TIMEOUT_MS);
        }
        return;
      }

      if (terminalState === TERMINAL_STATES.WAITING_PIN) {
        if (/^\d$/.test(event.key)) {
          event.preventDefault();
          appendPinDigit(event.key);
          return;
        }

        if (event.key === "Backspace") {
          event.preventDefault();
          setPin((current) => current.slice(0, -1));
          return;
        }

        if (event.key === "Enter") {
          event.preventDefault();
          confirmPin();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    adminOpen,
    appendPinDigit,
    appendRutCharacter,
    confirmPin,
    handleFunction,
    handleOk,
    processScannerBuffer,
    resetToIdle,
    terminalState
  ]);

  return (
    <main className="terminal-shell">
      <ClockDevice
        connectionStatus={connectionStatus}
        lcdLines={lcdLines}
        now={now}
        onClear={clearCurrentField}
        onDigit={handleDigit}
        onFunction={handleFunction}
        onK={handleK}
        onOk={handleOk}
        pendingCount={pendingCount}
        pinLength={terminalState === TERMINAL_STATES.WAITING_PIN ? pin.length : 0}
        rutInput={terminalState === TERMINAL_STATES.WAITING_RUT ? rutInput : ""}
        selectedFunction={selectedFunction}
        terminalConfig={terminalConfig}
        terminalState={terminalState}
        voucher={voucher}
      />

      {adminOpen ? (
        <AdminModal
          connectionStatus={connectionStatus}
          onAuthenticated={() => setTerminalState(TERMINAL_STATES.ADMIN_MODE)}
          onClose={() => {
            setAdminOpen(false);
            resetToIdle();
          }}
          onConfigChange={setTerminalConfig}
          onSync={async () => {
            setConnectionStatus("SYNCING");
            await syncPendingEvents(terminalConfig);
            refreshQueueStats();
          }}
          terminalConfig={terminalConfig}
        />
      ) : null}
    </main>
  );
}
