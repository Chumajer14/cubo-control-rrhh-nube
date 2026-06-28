const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export function getToken() {
  return localStorage.getItem("cubo_token");
}

export function setToken(token) {
  if (token) localStorage.setItem("cubo_token", token);
  else localStorage.removeItem("cubo_token");
}

export async function api(path, options = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Error de comunicacion." }));
    throw new Error(error.message || "Error de API.");
  }
  if (response.status === 204) return null;
  return response.json();
}

export function csvUrl(query = "") {
  return `${API_URL}/attendance/export/csv${query}`;
}
