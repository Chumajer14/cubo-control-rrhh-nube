import { mockEmployees } from "../data/mockEmployees";

export function findEmployeeByCode(employeeCode) {
  return mockEmployees.find((employee) => employee.code === employeeCode) ?? null;
}

export function listMockEmployees() {
  return [...mockEmployees];
}
