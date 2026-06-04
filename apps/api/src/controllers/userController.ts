import { Request, Response } from "express";
import { User } from "../models/User.js";
import { Skill } from "../models/Skill.js";
import { Rating } from "../models/Rating.js";
import { Session, SessionStatus } from "../models/Session.js";
import { z } from "zod";

// Zod schemas for validation
const syncSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  avatarUrl: z.string().url().optional().nullable(),
  college: z.string().optional().nullable(),
});

const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  bio: z.string().max(500).optional().nullable(),
  college: z.string().optional().nullable(),
});

const addSkillSchema = z.object({
  skillId: z.string().min(1),
  type: z.enum(["teach", "learn"]),
});

export const syncUser = async (req: Request, res: Response) => {
  try {
    const clerkId = req.user?.clerkId;
    if (!clerkId) {
      return res.status(401).json({ error: "Unauthorized. Clerk ID missing." });
    }

    const result = syncSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.errors });
    }

    const { name, email, avatarUrl, college } = result.data;

    // Sync to database via Mongoose
    const user = await User.findOneAndUpdate(
      { clerkId },
      {
        name,
        email,
        avatarUrl,
        college,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).populate("teachSkills learnSkills");

    return res.status(200).json(user);
  } catch (error) {
    console.error("Error syncing user:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const clerkId = req.user?.clerkId;
    if (!clerkId) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    const user = await User.findOne({ clerkId }).populate("teachSkills learnSkills");

    if (!user) {
      return res.status(404).json({ error: "User profile not found in database." });
    }

    // Fetch ratings received
    const ratingsReceived = await Rating.find({ ratedId: user.id });

    // Add average rating
    const totalScore = ratingsReceived.reduce((sum, r) => sum + r.score, 0);
    const avgRating = ratingsReceived.length > 0 ? totalScore / ratingsReceived.length : 0;

    return res.status(200).json({
      ...user.toJSON(),
      avgRating,
    });
  } catch (error) {
    console.error("Error fetching own profile:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const updateMe = async (req: Request, res: Response) => {
  try {
    const clerkId = req.user?.clerkId;
    if (!clerkId) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    const result = updateProfileSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.errors });
    }

    const updatedUser = await User.findOneAndUpdate(
      { clerkId },
      result.data,
      { new: true }
    ).populate("teachSkills learnSkills");

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error updating profile:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getPublicProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).populate("teachSkills learnSkills");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const ratingsReceived = await Rating.find({ ratedId: id })
      .populate({ path: "raterId", select: "_id name avatarUrl college" })
      .sort({ createdAt: -1 });

    const totalScore = ratingsReceived.reduce((sum, r) => sum + r.score, 0);
    const avgRating = ratingsReceived.length > 0 ? totalScore / ratingsReceived.length : 0;

    // Map Mongoose populates to match UI expected fields (rater: { name, ... })
    const formattedRatings = ratingsReceived.map(r => {
      const rObj = r.toJSON();
      const rater: any = rObj.raterId;
      return {
        ...rObj,
        rater: rater ? { id: rater.id, name: rater.name, avatarUrl: rater.avatarUrl, college: rater.college } : null
      };
    });

    return res.status(200).json({
      ...user.toJSON(),
      ratingsReceived: formattedRatings,
      avgRating,
    });
  } catch (error) {
    console.error("Error fetching public profile:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const addMySkill = async (req: Request, res: Response) => {
  try {
    const clerkId = req.user?.clerkId;
    if (!clerkId) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    const result = addSkillSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.errors });
    }

    const { skillId, type } = result.data;

    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const updateField = type === "teach" ? "teachSkills" : "learnSkills";

    const updatedUser = await User.findOneAndUpdate(
      { clerkId },
      { $addToSet: { [updateField]: skillId } },
      { new: true }
    ).populate("teachSkills learnSkills");

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error adding skill:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteMySkill = async (req: Request, res: Response) => {
  try {
    const clerkId = req.user?.clerkId;
    const { skillId } = req.params;
    const { type } = req.query; // Expect "teach" or "learn"

    if (!clerkId) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    if (!type || (type !== "teach" && type !== "learn")) {
      return res.status(400).json({ error: "Query parameter 'type' must be 'teach' or 'learn'" });
    }

    const updateField = type === "teach" ? "teachSkills" : "learnSkills";

    const updatedUser = await User.findOneAndUpdate(
      { clerkId },
      { $pull: { [updateField]: skillId } },
      { new: true }
    ).populate("teachSkills learnSkills");

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error deleting skill:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const browseUsers = async (req: Request, res: Response) => {
  try {
    const clerkId = req.user?.clerkId;
    const { teach, learn, category, page = "1", limit = "10" } = req.query;

    const currentPage = parseInt(page as string, 10);
    const currentLimit = parseInt(limit as string, 10);
    const skip = (currentPage - 1) * currentLimit;

    // 1. Fetch current viewer user for compatibility matching
    const viewer = clerkId
      ? await User.findOne({ clerkId }).populate("teachSkills learnSkills")
      : null;

    // 2. Build filters for DB query
    const query: any = {};

    if (clerkId) {
      query.clerkId = { $ne: clerkId };
    }

    if (teach) {
      const skills = await Skill.find({ name: { $regex: teach as string, $options: "i" } });
      query.teachSkills = { $in: skills.map(s => s._id) };
    }

    if (learn) {
      const skills = await Skill.find({ name: { $regex: learn as string, $options: "i" } });
      query.learnSkills = { $in: skills.map(s => s._id) };
    }

    if (category) {
      const skills = await Skill.find({ category: category as any });
      const skillIds = skills.map(s => s._id);
      query.$or = [
        { teachSkills: { $in: skillIds } },
        { learnSkills: { $in: skillIds } }
      ];
    }

    // 3. Fetch filtered users
    const allUsers = await User.find(query).populate("teachSkills learnSkills");

    // 4. Load ratings received to calculate avgRating for matches
    const allUserIds = allUsers.map(u => u.id);
    const ratingsReceived = await Rating.find({ ratedId: { $in: allUserIds } });

    // Prepare data for semantic matchmaking
    const targetData = allUsers.map(u => ({
      id: u.id,
      name: u.name,
      college: u.college,
      bio: u.bio,
      teachSkills: u.teachSkills.map((s: any) => s.name),
      learnSkills: u.learnSkills.map((s: any) => s.name),
    }));

    const viewerData = viewer ? {
      id: viewer.id,
      name: viewer.name,
      college: viewer.college,
      bio: viewer.bio,
      teachSkills: viewer.teachSkills.map((s: any) => s.name),
      learnSkills: viewer.learnSkills.map((s: any) => s.name),
    } : { id: "guest", name: "Guest User", teachSkills: [], learnSkills: [] };

    // Calculate semantic matches with Gemini
    const { calculateSemanticMatches } = await import("../utils/geminiMatcher.js");
    const semanticMatches = await calculateSemanticMatches(viewerData, targetData);

    const usersWithScores = allUsers.map((target) => {
      const match = semanticMatches.find(m => m.id === target.id) || { compatibilityScore: 0, explanation: "" };
      const targetRatings = ratingsReceived.filter(r => r.ratedId === target.id);
      const totalScore = targetRatings.reduce((sum, r) => sum + r.score, 0);
      const avgRating = targetRatings.length > 0 ? totalScore / targetRatings.length : 0;

      return {
        ...target.toJSON(),
        avgRating,
        compatibilityScore: match.compatibilityScore,
        matchExplanation: match.explanation,
      };
    });

    // 5. Sort by compatibilityScore DESC, then avgRating DESC
    usersWithScores.sort((a, b) => {
      if (b.compatibilityScore !== a.compatibilityScore) {
        return b.compatibilityScore - a.compatibilityScore;
      }
      return b.avgRating - a.avgRating;
    });

    // 6. Paginate results
    const paginatedUsers = usersWithScores.slice(skip, skip + currentLimit);
    const totalCount = usersWithScores.length;

    return res.status(200).json({
      users: paginatedUsers,
      pagination: {
        total: totalCount,
        page: currentPage,
        limit: currentLimit,
        totalPages: Math.ceil(totalCount / currentLimit),
      },
    });
  } catch (error) {
    console.error("Error browsing users:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const users = await User.find().populate("teachSkills learnSkills");
    const completedSessions = await Session.find({ status: SessionStatus.COMPLETED });
    const allRatings = await Rating.find();

    const leaderboard = users.map(u => {
      const teacherCount = completedSessions.filter(s => s.teacherId === u.id).length;
      const learnerCount = completedSessions.filter(s => s.learnerId === u.id).length;
      const completedCount = teacherCount + learnerCount;

      const userRatings = allRatings.filter(r => r.ratedId === u.id);
      const totalScore = userRatings.reduce((sum, r) => sum + r.score, 0);
      const avgRating = userRatings.length > 0 ? totalScore / userRatings.length : 0;

      return {
        id: u.id,
        name: u.name,
        avatarUrl: u.avatarUrl,
        college: u.college,
        completedSessions: completedCount,
        avgRating,
      };
    });

    // Sort by completed sessions DESC, then average rating DESC
    leaderboard.sort((a, b) => {
      if (b.completedSessions !== a.completedSessions) {
        return b.completedSessions - a.completedSessions;
      }
      return b.avgRating - a.avgRating;
    });

    return res.status(200).json(leaderboard.slice(0, 10)); // Top 10
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
