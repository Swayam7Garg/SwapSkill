import { Request, Response } from "express";
import { prisma } from "../config/prisma.ts";
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

    // Sync to database
    const user = await prisma.user.upsert({
      where: { clerkId },
      update: {
        name,
        email,
        avatarUrl,
        college,
      },
      create: {
        clerkId,
        name,
        email,
        avatarUrl,
        college,
      },
      include: {
        teachSkills: true,
        learnSkills: true,
      }
    });

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

    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        teachSkills: true,
        learnSkills: true,
        ratingsReceived: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User profile not found in database." });
    }

    // Add average rating
    const totalScore = user.ratingsReceived.reduce((sum, r) => sum + r.score, 0);
    const avgRating = user.ratingsReceived.length > 0 ? totalScore / user.ratingsReceived.length : 0;

    return res.status(200).json({
      ...user,
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

    const updatedUser = await prisma.user.update({
      where: { clerkId },
      data: result.data,
      include: {
        teachSkills: true,
        learnSkills: true,
      },
    });

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error updating profile:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getPublicProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        teachSkills: true,
        learnSkills: true,
        ratingsReceived: {
          include: {
            rater: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const totalScore = user.ratingsReceived.reduce((sum, r) => sum + r.score, 0);
    const avgRating = user.ratingsReceived.length > 0 ? totalScore / user.ratingsReceived.length : 0;

    return res.status(200).json({
      ...user,
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

    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const updatedUser = await prisma.user.update({
      where: { clerkId },
      data: {
        teachSkills: type === "teach" ? { connect: { id: skillId } } : undefined,
        learnSkills: type === "learn" ? { connect: { id: skillId } } : undefined,
      },
      include: {
        teachSkills: true,
        learnSkills: true,
      },
    });

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

    const updatedUser = await prisma.user.update({
      where: { clerkId },
      data: {
        teachSkills: type === "teach" ? { disconnect: { id: skillId } } : undefined,
        learnSkills: type === "learn" ? { disconnect: { id: skillId } } : undefined,
      },
      include: {
        teachSkills: true,
        learnSkills: true,
      },
    });

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
      ? await prisma.user.findUnique({
          where: { clerkId },
          include: { teachSkills: true, learnSkills: true },
        })
      : null;

    // 2. Build filters for DB query
    // Filters teachSkill or learnSkill if provided
    const whereClause: any = {};

    if (clerkId) {
      // Exclude self from browse results
      whereClause.clerkId = { not: clerkId };
    }

    if (teach) {
      whereClause.teachSkills = {
        some: {
          name: { contains: teach as string, mode: "insensitive" },
        },
      };
    }

    if (learn) {
      whereClause.learnSkills = {
        some: {
          name: { contains: learn as string, mode: "insensitive" },
        },
      };
    }

    if (category) {
      whereClause.OR = [
        {
          teachSkills: {
            some: {
              category: category,
            },
          },
        },
        {
          learnSkills: {
            some: {
              category: category,
            },
          },
        },
      ];
    }

    // 3. Fetch filtered users
    const allUsers = await prisma.user.findMany({
      where: whereClause,
      include: {
        teachSkills: true,
        learnSkills: true,
        ratingsReceived: true,
      },
    });

    // 4. Calculate average rating and compatibility score for each user
    const usersWithScores = allUsers.map((target) => {
      // Average rating
      const totalScore = target.ratingsReceived.reduce((sum, r) => sum + r.score, 0);
      const avgRating = target.ratingsReceived.length > 0 ? totalScore / target.ratingsReceived.length : 0;

      // Compatibility score
      let compScore = 0;
      if (viewer) {
        const overlap = viewer.learnSkills.filter((s) =>
          target.teachSkills.some((ts) => ts.id === s.id)
        ).length;
        const reverseOverlap = viewer.teachSkills.filter((s) =>
          target.learnSkills.some((ls) => ls.id === s.id)
        ).length;
        compScore = overlap * 2 + reverseOverlap;
      }

      return {
        ...target,
        avgRating,
        compatibilityScore: compScore,
      };
    });

    // 5. Sort by compatibilityScore DESC, then avgRating DESC
    usersWithScores.sort((a, b) => {
      if (b.compatibilityScore !== a.compatibilityScore) {
        return b.compatibilityScore - a.compatibilityScore;
      }
      return b.avgRating - a.avgRating;
    });

    // 6. Paginate results in memory (since we sorted in-memory)
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
    const users = await prisma.user.findMany({
      include: {
        sessionsAsTeacher: { where: { status: "COMPLETED" } },
        sessionsAsLearner: { where: { status: "COMPLETED" } },
        ratingsReceived: true,
      }
    });

    const leaderboard = users.map(u => {
      const completedCount = u.sessionsAsTeacher.length + u.sessionsAsLearner.length;
      const totalScore = u.ratingsReceived.reduce((sum, r) => sum + r.score, 0);
      const avgRating = u.ratingsReceived.length > 0 ? totalScore / u.ratingsReceived.length : 0;

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
