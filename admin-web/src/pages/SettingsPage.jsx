import { useState } from "react";
import { apiRequest } from "../api/apiClient.js";
import { env } from "../config/env.js";

export default function SettingsPage() {
  const [health, setHealth] = useState("No probado");

  async function testHealth() {
    try {
      const response = await apiRequest("/health");
      setHealth(response.ok ? "API disponible" : "Respuesta recibida");
    } catch (err) {
      setHealth(err.message);
    }
  }

  return (
    <div className="page-stack">
      <section className="content-band settings-list">
        <h2>Ajustes</h2>
        <dl>
          <dt>API Base URL</dt><dd>{env.apiBaseUrl}</dd>
          <dt>Region</dt><dd>{env.awsRegion}</dd>
          <dt>Autenticacion</dt><dd>{env.authMode}</dd>
          <dt>Version frontend</dt><dd>{env.appVersion}</dd>
          <dt>Estado API</dt><dd>{health}</dd>
        </dl>
        <button className="primary-button" onClick={testHealth}>Probar /health</button>
      </section>
    </div>
  );
}
