const numericButtons = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

export default function NumericPad({ onDigit, onBackspace, onCancel, onEnter, disabled }) {
  return (
    <section className="pad-section" aria-label="Pad numerico">
      <div className="numeric-pad">
        {numericButtons.slice(0, 9).map((digit) => (
          <button
            className="terminal-button numeric-button"
            disabled={disabled}
            key={digit}
            onClick={() => onDigit(digit)}
          >
            {digit}
          </button>
        ))}
        <button className="terminal-button utility-button" disabled={disabled} onClick={onBackspace}>
          BORRAR
        </button>
        <button className="terminal-button numeric-button" disabled={disabled} onClick={() => onDigit("0")}>
          0
        </button>
        <button className="terminal-button utility-button" disabled={disabled} onClick={onEnter}>
          ENTER
        </button>
        <button className="terminal-button utility-button cancel-button" onClick={onCancel}>
          CANCELAR
        </button>
      </div>
    </section>
  );
}
