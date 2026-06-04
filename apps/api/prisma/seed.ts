import mongoose from "mongoose";
import { Skill, SkillCategory } from "../src/models/Skill.ts";
import { User } from "../src/models/User.ts";
import { Session, SessionStatus } from "../src/models/Session.ts";
import { Rating } from "../src/models/Rating.ts";
import { SwapRequest, RequestStatus } from "../src/models/SwapRequest.ts";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/skillswap";

async function main() {
  console.log("Connecting to MongoDB for seeding...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected. Seeding database...");

  // 1. Clean Database
  await Rating.deleteMany({});
  await Session.deleteMany({});
  await SwapRequest.deleteMany({});
  await User.deleteMany({});
  await Skill.deleteMany({});

  console.log("Cleaned old records.");

  // 2. Seed Skills (50 pre-defined skills)
  const skillsData = [
    // TECHNOLOGY
    { name: "React & Next.js", category: SkillCategory.TECHNOLOGY },
    { name: "Node.js & Express", category: SkillCategory.TECHNOLOGY },
    { name: "Python Scripting", category: SkillCategory.TECHNOLOGY },
    { name: "Docker Containerization", category: SkillCategory.TECHNOLOGY },
    { name: "SQL Databases", category: SkillCategory.TECHNOLOGY },
    { name: "TypeScript Core", category: SkillCategory.TECHNOLOGY },
    { name: "Machine Learning Basics", category: SkillCategory.TECHNOLOGY },
    { name: "AWS Cloud Services", category: SkillCategory.TECHNOLOGY },
    { name: "CSS & Tailwind", category: SkillCategory.TECHNOLOGY },
    { name: "Git & Github", category: SkillCategory.TECHNOLOGY },

    // DESIGN
    { name: "UI/UX & Figma", category: SkillCategory.DESIGN },
    { name: "Adobe Photoshop", category: SkillCategory.DESIGN },
    { name: "Adobe Illustrator", category: SkillCategory.DESIGN },
    { name: "3D Modeling in Blender", category: SkillCategory.DESIGN },
    { name: "Graphic Design Basics", category: SkillCategory.DESIGN },
    { name: "Typography", category: SkillCategory.DESIGN },
    { name: "Wireframing & Prototyping", category: SkillCategory.DESIGN },
    { name: "Logo Design", category: SkillCategory.DESIGN },

    // MUSIC
    { name: "Acoustic Guitar", category: SkillCategory.MUSIC },
    { name: "Classical Piano", category: SkillCategory.MUSIC },
    { name: "Vocal Training", category: SkillCategory.MUSIC },
    { name: "Music Theory Basics", category: SkillCategory.MUSIC },
    { name: "Drums & Rhythm", category: SkillCategory.MUSIC },
    { name: "Music Production in FL Studio", category: SkillCategory.MUSIC },

    // LANGUAGE
    { name: "Conversational Spanish", category: SkillCategory.LANGUAGE },
    { name: "Conversational French", category: SkillCategory.LANGUAGE },
    { name: "Japanese Hiragana & Katakana", category: SkillCategory.LANGUAGE },
    { name: "German Grammar", category: SkillCategory.LANGUAGE },
    { name: "Mandarin Tones", category: SkillCategory.LANGUAGE },
    { name: "English Public Speaking", category: SkillCategory.LANGUAGE },

    // SPORTS
    { name: "Competitive Chess", category: SkillCategory.SPORTS },
    { name: "Basketball Shooting Form", category: SkillCategory.SPORTS },
    { name: "Tennis Groundstrokes", category: SkillCategory.SPORTS },
    { name: "Vinyasa Yoga", category: SkillCategory.SPORTS },
    { name: "Swimming Breathing Techniques", category: SkillCategory.SPORTS },

    // ACADEMICS
    { name: "Calculus I & II", category: SkillCategory.ACADEMICS },
    { name: "Physics: Mechanics", category: SkillCategory.ACADEMICS },
    { name: "Organic Chemistry", category: SkillCategory.ACADEMICS },
    { name: "Microeconomics", category: SkillCategory.ACADEMICS },
    { name: "Probability & Statistics", category: SkillCategory.ACADEMICS },
    { name: "Intro to Biology", category: SkillCategory.ACADEMICS },

    // COMMUNICATION
    { name: "Public Speaking", category: SkillCategory.COMMUNICATION },
    { name: "Creative Copywriting", category: SkillCategory.COMMUNICATION },
    { name: "Salary Negotiation", category: SkillCategory.COMMUNICATION },
    { name: "Storytelling", category: SkillCategory.COMMUNICATION },

    // OTHER
    { name: "Gourmet Cooking", category: SkillCategory.OTHER },
    { name: "Organic Gardening", category: SkillCategory.OTHER },
    { name: "Digital Photography", category: SkillCategory.OTHER },
    { name: "Personal Finance & Budgeting", category: SkillCategory.OTHER },
    { name: "Mindfulness & Meditation", category: SkillCategory.OTHER },
  ];

  const createdSkills = [];
  for (const skill of skillsData) {
    const s = await Skill.create(skill);
    createdSkills.push(s);
  }
  console.log(`Seeded ${createdSkills.length} skills.`);

  const findSkill = (name: string) => createdSkills.find(s => s.name === name)!;

  // 3. Seed Users (8 demo users)
  const usersData = [
    {
      clerkId: "user_demo_1",
      name: "Alex Rivera",
      email: "alex.rivera@college.edu",
      college: "Stanford University",
      bio: "Computer Science junior. Love building responsive web apps. Looking to learn photography and piano.",
      avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Alex",
      teach: ["React & Next.js", "TypeScript Core", "Git & Github"],
      learn: ["Digital Photography", "Classical Piano", "Conversational Spanish"]
    },
    {
      clerkId: "user_demo_2",
      name: "Sofia Chen",
      email: "sofia.chen@college.edu",
      college: "Stanford University",
      bio: "Design sophomore. Figma is my playground. Want to pick up web development basics and guitar.",
      avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Sofia",
      teach: ["UI/UX & Figma", "Wireframing & Prototyping", "Typography"],
      learn: ["React & Next.js", "Acoustic Guitar", "Conversational French"]
    },
    {
      clerkId: "user_demo_3",
      name: "Carlos Mendez",
      email: "carlos.m@college.edu",
      college: "UC Berkeley",
      bio: "Music production enthusiast and native Spanish speaker. Striving to learn React and Calculus.",
      avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Carlos",
      teach: ["Acoustic Guitar", "Conversational Spanish", "Music Production in FL Studio"],
      learn: ["React & Next.js", "Calculus I & II"]
    },
    {
      clerkId: "user_demo_4",
      name: "Elena Rostova",
      email: "elena.r@college.edu",
      college: "UC Berkeley",
      bio: "Math & Stats double major. Can explain integrals in my sleep. Eager to learn French and digital illustration.",
      avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Elena",
      teach: ["Calculus I & II", "Probability & Statistics", "Competitive Chess"],
      learn: ["Conversational French", "Adobe Illustrator"]
    },
    {
      clerkId: "user_demo_5",
      name: "Jordan Smith",
      email: "jordan.s@college.edu",
      college: "MIT",
      bio: "Avid swimmer and chef. Love cooking Italian and Asian dishes. Looking to learn Python scripting and Chess.",
      avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Jordan",
      teach: ["Gourmet Cooking", "Swimming Breathing Techniques", "Vinyasa Yoga"],
      learn: ["Python Scripting", "Competitive Chess"]
    },
    {
      clerkId: "user_demo_6",
      name: "Liam O'Connor",
      email: "liam.oc@college.edu",
      college: "MIT",
      bio: "AI research assistant. Happy to teach Python and machine learning. Want to learn public speaking and cooking.",
      avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Liam",
      teach: ["Python Scripting", "Machine Learning Basics", "AWS Cloud Services"],
      learn: ["Public Speaking", "Gourmet Cooking"]
    },
    {
      clerkId: "user_demo_7",
      name: "Maya Patel",
      email: "maya.patel@college.edu",
      college: "NYU",
      bio: "Communications major. Passionate about public speaking and creative writing. Want to learn Figma and Yoga.",
      avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Maya",
      teach: ["Public Speaking", "Creative Copywriting", "Storytelling"],
      learn: ["UI/UX & Figma", "Vinyasa Yoga"]
    },
    {
      clerkId: "user_demo_8",
      name: "David Kim",
      email: "david.kim@college.edu",
      college: "NYU",
      bio: "Photography major. Can teach camera settings and lighting. Looking to learn personal finance and Node.js.",
      avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=David",
      teach: ["Digital Photography", "Adobe Photoshop", "Logo Design"],
      learn: ["Personal Finance & Budgeting", "Node.js & Express"]
    }
  ];

  const createdUsers = [];
  for (const u of usersData) {
    const user = await User.create({
      clerkId: u.clerkId,
      name: u.name,
      email: u.email,
      college: u.college,
      bio: u.bio,
      avatarUrl: u.avatarUrl,
      teachSkills: u.teach.map(name => findSkill(name).id),
      learnSkills: u.learn.map(name => findSkill(name).id)
    });
    createdUsers.push(user);
  }
  console.log(`Seeded ${createdUsers.length} users.`);

  const findUser = (clerkId: string) => createdUsers.find(u => u.clerkId === clerkId)!;

  // 4. Seed Completed Sessions with Ratings (5 sessions)
  const sessionsData = [
    {
      teacher: "user_demo_1",
      learner: "user_demo_2",
      skill: "React & Next.js",
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      score: 5,
      comment: "Alex is awesome! Explained React props and states very clearly with real-life analogies."
    },
    {
      teacher: "user_demo_2",
      learner: "user_demo_1",
      skill: "UI/UX & Figma",
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      score: 5,
      comment: "Sofia taught me auto layouts and components. My frontend pages will look much better now!"
    },
    {
      teacher: "user_demo_3",
      learner: "user_demo_2",
      skill: "Acoustic Guitar",
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      score: 4,
      comment: "Carlos was very patient. Taught me basic chords. Exciting!"
    },
    {
      teacher: "user_demo_4",
      learner: "user_demo_3",
      skill: "Calculus I & II",
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      score: 5,
      comment: "Integrals make sense now. Elena is super smart!"
    },
    {
      teacher: "user_demo_5",
      learner: "user_demo_7",
      skill: "Vinyasa Yoga",
      date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      score: 4,
      comment: "Very relaxing session. Jordan guided the breathing poses perfectly."
    }
  ];

  for (const s of sessionsData) {
    const teacher = findUser(s.teacher);
    const learner = findUser(s.learner);
    const skill = findSkill(s.skill);

    const session = await Session.create({
      teacherId: teacher.id,
      learnerId: learner.id,
      skillId: skill.id,
      date: s.date,
      durationMin: 60,
      mode: "ONLINE",
      status: SessionStatus.COMPLETED,
      meetLink: "https://meet.google.com/abc-defg-hij",
    });

    await Rating.create({
      sessionId: session.id,
      raterId: learner.id,
      ratedId: teacher.id,
      score: s.score,
      comment: s.comment,
    });
  }
  console.log("Seeded 5 completed sessions with ratings.");

  // Seed 2 upcoming scheduled sessions
  const upcomingSessionsData = [
    {
      teacher: "user_demo_1",
      learner: "user_demo_3",
      skill: "React & Next.js",
      date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      mode: "ONLINE",
      meetLink: "https://meet.google.com/xyz-pdqr-lmn",
    },
    {
      teacher: "user_demo_6",
      learner: "user_demo_5",
      skill: "Python Scripting",
      date: new Date(Date.now() + 2 * 60 * 60 * 1000),
      mode: "ONLINE",
      meetLink: "https://meet.google.com/py-learn-session",
    }
  ];

  for (const s of upcomingSessionsData) {
    const teacher = findUser(s.teacher);
    const learner = findUser(s.learner);
    const skill = findSkill(s.skill);

    await Session.create({
      teacherId: teacher.id,
      learnerId: learner.id,
      skillId: skill.id,
      date: s.date,
      durationMin: 60,
      mode: "ONLINE",
      status: SessionStatus.SCHEDULED,
      meetLink: s.meetLink,
    });
  }
  console.log("Seeded 2 upcoming scheduled sessions.");

  // 5. Seed Swap Requests (3 pending requests)
  const requestsData = [
    {
      sender: "user_demo_2",
      receiver: "user_demo_8",
      message: "Hi David, I love your photography! I can teach you Figma in return for a photography basics crash course."
    },
    {
      sender: "user_demo_7",
      receiver: "user_demo_2",
      message: "Hey Sofia, let's connect! I need help with wireframing a logo. I can help you with script writing/copywriting."
    },
    {
      sender: "user_demo_3",
      receiver: "user_demo_1",
      message: "What's up Alex! I see you want to learn piano. I teach guitar and basic production. Let's trade for React?"
    }
  ];

  for (const r of requestsData) {
    const sender = findUser(r.sender);
    const receiver = findUser(r.receiver);

    await SwapRequest.create({
      senderId: sender.id,
      receiverId: receiver.id,
      message: r.message,
      status: RequestStatus.PENDING
    });
  }
  console.log("Seeded 3 pending swap requests.");

  console.log("Seeding complete! MongoDB is ready to use.");
  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
