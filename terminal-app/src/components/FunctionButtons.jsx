const functionButtons = [
  { keyName: "F1", label: "INGRESO" },
  { keyName: "F2", label: "SALIDA" },
  { keyName: "F3", label: "VALE" },
  { keyName: "F4", label: "INI COL" },
  { keyName: "F5", label: "FIN COL" },
  { keyName: "F6", label: "ADMIN" }
];

export default function FunctionButtons({ onFunction, selectedFunction, disabled }) {
  return (
    <section className="function-buttons" aria-label="Botones de funcion">
      {functionButtons.map((button) => (
        <button
          className={`machine-button function-key ${
            selectedFunction === button.keyName ? "is-selected" : ""
          }`}
          disabled={disabled && button.keyName !== "F6"}
          key={button.keyName}
          onClick={() => onFunction(button.keyName)}
          type="button"
        >
          <strong>{button.keyName}</strong>
          <span>{button.label}</span>
        </button>
      ))}
    </section>
  );
}
