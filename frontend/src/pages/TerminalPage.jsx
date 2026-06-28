import { Clock, LogIn, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client.js";

export default function TerminalPage() {
  const { terminalCode } = useParams();
  const [terminal, setTerminal] = useState(null);
  const [rut, setRut] = useState("11.111.111-1");
  const [pin, setPin] = useState("1234");
  const [now, setNow] = useState(new Date());
  const [message, setMessage] = useState("");

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    api(`/terminals/code/${terminalCode}`).then(setTerminal).catch((err) => setMessage(err.message));
    return () => clearInterval(interval);
  }, [terminalCode]);

  async function mark(type) {
    setMessage("");
    try {
      const data = await api("/attendance/mark", {
        method: "POST",
        body: JSON.stringify({ terminalCode, rut, pin, type })
      });
      setMessage(`${type} registrada para ${data.record.employee.name} con estado ${data.record.status}.`);
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <main className="min-h-screen bg-cubo-navy px-4 py-8 text-white">
      <section className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-4xl font-bold">CUBO</div>
            <div className="text-cubo-sky">{terminal?.name || terminalCode}</div>
            <div className="text-sm text-slate-200">{terminal?.location} · {terminal?.branch}</div>
          </div>
          <div className="text-right">
            <Clock className="ml-auto h-8 w-8 text-cubo-sky" />
            <div className="mt-2 text-5xl font-semibold">{now.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</div>
          </div>
        </div>
        <div className="mt-10 rounded-lg bg-white p-6 text-cubo-ink shadow-xl">
          <label className="block text-sm font-semibold">RUT o codigo de empleado</label>
          <input className="field mt-1 text-lg" value={rut} onChange={(event) => setRut(event.target.value)} />
          <label className="mt-4 block text-sm font-semibold">PIN</label>
          <input className="field mt-1 text-lg" type="password" value={pin} onChange={(event) => setPin(event.target.value)} />
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button className="btn-primary py-4 text-base" onClick={() => mark("ENTRADA")}><LogIn className="h-5 w-5" /> Marcar entrada</button>
            <button className="btn-secondary py-4 text-base" onClick={() => mark("SALIDA")}><LogOut className="h-5 w-5" /> Marcar salida</button>
          </div>
          {message && <div className="mt-5 rounded-md bg-cubo-sky px-4 py-3 text-sm text-cubo-navy">{message}</div>}
        </div>
      </section>
    </main>
  );
}
