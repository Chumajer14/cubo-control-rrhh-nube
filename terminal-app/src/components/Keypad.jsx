const keypadRows = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["C", "0", "K"],
  ["OK"]
];

export default function Keypad({ state, onDigit, onK, onClear, onOk }) {
  const acceptsInput = state === "WAITING_RUT" || state === "ACTION_SELECTED" || state === "WAITING_PIN";
  const acceptsK = state === "WAITING_RUT" || state === "ACTION_SELECTED";

  function handleButton(value) {
    if (value === "C") {
      onClear();
      return;
    }

    if (value === "OK") {
      onOk();
      return;
    }

    if (value === "K") {
      onK();
      return;
    }

    onDigit(value);
  }

  return (
    <section className="keypad" aria-label="Panel numerico">
      {keypadRows.flatMap((row) =>
        row.map((value) => (
          <button
            className={`machine-button keypad-key keypad-key-${value.toLowerCase()}`}
            disabled={!acceptsInput || (value === "K" && !acceptsK)}
            key={value}
            onClick={() => handleButton(value)}
            type="button"
          >
            {value}
          </button>
        ))
      )}
    </section>
  );
}
