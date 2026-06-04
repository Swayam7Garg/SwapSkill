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
  
  const User = mongoose.model("User");
  const Skill = mongoose.model("Skill");

  const users = await User.find();
  console.log("Raw users count:", users.length);
  
  for (const u of users) {
    console.log(`User: ${u.name} (clerkId: ${u.clerkId})`);
    console.log("  teachSkills raw:", u.teachSkills);
    console.log("  learnSkills raw:", u.learnSkills);
    
    // Attempt population manually
    const populated = await User.findById(u._id).populate("teachSkills learnSkills");
    console.log("  teachSkills populated:", populated.teachSkills.map(s => s ? s.name : "null"));
    console.log("  learnSkills populated:", populated.learnSkills.map(s => s ? s.name : "null"));
  }

  await mongoose.disconnect();
}

run().catch(console.error);
