import { Router } from "express";
import { requireAuth } from "../middlewares/auth.ts";
import { getDashboardData } from "../controllers/dashboardController.ts";

const router = Router();

router.get("/", requireAuth, getDashboardData);

export default router;
