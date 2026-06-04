import React, { useState } from "react";
import Link from "next/link";
import { Check, X, ArrowUpRight, Clock, Trash } from "lucide-react";
import SkillChip, { SkillCategory } from "./SkillChip";

interface SkillItem {
  id: string;
  name: string;
  category: SkillCategory;
}

interface RequestCardProps {
  id: string;
  type: "inbox" | "sent";
  message?: string | null;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED";
  createdAt: string | Date;
  partner: {
    id: string;
    name: string;
    avatarUrl?: string | null;
    college?: string | null;
    teachSkills?: SkillItem[];
    learnSkills?: SkillItem[];
  };
  onAccept?: (id: string) => Promise<void>;
  onReject?: (id: string) => Promise<void>;
  onCancel?: (id: string) => Promise<void>;
}

export default function RequestCard({
  id,
  type,
  message,
  status,
  createdAt,
  partner,
  onAccept,
  onReject,
  onCancel,
}: RequestCardProps) {
  const [loading, setLoading] = useState(false);

  const handleAction = async (actionFn: ((reqId: string) => Promise<void>) | undefined) => {
    if (!actionFn) return;
    try {
      setLoading(true);
      await actionFn(id);
    } catch (err) {
      console.error("Action failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const formattedDate = new Date(createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  return (
    <div className="glass-card rounded p-5 border border-white/5 flex flex-col justify-between gap-4 transition-all">
      <div className="flex items-start justify-between gap-3">
        {/* User Profile */}
        <div className="flex items-center gap-3">
          <img
            src={partner.avatarUrl || "https://api.dicebear.com/7.x/adventurer/svg"}
            alt={partner.name}
            className="w-12 h-12 rounded border border-white/10 object-cover bg-white/5"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="font-bold text-sm text-white">{partner.name}</h4>
              <Link href={`/profile/${partner.id}`}>
                <ArrowUpRight className="w-3.5 h-3.5 text-white/40 hover:text-white cursor-pointer transition-colors" />
              </Link>
            </div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-white/45">{partner.college || "College Student"}</p>
          </div>
        </div>

        {/* Date / Status */}
        <div className="text-right font-mono">
          <p className="text-[9px] text-white/30">{formattedDate}</p>
          {type === "sent" && (
            <span className={`inline-flex items-center gap-1 mt-1 text-[9px] px-2 py-0.5 rounded font-mono uppercase tracking-wider border ${
              status === "PENDING" ? "text-white/60 bg-white/5 border-white/10" :
              status === "ACCEPTED" ? "text-white bg-white/15 border-white/30" :
              status === "REJECTED" ? "text-white/40 bg-white/[0.02] border-white/5 line-through" :
              "text-white/30 bg-white/5 border-white/5"
            }`}>
              {status === "PENDING" && <Clock className="w-3 h-3 animate-spin text-white/40" />}
              <span>{status.toLowerCase()}</span>
            </span>
          )}
        </div>
      </div>

      {/* Message Box */}
      {message && (
        <div className="px-3.5 py-2.5 rounded bg-white/[0.01] border border-white/[0.03] text-[11px] text-white/60 italic leading-relaxed">
          "{message}"
        </div>
      )}

      {/* Skills Preview */}
      {partner.teachSkills && partner.teachSkills.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[9px] font-mono uppercase tracking-wider text-white/30 mr-1">Teaches:</span>
          {partner.teachSkills.slice(0, 2).map((s) => (
            <SkillChip key={s.id} name={s.name} category={s.category} size="sm" />
          ))}
          {partner.teachSkills.length > 2 && (
            <span className="text-[9px] font-mono text-white/45">+{partner.teachSkills.length - 2} more</span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 border-t border-white/5 pt-3.5 mt-1">
        {type === "inbox" && status === "PENDING" && (
          <>
            <button
              onClick={() => handleAction(onAccept)}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-1 py-2 rounded text-xs font-mono uppercase tracking-wider text-black bg-white hover:bg-white/90 transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>Accept Swap</span>
            </button>
            <button
              onClick={() => handleAction(onReject)}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-1 py-2 rounded text-xs font-mono uppercase tracking-wider text-white/70 bg-white/5 hover:bg-white/10 border border-white/10 transition-all disabled:opacity-50"
            >
              <X className="w-4 h-4" />
              <span>Decline</span>
            </button>
          </>
        )}

        {type === "sent" && status === "PENDING" && onCancel && (
          <button
            onClick={() => handleAction(onCancel)}
            disabled={loading}
            className="w-full flex items-center justify-center gap-1 py-2 rounded text-xs font-mono uppercase tracking-wider text-white/70 bg-white/5 hover:bg-white/10 border border-white/10 transition-all disabled:opacity-50"
          >
            <Trash className="w-3.5 h-3.5" />
            <span>Cancel Request</span>
          </button>
        )}
      </div>
    </div>
  );
}
export type { SkillItem };
