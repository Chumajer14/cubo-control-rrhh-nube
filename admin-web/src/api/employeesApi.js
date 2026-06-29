import { get, patch, post, put } from "./apiClient.js";

export const fetchEmployees = (filters = {}) => get("/admin/employees", filters);
export const createEmployee = (employee) => post("/admin/employees", employee);
export const updateEmployee = (employeeRun, employee) => put(`/admin/employees/${encodeURIComponent(employeeRun)}`, employee);
export const updateEmployeeStatus = (employeeRun, active) =>
  patch(`/admin/employees/${encodeURIComponent(employeeRun)}/status`, { active });
