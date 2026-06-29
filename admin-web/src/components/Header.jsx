import { LogOut } from "lucide-react";
import { useAuth } from "../auth/AuthProvider.jsx";

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Consola RR.HH.</p>
        <h1>Administracion de asistencia</h1>
      </div>
      <div className="user-menu">
        <div>
          <strong>{user?.name || user?.email}</strong>
          <span>{user?.role} · {user?.authMode}</span>
        </div>
        <button className="icon-button" onClick={logout} title="Cerrar sesion">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
