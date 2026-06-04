import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { createRating, getUserRatings } from "../controllers/ratingController.js";

const router = Router();

router.post("/", requireAuth, createRating);
router.get("/user/:userId", requireAuth, getUserRatings);

export default router;
