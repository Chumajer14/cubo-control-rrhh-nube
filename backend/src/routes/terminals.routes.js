import { Router } from "express";
import { createTerminal, getTerminalByCode, listTerminals, updateTerminal, updateTerminalStatus } from "../controllers/terminals.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { terminalSchema, terminalStatusSchema } from "../validators/schemas.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/code/:code", asyncHandler(getTerminalByCode));
router.use(authenticate);
router.get("/", asyncHandler(listTerminals));
router.post("/", authorize("ADMIN", "RRHH"), validate(terminalSchema), asyncHandler(createTerminal));
router.put("/:id", authorize("ADMIN", "RRHH"), validate(terminalSchema), asyncHandler(updateTerminal));
router.patch("/:id/status", authorize("ADMIN", "RRHH"), validate(terminalStatusSchema), asyncHandler(updateTerminalStatus));

export default router;
