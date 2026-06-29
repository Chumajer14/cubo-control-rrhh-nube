import { get, patch, post, put } from "./apiClient.js";

export const fetchTerminals = (filters = {}) => get("/admin/terminals", filters);
export const createTerminal = (terminal) => post("/admin/terminals", terminal);
export const updateTerminal = (terminalCode, terminal) => put(`/admin/terminals/${encodeURIComponent(terminalCode)}`, terminal);
export const updateTerminalStatus = (terminalCode, active) =>
  patch(`/admin/terminals/${encodeURIComponent(terminalCode)}/status`, { active });
