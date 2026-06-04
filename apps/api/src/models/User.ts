import { Schema, model } from "mongoose";
import crypto from "crypto";

const userSchema = new Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  clerkId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  bio: { type: String, default: null },
  avatarUrl: { type: String, default: null },
  college: { type: String, default: null },
  teachSkills: [{ type: String, ref: "Skill" }],
  learnSkills: [{ type: String, ref: "Skill" }]
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

export const User = model("User", userSchema);
