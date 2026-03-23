"use client";

import { useState, useEffect } from "react";
import { Vote, ChevronDown, ChevronUp } from "lucide-react";

interface VoteCount {
  asset: string;
  count: number;
}

export function VoteButton() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [votes, setVotes] = useState<VoteCount[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (open) {
      fetch("/api/votes")
        .then((r) => r.json())
        .then((d) => setVotes(d.votes ?? []))
        .catch(() => {});
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || submitting) return;

    setSubmitting(true);
    setMessage("");

    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asset: input.trim() }),
      });
      if (res.ok) {
        setMessage("Vote recorded!");
        setInput("");
        const d = await fetch("/api/votes").then((r) => r.json());
        setVotes(d.votes ?? []);
      } else {
        const err = await res.json();
        setMessage(err.error || "Failed to vote");
      }
    } catch {
      setMessage("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl bg-surface border border-border">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between text-sm text-secondary hover:text-primary transition-colors"
      >
        <span className="flex items-center gap-2">
          <Vote size={14} />
          Vote for an unsupported asset
        </span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {open && (
        <div className="flex flex-col gap-3">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. BONK"
              maxLength={20}
              className="flex-1 px-3 py-2 rounded-lg bg-input border border-border text-sm text-primary placeholder:text-tertiary focus:outline-none focus:border-accent"
            />
            <button
              type="submit"
              disabled={submitting || !input.trim()}
              className="px-4 py-2 rounded-lg bg-accent text-bg text-sm font-medium disabled:opacity-50 hover:bg-accent-hover transition-colors"
            >
              Vote
            </button>
          </form>

          {message && (
            <span className="text-xs text-accent">{message}</span>
          )}

          {votes.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-tertiary">Current votes</span>
              {votes.map((v) => (
                <div
                  key={v.asset}
                  className="flex justify-between text-xs text-secondary"
                >
                  <span>{v.asset}</span>
                  <span>
                    {v.count} {v.count === 1 ? "vote" : "votes"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
