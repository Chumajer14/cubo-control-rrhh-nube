import { get } from "./apiClient.js";

export const fetchDashboard = () => get("/admin/dashboard");
