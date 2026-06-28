import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AdminModal from "./components/AdminModal";
import FunctionPad from "./components/FunctionPad";
import LedDisplay from "./components/LedDisplay";
import NumericPad from "./components/NumericPad";
import StatusMessage from "./components/StatusMessage";
import { registerAttendanceEvent } from "./services/attendanceService";
import { getTerminalConfig } from "./services/terminalConfigService";
import { EVENT_LABELS, FUNCTION_KEYS } from "./utils/eventTypes";

const MAX_CODE_LENGTH = 10;

export default function App() {
  const [now, setNow] = useState(new Date());
  const [employeeCode, setEmployeeCode] = useState("");
  const [status, setStatus] = useState({ message: "INGRESE CODIGO", tone: "idle" });
  const [lastAction, setLastAction] = useState(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [terminalConfig, setTerminalConfig] = useState(() => getTerminalConfig());
  const resetTimerRef = useRef(null);

  const selectedEventLabel = useMemo(
    () => (lastAction ? EVENT_LABELS[lastAction] : ""),
    [lastAction]
  );

  useEffect(() => {
    const timerId = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timerId);
  }, []);

  useEffect(() => {
    return () => window.clearTimeout(resetTimerRef.current);
  }, []);

  const setTemporaryStatus = useCallback((message, tone = "idle", clearCode = false) => {
    window.clearTimeout(resetTimerRef.current);
    setStatus({ message, tone });

    resetTimerRef.current = window.setTimeout(() => {
      if (clearCode) {
        setEmployeeCode("");
      }
      setStatus({ message: "INGRESE CODIGO", tone: "idle" });
    }, 2600);
  }, []);

  const appendDigit = useCallback((digit) => {
    setEmployeeCode((current) => {
      if (current.length >= MAX_CODE_LENGTH) {
        return current;
      }

      return `${current}${digit}`;
    });
  }, []);

  const removeDigit = useCallback(() => {
    setEmployeeCode((current) => current.slice(0, -1));
  }, []);

  const clearCode = useCallback(() => {
    setEmployeeCode("");
    setStatus({ message: "INGRESE CODIGO", tone: "idle" });
  }, []);

  const executeEvent = useCallback(
    async (eventType) => {
      setLastAction(eventType);
      setStatus({ message: "REGISTRANDO...", tone: "busy" });

      const result = await registerAttendanceEvent({
        employeeCode,
        eventType
      });

      setTemporaryStatus(result.message, result.ok ? "success" : "error", result.ok);
    },
    [employeeCode, setTemporaryStatus]
  );

  const handleFunction = useCallback(
    (keyName) => {
      if (keyName === "F6") {
        setStatus({ message: "MODO ADMINISTRADOR", tone: "busy" });
        setAdminOpen(true);
        return;
      }

      const eventType = FUNCTION_KEYS[keyName];
      if (eventType) {
        executeEvent(eventType);
      }
    },
    [executeEvent]
  );

  useEffect(() => {
    function handleKeyDown(event) {
      if (adminOpen) {
        return;
      }

      if (/^\d$/.test(event.key)) {
        event.preventDefault();
        appendDigit(event.key);
        return;
      }

      if (event.key === "Backspace") {
        event.preventDefault();
        removeDigit();
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        clearCode();
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        if (lastAction) {
          executeEvent(lastAction);
        } else {
          setTemporaryStatus("SELECCIONE ACCION F1-F5", "error");
        }
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
    appendDigit,
    clearCode,
    executeEvent,
    handleFunction,
    lastAction,
    removeDigit,
    setTemporaryStatus
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
              code={employeeCode}
              now={now}
              terminalConfig={terminalConfig}
              selectedEventLabel={selectedEventLabel}
            />
            <StatusMessage message={status.message} tone={status.tone} />
          </div>

          <div className="controls-column">
            <FunctionPad
              onFunction={handleFunction}
              selectedFunction={
                lastAction
                  ? Object.entries(FUNCTION_KEYS).find(([, value]) => value === lastAction)?.[0]
                  : ""
              }
            />
            <NumericPad onDigit={appendDigit} onBackspace={removeDigit} onClear={clearCode} />
          </div>
        </div>
      </section>

      {adminOpen ? (
        <AdminModal
          terminalConfig={terminalConfig}
          onConfigChange={setTerminalConfig}
          onClose={() => {
            setAdminOpen(false);
            setStatus({ message: "INGRESE CODIGO", tone: "idle" });
          }}
        />
      ) : null}
    </main>
  );
}
