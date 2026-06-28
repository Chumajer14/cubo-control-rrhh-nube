import { Router } from "express";
import { login, me } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { loginSchema } from "../validators/schemas.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/login", validate(loginSchema), asyncHandler(login));
router.get("/me", authenticate, me);

export default router;
