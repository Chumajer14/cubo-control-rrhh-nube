import { get } from "./apiClient.js";

export const fetchAuditLogs = (filters = {}) => get("/admin/audit-logs", filters);
