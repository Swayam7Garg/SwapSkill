import { Schema, model } from "mongoose";
import crypto from "crypto";

export enum SkillCategory {
  TECHNOLOGY = "TECHNOLOGY",
  DESIGN = "DESIGN",
  MUSIC = "MUSIC",
  LANGUAGE = "LANGUAGE",
  SPORTS = "SPORTS",
  ACADEMICS = "ACADEMICS",
  COMMUNICATION = "COMMUNICATION",
  OTHER = "OTHER"
}

const skillSchema = new Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  name: { type: String, required: true },
  category: { type: String, enum: Object.values(SkillCategory), required: true }
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

export const Skill = model("Skill", skillSchema);
