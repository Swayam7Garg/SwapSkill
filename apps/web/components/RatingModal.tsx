"use client";

import React, { useState } from "react";
import { Star, X } from "lucide-react";
import { apiFetch } from "../lib/api";

interface RatingModalProps {
  sessionId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RatingModal({ sessionId, onClose, onSuccess }: RatingModalProps) {
  const [score, setScore] = useState<number>(5);
  const [comment, setComment] = useState("");
  const [hoveredScore, setHoveredScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!sessionId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      await apiFetch("/ratings", {
        method: "POST",
        body: JSON.stringify({
          sessionId,
          score,
          comment: comment.trim() || null,
        }),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Failed to submit rating:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
      <div className="w-full max-w-md glass-panel border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h3 className="font-bold text-white text-base">Rate Your Learning Session</h3>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/25 text-rose-400 rounded-lg">
              {error}
            </div>
          )}

          {/* Star Picker */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-white/50 font-medium">How was your peer teacher?</span>
            <div className="flex items-center gap-1.5 my-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const isActive = (hoveredScore !== null ? hoveredScore : score) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setScore(star)}
                    onMouseEnter={() => setHoveredScore(star)}
                    onMouseLeave={() => setHoveredScore(null)}
                    className="p-1 transition-transform active:scale-90 hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        isActive
                          ? "text-yellow-400 fill-yellow-400 filter drop-shadow-[0_0_5px_rgba(250,204,21,0.4)]"
                          : "text-white/20 fill-none"
                      } transition-all`}
                    />
                  </button>
                );
              })}
            </div>
            <span className="text-xs font-bold text-yellow-400">
              {score === 5 && "Excellent! Highly recommended"}
              {score === 4 && "Great! Very helpful"}
              {score === 3 && "Good! Learned some skills"}
              {score === 2 && "Okay! Could be better"}
              {score === 1 && "Poor! Unsatisfactory session"}
            </span>
          </div>

          {/* Comment input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/60">Review Description</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell other students about your experience. How clear were they? What did you build together?"
              rows={4}
              maxLength={500}
              className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary leading-relaxed resize-none"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2.5 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white/80 bg-white/5 border border-white/5 hover:bg-white/10 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-primary to-secondary hover:opacity-95 transition-all disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
