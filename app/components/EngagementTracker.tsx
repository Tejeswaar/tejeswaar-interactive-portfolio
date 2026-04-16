"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useIdentity } from "./AuthProvider";

interface PopupConfig {
  id: string;
  triggerSeconds: number;
  title: string;
  message: string;
  cta: string;
  ctaHref: string;
  emoji: string;
}

const POPUPS: PopupConfig[] = [
  {
    id: "popup-60s",
    triggerSeconds: 60,
    title: "Hey, looks like you're enjoying the portfolio",
    message: "Want to play a classic game? Try Hamurabi in the terminal!",
    cta: "Open Terminal",
    ctaHref: "/terminal",
    emoji: "👀",
  },
  {
    id: "popup-120s",
    triggerSeconds: 120,
    title: "Seems like you're really into this",
    message: "Want to connect and build something together?",
    cta: "Let's Connect",
    ctaHref: "mailto:tejeswaarreddy@gmail.com",
    emoji: "😏",
  },
];

export default function EngagementTracker() {
  const [activeSeconds, setActiveSeconds] = useState(0);
  const [activePopup, setActivePopup] = useState<PopupConfig | null>(null);
  const shownPopups = useRef(new Set<string>());
  const isActive = useRef(true);
  const lastUpdate = useRef(Date.now());
  const idleTimer = useRef<ReturnType<typeof setTimeout>>();
  const pendingSeconds = useRef(0);

  const { getIdentityPayload, loading } = useIdentity();

  // Load shown popups from session
  useEffect(() => {
    const shown = sessionStorage.getItem("shown-popups");
    if (shown) {
      JSON.parse(shown).forEach((id: string) => shownPopups.current.add(id));
    }
  }, []);

  // Reset idle timer on activity
  const resetIdle = useCallback(() => {
    if (!isActive.current) {
      isActive.current = true;
      lastUpdate.current = Date.now();
    }
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      isActive.current = false;
    }, 60000); // 60 seconds idle = pause
  }, []);

  // Track visibility
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) {
        isActive.current = false;
      } else {
        isActive.current = true;
        lastUpdate.current = Date.now();
        resetIdle();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("mousemove", resetIdle);
    window.addEventListener("keydown", resetIdle);
    window.addEventListener("scroll", resetIdle);
    window.addEventListener("click", resetIdle);

    resetIdle();

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("mousemove", resetIdle);
      window.removeEventListener("keydown", resetIdle);
      window.removeEventListener("scroll", resetIdle);
      window.removeEventListener("click", resetIdle);
    };
  }, [resetIdle]);

  // Active time ticker
  useEffect(() => {
    const interval = setInterval(() => {
      if (isActive.current) {
        setActiveSeconds((s) => s + 1);
        pendingSeconds.current += 1;
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Send batched updates every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      const secondsToSend = pendingSeconds.current;
      if (secondsToSend > 0 && !loading) {
        pendingSeconds.current = 0;
        const identity = getIdentityPayload();
        fetch("/api/leaderboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...identity,
            active_seconds: secondsToSend,
            clicks: 0,
          }),
        }).catch(() => {}); // silent fail
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [getIdentityPayload, loading]);

  // Check popup triggers
  useEffect(() => {
    for (const popup of POPUPS) {
      if (
        activeSeconds >= popup.triggerSeconds &&
        !shownPopups.current.has(popup.id) &&
        !activePopup
      ) {
        setActivePopup(popup);
        shownPopups.current.add(popup.id);
        const shown = Array.from(shownPopups.current);
        sessionStorage.setItem("shown-popups", JSON.stringify(shown));
        break;
      }
    }
  }, [activeSeconds, activePopup]);

  const dismissPopup = () => setActivePopup(null);

  return (
    <AnimatePresence>
      {activePopup && (
        <motion.div
          key={activePopup.id}
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-6 right-6 z-[100] max-w-sm"
        >
          <div className="rounded-xl border border-ctp-surface1/60 bg-ctp-mantle/95 backdrop-blur-xl p-5 shadow-2xl">
            {/* Close button */}
            <button
              onClick={dismissPopup}
              className="absolute top-3 right-3 text-ctp-overlay0 hover:text-ctp-text transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            <p className="text-2xl mb-2">{activePopup.emoji}</p>
            <h3 className="font-mono text-sm font-bold text-ctp-text mb-1">
              {activePopup.title}
            </h3>
            <p className="text-xs text-ctp-subtext0 mb-4">
              {activePopup.message}
            </p>
            <div className="flex gap-2">
              <a
                href={activePopup.ctaHref}
                className="px-4 py-2 rounded-lg bg-ctp-blue/20 border border-ctp-blue/40 text-ctp-blue font-mono text-xs hover:bg-ctp-blue/30 transition-all"
              >
                {activePopup.cta}
              </a>
              <button
                onClick={dismissPopup}
                className="px-4 py-2 rounded-lg border border-ctp-surface1/50 text-ctp-overlay1 font-mono text-xs hover:text-ctp-text transition-all"
              >
                Maybe later
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
