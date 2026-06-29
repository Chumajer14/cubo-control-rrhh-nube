const functionButtons = [
  "F1",
  "F2",
  "F3",
  "F4",
  "F5",
  "F6"
];

export default function FunctionButtons({ onFunction, selectedFunction, disabled }) {
  return (
    <section className="function-buttons" aria-label="Botones de funcion">
      {functionButtons.map((keyName) => (
        <button
          className={`machine-button function-key ${
            selectedFunction === keyName ? "is-selected" : ""
          }`}
          disabled={disabled && keyName !== "F6"}
          key={keyName}
          onClick={() => onFunction(keyName)}
          type="button"
        >
          {keyName}
        </button>
      ))}
    </section>
  );
}
