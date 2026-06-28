import { mockEmployees } from "../data/mockEmployees";

export function findEmployeeByCode(employeeCode) {
  return mockEmployees.find((employee) => employee.code === employeeCode) ?? null;
}

export function findEmployeeByRun(run) {
  return mockEmployees.find((employee) => employee.run === String(run ?? "").toUpperCase()) ?? null;
}

export function validateEmployeePin(run, pin) {
  const employee = findEmployeeByRun(run);
  return Boolean(employee && employee.pin === String(pin ?? ""));
}

export function isEmployeeActive(run) {
  const employee = findEmployeeByRun(run);
  return Boolean(employee?.active);
}

export function listMockEmployees() {
  return [...mockEmployees];
}
