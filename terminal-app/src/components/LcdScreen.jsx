import { formatLcdLines } from "../utils/lcdFormatter";

export default function LcdScreen({ lines }) {
  const displayLines = formatLcdLines(lines);

  return (
    <section className="lcd-screen" aria-label="Pantalla LCD">
      <div className="lcd-lines">
        {displayLines.map((line, index) => (
          <div key={`${index}-${line}`}>{line}</div>
        ))}
      </div>
    </section>
  );
}
