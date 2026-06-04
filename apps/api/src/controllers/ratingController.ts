import { Request, Response } from "express";
import { prisma } from "../config/prisma.ts";
import { z } from "zod";

const createRatingSchema = z.object({
  sessionId: z.string().min(1),
  score: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional().nullable(),
});

export const createRating = async (req: Request, res: Response) => {
  try {
    const clerkId = req.user?.clerkId;
    if (!clerkId) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    const result = createRatingSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.errors });
    }

    const { sessionId, score, comment } = result.data;

    // Fetch user
    const rater = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!rater) {
      return res.status(404).json({ error: "Rater user profile not found." });
    }

    // Fetch session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        rating: true,
      }
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found." });
    }

    if (session.status !== "COMPLETED") {
      return res.status(400).json({ error: "You can only rate sessions that have been completed." });
    }

    if (session.rating) {
      return res.status(400).json({ error: "This session has already been rated." });
    }

    // Verify current user was a participant in the session
    if (session.teacherId !== rater.id && session.learnerId !== rater.id) {
      return res.status(403).json({ error: "Forbidden. You were not a participant in this session." });
    }

    // Identify who is being rated
    const ratedId = session.teacherId === rater.id ? session.learnerId : session.teacherId;

    // Create the rating
    const rating = await prisma.rating.create({
      data: {
        sessionId,
        raterId: rater.id,
        ratedId,
        score,
        comment,
      },
      include: {
        rater: true,
        rated: true,
        session: true,
      }
    });

    return res.status(201).json(rating);
  } catch (error) {
    console.error("Error creating rating:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getUserRatings = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const ratings = await prisma.rating.findMany({
      where: { ratedId: userId },
      include: {
        rater: true,
        session: {
          include: {
            skill: true,
          }
        }
      },
      orderBy: {
        createdAt: "desc",
      }
    });

    const totalScore = ratings.reduce((sum, r) => sum + r.score, 0);
    const avgRating = ratings.length > 0 ? totalScore / ratings.length : 0;

    return res.status(200).json({
      userId,
      avgRating,
      totalRatings: ratings.length,
      ratings,
    });
  } catch (error) {
    console.error("Error fetching user ratings:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
