import { Request, Response } from "express";
import { User } from "../models/User.ts";
import { Session, SessionStatus } from "../models/Session.ts";
import { Rating } from "../models/Rating.ts";
import { SwapRequest } from "../models/SwapRequest.ts";

export const getDashboardData = async (req: Request, res: Response) => {
  try {
    const clerkId = req.user?.clerkId;
    if (!clerkId) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    // 1. Fetch current user DB record
    const user = await User.findOne({ clerkId }).populate("teachSkills learnSkills");
    if (!user) {
      return res.status(404).json({ error: "User profile not found." });
    }

    const ratingsReceived = await Rating.find({ ratedId: user.id });

    // 2. Widget: Pending Requests (latest 3 PENDING incoming requests)
    const pendingRequests = await SwapRequest.find({
      receiverId: user.id,
      status: "PENDING",
    })
      .populate({ path: "senderId", select: "_id name avatarUrl college" })
      .sort({ createdAt: -1 })
      .limit(3);

    const pendingRequestsCount = await SwapRequest.countDocuments({
      receiverId: user.id,
      status: "PENDING",
    });

    const formattedPendingRequests = pendingRequests.map(r => {
      const rObj = r.toJSON();
      const sender = rObj.senderId;
      delete rObj.senderId;
      return {
        ...rObj,
        sender
      };
    });

    // 3. Widget: Upcoming Sessions (next 3 scheduled sessions)
    const upcomingSessions = await Session.find({
      $or: [
        { teacherId: user.id },
        { learnerId: user.id }
      ],
      status: SessionStatus.SCHEDULED,
      date: { $gte: new Date() }
    })
      .populate({ path: "teacherId", select: "_id name avatarUrl" })
      .populate({ path: "learnerId", select: "_id name avatarUrl" })
      .populate("skillId")
      .sort({ date: 1 })
      .limit(3);

    const formattedUpcomingSessions = upcomingSessions.map(s => {
      const sObj = s.toJSON();
      const teacher = sObj.teacherId;
      const learner = sObj.learnerId;
      const skill = sObj.skillId;
      delete sObj.teacherId;
      delete sObj.learnerId;
      delete sObj.skillId;
      return {
        ...sObj,
        teacher,
        learner,
        skill
      };
    });

    // 4. Widget: Swap Stats
    const completedSessionsCount = await Session.countDocuments({
      $or: [
        { teacherId: user.id },
        { learnerId: user.id }
      ],
      status: SessionStatus.COMPLETED,
    });

    const totalRatingsScore = ratingsReceived.reduce((sum, r) => sum + r.score, 0);
    const avgRatingReceived = ratingsReceived.length > 0 ? totalRatingsScore / ratingsReceived.length : 0;
    const skillsSharedCount = user.teachSkills.length + user.learnSkills.length;

    const stats = {
      completedSessions: completedSessionsCount,
      avgRating: avgRatingReceived,
      skillsCount: skillsSharedCount,
    };

    // 5. Widget: Suggested Matches (top 3 compatible users)
    const otherUsers = await User.find({ _id: { $ne: user.id } }).populate("teachSkills learnSkills");
    const otherRatings = await Rating.find({ ratedId: { $in: otherUsers.map(u => u.id) } });

    const targetData = otherUsers.map(u => ({
      id: u.id,
      name: u.name,
      college: u.college,
      bio: u.bio,
      teachSkills: u.teachSkills.map((s: any) => s.name),
      learnSkills: u.learnSkills.map((s: any) => s.name),
    }));

    const viewerData = {
      id: user.id,
      name: user.name,
      college: user.college,
      bio: user.bio,
      teachSkills: user.teachSkills.map((s: any) => s.name),
      learnSkills: user.learnSkills.map((s: any) => s.name),
    };

    const { calculateSemanticMatches } = await import("../utils/geminiMatcher.ts");
    const semanticMatches = await calculateSemanticMatches(viewerData, targetData);

    const matchScores = otherUsers.map(target => {
      const match = semanticMatches.find(m => m.id === target.id) || { compatibilityScore: 0, explanation: "" };
      const targetRatings = otherRatings.filter(r => r.ratedId === target.id);
      const targetTotal = targetRatings.reduce((sum, r) => sum + r.score, 0);
      const targetAvg = targetRatings.length > 0 ? targetTotal / targetRatings.length : 0;

      return {
        ...target.toJSON(),
        compatibilityScore: match.compatibilityScore,
        matchExplanation: match.explanation,
        avgRating: targetAvg,
      };
    });

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
      matchExplanation: m.matchExplanation,
    }));



    // 6. Widget: Recent Activity Feed (last 5 actions combined)
    const sentReqs = await SwapRequest.find({ senderId: user.id })
      .populate({ path: "receiverId", select: "name" })
      .sort({ createdAt: -1 })
      .limit(5);

    const recReqs = await SwapRequest.find({ receiverId: user.id })
      .populate({ path: "senderId", select: "name" })
      .sort({ createdAt: -1 })
      .limit(5);

    const compSessions = await Session.find({
      $or: [{ teacherId: user.id }, { learnerId: user.id }],
      status: SessionStatus.COMPLETED,
    })
      .populate({ path: "teacherId", select: "name" })
      .populate({ path: "learnerId", select: "name" })
      .populate("skillId")
      .sort({ date: -1 })
      .limit(5);

    const ratingsRec = await Rating.find({ ratedId: user.id })
      .populate({ path: "raterId", select: "name" })
      .sort({ createdAt: -1 })
      .limit(5);

    // Merge and map to generic feed interface
    type FeedItem = {
      type: "request_sent" | "request_received" | "session_completed" | "rating_received";
      title: string;
      description: string;
      timestamp: Date;
    };

    const feed: FeedItem[] = [];

    sentReqs.forEach(r => {
      const rec: any = r.receiverId;
      if (rec) {
        feed.push({
          type: "request_sent",
          title: `Sent connection request`,
          description: `You asked to swap skills with ${rec.name}. Status: ${r.status}`,
          timestamp: r.createdAt as Date,
        });
      }
    });

    recReqs.forEach(r => {
      const snd: any = r.senderId;
      if (snd) {
        feed.push({
          type: "request_received",
          title: `Received connection request`,
          description: `${snd.name} sent you a skill swap request.`,
          timestamp: r.createdAt as Date,
        });
      }
    });

    compSessions.forEach(s => {
      const isTeacher = s.teacherId === user.id;
      const partner: any = isTeacher ? s.learnerId : s.teacherId;
      const sk: any = s.skillId;
      if (partner && sk) {
        feed.push({
          type: "session_completed",
          title: `Completed learning session`,
          description: `Finished session on ${sk.name} with ${partner.name}.`,
          timestamp: s.date,
        });
      }
    });

    ratingsRec.forEach(r => {
      const rtr: any = r.raterId;
      if (rtr) {
        feed.push({
          type: "rating_received",
          title: `Received a new rating`,
          description: `${rtr.name} rated you ${r.score}/5 stars: "${r.comment || 'No comment'}"`,
          timestamp: r.createdAt as Date,
        });
      }
    });

    // Sort combined feed and take top 5
    feed.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    const recentActivity = feed.slice(0, 5);

    return res.status(200).json({
      pendingRequests: {
        count: pendingRequestsCount,
        list: formattedPendingRequests,
      },
      upcomingSessions: formattedUpcomingSessions,
      stats,
      suggestedMatches,
      recentActivity,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
