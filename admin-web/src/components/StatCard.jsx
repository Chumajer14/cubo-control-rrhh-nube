export default function StatCard({ label, value, detail, tone = "blue" }) {
  return (
    <article className={`stat-card ${tone}`}>
      <span>{label}</span>
      <strong>{value ?? 0}</strong>
      {detail && <small>{detail}</small>}
    </article>
  );
}
