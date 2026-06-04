import { Schema, model } from "mongoose";
import crypto from "crypto";

export enum RequestStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED"
}

const swapRequestSchema = new Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  senderId: { type: String, ref: "User", required: true },
  receiverId: { type: String, ref: "User", required: true },
  message: { type: String, default: null },
  status: { type: String, enum: Object.values(RequestStatus), default: RequestStatus.PENDING }
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

export const SwapRequest = model("SwapRequest", swapRequestSchema);
