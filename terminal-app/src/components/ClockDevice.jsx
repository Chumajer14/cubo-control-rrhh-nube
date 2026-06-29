import ConnectionStatus from "./ConnectionStatus";
import FunctionButtons from "./FunctionButtons";
import Keypad from "./Keypad";
import LcdScreen from "./LcdScreen";
import PrintedVoucher from "./PrintedVoucher";

export default function ClockDevice({
  lcdLines,
  terminalConfig,
  terminalState,
  connectionStatus,
  pendingCount,
  selectedFunction,
  voucher,
  onFunction,
  onDigit,
  onK,
  onClear,
  onOk
}) {
  return (
    <div className="clock-device-shell">
      <section className="clock-device" aria-label="Reloj control CUBO">
        <div className="device-brand-row">
          <strong>CUBO CONTROL</strong>
          <span>{terminalConfig.terminalName}</span>
        </div>

        <ConnectionStatus status={connectionStatus} pendingCount={pendingCount} />

        <LcdScreen
          lines={lcdLines}
        />

        <div className="device-controls">
          <FunctionButtons
            disabled={terminalState !== "IDLE"}
            onFunction={onFunction}
            selectedFunction={selectedFunction}
          />
          <Keypad
            onClear={onClear}
            onDigit={onDigit}
            onK={onK}
            onOk={onOk}
            state={terminalState}
          />
        </div>
      </section>

      <PrintedVoucher voucher={voucher} />
    </div>
  );
}
