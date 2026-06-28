const numericButtons = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

export default function NumericPad({ onDigit, onBackspace, onClear }) {
  return (
    <section className="pad-section" aria-label="Pad numerico">
      <div className="numeric-pad">
        {numericButtons.slice(0, 9).map((digit) => (
          <button className="terminal-button numeric-button" key={digit} onClick={() => onDigit(digit)}>
            {digit}
          </button>
        ))}
        <button className="terminal-button utility-button" onClick={onBackspace}>
          BORRAR
        </button>
        <button className="terminal-button numeric-button" onClick={() => onDigit("0")}>
          0
        </button>
        <button className="terminal-button utility-button" onClick={onClear}>
          LIMPIAR
        </button>
      </div>
    </section>
  );
}
