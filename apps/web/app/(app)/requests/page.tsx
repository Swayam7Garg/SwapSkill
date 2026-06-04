"use client";

import React, { useState, useEffect } from "react";
import { apiFetch } from "../../../lib/api";
import RequestCard from "../../../components/RequestCard";
import { Inbox, Send, Sparkles } from "lucide-react";

export default function RequestsPage() {
  const [activeTab, setActiveTab] = useState<"inbox" | "sent">("inbox");
  const [inboxRequests, setInboxRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      if (activeTab === "inbox") {
        const inbox = await apiFetch("/requests/inbox");
        setInboxRequests(inbox || []);
      } else {
        const sent = await apiFetch("/requests/sent");
        setSentRequests(sent || []);
      }
    } catch (err: any) {
      console.error("Failed to load requests:", err);
      setError(err.message || "Failed to load connection requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [activeTab]);

  const handleAccept = async (id: string) => {
    try {
      await apiFetch(`/requests/${id}/accept`, { method: "PATCH" });
      // Reload lists
      fetchRequests();
    } catch (err) {
      console.error("Failed to accept swap request:", err);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await apiFetch(`/requests/${id}/reject`, { method: "PATCH" });
      fetchRequests();
    } catch (err) {
      console.error("Failed to reject swap request:", err);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await apiFetch(`/requests/${id}`, { method: "DELETE" });
      fetchRequests();
    } catch (err) {
      console.error("Failed to cancel swap request:", err);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <Sparkles className="w-7 h-7 text-white/70" />
          <span>Connection Requests</span>
        </h1>
        <p className="text-xs text-white/50 mt-1 font-medium">
          Accept requests to unlock session scheduling. Direct message details to lock down dates.
        </p>
      </div>

      {/* Tabs headers */}
      <div className="flex border-b border-white/5 pb-0.5 max-w-md gap-4">
        <button
          onClick={() => setActiveTab("inbox")}
          className={`flex items-center gap-2 pb-3.5 text-xs font-mono uppercase tracking-wider relative transition-all ${
            activeTab === "inbox" ? "text-white" : "text-white/40 hover:text-white/70"
          }`}
        >
          <Inbox className="w-4 h-4" />
          <span>Incoming Inbox</span>
          {activeTab === "inbox" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/80 rounded" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("sent")}
          className={`flex items-center gap-2 pb-3.5 text-xs font-mono uppercase tracking-wider relative transition-all ${
            activeTab === "sent" ? "text-white" : "text-white/40 hover:text-white/70"
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Sent Invitations</span>
          {activeTab === "sent" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/80 rounded" />
          )}
        </button>
      </div>

      {/* Requests Listings */}
      {loading ? (
        <div className="flex flex-col justify-center items-center py-20 gap-4">
          <div className="w-10 h-10 border-t-2 border-white border-solid rounded-full animate-spin" />
          <span className="text-xs text-white/50">Fetching request cards...</span>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-500/10 border border-rose-500/25 text-rose-400 rounded max-w-xl mx-auto text-center">
          <h4 className="font-bold text-sm mb-1">Error Loading Requests</h4>
          <p className="text-xs">{error}</p>
          <button onClick={fetchRequests} className="mt-3 text-xs bg-white text-black px-4 py-2 rounded font-bold uppercase font-mono tracking-wider">
            Retry Connection
          </button>
        </div>
      ) : activeTab === "inbox" ? (
        inboxRequests.length === 0 ? (
          <div className="text-center py-20 glass-panel border border-white/5 border-dashed rounded max-w-xl mx-auto space-y-2">
            <p className="text-sm font-bold text-white/60 font-mono uppercase">No pending incoming requests</p>
            <p className="text-xs text-white/40">When other students request to connect, they'll appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {inboxRequests.map((req) => (
              <RequestCard
                key={req.id}
                id={req.id}
                type="inbox"
                message={req.message}
                status={req.status}
                createdAt={req.createdAt}
                partner={{
                  id: req.sender.id,
                  name: req.sender.name,
                  avatarUrl: req.sender.avatarUrl,
                  college: req.sender.college,
                  teachSkills: req.sender.teachSkills,
                }}
                onAccept={handleAccept}
                onReject={handleReject}
              />
            ))}
          </div>
        )
      ) : sentRequests.length === 0 ? (
        <div className="text-center py-20 glass-panel border border-white/5 border-dashed rounded max-w-xl mx-auto space-y-2">
          <p className="text-sm font-bold text-white/60 font-mono uppercase">No sent requests</p>
          <p className="text-xs text-white/40">Go to "Browse peers" and hit Connect to send out invites!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sentRequests.map((req) => (
            <RequestCard
              key={req.id}
              id={req.id}
              type="sent"
              message={req.message}
              status={req.status}
              createdAt={req.createdAt}
              partner={{
                id: req.receiver.id,
                name: req.receiver.name,
                avatarUrl: req.receiver.avatarUrl,
                college: req.receiver.college,
              }}
              onCancel={handleCancel}
            />
          ))}
        </div>
      )}
    </div>
  );
}
