import { formatClock } from "../utils/dateTime";

export default function LcdScreen({ now, lines, rutInput, pinLength, terminalCode }) {
  return (
    <section className="lcd-screen" aria-label="Pantalla LCD">
      <div className="lcd-topline">
        <span>{formatClock(now)}</span>
        <span>{terminalCode}</span>
      </div>

      <div className="lcd-lines">
        {lines.map((line) => (
          <div key={line}>{line}</div>
        ))}
        {rutInput ? <div>RUT: {rutInput}</div> : null}
        {pinLength > 0 ? <div>PIN: {"*".repeat(pinLength)}</div> : null}
      </div>
    </section>
  );
}
