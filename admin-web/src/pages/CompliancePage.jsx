const sections = [
  ["NIST CSF 2.0", [
    "Govern: roles, politicas y finalidad de tratamiento documentadas.",
    "Identify: empleados, terminales y activos de informacion identificados.",
    "Protect: Cognito, IAM, hash de PIN y HTTPS.",
    "Detect: CloudWatch, auditoria y eventos observados.",
    "Respond: revision administrativa de incidencias.",
    "Recover: respaldo logico y sincronizacion offline.",
  ]],
  ["ISO/IEC 27001", [
    "Control de acceso administrativo.",
    "Gestion de activos de informacion.",
    "Registro de eventos y trazabilidad.",
    "Gestion de incidentes.",
    "Continuidad operacional.",
    "Seguridad considerada durante el desarrollo.",
  ]],
  ["Proteccion de datos", [
    "Finalidad del tratamiento definida para asistencia laboral.",
    "Minimizacion de datos y acceso restringido.",
    "RUN tratado como dato personal.",
    "No se almacena QR completo, MRZ ni serial de cedula.",
    "Supervision humana sobre revisiones y correcciones.",
  ]],
  ["Resolucion Exenta 38", [
    "Registro de entrada y salida.",
    "Identificacion del trabajador.",
    "Fecha y hora automatica.",
    "Reportabilidad y trazabilidad.",
    "Correcciones justificadas.",
    "Terminal identificado.",
  ]],
];

export default function CompliancePage() {
  return (
    <div className="page-stack">
      <section className="content-band">
        <h2>Cumplimiento y gobernanza</h2>
        <p>
          Esta vista es documental y educativa. CUBO esta disenado considerando buenas practicas de seguridad,
          proteccion de datos y trazabilidad; no afirma certificacion ISO ni cumplimiento legal completo.
        </p>
      </section>
      <div className="compliance-grid">
        {sections.map(([title, items]) => (
          <article className="content-band" key={title}>
            <h3>{title}</h3>
            <ul>
              {items.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}
