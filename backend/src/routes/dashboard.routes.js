import { Router } from "express";
import { simulatedAiSummary, summary } from "../controllers/dashboard.controller.js";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.use(authenticate);
router.get("/summary", asyncHandler(summary));
router.get("/ai-summary", asyncHandler(simulatedAiSummary));

export default router;
