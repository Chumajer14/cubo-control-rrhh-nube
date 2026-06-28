import { AlertTriangle, BrainCircuit, CalendarCheck, Clock3, Users } from "lucide-react";
import StatCard from "../components/StatCard.jsx";
import { useFetch } from "../hooks/useFetch.js";

export default function DashboardPage() {
  const { data: summary } = useFetch("/dashboard/summary", []);
  const { data: ai } = useFetch("/dashboard/ai-summary", []);

  return (
    <section>
      <h1 className="text-2xl font-semibold text-cubo-ink">Dashboard RR.HH.</h1>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={Users} label="Empleados activos" value={summary?.activeEmployees ?? "-"} />
        <StatCard icon={CalendarCheck} label="Presentes hoy" value={summary?.presentToday ?? "-"} accent="text-cubo-teal" />
        <StatCard icon={AlertTriangle} label="Ausentes estimados" value={summary?.estimatedAbsent ?? "-"} accent="text-amber-600" />
        <StatCard icon={Clock3} label="Atrasos del dia" value={summary?.delaysToday ?? "-"} accent="text-red-600" />
        <StatCard icon={CalendarCheck} label="Marcajes hoy" value={summary?.recordsToday ?? "-"} />
      </div>
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 text-lg font-semibold text-cubo-ink"><BrainCircuit className="h-5 w-5 text-cubo-teal" /> Resumen IA</div>
        <p className="mt-3 text-sm leading-6 text-slate-700">{ai?.text}</p>
        <p className="mt-3 text-xs text-slate-500">{ai?.disclaimer}</p>
      </div>
    </section>
  );
}
