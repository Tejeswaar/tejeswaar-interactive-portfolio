"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useIdentity } from "../components/AuthProvider";

interface LeaderboardEntry {
  display_name: string;
  clicks: number;
  active_seconds: number;
  game_score: number;
  achievement_score: number;
  score: number;
  avatar_url?: string;
  github_username?: string;
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

function generateGuestName(): string {
  const words = ["fox", "wolf", "bear", "hawk", "lynx", "raven", "pike", "cobra", "orca", "puma"];
  const word = words[Math.floor(Math.random() * words.length)];
  const num = Math.floor(Math.random() * 9999).toString().padStart(4, "0");
  return `${word}_${num}`;
}

function GuestPrompt({ visitorId, login }: { visitorId: string; login: () => void }) {
  const [guestName, setGuestName] = useState("");
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load or generate guest name
  useEffect(() => {
    const stored = localStorage.getItem("guest_display_name");
    if (stored) {
      setGuestName(stored);
    } else {
      const name = `guest_${generateGuestName()}`;
      setGuestName(name);
      localStorage.setItem("guest_display_name", name);
      // Sync to DB
      if (visitorId) {
        fetch("/api/leaderboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visitor_id: visitorId, display_name: name }),
        }).catch(() => {});
      }
    }
  }, [visitorId]);

