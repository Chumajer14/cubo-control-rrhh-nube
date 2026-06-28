import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { BarChart3, CalendarClock, ClipboardList, FileDown, History, LogOut, Monitor, ShieldCheck, Users } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const links = [
  ["/dashboard", "Dashboard", BarChart3],
  ["/employees", "Empleados", Users],
  ["/shifts", "Turnos", CalendarClock],
  ["/terminals", "Terminales", Monitor],
  ["/attendance", "Asistencia", ClipboardList],
  ["/reports", "Reportes", FileDown],
  ["/audit", "Auditoria", History],
  ["/privacy-compliance", "Privacidad", ShieldCheck]
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-cubo-navy text-white lg:block">
        <div className="px-6 py-5">
          <div className="text-2xl font-bold">CUBO</div>
          <div className="mt-1 text-xs text-cubo-sky">Control RR.HH. nube</div>
        </div>
        <nav className="space-y-1 px-3">
          {links.map(([to, label, Icon]) => (
            <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2 text-sm ${isActive ? "bg-white text-cubo-navy" : "text-slate-200 hover:bg-white/10"}`}>
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:px-8">
          <div>
            <div className="font-semibold text-cubo-ink">{user?.name}</div>
            <div className="text-xs text-slate-500">{user?.email} · {user?.role}</div>
          </div>
          <button className="btn-secondary" onClick={handleLogout}><LogOut className="h-4 w-4" /> Salir</button>
        </header>
        <main className="px-4 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
