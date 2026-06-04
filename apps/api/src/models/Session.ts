import { Schema, model } from "mongoose";
import crypto from "crypto";

export enum SessionMode {
  ONLINE = "ONLINE",
  OFFLINE = "OFFLINE"
}

export enum SessionStatus {
  SCHEDULED = "SCHEDULED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED"
}

const sessionSchema = new Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  teacherId: { type: String, ref: "User", required: true },
  learnerId: { type: String, ref: "User", required: true },
  skillId: { type: String, ref: "Skill", required: true },
  date: { type: Date, required: true },
  durationMin: { type: Number, default: 60 },
  mode: { type: String, enum: Object.values(SessionMode), default: SessionMode.ONLINE },
  meetLink: { type: String, default: null },
  location: { type: String, default: null },
  status: { type: String, enum: Object.values(SessionStatus), default: SessionStatus.SCHEDULED }
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

export const Session = model("Session", sessionSchema);
