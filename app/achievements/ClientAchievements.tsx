"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useIdentity } from "../components/AuthProvider";

const ALL_ACHIEVEMENTS = [
  { id: "greenDotFound", name: "Green Dot", desc: "You found the evasive green dot lurking in the terminal.", score: 200, icon: "🟢" },
  { id: "greenDotFriends", name: "Me & Green Dot Friends", desc: "You showed compassion to the green dot. It will never run away from you again.", score: 1000, icon: "💚" },
  { id: "greenDotPissedOff", name: "Pissing off the Green Dot", desc: "You tormented the green dot until it vanished in vengeance.", score: 1000, icon: "👻" },
];

export default function ClientAchievements() {
  const [unlocked, setUnlocked] = useState<Record<string, boolean>>({});
  const { isLoggedIn, login, visitor_id, user, loading: authLoading } = useIdentity();

  useEffect(() => {
    const list: Record<string, boolean> = {};
    ALL_ACHIEVEMENTS.forEach(a => {
      if (localStorage.getItem(a.id)) {
        list[a.id] = true;
      }
    });
    setUnlocked(list);

    const handleUnlock = (e: CustomEvent) => {
      if (e.detail?.id) {
        setUnlocked(prev => ({ ...prev, [e.detail.id]: true }));
      }
    };
    window.addEventListener("achievement-unlocked", handleUnlock as EventListener);
    
    return () => window.removeEventListener("achievement-unlocked", handleUnlock as EventListener);
  }, []);

  // Fetch cloud stats
  useEffect(() => {
    if (authLoading) return;
    const params = new URLSearchParams();
    if (user) {
      params.set("user_id", user.id);
    } else if (visitor_id) {
      params.set("visitor_id", visitor_id);
    } else {
      return;
    }
    fetch(`/api/user-stats?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.stats && d.stats.achievements) {
           const parsed: Record<string, boolean> = {};
           d.stats.achievements.forEach((id: string) => { 
              parsed[id] = true; 
              localStorage.setItem(id, "true"); 
           });
           setUnlocked(prev => ({ ...prev, ...parsed }));
        }
      })
      .catch(() => {});
  }, [user, visitor_id, authLoading]);

  return (
    <div>
      {!isLoggedIn && (
        <div className="mb-8 p-5 rounded-xl border border-ctp-yellow/50 bg-ctp-yellow/10 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col">
            <span className="font-mono text-sm text-ctp-yellow font-bold mb-1">Login Required</span>
            <span className="text-xs text-ctp-subtext1 leading-relaxed">
              Login with GitHub to unlock the green dot mission and permanently store your achievements in the cloud.
            </span>
          </div>
          <button 
            onClick={login} 
            className="shrink-0 px-4 py-2 font-mono text-xs font-bold text-ctp-crust bg-ctp-yellow hover:bg-ctp-yellow/80 rounded-lg transition-colors"
          >
            Login
          </button>
        </div>
      )}

      <div className="flex justify-between items-end mb-6 font-mono">
        <span className="text-ctp-subtext1 tracking-wide uppercase text-xs">Quest Progress</span>
        <span className="text-ctp-peach text-xl font-bold">{Object.keys(unlocked).length} / {ALL_ACHIEVEMENTS.length}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ALL_ACHIEVEMENTS.map((a, i) => {
          const isUnlocked = unlocked[a.id];
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`p-5 rounded-xl border flex gap-4 ${isUnlocked ? 'bg-ctp-surface0/50 border-ctp-surface2' : 'bg-transparent border-ctp-surface1/20 opacity-50 grayscale'}`}
            >
              <div className="text-4xl shrink-0 leading-none flex items-center justify-center bg-ctp-crust/50 h-16 w-16 rounded-xl border border-ctp-surface0">
                {isUnlocked ? a.icon : "🔒"}
              </div>
              <div className="flex flex-col justify-center">
                <h3 className={`font-mono text-base font-bold mb-1 ${isUnlocked ? 'text-ctp-text' : 'text-ctp-subtext0'}`}>
                  {isUnlocked ? a.name : "Secret Achievement"}
                </h3>
                <p className="text-xs text-ctp-subtext0 leading-snug mb-2">
                  {isUnlocked ? a.desc : "This achievement remains hidden until you unlock it."}
                </p>
                <div className="font-mono text-[10px] text-ctp-lavender font-bold">
                  +{a.score} PTS
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      {(unlocked.greenDotFriends && unlocked.greenDotPissedOff) && (
        <p className="mt-8 text-center text-xs text-ctp-overlay0 opacity-50 font-mono italic">
          You've somehow traveled branching timelines to obtain all endings. 
        </p>
      )}
    </div>
  );
}
