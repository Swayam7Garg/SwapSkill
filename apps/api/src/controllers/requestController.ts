import { Request, Response } from "express";
import { prisma } from "../config/prisma.ts";
import { emitToUser } from "../utils/socket.ts";
import { z } from "zod";

const createRequestSchema = z.object({
  receiverId: z.string().min(1), // database user ID of the receiver
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
    const sender = await prisma.user.findUnique({
      where: { clerkId: senderClerkId },
    });

    if (!sender) {
      return res.status(404).json({ error: "Sender profile not found" });
    }

    if (sender.id === receiverId) {
      return res.status(400).json({ error: "You cannot send a swap request to yourself." });
    }

    // Find receiver DB record
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
    });

    if (!receiver) {
      return res.status(404).json({ error: "Receiver profile not found" });
    }

    // Check if request already exists between them (PENDING or ACCEPTED)
    const existingRequest = await prisma.swapRequest.findFirst({
      where: {
        OR: [
          { senderId: sender.id, receiverId, status: { in: ["PENDING", "ACCEPTED"] } },
          { senderId: receiverId, receiverId: sender.id, status: { in: ["PENDING", "ACCEPTED"] } }
        ]
      }
    });

    if (existingRequest) {
      return res.status(400).json({ error: "A pending or accepted request already exists between you." });
    }

    // Create the SwapRequest
    const swapRequest = await prisma.swapRequest.create({
      data: {
        senderId: sender.id,
        receiverId,
        message,
        status: "PENDING",
      },
      include: {
        sender: true,
        receiver: true,
      }
    });

    // Notify receiver over Socket.io
    emitToUser(receiver.clerkId, "swap:request:new", {
      id: swapRequest.id,
      senderName: sender.name,
      senderAvatar: sender.avatarUrl,
      message: message,
    });

    return res.status(201).json(swapRequest);
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

    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const inbox = await prisma.swapRequest.findMany({
      where: {
        receiverId: user.id,
        status: "PENDING",
      },
      include: {
        sender: {
          include: {
            teachSkills: true,
            learnSkills: true,
          }
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json(inbox);
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

    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const sent = await prisma.swapRequest.findMany({
      where: {
        senderId: user.id,
      },
      include: {
        receiver: {
          include: {
            teachSkills: true,
            learnSkills: true,
          }
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json(sent);
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

    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify request exists and is pending for this user
    const swapRequest = await prisma.swapRequest.findUnique({
      where: { id },
      include: {
        sender: true,
        receiver: true,
      }
    });

    if (!swapRequest) {
      return res.status(404).json({ error: "Request not found" });
    }

    if (swapRequest.receiverId !== user.id) {
      return res.status(403).json({ error: "Forbidden. You cannot accept this request." });
    }

    if (swapRequest.status !== "PENDING") {
      return res.status(400).json({ error: `Request has already been ${swapRequest.status.toLowerCase()}.` });
    }

    // Update request
    const updatedRequest = await prisma.swapRequest.update({
      where: { id },
      data: { status: "ACCEPTED" },
    });

    // Notify sender over Socket.io
    emitToUser(swapRequest.sender.clerkId, "swap:request:accepted", {
      id: swapRequest.id,
      receiverName: user.name,
    });

    return res.status(200).json(updatedRequest);
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

    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const swapRequest = await prisma.swapRequest.findUnique({
      where: { id },
    });

    if (!swapRequest) {
      return res.status(404).json({ error: "Request not found" });
    }

    if (swapRequest.receiverId !== user.id) {
      return res.status(403).json({ error: "Forbidden. You cannot reject this request." });
    }

    if (swapRequest.status !== "PENDING") {
      return res.status(400).json({ error: `Request has already been ${swapRequest.status.toLowerCase()}.` });
    }

    const updatedRequest = await prisma.swapRequest.update({
      where: { id },
      data: { status: "REJECTED" },
    });

    return res.status(200).json(updatedRequest);
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

    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const swapRequest = await prisma.swapRequest.findUnique({
      where: { id },
    });

    if (!swapRequest) {
      return res.status(404).json({ error: "Request not found" });
    }

    if (swapRequest.senderId !== user.id) {
      return res.status(403).json({ error: "Forbidden. You can only cancel your own requests." });
    }

    const updatedRequest = await prisma.swapRequest.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    return res.status(200).json(updatedRequest);
  } catch (error) {
    console.error("Error cancelling request:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
