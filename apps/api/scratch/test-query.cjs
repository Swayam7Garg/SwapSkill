const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/exchangeskill";

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to database.");

  // Import models
  require("../dist/models/Skill.js");
  require("../dist/models/User.js");
  require("../dist/models/Rating.js");
  require("../dist/models/Session.js");
  
  const User = mongoose.model("User");
  const Skill = mongoose.model("Skill");
  const Rating = mongoose.model("Rating");

  const clerkId = "user_demo_1";
  
  // 1. Fetch viewer
  const viewer = await User.findOne({ clerkId }).populate("teachSkills learnSkills");
  console.log("Viewer found:", viewer ? viewer.name : "None");

  // 2. Build filter
  const query = {};
  if (clerkId) {
    query.clerkId = { $ne: clerkId };
  }

  console.log("Query filters:", JSON.stringify(query, null, 2));

  // 3. Fetch users
  const allUsers = await User.find(query).populate("teachSkills learnSkills");
  console.log("Found raw users count:", allUsers.length);
  
  // Log names and skills
  allUsers.forEach(u => {
    console.log(`- ${u.name} (clerkId: ${u.clerkId}): Teach: [${u.teachSkills.map(s => s.name).join(", ")}], Learn: [${u.learnSkills.map(s => s.name).join(", ")}]`);
  });

  // Calculate matches
  const targetData = allUsers.map(u => ({
    id: u.id,
    name: u.name,
    college: u.college,
    bio: u.bio,
    teachSkills: u.teachSkills.map((s) => s.name),
    learnSkills: u.learnSkills.map((s) => s.name),
  }));

  const viewerData = viewer ? {
    id: viewer.id,
    name: viewer.name,
    college: viewer.college,
    bio: viewer.bio,
    teachSkills: viewer.teachSkills.map((s) => s.name),
    learnSkills: viewer.learnSkills.map((s) => s.name),
  } : { id: "guest", name: "Guest User", teachSkills: [], learnSkills: [] };

  console.log("Calling semantic matchmaking...");
  try {
    const { calculateSemanticMatches } = require("../dist/utils/geminiMatcher.js");
    const semanticMatches = await calculateSemanticMatches(viewerData, targetData);
    console.log("Semantic Matches output:", semanticMatches);
  } catch (err) {
    console.error("Semantic Matchmaking Error:", err);
  }

  await mongoose.disconnect();
}

run().catch(console.error);
