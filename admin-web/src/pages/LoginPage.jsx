import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "../auth/AuthProvider.jsx";
import { env } from "../config/env.js";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("admin@cubo.cl");
  const [password, setPassword] = useState("Admin123*");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate(location.state?.from?.pathname || "/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="login-mark"><ShieldCheck size={34} /></div>
        <h1>CUBO Admin</h1>
        <p>Acceso administrativo para RR.HH. y operaciones.</p>
        <form onSubmit={handleSubmit} className="form-stack">
          <label>Email<input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required /></label>
          <label>Contrasena<input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required /></label>
          {error && <div className="alert danger">{error}</div>}
          <button className="primary-button" disabled={loading}>{loading ? "Validando" : "Ingresar"}</button>
        </form>
        <small>Modo activo: {env.authMode}. Usuarios demo disponibles solo con MOCK.</small>
      </section>
    </main>
  );
}
