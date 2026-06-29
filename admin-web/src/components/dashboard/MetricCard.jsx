import StatCard from "../StatCard.jsx";
import { formatMinutes } from "../../utils/timeUtils.js";

export default function MetricCard({ label, value, detail, tone }) {
  const displayValue = typeof value === "number" && label.toLowerCase().includes("horas")
    ? formatMinutes(value)
    : value;

  return <StatCard label={label} value={displayValue} detail={detail} tone={tone} />;
}
