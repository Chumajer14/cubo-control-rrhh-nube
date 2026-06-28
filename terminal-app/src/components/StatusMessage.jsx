export default function StatusMessage({ message, tone = "idle" }) {
  return (
    <div className={`status-message status-${tone}`} role="status" aria-live="polite">
      {message}
    </div>
  );
}
