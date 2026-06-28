import { LogIn } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@cubo.cl");
  const [password, setPassword] = useState("Admin123*");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-cubo-navy px-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="text-3xl font-bold text-cubo-navy">CUBO</div>
        <p className="mt-2 text-sm text-slate-600">Panel administrativo de asistencia laboral.</p>
        <label className="mt-6 block text-sm font-medium">Email</label>
        <input className="field mt-1" value={email} onChange={(event) => setEmail(event.target.value)} />
        <label className="mt-4 block text-sm font-medium">Contrasena</label>
        <input className="field mt-1" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        {error && <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        <button className="btn-primary mt-6 w-full"><LogIn className="h-4 w-4" /> Ingresar</button>
        <p className="mt-4 text-xs text-slate-500">Demo: admin@cubo.cl / Admin123* · rrhh@cubo.cl / Rrhh123*</p>
      </form>
    </main>
  );
}
