import { Schema, model } from "mongoose";
import crypto from "crypto";

const ratingSchema = new Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  sessionId: { type: String, ref: "Session", required: true, unique: true },
  raterId: { type: String, ref: "User", required: true },
  ratedId: { type: String, ref: "User", required: true },
  score: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: null }
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

export const Rating = model("Rating", ratingSchema);
