import { Request, Response } from "express";
import { prisma } from "../config/prisma.ts";
import { z } from "zod";

const createSessionSchema = z.object({
  teacherId: z.string().min(1),
  learnerId: z.string().min(1),
  skillId: z.string().min(1),
  date: z.string().datetime(), // ISO string date-time
  durationMin: z.number().int().positive().default(60),
  mode: z.enum(["ONLINE", "OFFLINE"]).default("ONLINE"),
  meetLink: z.string().url().optional().nullable(),
  location: z.string().optional().nullable(),
});

export const createSession = async (req: Request, res: Response) => {
  try {
    const clerkId = req.user?.clerkId;
    if (!clerkId) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    const result = createSessionSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.errors });
    }

    const { teacherId, learnerId, skillId, date, durationMin, mode, meetLink, location } = result.data;

    // Fetch user matching clerkId
    const currentUser = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!currentUser) {
      return res.status(404).json({ error: "Current user profile not found." });
    }

    // Verify current user is part of the session
    if (currentUser.id !== teacherId && currentUser.id !== learnerId) {
      return res.status(403).json({ error: "Forbidden. You must be the teacher or learner to schedule a session." });
    }

    // Create session
    const session = await prisma.session.create({
      data: {
        teacherId,
        learnerId,
        skillId,
        date: new Date(date),
        durationMin,
        mode,
        meetLink,
        location,
        status: "SCHEDULED",
      },
      include: {
        teacher: true,
        learner: true,
        skill: true,
      }
    });

    return res.status(201).json(session);
  } catch (error) {
    console.error("Error creating session:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getMySessions = async (req: Request, res: Response) => {
  try {
    const clerkId = req.user?.clerkId;
    if (!clerkId) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return res.status(404).json({ error: "User profile not found." });
    }

    const sessions = await prisma.session.findMany({
      where: {
        OR: [
          { teacherId: user.id },
          { learnerId: user.id }
        ]
      },
      include: {
        teacher: true,
        learner: true,
        skill: true,
        rating: true,
      },
      orderBy: {
        date: "desc",
      }
    });

    return res.status(200).json(sessions);
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getSessionById = async (req: Request, res: Response) => {
  try {
    const clerkId = req.user?.clerkId;
    const { id } = req.params;

    if (!clerkId) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return res.status(404).json({ error: "User profile not found." });
    }

    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        teacher: true,
        learner: true,
        skill: true,
        rating: true,
      }
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found." });
    }

    // Verify permission
    if (session.teacherId !== user.id && session.learnerId !== user.id) {
      return res.status(403).json({ error: "Forbidden. You are not a participant in this session." });
    }

    return res.status(200).json(session);
  } catch (error) {
    console.error("Error fetching session details:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const completeSession = async (req: Request, res: Response) => {
  try {
    const clerkId = req.user?.clerkId;
    const { id } = req.params;

    if (!clerkId) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return res.status(404).json({ error: "User profile not found." });
    }

    const session = await prisma.session.findUnique({
      where: { id },
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found." });
    }

    // Only participants can complete a session
    if (session.teacherId !== user.id && session.learnerId !== user.id) {
      return res.status(403).json({ error: "Forbidden. You cannot manage this session." });
    }

    const updatedSession = await prisma.session.update({
      where: { id },
      data: { status: "COMPLETED" },
      include: {
        teacher: true,
        learner: true,
        skill: true,
      }
    });

    return res.status(200).json(updatedSession);
  } catch (error) {
    console.error("Error completing session:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const cancelSession = async (req: Request, res: Response) => {
  try {
    const clerkId = req.user?.clerkId;
    const { id } = req.params;

    if (!clerkId) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return res.status(404).json({ error: "User profile not found." });
    }

    const session = await prisma.session.findUnique({
      where: { id },
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found." });
    }

    // Only participants can cancel a session
    if (session.teacherId !== user.id && session.learnerId !== user.id) {
      return res.status(403).json({ error: "Forbidden. You cannot manage this session." });
    }

    const updatedSession = await prisma.session.update({
      where: { id },
      data: { status: "CANCELLED" },
      include: {
        teacher: true,
        learner: true,
        skill: true,
      }
    });

    return res.status(200).json(updatedSession);
  } catch (error) {
    console.error("Error cancelling session:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
