import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import {
  syncUser,
  getMe,
  updateMe,
  getPublicProfile,
  addMySkill,
  deleteMySkill,
  browseUsers,
  getLeaderboard,
} from "../controllers/userController.js";

const router = Router();

// Clerk sync must be done right after initial authentication
router.post("/sync", requireAuth, syncUser);

// Personal profile management
router.get("/me", requireAuth, getMe);
router.put("/me", requireAuth, updateMe);
router.post("/me/skills", requireAuth, addMySkill);
router.delete("/me/skills/:skillId", requireAuth, deleteMySkill);

// Users discovery and public details
router.get("/leaderboard", requireAuth, getLeaderboard);
router.get("/browse", requireAuth, browseUsers);
router.get("/:id", requireAuth, getPublicProfile);

export default router;
