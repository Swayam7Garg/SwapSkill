import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import {
  sendRequest,
  getInbox,
  getSent,
  acceptRequest,
  rejectRequest,
  cancelRequest,
} from "../controllers/requestController.js";

const router = Router();

router.post("/", requireAuth, sendRequest);
router.get("/inbox", requireAuth, getInbox);
router.get("/sent", requireAuth, getSent);
router.patch("/:id/accept", requireAuth, acceptRequest);
router.patch("/:id/reject", requireAuth, rejectRequest);
router.delete("/:id", requireAuth, cancelRequest);

export default router;
