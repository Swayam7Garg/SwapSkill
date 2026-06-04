import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import cron from "node-cron";

// Load environment variables
dotenv.config();

import { initSocket } from "./utils/socket.ts";
import { prisma } from "./config/prisma.ts";
import { emitToUser } from "./utils/socket.ts";

// Import Routes
import userRoutes from "./routes/userRoutes.ts";
import requestRoutes from "./routes/requestRoutes.ts";
import sessionRoutes from "./routes/sessionRoutes.ts";
import ratingRoutes from "./routes/ratingRoutes.ts";
import skillRoutes from "./routes/skillRoutes.ts";
import dashboardRoutes from "./routes/dashboardRoutes.ts";

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 5000;

// Configure Socket.io
initSocket(server);

// Middlewares
app.use(cors({
  origin: "*", // Adjust in production to match frontend URL
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

    const sessions = await prisma.session.findMany({
      where: {
        status: "SCHEDULED",
        date: {
          gte: targetTimeMin,
          lt: targetTimeMax,
        }
      },
      include: {
        teacher: true,
        learner: true,
        skill: true,
      }
    });

    sessions.forEach((session) => {
      // Send reminder to teacher
      emitToUser(session.teacher.clerkId, "session:reminder", {
        sessionId: session.id,
        role: "teacher",
        partnerName: session.learner.name,
        skillName: session.skill.name,
        time: session.date,
        meetLink: session.meetLink,
      });

      // Send reminder to learner
      emitToUser(session.learner.clerkId, "session:reminder", {
        sessionId: session.id,
        role: "learner",
        partnerName: session.teacher.name,
        skillName: session.skill.name,
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
  console.log(`[server]: SkillSwap backend running on http://localhost:${port}`);
});
