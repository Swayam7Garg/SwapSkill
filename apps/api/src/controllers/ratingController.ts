import { Request, Response } from "express";
import { User } from "../models/User.ts";
import { Session } from "../models/Session.ts";
import { Rating } from "../models/Rating.ts";
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
    const rater = await User.findOne({ clerkId });
    if (!rater) {
      return res.status(404).json({ error: "Rater user profile not found." });
    }

    // Fetch session
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found." });
    }

    if (session.status !== "COMPLETED") {
      return res.status(400).json({ error: "You can only rate sessions that have been completed." });
    }

    // Check if session already has a rating document
    const existingRating = await Rating.findOne({ sessionId });
    if (existingRating) {
      return res.status(400).json({ error: "This session has already been rated." });
    }

    // Verify current user was a participant in the session
    if (session.teacherId !== rater.id && session.learnerId !== rater.id) {
      return res.status(403).json({ error: "Forbidden. You were not a participant in this session." });
    }

    // Identify who is being rated
    const ratedId = session.teacherId === rater.id ? session.learnerId : session.teacherId;

    // Create the rating
    const rating = await Rating.create({
      sessionId,
      raterId: rater.id,
      ratedId,
      score,
      comment,
    });

    // Populate relation fields for response
    const populatedRating = await Rating.findById(rating.id)
      .populate("raterId")
      .populate("ratedId")
      .populate("sessionId");

    return res.status(201).json(populatedRating);
  } catch (error) {
    console.error("Error creating rating:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getUserRatings = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const ratings = await Rating.find({ ratedId: userId })
      .populate({ path: "raterId", select: "_id name avatarUrl college" })
      .populate({
        path: "sessionId",
        populate: {
          path: "skillId"
        }
      })
      .sort({ createdAt: -1 });

    const totalScore = ratings.reduce((sum, r) => sum + r.score, 0);
    const avgRating = ratings.length > 0 ? totalScore / ratings.length : 0;

    // Format for Next.js expectations
    const formattedRatings = ratings.map(r => {
      const rObj = r.toJSON();
      const rater: any = rObj.raterId;
      const sess: any = rObj.sessionId;
      return {
        ...rObj,
        rater: rater ? { id: rater.id, name: rater.name, avatarUrl: rater.avatarUrl, college: rater.college } : null,
        session: sess ? {
          ...sess,
          id: sess.id,
          skill: sess.skillId ? { id: sess.skillId.id, name: sess.skillId.name, category: sess.skillId.category } : null
        } : null
      };
    });

    return res.status(200).json({
      userId,
      avgRating,
      totalRatings: ratings.length,
      ratings: formattedRatings,
    });
  } catch (error) {
    console.error("Error fetching user ratings:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
