"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { identity, links } from "../lib/content";
import type { GitHubCommit, LanguageStat } from "../lib/github";
import { useIdentity } from "./AuthProvider";

const connectEmail = "tejeswaarreddy@gmail.com";
const connectMailto = `mailto:${connectEmail}?subject=${encodeURIComponent("Saw your portfolio")}&body=${encodeURIComponent("Hi Tejeswaar,\nI came across your portfolio and really liked your work. I'd love to connect and explore potential opportunities to collaborate.\n\nBest regards,\n")}`;

/* â”€â”€â”€ Global Click Counter (Supabase-backed) â”€ */
function GlobalClickCounter() {
  const [globalCount, setGlobalCount] = useState(0);
  const [localClicks, setLocalClicks] = useState(0);
  const [pendingClicks, setPendingClicks] = useState(0);
  const [pops, setPops] = useState<{ id: number; x: number; y: number }[]>([]);
  const nextId = useRef(0);
  const flushing = useRef(false);

  useEffect(() => {
    fetch("/api/clicks")
      .then((r) => r.json())
      .then((d) => setGlobalCount(d.total_clicks || 0))
      .catch(() => {});
  }, []);

  const { getIdentityPayload, loading: authLoading } = useIdentity();

  const flushClicks = useCallback(async () => {
    if (flushing.current || authLoading) return;
    flushing.current = true;
    try {
      const identityData = getIdentityPayload();
      // Send queued clicks one-by-one to avoid lost updates / out-of-order responses.
      // This makes the counter correct even under very fast clicking.
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const shouldSend = await new Promise<boolean>((resolve) => {
          setPendingClicks((p) => {
            resolve(p > 0);
            return p;
          });
        });
        if (!shouldSend) break;

        const res = await fetch("/api/clicks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(identityData),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && typeof data.total_clicks === "number") {
          setGlobalCount(data.total_clicks);
          setLocalClicks((c) => c + 1);
          setPendingClicks((p) => Math.max(0, p - 1));
          window.dispatchEvent(new CustomEvent("clicks-updated", { detail: { clicks: data.total_clicks } }));
        } else {
          // If something went wrong, stop flushing for now (we'll retry on next click).
          break;
        }
      }
    } catch {
      // ignore; will retry on next click
    } finally {
      flushing.current = false;
    }
  }, [authLoading, getIdentityPayload]);

  const handleClick = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const id = nextId.current++;
    setPops((prev) => [
      ...prev,
      { id, x: e.clientX - rect.left, y: e.clientY - rect.top },
    ]);
    setTimeout(() => setPops((prev) => prev.filter((p) => p.id !== id)), 600);

    setPendingClicks((p) => p + 1);
    void flushClicks();
  };

  const formatted = globalCount.toLocaleString();

  return (
    <div className="rounded-xl border border-ctp-surface1/40 bg-ctp-surface0/20 p-5 flex flex-col items-center justify-center">
      <p className="font-mono text-4xl sm:text-5xl font-bold text-ctp-mauve tabular-nums mb-3">
        {formatted}
      </p>
      <button
        onClick={handleClick}
        className="counter-btn relative px-8 py-2.5 rounded-lg border border-ctp-mauve/40 bg-ctp-mauve/15 hover:bg-ctp-mauve/25 hover:border-ctp-mauve/60 transition-all font-mono text-sm font-bold text-ctp-mauve overflow-hidden"
      >
        CLICK ME
        <AnimatePresence>
          {pops.map((pop) => (
            <motion.span
              key={pop.id}
              initial={{ opacity: 1, y: 0, scale: 1 }}
              animate={{ opacity: 0, y: -30, scale: 1.4 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute text-ctp-mauve font-mono text-xs font-bold pointer-events-none"
              style={{ left: pop.x, top: pop.y }}
            >
              +1
            </motion.span>
          ))}
        </AnimatePresence>
      </button>
      <p className="text-xs font-mono text-ctp-overlay0 mt-2">
        you&apos;ve clicked {localClicks} times{pendingClicks > 0 ? ` (+${pendingClicks} syncing...)` : ""}
      </p>
    </div>
  );
}

/* â”€â”€â”€ Let's Connect â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function ConnectCard() {
  return (
    <div className="rounded-xl border border-ctp-surface1/40 bg-ctp-surface0/20 p-5">
      <h3 className="font-mono text-sm font-bold text-ctp-text mb-2 flex items-center gap-2">
        Let&apos;s Connect
      </h3>
      <p className="text-xs text-ctp-subtext0 mb-4 leading-relaxed">
        Always open to interesting projects and conversations.
      </p>
      <a
        href={connectMailto}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-ctp-blue/40 bg-ctp-blue/10 hover:bg-ctp-blue/20 transition-all font-mono text-xs text-ctp-blue"
      >
        Book a Chat
      </a>
    </div>
  );
}

/* â”€â”€â”€ Location + Live Clock â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function LocationCard() {
  const [time, setTime] = useState("");

  const updateTime = useCallback(() => {
    const now = new Date().toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    setTime(now);
  }, []);

  useEffect(() => {
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [updateTime]);

  return (
    <div className="rounded-xl border border-ctp-surface1/40 bg-ctp-surface0/20 p-5">
      <h3 className="font-mono text-sm font-bold text-ctp-text mb-2 flex items-center gap-2">
        Currently Based In
      </h3>
      <p className="text-sm text-ctp-subtext1 mb-1">{identity.location}</p>
      <p className="font-mono text-lg text-ctp-blue tabular-nums">
        IST {time}
      </p>
    </div>
  );
}

/* â”€â”€â”€ Leaderboard Widget â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function LeaderboardWidget() {
  const [leaders, setLeaders] = useState<
    { display_name: string; score: number; avatar_url?: string; github_username?: string }[]
  >([]);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((d) => setLeaders((d.leaderboard || []).slice(0, 8)))
      .catch(() => {});
  }, []);

  return (
    <div className="rounded-xl border border-ctp-surface1/40 bg-ctp-surface0/20 p-5">
      <h3 className="font-mono text-sm text-ctp-overlay1 uppercase tracking-wider mb-3 flex items-center justify-between">
        <span>Leaderboard</span>
        <Link href="/leaderboard" className="text-[10px] text-ctp-blue normal-case hover:text-ctp-lavender transition-colors">
          View all -&gt;
        </Link>
      </h3>
      {leaders.length === 0 ? (
        <p className="text-xs text-ctp-overlay0 font-mono">No visitors yet. Be the first!</p>
      ) : (
        <div className="space-y-1.5">
          {leaders.map((l, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-xs font-mono"
            >
              <span className={`w-5 text-right shrink-0 ${i < 3 ? "text-ctp-yellow" : "text-ctp-overlay0"}`}>
                {i < 3 ? `#${i + 1}` : `${i + 1}.`}
              </span>
              {l.avatar_url ? (
                <img
                  src={l.avatar_url}
                  alt={l.display_name}
                  className="w-4 h-4 rounded-full shrink-0"
                />
              ) : (
                <span className="w-4 h-4 rounded-full bg-ctp-surface1 shrink-0" />
              )}
              <span className="text-ctp-subtext1 truncate flex-1">
                {l.github_username || l.display_name}
              </span>
              <span className="text-ctp-overlay1 tabular-nums shrink-0">
                {l.score.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* â”€â”€â”€ User Stats Card (horizontal, full-width) â”€â”€ */
function UserStatsCard() {
  const { isLoggedIn, user, visitor_id, login, logout, loading: authLoading } = useIdentity();
  const [stats, setStats] = useState<{
    clicks: number;
    active_seconds: number;
    game_score: number;
    score: number;
    rank: number | null;
  } | null>(null);

  // Fetch stats on load
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
        if (d.stats) {
          if (d.stats.achievements) {
            d.stats.achievements.forEach((id: string) => {
              localStorage.setItem(id, "true");
            });
            window.dispatchEvent(new CustomEvent("achievement-unlocked"));
          }
          setStats(d.stats); 
        } 
      })
      .catch(() => {});
  }, [user, visitor_id, authLoading]);

  // Achievements tracking
  const [achievements, setAchievements] = useState<string[]>([]);
  useEffect(() => {
    const checkAchievements = () => {
      const list = [];
      if (localStorage.getItem("greenDotFound")) list.push("Green Dot");
      if (localStorage.getItem("greenDotFriends")) list.push("Friends");
      if (localStorage.getItem("greenDotPissedOff")) list.push("Vengeance");
      setAchievements(list);
    };
    checkAchievements();
    const handleUnlock = () => checkAchievements();
    window.addEventListener("achievement-unlocked", handleUnlock);
    return () => window.removeEventListener("achievement-unlocked", handleUnlock);
  }, []);

  // Real-time click updates
  useEffect(() => {
    const handler = () => {
      setStats((prev) => prev ? { ...prev, clicks: prev.clicks + 1, score: prev.score + 1 } : prev);
    };
    window.addEventListener("clicks-updated", handler);
    return () => window.removeEventListener("clicks-updated", handler);
  }, []);

  const formatTime = (s: number) => {
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
  };

  if (isLoggedIn && user) {
    return (
      <div className="sm:col-span-2 rounded-xl border border-ctp-surface1/40 bg-ctp-surface0/20 p-5">
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <img
            src={user.user_metadata?.avatar_url || ""}
            alt="avatar"
            className="w-14 h-14 rounded-full border-2 border-ctp-green/50 shrink-0"
          />
          {/* Info + Stats */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-mono text-sm text-ctp-text font-bold">
                  {user.user_metadata?.user_name || user.email}
                </p>
                <p className="text-[10px] text-ctp-green font-mono">✓ Progress saved</p>
              </div>
              <div className="flex items-center gap-3">
                {stats && (
                  <p className="font-mono text-xs text-ctp-subtext0">
                    Score: <span className="text-ctp-mauve font-bold">{stats.score.toLocaleString()}</span>
                  </p>
                )}
                <button
                  onClick={logout}
                  className="text-[10px] text-ctp-overlay0 hover:text-ctp-red font-mono transition-colors"
                >
                  Sign out
                </button>
              </div>
            </div>
            {stats && (
              <div className="grid grid-cols-4 gap-2 mb-3">
                <div className="text-center rounded-lg bg-ctp-crust/50 py-2 px-1">
                  <p className="font-mono text-base text-ctp-blue font-bold tabular-nums">{formatTime(stats.active_seconds)}</p>
                  <p className="text-[9px] text-ctp-overlay0 font-mono">TIME</p>
                </div>
                <div className="text-center rounded-lg bg-ctp-crust/50 py-2 px-1">
                  <p className="font-mono text-base text-ctp-mauve font-bold tabular-nums">{stats.clicks.toLocaleString()}</p>
                  <p className="text-[9px] text-ctp-overlay0 font-mono">CLICKS</p>
                </div>
                <div className="text-center rounded-lg bg-ctp-crust/50 py-2 px-1">
                  <p className="font-mono text-base text-ctp-peach font-bold tabular-nums">{stats.game_score.toLocaleString()}</p>
                  <p className="text-[9px] text-ctp-overlay0 font-mono">GAME</p>
                </div>
                <div className="text-center rounded-lg bg-ctp-crust/50 py-2 px-1">
                  <p className="font-mono text-base text-ctp-yellow font-bold tabular-nums">
                    {stats.rank ? `#${stats.rank}` : "—"}
                  </p>
                  <p className="text-[9px] text-ctp-overlay0 font-mono">RANK</p>
                </div>
              </div>
            )}

            <Link href="/achievements" className="group rounded-lg border border-ctp-surface1 bg-ctp-crust/40 p-3 flex justify-between items-center hover:bg-ctp-surface1/60 transition-colors">
              <div>
                <p className="font-mono text-xs text-ctp-subtext1 mb-1">🏆 Achievements Unlocked</p>
                <div className="flex gap-1.5 flex-wrap">
                  {achievements.length === 0 ? (
                    <span className="text-[10px] text-ctp-overlay0 font-mono italic">None yet</span>
                  ) : (
                    achievements.map(a => (
                      <span key={a} className="inline-flex bg-ctp-surface1 text-ctp-text text-[10px] items-center px-1.5 py-0.5 rounded border border-ctp-surface2 group-hover:border-ctp-mauve/30 transition-colors">
                        {a}
                      </span>
                    ))
                  )}
                </div>
              </div>
              <div className="text-ctp-mauve text-lg ml-2 group-hover:translate-x-1 transition-transform">
                →
              </div>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sm:col-span-2 rounded-xl border border-ctp-surface1/40 bg-ctp-surface0/20 p-5">
      <div className="flex items-center gap-5">
        <div className="shrink-0 text-center">
          <p className="text-3xl mb-1">🐙</p>
          <h3 className="font-mono text-xs font-bold text-ctp-text">Save Progress</h3>
        </div>
        <div className="flex-1 min-w-0">
          {stats && (
            <div className="flex gap-3 mb-3">
              <div className="text-center rounded-lg bg-ctp-crust/50 py-2 px-3">
                <p className="font-mono text-sm text-ctp-blue font-bold tabular-nums">{formatTime(stats.active_seconds)}</p>
                <p className="text-[9px] text-ctp-overlay0 font-mono">TIME</p>
              </div>
              <div className="text-center rounded-lg bg-ctp-crust/50 py-2 px-3">
                <p className="font-mono text-sm text-ctp-mauve font-bold tabular-nums">{stats.clicks.toLocaleString()}</p>
                <p className="text-[9px] text-ctp-overlay0 font-mono">CLICKS</p>
              </div>
            </div>
          )}

          <Link href="/achievements" className="group mb-3 rounded-lg border border-ctp-surface1 bg-ctp-crust/40 p-2.5 flex justify-between items-center hover:bg-ctp-surface1/60 transition-colors">
            <div>
              <p className="font-mono text-[11px] text-ctp-subtext1 mb-1">🏆 Achievements Unlocked</p>
              <div className="flex gap-1 flex-wrap">
                {achievements.length === 0 ? (
                  <span className="text-[10px] text-ctp-overlay0 font-mono italic">None yet</span>
                ) : (
                  achievements.map(a => (
                    <span key={a} className="inline-flex bg-ctp-surface1 text-ctp-text text-[9px] items-center px-1.5 py-0.5 rounded border border-ctp-surface2">
                      {a}
                    </span>
                  ))
                )}
              </div>
            </div>
            <div className="text-ctp-mauve text-sm ml-2 group-hover:translate-x-1 transition-transform">
              →
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <p className="text-[11px] text-ctp-subtext0 leading-relaxed max-w-[120px]">
              Login with GitHub to compete globally
            </p>
            <button
              onClick={login}
              className="px-3 py-1.5 flex-1 rounded-lg border border-ctp-mauve/40 bg-ctp-mauve/10 hover:bg-ctp-mauve/20 transition-all font-mono text-xs text-ctp-mauve text-center"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
function LatestPostsWidget({
  posts,
}: {
  posts: { title: string; slug: string; created_at: string }[];
}) {
  return (
    <div className="rounded-xl border border-ctp-surface1/40 bg-ctp-surface0/20 p-5">
      <h3 className="font-mono text-sm text-ctp-overlay1 uppercase tracking-wider mb-3 flex items-center justify-between">
        <span>Latest Posts</span>
        <a
          href="/blog"
          className="text-[10px] text-ctp-blue hover:text-ctp-lavender transition-colors normal-case"
        >
          -&gt;
        </a>
      </h3>
      {posts.length === 0 ? (
        <p className="text-xs text-ctp-overlay0 font-mono">No posts yet. Check back soon!</p>
      ) : (
        <div className="space-y-2.5">
          {posts.map((p) => (
            <a
              key={p.slug}
              href={`/blog/${p.slug}`}
              className="flex items-center justify-between gap-2 group"
            >
              <span className="text-sm text-ctp-subtext1 group-hover:text-ctp-text transition-colors truncate">
                {p.title}
              </span>
              <span className="text-[11px] text-ctp-overlay0 font-mono shrink-0">
                {new Date(p.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

/* â”€â”€â”€ GitHub Commits â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function CommitsWidget({
  commits,
  languages,
}: {
  commits: GitHubCommit[];
  languages: LanguageStat[];
}) {
  const getCommitHref = (commit: GitHubCommit) => {
    // If GitHub API failed, fallback commits use "#" which keeps you on-page.
    // In that case, send users to the GitHub profile (repo might not exist / be private).
    if (commit.url?.startsWith("http")) return commit.url;
    return links.github;
  };

  return (
    <div className="rounded-xl border border-ctp-surface1/40 bg-ctp-surface0/20 p-5 sm:col-span-2">
      <h3 className="font-mono text-sm text-ctp-overlay1 uppercase tracking-wider mb-3 flex items-center justify-between">
        <span>Recent Commits</span>
        <span className="text-[10px] text-ctp-overlay0 normal-case">[live]</span>
      </h3>

      {/* Commits list */}
      <div className="space-y-0 border border-ctp-surface1/30 rounded-lg overflow-hidden mb-4">
        {commits.map((commit, i) => (
          <a
            key={`${commit.sha}-${i}`}
            href={getCommitHref(commit)}
            target="_blank"
            rel="noopener noreferrer"
            className="commit-row flex items-center gap-3 px-3 py-2 border-b border-ctp-surface1/20 last:border-b-0 group"
          >
            <span className="font-mono text-[11px] text-ctp-blue shrink-0 w-24 truncate font-bold">
              {commit.repo}:
            </span>
            <span className="text-xs text-ctp-subtext1 truncate flex-1 group-hover:text-ctp-text transition-colors">
              {commit.message}
            </span>
            {/* Real additions / deletions - only shown when available */}
            {(commit.additions !== null || commit.deletions !== null) && (
              <span className="text-[11px] font-mono shrink-0 hidden sm:inline space-x-1">
                {commit.additions !== null && (
                  <span className="text-ctp-green">+{commit.additions}</span>
                )}
                {commit.deletions !== null && (
                  <span className="text-ctp-red">-{commit.deletions}</span>
                )}
              </span>
            )}
            <span className="text-[10px] text-ctp-overlay0 font-mono shrink-0 hidden sm:inline" title={commit.sha}>
              {commit.date}
            </span>
          </a>
        ))}
      </div>

      {/* Language bar */}
      {languages.length > 0 && (
        <>
          <div className="flex h-2 rounded-full overflow-hidden mb-2">
            {languages.map((lang) => (
              <div
                key={lang.name}
                style={{
                  width: `${lang.percentage}%`,
                  backgroundColor: lang.color,
                }}
                title={`${lang.name}: ${lang.percentage}%`}
                className="transition-all hover:opacity-80"
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {languages.map((lang) => (
              <span key={lang.name} className="flex items-center gap-1 text-[10px] font-mono text-ctp-subtext0">
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: lang.color }}
                />
                {lang.name}
              </span>
            ))}
          </div>
          <a
            href="https://github.com/tejeswaar"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-3 text-xs font-mono text-ctp-blue hover:text-ctp-lavender transition-colors"
          >
            View on GitHub -&gt;
          </a>
        </>
      )}
    </div>
  );
}

/* â”€â”€â”€ Dashboard (bento grid) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export default function Dashboard({
  commits,
  languages,
  posts = [],
}: {
  commits: GitHubCommit[];
  languages: LanguageStat[];
  posts?: { title: string; slug: string; created_at: string }[];
}) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("visible");
          observer.disconnect();
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="dashboard" ref={sectionRef} className="reveal py-24 px-6 max-w-5xl mx-auto">
      <h2 className="font-mono text-2xl text-ctp-blue mb-2 flex items-center gap-2">
        <span className="text-ctp-mauve">04.</span> dashboard
      </h2>
      <div className="section-divider mb-10" />

      {/* Bento grid inspired by jasoncameron.dev */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Row 1: 4 cards */}
        <ConnectCard />
        <LocationCard />
        <GlobalClickCounter />
        <LeaderboardWidget />

        {/* Row 2: wide cards + small cards */}
        <CommitsWidget commits={commits} languages={languages} />
        <LatestPostsWidget posts={posts} />
        <div className="rounded-xl border border-ctp-surface1/40 bg-ctp-surface0/20 p-5">
          <h3 className="font-mono text-sm text-ctp-overlay1 uppercase tracking-wider mb-3">
            Play a Game
          </h3>
          <p className="text-xs text-ctp-subtext0 mb-4">
            Try the classic Hamurabi in the terminal - rule ancient Sumeria!
          </p>
          <a
            href="/terminal"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-ctp-green/40 bg-ctp-green/10 hover:bg-ctp-green/20 transition-all font-mono text-xs text-ctp-green"
          >
            &gt;_ Open Terminal
          </a>
        </div>
        <UserStatsCard />
        {/* UserStatsCard handles its own col-span-2 */}
      </div>
    </section>
  );
}


