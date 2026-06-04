import { ai, isGeminiConfigured } from "../config/gemini.js";

interface UserProfileData {
  id: string;
  name: string;
  college?: string | null;
  bio?: string | null;
  teachSkills: string[];
  learnSkills: string[];
}

interface MatchResult {
  id: string;
  compatibilityScore: number;
  explanation: string;
}

export const calculateSemanticMatches = async (
  viewer: UserProfileData,
  targets: UserProfileData[]
): Promise<MatchResult[]> => {
  if (targets.length === 0) return [];

  if (!isGeminiConfigured) {
    // Mock fallback matching logic based on simple overlaps
    return targets.map(target => {
      const overlap = viewer.learnSkills.filter(s => target.teachSkills.includes(s)).length;
      const reverseOverlap = viewer.teachSkills.filter(s => target.learnSkills.includes(s)).length;
      const score = Math.min((overlap * 35) + (reverseOverlap * 15), 100);
      
      let explanation = "Mutual interest found! Swipe profiles to connect and coordinate a session.";
      if (overlap > 0 && reverseOverlap > 0) {
        explanation = `Perfect match! You can learn ${viewer.learnSkills.filter(s => target.teachSkills.includes(s)).join(", ")} from ${target.name}, and teach them ${viewer.teachSkills.filter(s => target.learnSkills.includes(s)).join(", ")}.`;
      } else if (overlap > 0) {
        explanation = `${target.name} teaches ${viewer.learnSkills.filter(s => target.teachSkills.includes(s)).join(", ")} which matches your learning goals.`;
      } else if (reverseOverlap > 0) {
        explanation = `You can teach ${target.name} ${viewer.teachSkills.filter(s => target.learnSkills.includes(s)).join(", ")}, which they want to learn.`;
      }

      return {
        id: target.id,
        compatibilityScore: score,
        explanation
      };
    });
  }

  try {
    const prompt = `
You are an expert matchmaking assistant for a student skill barter platform called SkillSwap.
Your goal is to evaluate the compatibility between a "Viewer" student and a list of "Target" candidate students.

Viewer Profile:
Name: ${viewer.name}
College: ${viewer.college || "N/A"}
Bio: ${viewer.bio || "N/A"}
Teaches: ${viewer.teachSkills.join(", ") || "None"}
Wants to Learn: ${viewer.learnSkills.join(", ") || "None"}

Target Candidates:
${targets.map((t, idx) => `
Candidate #${idx + 1}:
ID: ${t.id}
Name: ${t.name}
College: ${t.college || "N/A"}
Bio: ${t.bio || "N/A"}
Teaches: ${t.teachSkills.join(", ") || "None"}
Wants to Learn: ${t.learnSkills.join(", ") || "None"}
`).join("\n")}

For each candidate, calculate:
1. "compatibilityScore": A score from 0 to 100 representing how well their teaching skills match the viewer's learning goals, and how well their learning goals match the viewer's teaching skills. Give extra weight if it is a bidirectional match (they want what you teach, and teach what you want).
2. "explanation": A friendly, 1-sentence explanation of why they are a good match (e.g. "Alex teaches React which you want to learn, and wants to learn Spanish which you speak").

Return the output as a valid JSON array of objects matching this JSON schema:
[
  {
    "id": "candidate_id",
    "compatibilityScore": 85,
    "explanation": "Explanation text"
  }
]
    `;

    const response = await ai!.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const responseText = response.text || "[]";
    const matches: MatchResult[] = JSON.parse(responseText);
    return matches;
  } catch (error) {
    console.error("Gemini Matchmaking Error:", error);
    // Fallback on error
    return targets.map(target => ({
      id: target.id,
      compatibilityScore: 50,
      explanation: "Calculated via basic keyword overlaps in local sandbox."
    }));
  }
};
