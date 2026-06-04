import { Request, Response } from "express";
import { prisma } from "../config/prisma.ts";

export const getDashboardData = async (req: Request, res: Response) => {
  try {
    const clerkId = req.user?.clerkId;
    if (!clerkId) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    // 1. Fetch current user DB record
    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        teachSkills: true,
        learnSkills: true,
        ratingsReceived: true,
      }
    });

    if (!user) {
      return res.status(404).json({ error: "User profile not found." });
    }

    // 2. Widget: Pending Requests (latest 3 PENDING incoming requests)
    const pendingRequests = await prisma.swapRequest.findMany({
      where: {
        receiverId: user.id,
        status: "PENDING",
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            college: true,
          }
        }
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 3,
    });

    const pendingRequestsCount = await prisma.swapRequest.count({
      where: {
        receiverId: user.id,
        status: "PENDING",
      }
    });

    // 3. Widget: Upcoming Sessions (next 3 scheduled sessions)
    const upcomingSessions = await prisma.session.findMany({
      where: {
        OR: [
          { teacherId: user.id },
          { learnerId: user.id }
        ],
        status: "SCHEDULED",
        date: {
          gte: new Date(),
        }
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          }
        },
        learner: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          }
        },
        skill: true,
      },
      orderBy: {
        date: "asc",
      },
      take: 3,
    });

    // 4. Widget: Swap Stats
    const completedSessionsCount = await prisma.session.count({
      where: {
        OR: [
          { teacherId: user.id },
          { learnerId: user.id }
        ],
        status: "COMPLETED",
      }
    });

    const totalRatingsScore = user.ratingsReceived.reduce((sum, r) => sum + r.score, 0);
    const avgRatingReceived = user.ratingsReceived.length > 0 ? totalRatingsScore / user.ratingsReceived.length : 0;
    const skillsSharedCount = user.teachSkills.length + user.learnSkills.length;

    const stats = {
      completedSessions: completedSessionsCount,
      avgRating: avgRatingReceived,
      skillsCount: skillsSharedCount,
    };

    // 5. Widget: Suggested Matches (top 3 compatible users)
    const otherUsers = await prisma.user.findMany({
      where: {
        id: { not: user.id }
      },
      include: {
        teachSkills: true,
        learnSkills: true,
        ratingsReceived: true,
      }
    });

    const matchScores = otherUsers.map(target => {
      // Compatibility overlap logic
      const overlap = user.learnSkills.filter(s =>
        target.teachSkills.some(ts => ts.id === s.id)
      ).length;
      const reverseOverlap = user.teachSkills.filter(s =>
        target.learnSkills.some(ls => ls.id === s.id)
      ).length;
      const score = (overlap * 2) + reverseOverlap;

      // Avg rating
      const targetTotal = target.ratingsReceived.reduce((sum, r) => sum + r.score, 0);
      const targetAvg = target.ratingsReceived.length > 0 ? targetTotal / target.ratingsReceived.length : 0;

      return {
        ...target,
        compatibilityScore: score,
        avgRating: targetAvg,
      };
    });

    // Sort by compatibility score, then average rating, and take top 3
    matchScores.sort((a, b) => {
      if (b.compatibilityScore !== a.compatibilityScore) {
        return b.compatibilityScore - a.compatibilityScore;
      }
      return b.avgRating - a.avgRating;
    });

    const suggestedMatches = matchScores.slice(0, 3).map(m => ({
      id: m.id,
      name: m.name,
      avatarUrl: m.avatarUrl,
      college: m.college,
      teachSkills: m.teachSkills,
      learnSkills: m.learnSkills,
      avgRating: m.avgRating,
      compatibilityScore: m.compatibilityScore,
    }));

    // 6. Widget: Recent Activity Feed (last 5 actions combined)
    // Fetch individual feeds
    const sentReqs = await prisma.swapRequest.findMany({
      where: { senderId: user.id },
      include: { receiver: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    const recReqs = await prisma.swapRequest.findMany({
      where: { receiverId: user.id },
      include: { sender: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    const compSessions = await prisma.session.findMany({
      where: {
        OR: [{ teacherId: user.id }, { learnerId: user.id }],
        status: "COMPLETED",
      },
      include: {
        teacher: { select: { id: true, name: true } },
        learner: { select: { id: true, name: true } },
        skill: true,
      },
      orderBy: { date: "desc" },
      take: 5,
    });

    const ratingsRec = await prisma.rating.findMany({
      where: { ratedId: user.id },
      include: { rater: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // Merge and map to generic feed interface
    type FeedItem = {
      type: "request_sent" | "request_received" | "session_completed" | "rating_received";
      title: string;
      description: string;
      timestamp: Date;
    };

    const feed: FeedItem[] = [];

    sentReqs.forEach(r => {
      feed.push({
        type: "request_sent",
        title: `Sent connection request`,
        description: `You asked to swap skills with ${r.receiver.name}. Status: ${r.status}`,
        timestamp: r.createdAt,
      });
    });

    recReqs.forEach(r => {
      feed.push({
        type: "request_received",
        title: `Received connection request`,
        description: `${r.sender.name} sent you a skill swap request.`,
        timestamp: r.createdAt,
      });
    });

    compSessions.forEach(s => {
      const isTeacher = s.teacherId === user.id;
      const partnerName = isTeacher ? s.learner.name : s.teacher.name;
      feed.push({
        type: "session_completed",
        title: `Completed learning session`,
        description: `Finished session on ${s.skill.name} with ${partnerName}.`,
        timestamp: s.date,
      });
    });

    ratingsRec.forEach(r => {
      feed.push({
        type: "rating_received",
        title: `Received a new rating`,
        description: `${r.rater.name} rated you ${r.score}/5 stars: "${r.comment || 'No comment'}"`,
        timestamp: r.createdAt,
      });
    });

    // Sort combined feed and take top 5
    feed.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    const recentActivity = feed.slice(0, 5);

    return res.status(200).json({
      pendingRequests: {
        count: pendingRequestsCount,
        list: pendingRequests,
      },
      upcomingSessions,
      stats,
      suggestedMatches,
      recentActivity,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
