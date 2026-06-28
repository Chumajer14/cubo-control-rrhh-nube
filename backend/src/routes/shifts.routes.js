import { Router } from "express";
import { createShift, deactivateShift, listShifts, updateShift } from "../controllers/shifts.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { shiftSchema } from "../validators/schemas.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.use(authenticate);
router.get("/", asyncHandler(listShifts));
router.post("/", authorize("ADMIN", "RRHH"), validate(shiftSchema), asyncHandler(createShift));
router.put("/:id", authorize("ADMIN", "RRHH"), validate(shiftSchema), asyncHandler(updateShift));
router.patch("/:id/deactivate", authorize("ADMIN", "RRHH"), asyncHandler(deactivateShift));

export default router;
