import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import cron from "node-cron";

// Load environment variables
dotenv.config();

import { initSocket } from "./utils/socket.js";
import { connectDB } from "./config/db.js";
import { emitToUser } from "./utils/socket.js";
import { Session, SessionStatus } from "./models/Session.js";

// Import Routes
import userRoutes from "./routes/userRoutes.js";
import requestRoutes from "./routes/requestRoutes.js";
import sessionRoutes from "./routes/sessionRoutes.js";
import ratingRoutes from "./routes/ratingRoutes.js";
import skillRoutes from "./routes/skillRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Configure Socket.io
initSocket(server);

const sanitizeOrigin = (url?: string) => url ? url.trim().replace(/\/+$/, "") : "";

const allowedOrigins = [
  sanitizeOrigin(process.env.FRONTEND_BASE_URL),
  sanitizeOrigin(process.env.FROTEND_BASE_URL),
  "http://localhost:3000"
].filter(Boolean) as string[];

app.use(cors({
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization", "x-mock-user-id"]
}));
app.use(express.json());

// API Route prefixes
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/requests", requestRoutes);
app.use("/api/v1/sessions", sessionRoutes);
app.use("/api/v1/ratings", ratingRoutes);
app.use("/api/v1/skills", skillRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy", timestamp: new Date() });
});

// Cron job: Check every minute for sessions starting in 15 minutes
cron.schedule("* * * * *", async () => {
  try {
    const targetTimeMin = new Date(Date.now() + 14 * 60 * 1000);
    const targetTimeMax = new Date(Date.now() + 16 * 60 * 1000);

    const sessions = await Session.find({
      status: SessionStatus.SCHEDULED,
      date: {
        $gte: targetTimeMin,
        $lt: targetTimeMax,
      }
    })
      .populate("teacherId")
      .populate("learnerId")
      .populate("skillId");

    sessions.forEach((session) => {
      const teacher: any = session.teacherId;
      const learner: any = session.learnerId;
      const skill: any = session.skillId;
      if (!teacher || !learner || !skill) return;

      // Send reminder to teacher
      emitToUser(teacher.clerkId, "session:reminder", {
        sessionId: session.id,
        role: "teacher",
        partnerName: learner.name,
        skillName: skill.name,
        time: session.date,
        meetLink: session.meetLink,
      });

      // Send reminder to learner
      emitToUser(learner.clerkId, "session:reminder", {
        sessionId: session.id,
        role: "learner",
        partnerName: teacher.name,
        skillName: skill.name,
        time: session.date,
        meetLink: session.meetLink,
      });

      console.log(`Cron: Sent 15-min reminder for session ${session.id} to both users.`);
    });
  } catch (error) {
    console.error("Cron reminder task error:", error);
  }
});

// Start HTTP server
server.listen(port, () => {
  console.log(`[server]: ExchangeSkill backend running on http://localhost:${port}`);
});
