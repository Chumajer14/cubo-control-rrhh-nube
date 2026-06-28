import { Router } from "express";
import { createEmployee, getEmployee, listEmployees, setEmployeeActive, updateEmployee } from "../controllers/employees.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { employeeSchema } from "../validators/schemas.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.use(authenticate);
router.get("/", asyncHandler(listEmployees));
router.get("/:id", asyncHandler(getEmployee));
router.post("/", authorize("ADMIN", "RRHH"), validate(employeeSchema), asyncHandler(createEmployee));
router.put("/:id", authorize("ADMIN", "RRHH"), validate(employeeSchema), asyncHandler(updateEmployee));
router.patch("/:id/deactivate", authorize("ADMIN", "RRHH"), asyncHandler(setEmployeeActive));
router.patch("/:id/activate", authorize("ADMIN", "RRHH"), asyncHandler(setEmployeeActive));

export default router;
