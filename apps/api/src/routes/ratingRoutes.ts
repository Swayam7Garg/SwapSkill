import { Router } from "express";
import { requireAuth } from "../middlewares/auth.ts";
import { createRating, getUserRatings } from "../controllers/ratingController.ts";

const router = Router();

router.post("/", requireAuth, createRating);
router.get("/user/:userId", requireAuth, getUserRatings);

export default router;
