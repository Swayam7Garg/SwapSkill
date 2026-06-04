import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer | null = null;
const userSockets = new Map<string, string>(); // Maps userId -> socketId

export const initSocket = (server: any) => {
  const sanitizeOrigin = (url?: string) => url ? url.trim().replace(/\/+$/, "") : "";

  const allowedOrigins = [
    sanitizeOrigin(process.env.FRONTEND_BASE_URL),
    sanitizeOrigin(process.env.FROTEND_BASE_URL),
    "http://localhost:3000"
  ].filter(Boolean) as string[];

  io = new SocketIOServer(server, {
    cors: {
      origin: true,
      credentials: true,
      methods: ["GET", "POST", "PATCH", "DELETE"]
    }
  });

  io.on("connection", (socket) => {
    // Authenticate/bind user to socket
    const clerkId = socket.handshake.auth.clerkId || socket.handshake.query.clerkId;
    
    if (clerkId) {
      userSockets.set(clerkId, socket.id);
      console.log(`User connected to socket: ${clerkId} (${socket.id})`);
    }

    socket.on("disconnect", () => {
      if (clerkId) {
        userSockets.delete(clerkId);
        console.log(`User disconnected from socket: ${clerkId}`);
      }
    });
  });

  return io;
};

export const getIO = () => {
  return io;
};

// Emit real-time notification to a specific user (by Clerk ID or database User ID)
export const emitToUser = (clerkOrDbUserId: string, event: string, data: any) => {
  if (!io) return;
  
  // Try sending to target using the ID (mapped to socket.id)
  const socketId = userSockets.get(clerkOrDbUserId);
  if (socketId) {
    io.to(socketId).emit(event, data);
    console.log(`Emitted event ${event} to user ${clerkOrDbUserId}`);
  } else {
    console.log(`User ${clerkOrDbUserId} is not online. Real-time event queued/dropped.`);
  }
};

// Broadcast to all users
export const broadcast = (event: string, data: any) => {
  if (!io) return;
  io.emit(event, data);
};
