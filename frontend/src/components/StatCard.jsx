export default function StatCard({ icon: Icon, label, value, accent = "text-cubo-blue" }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-600">{label}</span>
        {Icon && <Icon className={`h-5 w-5 ${accent}`} aria-hidden="true" />}
      </div>
      <div className="mt-3 text-3xl font-semibold text-cubo-ink">{value}</div>
    </div>
  );
}
