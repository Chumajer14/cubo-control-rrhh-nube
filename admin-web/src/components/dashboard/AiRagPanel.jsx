import Badge from "../Badge.jsx";
import { severityTone } from "../../utils/formatters.js";

export default function AiRagPanel({ rag }) {
  return (
    <section className="content-band ai-rag-panel">
      <div className="section-heading">
        <div>
          <h2>Asistente IA RAG - Recomendaciones del dia</h2>
          <p>{rag.executiveSummary}</p>
        </div>
        <Badge tone={severityTone(rag.riskLevel === "ALTO" ? "HIGH" : rag.riskLevel === "MEDIO" ? "MEDIUM" : "LOW")}>
          Riesgo {rag.riskLevel}
        </Badge>
      </div>

      <div className="rag-grid">
        <div>
          <h3>Recomendaciones</h3>
          <ol className="compact-list">
            {rag.recommendations.map((recommendation) => (
              <li key={recommendation}>{recommendation}</li>
            ))}
          </ol>
        </div>
        <div>
          <h3>Fuentes mock utilizadas</h3>
          <ul className="compact-list">
            {rag.sources.map((source) => (
              <li key={source}>{source}</li>
            ))}
          </ul>
        </div>
      </div>

      <p className="fine-print">{rag.disclaimer}</p>
      <p className="fine-print">
        Las recomendaciones son asistivas y requieren revision humana. El sistema no ejecuta sanciones, descuentos ni decisiones laborales automaticas.
      </p>
    </section>
  );
}
