import { NavLink } from "react-router-dom";
import { BarChart3, ClipboardList, FileDown, Gauge, Monitor, Settings, ShieldCheck, Users, ScrollText } from "lucide-react";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: Gauge },
  { to: "/attendance", label: "Asistencia", icon: ClipboardList },
  { to: "/employees", label: "Empleados", icon: Users },
  { to: "/terminals", label: "Terminales", icon: Monitor },
  { to: "/reports", label: "Reportes", icon: FileDown },
  { to: "/audit", label: "Auditoria", icon: ScrollText },
  { to: "/compliance", label: "Cumplimiento", icon: ShieldCheck },
  { to: "/settings", label: "Ajustes", icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <BarChart3 size={26} />
        <div>
          <strong>CUBO</strong>
          <span>Admin</span>
        </div>
      </div>
      <nav className="nav">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
