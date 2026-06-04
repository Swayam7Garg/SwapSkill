"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAppAuth } from "./AuthProvider";
import { Bell, Calendar, Check, X, ShieldAlert } from "lucide-react";

interface ToastNotification {
  id: string;
  type: "request" | "accept" | "reminder" | "general";
  title: string;
  message: string;
  meetLink?: string;
  duration?: number;
}

interface SocketContextType {
  socket: Socket | null;
  toasts: ToastNotification[];
  removeToast: (id: string) => void;
  addToast: (toast: Omit<ToastNotification, "id">) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:5000";

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAppAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const addToast = (toast: Omit<ToastNotification, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...toast, id };
    
    setToasts((prev) => [...prev, newToast]);

    // Auto-remove after duration (default 8 seconds)
    const duration = toast.duration || 8000;
    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // Connect to WebSockets passing user clerkId for tracking
    console.log("Connecting to WebSockets at:", WS_URL);
    const newSocket = io(WS_URL, {
      auth: {
        clerkId: user.clerkId
      },
      query: {
        clerkId: user.clerkId
      }
    });

    setSocket(newSocket);

    // Event listener: incoming swap request
    newSocket.on("swap:request:new", (data: any) => {
      console.log("Real-time: Received new request", data);
      addToast({
        type: "request",
        title: "New Swap Request!",
        message: `${data.senderName} sent you a connection request. Message: "${data.message || 'No message'}"`,
      });
    });

    // Event listener: request accepted
    newSocket.on("swap:request:accepted", (data: any) => {
      console.log("Real-time: Request accepted", data);
      addToast({
        type: "accept",
        title: "Request Accepted!",
        message: `${data.receiverName} accepted your skill swap request! Head to sessions to see details.`,
      });
    });

    // Event listener: session 15 minute reminder
    newSocket.on("session:reminder", (data: any) => {
      console.log("Real-time: Session reminder", data);
      const isTeacher = data.role === "teacher";
      const relationText = isTeacher ? "teaching" : "learning";
      addToast({
        type: "reminder",
        title: "Session Starting in 15 Minutes!",
        message: `Your scheduled session for ${data.skillName} with ${data.partnerName} is starting soon.`,
        meetLink: data.meetLink || undefined,
        duration: 15000 // Show reminder longer (15 seconds)
      });
    });

    // Event listener: general
    newSocket.on("notification:general", (data: any) => {
      addToast({
        type: "general",
        title: data.title || "Notification",
        message: data.message,
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, toasts, removeToast, addToast }}>
      {children}
      
      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto w-full glass-panel border border-white/10 rounded-xl p-4 shadow-2xl transition-all duration-500 animate-slide-in flex gap-3 relative overflow-hidden"
          >
            {/* Ambient visual gradient based on type */}
            <div 
              className={`absolute top-0 left-0 bottom-0 w-1.5 ${
                t.type === "request" ? "bg-gradient-to-b from-[#e91e8c] to-[#7c3aed]" :
                t.type === "accept" ? "bg-green-500" :
                t.type === "reminder" ? "bg-cyan-400 animate-pulse" : "bg-white/20"
              }`}
            />
            
            <div className="flex-1 flex flex-col gap-1 pl-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                {t.type === "request" && <Bell className="w-4 h-4 text-[#e91e8c]" />}
                {t.type === "accept" && <Check className="w-4 h-4 text-green-400" />}
                {t.type === "reminder" && <Calendar className="w-4 h-4 text-cyan-400" />}
                {t.type === "general" && <ShieldAlert className="w-4 h-4 text-white/60" />}
                {t.title}
              </div>
              <p className="text-xs text-white/70 leading-relaxed">{t.message}</p>
              
              {t.meetLink && (
                <a
                  href={t.meetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300 underline flex items-center gap-1"
                >
                  Join Google Meet Call
                </a>
              )}
            </div>

            <button
              onClick={() => removeToast(t.id)}
              className="text-white/40 hover:text-white/80 self-start transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </SocketContext.Provider>
  );
};

export const useAppSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useAppSocket must be used within a SocketProvider");
  }
  return context;
};
