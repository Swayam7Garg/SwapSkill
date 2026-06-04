const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/exchangeskill";
console.log("Connecting to:", MONGODB_URI);

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected successfully.");
  
  // Define inline schemas
  const userSchema = new mongoose.Schema({}, { strict: false });
  const User = mongoose.model("User", userSchema, "users");
  
  const skillSchema = new mongoose.Schema({}, { strict: false });
  const Skill = mongoose.model("Skill", skillSchema, "skills");

  const userCount = await User.countDocuments();
  const skillCount = await Skill.countDocuments();
  
  console.log("User count in database:", userCount);
  console.log("Skill count in database:", skillCount);

  if (userCount > 0) {
    const sampleUsers = await User.find().limit(3);
    console.log("Sample users:", sampleUsers.map(u => ({ id: u._id, name: u.name, clerkId: u.clerkId })));
  }

  await mongoose.disconnect();
}

run().catch(console.error);