  const handleSaveName = async () => {
    const trimmed = inputVal.trim().replace(/[^a-zA-Z0-9_]/g, "");
    if (!trimmed || trimmed.length < 2) return;
    const finalName = `guest_${trimmed}`;
    setSaving(true);
    try {
      await fetch("/api/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitor_id: visitorId, display_name: finalName }),
      });
      setGuestName(finalName);
      localStorage.setItem("guest_display_name", finalName);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {} finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="mb-8 rounded-xl border border-ctp-surface1/40 bg-ctp-surface0/20 p-5"
    >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Guest identity */}
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-ctp-surface1 flex items-center justify-center text-sm">👤</span>
          <div>
            {editing ? (
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-ctp-overlay0">guest_</span>
                <input
                  autoFocus
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                  placeholder="your_name"
                  maxLength={16}
                  className="bg-ctp-crust/60 border border-ctp-surface1/60 rounded px-2 py-1 font-mono text-xs text-ctp-text outline-none focus:border-ctp-blue/60 w-28"
                />
                <button
                  onClick={handleSaveName}
                  disabled={saving || inputVal.trim().length < 2}
                  className="px-2 py-1 rounded text-[10px] font-mono bg-ctp-green/20 text-ctp-green hover:bg-ctp-green/30 transition-all disabled:opacity-40"
                >
                  {saving ? "..." : "Save"}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="text-[10px] font-mono text-ctp-overlay0 hover:text-ctp-red transition-colors"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="font-mono text-sm text-ctp-text font-bold">{guestName}</p>
                <button
                  onClick={() => { setInputVal(""); setEditing(true); }}
                  className="text-[10px] font-mono text-ctp-blue hover:text-ctp-lavender transition-colors"
                >
                  ✏️ edit
                </button>
                {saved && <span className="text-[10px] font-mono text-ctp-green">✓ saved</span>}
              </div>
            )}
            <p className="text-[10px] text-ctp-overlay0 font-mono mt-0.5">Playing as guest</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-ctp-subtext0 font-mono hidden sm:inline">
            Login to save progress permanently
          </span>
          <button
            onClick={login}
            className="px-4 py-2 rounded-lg border border-ctp-mauve/40 bg-ctp-mauve/10 hover:bg-ctp-mauve/20 transition-all font-mono text-xs text-ctp-mauve"
          >
            Login with GitHub
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function LeaderboardClient() {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { isLoggedIn, user, visitor_id, login } = useIdentity();

  // Determine current user's identity value for highlighting
  const currentId = user?.user_metadata?.user_name || visitor_id;

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((d) => {
        setLeaders(d.leaderboard || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-ctp-base">
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link
            href="/"
            className="font-mono text-sm font-bold text-ctp-blue hover:text-ctp-lavender transition-colors"
          >
            ← ~/tejeswaar
          </Link>
          <h1 className="font-mono text-sm text-ctp-text">🏆 Leaderboard</h1>
        </div>
      </nav>

      <main className="pt-20 pb-16 px-6 max-w-4xl mx-auto">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="font-mono text-3xl sm:text-4xl font-bold text-ctp-text mb-2">
            🏆 Leaderboard
          </h1>
          <p className="text-sm text-ctp-subtext0 font-mono">
            Compete by exploring, clicking, and playing games
          </p>
          <div className="mt-3 flex justify-center gap-6 text-[10px] font-mono text-ctp-overlay0">
            <span>
              Score = clicks + time(s) + game×5 + achv.
            </span>
          </div>
        </motion.div>

        {/* Guest prompt */}
        {!isLoggedIn && (
          <GuestPrompt visitorId={visitor_id} login={login} />
        )}

        {/* Leaderboard table */}
        {loading ? (
          <div className="text-center py-20">
            <p className="font-mono text-sm text-ctp-overlay0 animate-pulse">
              Loading leaderboard...
            </p>
          </div>
        ) : leaders.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">👻</p>
            <p className="font-mono text-sm text-ctp-overlay0">
              No visitors yet. Be the first!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Table header */}
            <div className="grid grid-cols-[3rem_1fr_4rem_4rem_4rem_4rem_5rem] gap-2 px-4 py-2 text-[10px] font-mono text-ctp-overlay0 uppercase tracking-wider">
              <span>Rank</span>
              <span>Player</span>
              <span className="text-right">Time</span>
              <span className="text-right">Clicks</span>
              <span className="text-right">Game</span>
              <span className="text-right">Achv.</span>
              <span className="text-right">Score</span>
            </div>

            {/* Rows */}
            {leaders.map((entry, i) => {
              const isCurrentUser =
                entry.github_username === currentId ||
                entry.display_name === currentId;
              const medal =
                i === 0
                  ? "🥇"
                  : i === 1
                  ? "🥈"
                  : i === 2
                  ? "🥉"
                  : `${i + 1}`;

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`grid grid-cols-[3rem_1fr_4rem_4rem_4rem_4rem_5rem] gap-2 items-center px-4 py-3 rounded-xl border transition-all ${
                    isCurrentUser
                      ? "border-ctp-green/50 bg-ctp-green/10"
                      : i < 3
                      ? "border-ctp-yellow/20 bg-ctp-surface0/30"
                      : "border-ctp-surface1/30 bg-ctp-surface0/10 hover:bg-ctp-surface0/20"
                  }`}
                >
                  {/* Rank */}
                  <span
                    className={`font-mono text-sm font-bold ${
                      i < 3 ? "text-ctp-yellow" : "text-ctp-overlay0"
                    }`}
                  >
                    {medal}
                  </span>

                  {/* Player */}
                  <div className="flex items-center gap-2 min-w-0">
                    {entry.avatar_url ? (
                      <img
                        src={entry.avatar_url}
                        alt=""
                        className="w-6 h-6 rounded-full shrink-0"
                      />
                    ) : (
                      <span className="w-6 h-6 rounded-full bg-ctp-surface1 shrink-0 flex items-center justify-center text-[10px]">
                        👤
                      </span>
                    )}
                    <span className="font-mono text-xs text-ctp-text truncate">
                      {entry.github_username || entry.display_name}
                      {isCurrentUser && (
                        <span className="ml-1 text-ctp-green text-[10px]">
                          (you)
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Time */}
                  <span className="font-mono text-xs text-ctp-subtext0 text-right tabular-nums">
                    {formatTime(entry.active_seconds || 0)}
                  </span>

                  {/* Clicks */}
                  <span className="font-mono text-xs text-ctp-subtext0 text-right tabular-nums">
                    {(entry.clicks || 0).toLocaleString()}
                  </span>

                  {/* Game */}
                  <span className="font-mono text-xs text-ctp-subtext0 text-right tabular-nums">
                    {(entry.game_score || 0).toLocaleString()}
                  </span>

                  {/* Achievements */}
                  <span className="font-mono text-xs text-ctp-subtext0 text-right tabular-nums">
                    {(entry.achievement_score || 0).toLocaleString()}
                  </span>

                  {/* Score */}
                  <span className="font-mono text-sm font-bold text-ctp-mauve text-right tabular-nums">
                    {(entry.score || 0).toLocaleString()}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <Link
            href="/"
            className="font-mono text-xs text-ctp-blue hover:text-ctp-lavender transition-colors"
          >
            ← Back to portfolio
          </Link>
        </div>
      </main>
    </div>
  );
}
