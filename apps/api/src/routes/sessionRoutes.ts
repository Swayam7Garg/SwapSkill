import { Router } from "express";
import { requireAuth } from "../middlewares/auth.ts";
import {
  createSession,
  getMySessions,
  getSessionById,
  completeSession,
  cancelSession,
  generateStudyGuide,
} from "../controllers/sessionController.ts";

const router = Router();

router.post("/", requireAuth, createSession);
router.get("/", requireAuth, getMySessions);
router.get("/:id", requireAuth, getSessionById);
router.patch("/:id/complete", requireAuth, completeSession);
router.patch("/:id/cancel", requireAuth, cancelSession);
router.post("/:id/study-guide", requireAuth, generateStudyGuide);

export default router;
