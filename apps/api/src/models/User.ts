import { Schema, model } from "mongoose";
import crypto from "crypto";

export interface IUser {
  _id: string;
  clerkId: string;
  name: string;
  email: string;
  bio?: string | null;
  avatarUrl?: string | null;
  college?: string | null;
  teachSkills: any[]; // references to Skill model
  learnSkills: any[]; // references to Skill model
  createdAt?: Date;
  updatedAt?: Date;
}

const userSchema = new Schema<IUser>({
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
    transform: (doc, ret: any) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

export const User = model<IUser>("User", userSchema);
