import { createContext, useContext, useMemo, useState } from "react";
import { clearSession, loginWithCognito, readSession, saveSession } from "./cognitoAuth.js";
import { env } from "../config/env.js";

const AuthContext = createContext(null);

const MOCK_USERS = {
  "admin@cubo.cl": { password: "Admin123*", role: "ADMIN", name: "Admin CUBO" },
  "rrhh@cubo.cl": { password: "Rrhh123*", role: "RRHH", name: "RR.HH. CUBO" },
};

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readSession());

  async function login(email, password) {
    const normalizedEmail = email.trim().toLowerCase();

    if (env.authMode === "MOCK") {
      const mockUser = MOCK_USERS[normalizedEmail];
      if (!mockUser || mockUser.password !== password) {
        throw new Error("Credenciales demo invalidas");
      }

      const nextSession = {
        email: normalizedEmail,
        name: mockUser.name,
        role: mockUser.role,
        authMode: "MOCK",
        expiresAt: Date.now() + 8 * 60 * 60 * 1000,
      };
      saveSession(nextSession);
      setSession(nextSession);
      return nextSession;
    }

    const nextSession = await loginWithCognito(normalizedEmail, password);
    saveSession(nextSession);
    setSession(nextSession);
    return nextSession;
  }

  function logout() {
    clearSession();
    setSession(null);
  }

  const value = useMemo(() => ({
    user: session,
    isAuthenticated: Boolean(session && session.expiresAt > Date.now()),
    login,
    logout,
  }), [session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
}
