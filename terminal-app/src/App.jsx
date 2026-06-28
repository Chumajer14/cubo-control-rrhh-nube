import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AdminModal from "./components/AdminModal";
import FunctionPad from "./components/FunctionPad";
import LedDisplay from "./components/LedDisplay";
import NumericPad from "./components/NumericPad";
import StatusMessage from "./components/StatusMessage";
import useScannerInput from "./hooks/useScannerInput";
import { registerAttendanceEvent } from "./services/attendanceService";
import { getTerminalConfig } from "./services/terminalConfigService";
import { EVENT_LABELS, FUNCTION_KEYS } from "./utils/eventTypes";
import { extractRunFromScan, maskRun } from "./utils/runParser";

const MAX_PIN_LENGTH = 8;
const TERMINAL_STATES = {
  IDLE: "IDLE",
  WAITING_SCAN: "WAITING_SCAN",
  WAITING_PIN: "WAITING_PIN",
  PROCESSING: "PROCESSING",
  SUCCESS: "SUCCESS",
  ERROR: "ERROR",
  ADMIN_AUTH: "ADMIN_AUTH",
  ADMIN_MODE: "ADMIN_MODE"
};

export default function App() {
  const [now, setNow] = useState(new Date());
  const [terminalState, setTerminalState] = useState(TERMINAL_STATES.IDLE);
  const [pin, setPin] = useState("");
  const [detectedRun, setDetectedRun] = useState("");
  const [status, setStatus] = useState({ message: "SELECCIONE ACCION", tone: "idle" });
  const [selectedEventType, setSelectedEventType] = useState(null);
  const [lastEvent, setLastEvent] = useState(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [terminalConfig, setTerminalConfig] = useState(() => getTerminalConfig());
  const resetTimerRef = useRef(null);
  const connectionStatusShownRef = useRef(false);

  const selectedEventLabel = useMemo(
    () => (selectedEventType ? EVENT_LABELS[selectedEventType] : ""),
    [selectedEventType]
  );

  useEffect(() => {
    const timerId = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timerId);
  }, []);

  useEffect(() => {
    return () => window.clearTimeout(resetTimerRef.current);
  }, []);

  const resetToIdle = useCallback((message = "SELECCIONE ACCION", tone = "idle") => {
    window.clearTimeout(resetTimerRef.current);
    setTerminalState(TERMINAL_STATES.IDLE);
    setSelectedEventType(null);
    setDetectedRun("");
    setPin("");
    setLastEvent(null);
    setStatus({ message, tone });
  }, []);

  useEffect(() => {
    if (connectionStatusShownRef.current || terminalConfig.mode !== "API") {
      return undefined;
    }

    connectionStatusShownRef.current = true;
    setStatus({ message: "CONECTANDO CON AWS...", tone: "busy" });
    const timerId = window.setTimeout(() => resetToIdle(), 900);

    return () => window.clearTimeout(timerId);
  }, [resetToIdle, terminalConfig.mode]);

  const finishWithStatus = useCallback((message, tone, event = null) => {
    window.clearTimeout(resetTimerRef.current);
    setTerminalState(tone === "success" ? TERMINAL_STATES.SUCCESS : TERMINAL_STATES.ERROR);
    setLastEvent(event);
    setStatus({ message, tone });

    resetTimerRef.current = window.setTimeout(() => {
      resetToIdle();
    }, 2600);
  }, [resetToIdle]);

  const appendPinDigit = useCallback((digit) => {
    if (terminalState !== TERMINAL_STATES.WAITING_PIN) {
      return;
    }

    setPin((current) => {
      if (current.length >= MAX_PIN_LENGTH) {
        return current;
      }

      return `${current}${digit}`;
    });
  }, [terminalState]);

  const removePinDigit = useCallback(() => {
    if (terminalState === TERMINAL_STATES.WAITING_PIN) {
      setPin((current) => current.slice(0, -1));
    }
  }, [terminalState]);

  const cancelOperation = useCallback(() => {
    finishWithStatus("OPERACION CANCELADA", "error");
  }, [finishWithStatus]);

  const confirmPin = useCallback(async () => {
    if (terminalState !== TERMINAL_STATES.WAITING_PIN || !selectedEventType || !detectedRun) {
      finishWithStatus("SELECCIONE ACCION", "error");
      return;
    }

    if (!pin) {
      finishWithStatus("PIN INCORRECTO", "error");
      return;
    }

    setTerminalState(TERMINAL_STATES.PROCESSING);
    setStatus({
      message: terminalConfig.mode === "API" ? "REGISTRANDO EN AWS..." : "REGISTRANDO...",
      tone: "busy"
    });

    const result = await registerAttendanceEvent({
      run: detectedRun,
      pin,
      eventType: selectedEventType
    });

    const resultEvent = result.event ?? {
      employeeName: result.employeeName,
      eventLabel: EVENT_LABELS[result.eventType] || EVENT_LABELS[selectedEventType]
    };
    finishWithStatus(result.message, result.ok ? "success" : "error", resultEvent);
  }, [detectedRun, finishWithStatus, pin, selectedEventType, terminalConfig.mode, terminalState]);

  const handleScanComplete = useCallback(
    (scanText) => {
      const parsedRun = extractRunFromScan(scanText);
      scanText = "";

      if (!parsedRun.ok) {
        finishWithStatus(parsedRun.error === "RUN_INVALIDO" ? "RUN INVALIDO" : "RUN NO DETECTADO", "error");
        return;
      }

      setDetectedRun(parsedRun.run);
      setPin("");
      setTerminalState(TERMINAL_STATES.WAITING_PIN);
      setStatus({ message: "INGRESE PIN", tone: "busy" });
    },
    [finishWithStatus]
  );

  useScannerInput({
    active: terminalState === TERMINAL_STATES.WAITING_SCAN && !adminOpen,
    onScanStart: useCallback(() => {
      setStatus({ message: "LEYENDO CEDULA...", tone: "busy" });
    }, []),
    onScanComplete: handleScanComplete
  });

  const selectEvent = useCallback(
    (eventType) => {
      window.clearTimeout(resetTimerRef.current);
      setSelectedEventType(eventType);
      setDetectedRun("");
      setPin("");
      setLastEvent(null);
      setTerminalState(TERMINAL_STATES.WAITING_SCAN);
      setStatus({ message: "ESCANEE CEDULA", tone: "busy" });
    },
    []
  );

  const handleFunction = useCallback(
    (keyName) => {
      if (keyName === "F6") {
        setStatus({ message: "MODO ADMINISTRADOR", tone: "busy" });
        setTerminalState(TERMINAL_STATES.ADMIN_AUTH);
        setAdminOpen(true);
        return;
      }

      const eventType = FUNCTION_KEYS[keyName];
      if (eventType) {
        if (terminalState !== TERMINAL_STATES.IDLE) {
          return;
        }
        selectEvent(eventType);
      }
    },
    [selectEvent, terminalState]
  );

  useEffect(() => {
    function handleKeyDown(event) {
      if (adminOpen) {
        return;
      }

      if (terminalState === TERMINAL_STATES.WAITING_SCAN) {
        if (event.key === "Escape") {
          event.preventDefault();
          cancelOperation();
        }
        return;
      }

      if (/^\d$/.test(event.key)) {
        event.preventDefault();
        appendPinDigit(event.key);
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        if (terminalState === TERMINAL_STATES.IDLE) {
          resetToIdle();
        } else {
          cancelOperation();
        }
        return;
      }

      if (event.key === "Backspace") {
        event.preventDefault();
        removePinDigit();
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        confirmPin();
        return;
      }

      if (/^F[1-6]$/.test(event.key)) {
        event.preventDefault();
        handleFunction(event.key);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    adminOpen,
    appendPinDigit,
    cancelOperation,
    confirmPin,
    handleFunction,
    removePinDigit,
    resetToIdle,
    terminalState
  ]);

  return (
    <main className="terminal-shell">
      <section className="terminal-device">
        <div className="device-topbar">
          <span className="brand-mark">CUBO</span>
          <span>{terminalConfig.branch}</span>
        </div>

        <div className="device-content">
          <div className="display-column">
            <LedDisplay
              now={now}
              terminalConfig={terminalConfig}
              terminalState={terminalState}
              selectedEventLabel={selectedEventLabel}
              maskedRun={maskRun(detectedRun)}
              pinLength={pin.length}
              statusMessage={status.message}
              lastEvent={lastEvent}
            />
            <StatusMessage message={status.message} tone={status.tone} />
          </div>

          <div className="controls-column">
            <FunctionPad
              onFunction={handleFunction}
              selectedFunction={
                selectedEventType
                  ? Object.entries(FUNCTION_KEYS).find(([, value]) => value === selectedEventType)?.[0]
                  : ""
              }
            />
            <NumericPad
              disabled={terminalState !== TERMINAL_STATES.WAITING_PIN}
              onDigit={appendPinDigit}
              onBackspace={removePinDigit}
              onCancel={cancelOperation}
              onEnter={confirmPin}
            />
          </div>
        </div>
      </section>

      {adminOpen ? (
        <AdminModal
          terminalConfig={terminalConfig}
          onConfigChange={setTerminalConfig}
          onAuthenticated={() => setTerminalState(TERMINAL_STATES.ADMIN_MODE)}
          onClose={() => {
            setAdminOpen(false);
            resetToIdle();
          }}
        />
      ) : null}
    </main>
  );
}
