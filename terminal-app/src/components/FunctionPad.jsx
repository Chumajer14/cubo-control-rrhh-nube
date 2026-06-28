const functionButtons = [
  { keyName: "F1", label: "INGRESO" },
  { keyName: "F2", label: "SALIDA" },
  { keyName: "F3", label: "VALE ALMUERZO" },
  { keyName: "F4", label: "INICIO ALMUERZO" },
  { keyName: "F5", label: "FIN ALMUERZO" },
  { keyName: "F6", label: "ADMIN" }
];

export default function FunctionPad({ onFunction, selectedFunction }) {
  return (
    <section className="function-pad" aria-label="Teclas de funcion">
      {functionButtons.map((button) => (
        <button
          className={`terminal-button function-button ${
            selectedFunction === button.keyName ? "is-selected" : ""
          }`}
          key={button.keyName}
          onClick={() => onFunction(button.keyName)}
        >
          <strong>{button.keyName}</strong>
          <span>{button.label}</span>
        </button>
      ))}
    </section>
  );
}
