"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { identity, links, statusTags } from "../lib/content";

/* ─── Typewriter hook ────────────────── */
function useTypewriter(text: string, speed = 80) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    setDisplayed("");
    setDone(false);
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return { displayed, done };
}

/* ─── Role cycler ────────────────────── */
function useRoleCycler(roles: string[], intervalMs = 3000) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % roles.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [roles, intervalMs]);
  return roles[index];
}

/* ─── Status badge color map ─────────── */
const badgeColors: Record<string, string> = {
  blue: "bg-ctp-blue/15 text-ctp-blue border-ctp-blue/30",
  mauve: "bg-ctp-mauve/15 text-ctp-mauve border-ctp-mauve/30",
  green: "bg-ctp-green/15 text-ctp-green border-ctp-green/30",
};

/* ─── Social link data ───────────────── */
const socialLinks = [
  { label: "GitHub", href: links.github, path: "/logos/github.png" },
  { label: "ArtStation", href: links.artstation, path: "/logos/artstation.png" },
  { label: "The Rookies", href: links.rookies, path: "/logos/rookies.png" },
  { label: "YouTube", href: links.youtube, path: "/logos/youtube.png" },
  { label: "Resume", href: links.resume, path: "/logos/resume.png" },
];

export default function Hero() {
  const { displayed, done } = useTypewriter(identity.greeting, 70);
  const currentRole = useRoleCycler(identity.roles, 2800);
  const [roleKey, setRoleKey] = useState(0);

  const handleRoleChange = useCallback(() => {
    setRoleKey((k) => k + 1);
  }, []);

  useEffect(() => {
    handleRoleChange();
  }, [currentRole, handleRoleChange]);

  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden"
    >
      {/* Background grain overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
        }}
      />



      <div className="relative z-10 max-w-3xl text-center">
        {/* Typewriter greeting */}
        <h1 className="font-mono text-4xl sm:text-5xl md:text-6xl font-bold text-ctp-text mb-4 min-h-[1.2em]">
          {displayed}
          <span className="typewriter-cursor" />
        </h1>

        {/* Role cycler */}
        {done && (
          <motion.p
            key={roleKey}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="font-mono text-xl sm:text-2xl text-ctp-blue mb-6"
          >
            {currentRole}
          </motion.p>
        )}

        {/* Tagline */}
        {done && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-ctp-subtext0 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-8"
          >
            {identity.tagline}
          </motion.p>
        )}

        {/* Social links */}
        {done && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap justify-center gap-3 mb-6"
          >
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target={link.href.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="group flex items-center gap-2 px-4 py-2 rounded-lg
                  border border-ctp-surface1/50 bg-ctp-surface0/30
                  hover:border-ctp-blue/50 hover:bg-ctp-blue/10
                  transition-all duration-300 text-sm font-mono"
              >
                <div className="flex items-center justify-center min-w-[20px]">
                  <Image src={link.path} alt={link.label} width={20} height={20} className="opacity-70 group-hover:opacity-100 transition-opacity" />
                </div>
                <span className="text-ctp-subtext1 group-hover:text-ctp-text transition-colors">
                  {link.label}
                </span>
              </a>
            ))}
          </motion.div>
        )}

        {/* Status tags */}
        {done && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex flex-wrap justify-center gap-2"
          >
            {statusTags.map((tag) => (
              <span
                key={tag.label}
                className={`px-3 py-1 rounded-full text-xs font-mono border ${badgeColors[tag.color]}`}
              >
                {tag.label}
              </span>
            ))}
          </motion.div>
        )}
      </div>

      {/* Scroll indicator */}
      {done && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-5 h-8 rounded-full border-2 border-ctp-surface1 flex justify-center pt-1.5">
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1 h-1 rounded-full bg-ctp-blue"
            />
          </div>
        </motion.div>
      )}
    </section>
  );
}
