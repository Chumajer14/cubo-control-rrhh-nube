import { Router } from "express";
import { listAuditLogs } from "../controllers/audit.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.use(authenticate, authorize("ADMIN"));
router.get("/", asyncHandler(listAuditLogs));

export default router;
