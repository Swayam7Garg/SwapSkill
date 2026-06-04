import { Request, Response } from "express";
import { User } from "../models/User.js";
import { SwapRequest, RequestStatus } from "../models/SwapRequest.js";
import { emitToUser } from "../utils/socket.js";
import { z } from "zod";

const createRequestSchema = z.object({
  receiverId: z.string().min(1),
  message: z.string().max(250).optional(),
});

export const sendRequest = async (req: Request, res: Response) => {
  try {
    const senderClerkId = req.user?.clerkId;
    if (!senderClerkId) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    const result = createRequestSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.errors });
    }

    const { receiverId, message } = result.data;

    // Find sender DB record
    const sender = await User.findOne({ clerkId: senderClerkId });
    if (!sender) {
      return res.status(404).json({ error: "Sender profile not found" });
    }

    if (sender.id === receiverId) {
      return res.status(400).json({ error: "You cannot send a swap request to yourself." });
    }

    // Find receiver DB record
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ error: "Receiver profile not found" });
    }

    // Check if request already exists (PENDING or ACCEPTED)
    const existingRequest = await SwapRequest.findOne({
      $or: [
        { senderId: sender.id, receiverId, status: { $in: [RequestStatus.PENDING, RequestStatus.ACCEPTED] } },
        { senderId: receiverId, receiverId: sender.id, status: { $in: [RequestStatus.PENDING, RequestStatus.ACCEPTED] } }
      ]
    });

    if (existingRequest) {
      return res.status(400).json({ error: "A pending or accepted request already exists between you." });
    }

    // Create the SwapRequest
    const swapRequest = await SwapRequest.create({
      senderId: sender.id,
      receiverId,
      message,
      status: RequestStatus.PENDING,
    });

    // Notify receiver over Socket.io
    emitToUser(receiver.clerkId, "swap:request:new", {
      id: swapRequest.id,
      senderName: sender.name,
      senderAvatar: sender.avatarUrl,
      message: message,
    });

    // Format response to match Prisma fields
    return res.status(201).json({
      id: swapRequest.id,
      senderId: swapRequest.senderId,
      receiverId: swapRequest.receiverId,
      message: swapRequest.message,
      status: swapRequest.status,
      createdAt: swapRequest.createdAt,
      sender: sender.toJSON(),
      receiver: receiver.toJSON(),
    });
  } catch (error) {
    console.error("Error sending request:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getInbox = async (req: Request, res: Response) => {
  try {
    const clerkId = req.user?.clerkId;
    if (!clerkId) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const inbox = await SwapRequest.find({
      receiverId: user.id,
      status: RequestStatus.PENDING,
    })
      .populate({
        path: "senderId",
        populate: {
          path: "teachSkills learnSkills"
        }
      })
      .sort({ createdAt: -1 });

    // Format response matching Prisma (nesting under sender/receiver rather than senderId/receiverId)
    const formattedInbox = inbox.map(req => {
      const rObj = (req as any).toJSON();
      const sender = rObj.senderId;
      delete rObj.senderId;
      return {
        ...rObj,
        sender
      };
    });

    return res.status(200).json(formattedInbox);
  } catch (error) {
    console.error("Error fetching inbox:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getSent = async (req: Request, res: Response) => {
  try {
    const clerkId = req.user?.clerkId;
    if (!clerkId) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const sent = await SwapRequest.find({
      senderId: user.id,
    })
      .populate({
        path: "receiverId",
        populate: {
          path: "teachSkills learnSkills"
        }
      })
      .sort({ createdAt: -1 });

    // Format response matching Prisma (receiver mapping)
    const formattedSent = sent.map(req => {
      const rObj = (req as any).toJSON();
      const receiver = rObj.receiverId;
      delete rObj.receiverId;
      return {
        ...rObj,
        receiver
      };
    });

    return res.status(200).json(formattedSent);
  } catch (error) {
    console.error("Error fetching sent requests:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const acceptRequest = async (req: Request, res: Response) => {
  try {
    const clerkId = req.user?.clerkId;
    const { id } = req.params;

    if (!clerkId) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const swapRequest = await SwapRequest.findById(id)
      .populate("senderId")
      .populate("receiverId");

    if (!swapRequest) {
      return res.status(404).json({ error: "Request not found" });
    }

    if ((swapRequest.receiverId as any).id !== user.id) {
      return res.status(403).json({ error: "Forbidden. You cannot accept this request." });
    }

    if (swapRequest.status !== RequestStatus.PENDING) {
      return res.status(400).json({ error: `Request has already been ${swapRequest.status.toLowerCase()}.` });
    }

    swapRequest.status = RequestStatus.ACCEPTED;
    await swapRequest.save();

    // Notify sender over Socket.io
    const sender: any = swapRequest.senderId;
    emitToUser(sender.clerkId, "swap:request:accepted", {
      id: swapRequest.id,
      receiverName: user.name,
    });

    return res.status(200).json(swapRequest);
  } catch (error) {
    console.error("Error accepting request:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const rejectRequest = async (req: Request, res: Response) => {
  try {
    const clerkId = req.user?.clerkId;
    const { id } = req.params;

    if (!clerkId) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const swapRequest = await SwapRequest.findById(id);
    if (!swapRequest) {
      return res.status(404).json({ error: "Request not found" });
    }

    if (swapRequest.receiverId !== user.id) {
      return res.status(403).json({ error: "Forbidden. You cannot reject this request." });
    }

    if (swapRequest.status !== RequestStatus.PENDING) {
      return res.status(400).json({ error: `Request has already been ${swapRequest.status.toLowerCase()}.` });
    }

    swapRequest.status = RequestStatus.REJECTED;
    await swapRequest.save();

    return res.status(200).json(swapRequest);
  } catch (error) {
    console.error("Error rejecting request:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const cancelRequest = async (req: Request, res: Response) => {
  try {
    const clerkId = req.user?.clerkId;
    const { id } = req.params;

    if (!clerkId) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const swapRequest = await SwapRequest.findById(id);
    if (!swapRequest) {
      return res.status(404).json({ error: "Request not found" });
    }

    if (swapRequest.senderId !== user.id) {
      return res.status(403).json({ error: "Forbidden. You can only cancel your own requests." });
    }

    swapRequest.status = RequestStatus.CANCELLED;
    await swapRequest.save();

    return res.status(200).json(swapRequest);
  } catch (error) {
    console.error("Error cancelling request:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
