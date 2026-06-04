import { Request, Response, NextFunction } from "express";
import { createClerkClient } from "@clerk/backend";

// Extend Express Request type to include user information
declare global {
  namespace Express {
    interface Request {
      user?: {
        clerkId: string;
        email?: string;
        name?: string;
        avatarUrl?: string;
      };
    }
  }
}

const clerkSecretKey = process.env.CLERK_SECRET_KEY;
const isClerkConfigured = clerkSecretKey && clerkSecretKey !== "sk_test_placeholder";

const clerk = isClerkConfigured
  ? createClerkClient({ secretKey: clerkSecretKey })
  : null;

if (!isClerkConfigured) {
  console.warn("Clerk Secret Key not configured or placeholder used. Mock Auth Enabled for local development.");
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    // If Clerk is not configured, support local development mock user
    if (!isClerkConfigured) {
      const mockClerkId = req.headers["x-mock-user-id"] as string || "user_demo_1";
      req.user = {
        clerkId: mockClerkId,
        email: `${mockClerkId}@example.com`,
        name: mockClerkId.split("_").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" "),
        avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${mockClerkId}`
      };
      return next();
    }

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized. Missing or malformed token." });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized. Token not found." });
    }

    try {
      // Verify the JWT token using Clerk Backend SDK
      const verifiedToken = await clerk!.verifyToken(token);
      
      // Clerk's subject 'sub' is the Clerk User ID
      req.user = {
        clerkId: verifiedToken.sub,
      };
      
      next();
    } catch (jwtError: any) {
      console.error("JWT Verification failed:", jwtError.message);
      return res.status(401).json({ error: "Unauthorized. Invalid token." });
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ error: "Internal server error during authentication" });
  }
};
