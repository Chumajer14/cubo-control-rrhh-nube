import { env } from "../config/env.js";
import { getAuthorizationToken } from "../auth/cognitoAuth.js";

function buildUrl(path, params = {}) {
  const url = new URL(path, env.apiBaseUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
}

export async function apiRequest(path, options = {}) {
  const token = getAuthorizationToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildUrl(path, options.params), {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || `Error HTTP ${response.status}`);
  }
  return payload;
}

export const get = (path, params) => apiRequest(path, { params });
export const post = (path, body) => apiRequest(path, { method: "POST", body });
export const put = (path, body) => apiRequest(path, { method: "PUT", body });
export const patch = (path, body) => apiRequest(path, { method: "PATCH", body });
