import { Router } from "express";
import { requireAuth } from "../middlewares/auth.ts";
import { listSkills, createSkill } from "../controllers/skillController.ts";

const router = Router();

router.get("/", listSkills);
router.post("/", requireAuth, createSkill);

export default router;
