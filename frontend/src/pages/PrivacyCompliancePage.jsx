import { ShieldCheck } from "lucide-react";

const items = [
  "Finalidad del tratamiento: control de asistencia laboral.",
  "Datos tratados: identificacion laboral, turnos, marcajes y registros administrativos.",
  "Acceso restringido por roles administrativos.",
  "Trazabilidad mediante auditoria y correcciones justificadas.",
  "Proteccion de credenciales con bcrypt y JWT con expiracion.",
  "Diseno alineado con buenas practicas ISO/IEC 27001 y NIST CSF 2.0.",
  "Funciones inspiradas en requisitos de sistemas electronicos de asistencia considerados en Chile.",
  "Este MVP educativo no declara certificacion legal, ISO ni autorizacion de la Direccion del Trabajo."
];

export default function PrivacyCompliancePage() {
  return (
    <section className="max-w-4xl">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-6 w-6 text-cubo-teal" />
        <h1 className="text-2xl font-semibold">Privacidad y cumplimiento</h1>
      </div>
      <div className="mt-5 rounded-lg border border-slate-200 bg-white p-5">
        <ul className="space-y-3 text-sm leading-6 text-slate-700">
          {items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </div>
    </section>
  );
}
