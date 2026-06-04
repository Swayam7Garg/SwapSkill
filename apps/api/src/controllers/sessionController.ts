import { Request, Response } from "express";
import { User } from "../models/User.ts";
import { Session, SessionStatus } from "../models/Session.ts";
import { Rating } from "../models/Rating.ts";
import { Skill } from "../models/Skill.ts";
import { z } from "zod";

const createSessionSchema = z.object({
  teacherId: z.string().min(1),
  learnerId: z.string().min(1),
  skillId: z.string().min(1),
  date: z.string().datetime(),
  durationMin: z.number().int().positive().default(60),
  mode: z.enum(["ONLINE", "OFFLINE"]).default("ONLINE"),
  meetLink: z.string().url().optional().nullable(),
  location: z.string().optional().nullable(),
});

// Helper to format session output to match Prisma models
const formatSession = (s: any, ratingObj?: any) => {
  const sObj = s.toJSON ? s.toJSON() : s;
  const teacher = sObj.teacherId;
  const learner = sObj.learnerId;
  const skill = sObj.skillId;
  const rating = ratingObj || sObj.rating;

  delete sObj.teacherId;
  delete sObj.learnerId;
  delete sObj.skillId;

  return {
    ...sObj,
    teacher,
    learner,
    skill,
    rating: rating || null
  };
};

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
    const currentUser = await User.findOne({ clerkId });
    if (!currentUser) {
      return res.status(404).json({ error: "Current user profile not found." });
    }

    // Verify current user is part of the session
    if (currentUser.id !== teacherId && currentUser.id !== learnerId) {
      return res.status(403).json({ error: "Forbidden. You must be the teacher or learner to schedule a session." });
    }

    // Create session
    const session = await Session.create({
      teacherId,
      learnerId,
      skillId,
      date: new Date(date),
      durationMin,
      mode,
      meetLink,
      location,
      status: SessionStatus.SCHEDULED,
    });

    const populatedSession = await Session.findById(session.id)
      .populate("teacherId")
      .populate("learnerId")
      .populate("skillId");

    return res.status(201).json(formatSession(populatedSession));
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

    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(404).json({ error: "User profile not found." });
    }

    const sessions = await Session.find({
      $or: [
        { teacherId: user.id },
        { learnerId: user.id }
      ]
    })
      .populate("teacherId")
      .populate("learnerId")
      .populate("skillId")
      .sort({ date: -1 });

    // Fetch ratings for these sessions
    const sessionIds = sessions.map(s => s.id);
    const ratings = await Rating.find({ sessionId: { $in: sessionIds } });

    const formattedSessions = sessions.map(s => {
      const r = ratings.find(rate => rate.sessionId === s.id);
      return formatSession(s, r);
    });

    return res.status(200).json(formattedSessions);
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

    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(404).json({ error: "User profile not found." });
    }

    const session = await Session.findById(id)
      .populate("teacherId")
      .populate("learnerId")
      .populate("skillId");

    if (!session) {
      return res.status(404).json({ error: "Session not found." });
    }

    // Verify permission
    if (session.teacherId !== user.id && session.learnerId !== user.id) {
      return res.status(403).json({ error: "Forbidden. You are not a participant in this session." });
    }

    const ratingObj = await Rating.findOne({ sessionId: id });

    return res.status(200).json(formatSession(session, ratingObj));
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

    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(404).json({ error: "User profile not found." });
    }

    const session = await Session.findById(id);
    if (!session) {
      return res.status(404).json({ error: "Session not found." });
    }

    // Only participants can complete a session
    if (session.teacherId !== user.id && session.learnerId !== user.id) {
      return res.status(403).json({ error: "Forbidden. You cannot manage this session." });
    }

    session.status = SessionStatus.COMPLETED;
    await session.save();

    const populatedSession = await Session.findById(session.id)
      .populate("teacherId")
      .populate("learnerId")
      .populate("skillId");

    return res.status(200).json(formatSession(populatedSession));
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

    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(404).json({ error: "User profile not found." });
    }

    const session = await Session.findById(id);
    if (!session) {
      return res.status(404).json({ error: "Session not found." });
    }

    // Only participants can cancel a session
    if (session.teacherId !== user.id && session.learnerId !== user.id) {
      return res.status(403).json({ error: "Forbidden. You cannot manage this session." });
    }

    session.status = SessionStatus.CANCELLED;
    await session.save();

    const populatedSession = await Session.findById(session.id)
      .populate("teacherId")
      .populate("learnerId")
      .populate("skillId");

    return res.status(200).json(formatSession(populatedSession));
  } catch (error) {
    console.error("Error cancelling session:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const generateStudyGuide = async (req: Request, res: Response) => {
  try {
    const clerkId = req.user?.clerkId;
    const { id } = req.params;

    if (!clerkId) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(404).json({ error: "User profile not found." });
    }

    const session = await Session.findById(id)
      .populate("teacherId")
      .populate("learnerId")
      .populate("skillId");

    if (!session) {
      return res.status(404).json({ error: "Session not found." });
    }

    // Verify permission
    const teacherIdStr = (session.teacherId as any).id || (session.teacherId as any)._id;
    const learnerIdStr = (session.learnerId as any).id || (session.learnerId as any)._id;

    if (teacherIdStr !== user.id && learnerIdStr !== user.id) {
      return res.status(403).json({ error: "Forbidden. You are not a participant in this session." });
    }

    // Return saved guide if already generated
    if (session.studyGuide) {
      return res.status(200).json({ studyGuide: session.studyGuide });
    }

    const teacher: any = session.teacherId;
    const learner: any = session.learnerId;
    const skill: any = session.skillId;

    let studyGuideMarkdown = "";

    const { ai, isGeminiConfigured } = await import("../config/gemini.ts");

    if (!isGeminiConfigured) {
      // Mock Fallback Study Guide
      studyGuideMarkdown = `
# 📚 AI Lesson Plan: ${skill.name}
*Prepared for ${learner.name} by instructor ${teacher.name} (Sandbox Mock Guide)*

### 🕒 Session Timeline (60 Minutes)
* **00:00 - 00:10 | Introduction & Goal Alignment**
  * Discuss ${learner.name}'s learning goals in ${skill.name}.
  * Review any prerequisite knowledge or setups needed.
* **00:10 - 00:35 | Core Concept Training**
  * ${teacher.name} explains the foundational blocks of ${skill.name}.
  * Code-along or direct hands-on walkthrough.
* **00:35 - 00:50 | Guided Practical Exercise**
  * Complete a short task or build a simple mini-project together.
  * Live feedback and debugging from ${teacher.name}.
* **00:50 - 01:00 | Wrap-up & Q&A**
  * Review key takeaways.
  * Plan next self-study steps and future swap sessions.

---
💡 *Tip: Since this is in sandbox development mode, configure a valid GEMINI_API_KEY to generate highly personalized AI guides!*
      `;
    } else {
      try {
        const prompt = `
You are an expert AI teaching assistant for a peer-to-peer student skill-barter platform called SkillSwap.
Your goal is to generate a highly personalized, structured 1-hour session study guide / lesson plan for a swap session.

Session Details:
- Skill being taught: ${skill.name} (Category: ${skill.category})
- Instructor/Teacher: ${teacher.name}
  * Bio: ${teacher.bio || "N/A"}
- Student/Learner: ${learner.name}
  * Bio: ${learner.bio || "N/A"}

Please generate a professional Markdown lesson plan. Address both students by name. Include:
1. A brief, encouraging introduction about the exchange.
2. A detailed 60-minute timeline breakdown (Introduction, Core Concept, Practical Exercise, Q&A).
3. 2-3 specific, actionable practice exercises or mini-project ideas that they can build during this session.
4. Tips for the teacher (${teacher.name}) on how to explain concepts simply, and tips for the learner (${learner.name}) on how to practice.

Format the output as clean Markdown. Do NOT wrap it in any HTML tags.
        `;

        const response = await ai!.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt
        });

        studyGuideMarkdown = response.text || "Failed to generate study guide. Please try again.";
      } catch (geminiError: any) {
        console.error("Gemini Guide Generation Error:", geminiError);
        return res.status(500).json({ error: "Failed to generate AI study guide due to API error." });
      }
    }

    // Save study guide in Mongoose database
    session.studyGuide = studyGuideMarkdown;
    await session.save();

    return res.status(200).json({ studyGuide: studyGuideMarkdown });
  } catch (error) {
    console.error("Error generating study guide:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
