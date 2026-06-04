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

export interface ISession {
  _id: string;
  teacherId: string;
  learnerId: string;
  skillId: string;
  date: Date;
  durationMin: number;
  mode: SessionMode;
  meetLink?: string | null;
  location?: string | null;
  status: SessionStatus;
  studyGuide?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const sessionSchema = new Schema<ISession>({
  _id: { type: String, default: () => crypto.randomUUID() },
  teacherId: { type: String, ref: "User", required: true },
  learnerId: { type: String, ref: "User", required: true },
  skillId: { type: String, ref: "Skill", required: true },
  date: { type: Date, required: true },
  durationMin: { type: Number, default: 60 },
  mode: { type: String, enum: Object.values(SessionMode), default: SessionMode.ONLINE },
  meetLink: { type: String, default: null },
  location: { type: String, default: null },
  status: { type: String, enum: Object.values(SessionStatus), default: SessionStatus.SCHEDULED },
  studyGuide: { type: String, default: null }
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

export const Session = model<ISession>("Session", sessionSchema);
