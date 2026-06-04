import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { listSkills, createSkill } from "../controllers/skillController.js";

const router = Router();

router.get("/", listSkills);
router.post("/", requireAuth, createSkill);

export default router;
