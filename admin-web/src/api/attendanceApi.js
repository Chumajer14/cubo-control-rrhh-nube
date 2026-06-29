import { get } from "./apiClient.js";

export const fetchAttendance = (filters = {}) => get("/admin/attendance", filters);
