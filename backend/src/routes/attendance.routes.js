import { Router } from "express";
import { correct, exportCsv, list, mark, today } from "../controllers/attendance.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { correctionSchema, markAttendanceSchema } from "../validators/schemas.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/mark", validate(markAttendanceSchema), asyncHandler(mark));
router.use(authenticate);
router.get("/", asyncHandler(list));
router.get("/today", asyncHandler(today));
router.get("/export/csv", authorize("ADMIN", "RRHH"), asyncHandler(exportCsv));
router.put("/:id/correct", authorize("ADMIN", "RRHH"), validate(correctionSchema), asyncHandler(correct));

export default router;
