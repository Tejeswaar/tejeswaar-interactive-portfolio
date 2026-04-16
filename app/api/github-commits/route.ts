// /api/github-commits — cached GitHub commit data endpoint
import { NextResponse } from "next/server";
import { githubUsername } from "../../lib/content";

interface CachedData {
  commits: CommitResponse[];
  languages: LanguageResponse[];
  timestamp: number;
}

interface CommitResponse {
  repo: string;
  message: string;
  date: string;
  relativeDate: string;
  sha: string;
  url: string;
  additions: number | null;
  deletions: number | null;
}

interface LanguageResponse {
  name: string;
  percentage: number;
  color: string;
}

const GITHUB_API = "https://api.github.com";
const CACHE_TTL_MS = 60_000; // 60-second cache

let cache: CachedData | null = null;

const LANG_COLORS: Record<string, string> = {
  "C++": "#f34b7d",
  "C#": "#178600",
  C: "#555555",
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  HLSL: "#aace60",
  ShaderLab: "#222c37",
  Lua: "#000080",
  GLSL: "#5686a5",
  CMake: "#DA3434",
  Shell: "#89e051",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Makefile: "#427819",
};

function headers() {
  const h: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "portfolio-site",
  };
  if (process.env.GITHUB_TOKEN) {
    h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return h;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

// Fetch additions/deletions for a single commit (best-effort)
async function fetchCommitStats(
  repoFullName: string,
  sha: string
): Promise<{ additions: number; deletions: number } | null> {
  try {
    const res = await fetch(`${GITHUB_API}/repos/${repoFullName}/commits/${sha}`, {
      headers: headers(),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      additions: data.stats?.additions ?? 0,
      deletions: data.stats?.deletions ?? 0,
    };
  } catch {
    return null;
  }
}

async function fetchFreshData(): Promise<CachedData> {
  const limit = 8;

  // ── Fetch commits from events API ──
  let commits: CommitResponse[] = [];
  try {
    const res = await fetch(
      `${GITHUB_API}/users/${githubUsername}/events/public?per_page=30`,
      { headers: headers() }
    );

    if (res.ok) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const events: any[] = await res.json();
      const rawCommits: {
        repo: string;
        repoFullName: string;
        message: string;
        date: string;
        sha: string;
      }[] = [];

      for (const event of events) {
        if (event.type !== "PushEvent") continue;
        const repoName = event.repo?.name?.split("/")[1] || event.repo?.name;
        const repoFullName = event.repo?.name;

        if (event.payload?.commits && event.payload.commits.length > 0) {
          // Events API returned commit details inline
          for (const commit of event.payload.commits) {
            rawCommits.push({
              repo: repoName,
              repoFullName,
              message: commit.message.split("\n")[0],
              date: event.created_at,
              sha: commit.sha,
            });
            if (rawCommits.length >= limit) break;
          }
        } else if (event.payload?.head) {
          // No inline commits — fetch the head commit via the commits API
          try {
            const commitRes = await fetch(
              `${GITHUB_API}/repos/${repoFullName}/commits/${event.payload.head}`,
              { headers: headers() }
            );
            if (commitRes.ok) {
              const commitData = await commitRes.json();
              rawCommits.push({
                repo: repoName,
                repoFullName,
                message: (commitData.commit?.message || "Push event").split("\n")[0],
                date: event.created_at,
                sha: event.payload.head,
              });
            }
          } catch {
            // skip this event
          }
        }
        if (rawCommits.length >= limit) break;
      }

      // Fetch stats for up to 5 commits in parallel (to stay within rate limits)
      const statsPromises = rawCommits.slice(0, 5).map((c) =>
        fetchCommitStats(c.repoFullName, c.sha)
      );
      const stats = await Promise.all(statsPromises);

      commits = rawCommits.map((c, i) => ({
        repo: c.repo,
        message:
          c.message.substring(0, 80) + (c.message.length > 80 ? "…" : ""),
        date: c.date,
        relativeDate: timeAgo(c.date),
        sha: c.sha.substring(0, 7),
        url: `https://github.com/${c.repoFullName}/commit/${c.sha}`,
        additions: i < stats.length ? (stats[i]?.additions ?? null) : null,
        deletions: i < stats.length ? (stats[i]?.deletions ?? null) : null,
      }));
    }
  } catch (err) {
    console.error("GitHub events fetch error:", err);
  }

  // ── Fetch language stats ──
  let languages: LanguageResponse[] = [];
  try {
    const res = await fetch(
      `${GITHUB_API}/users/${githubUsername}/repos?per_page=20&sort=updated`,
      { headers: headers() }
    );

    if (res.ok) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const repos: any[] = await res.json();
      const langBytes: Record<string, number> = {};

      const langPromises = repos.slice(0, 10).map(async (repo) => {
        try {
          const langRes = await fetch(repo.languages_url, {
            headers: headers(),
          });
          if (langRes.ok) {
            const langs = await langRes.json();
            for (const [lang, bytes] of Object.entries(langs)) {
              langBytes[lang] = (langBytes[lang] || 0) + (bytes as number);
            }
          }
        } catch {
          /* skip */
        }
      });

      await Promise.all(langPromises);

      const total = Object.values(langBytes).reduce((a, b) => a + b, 0);
      if (total > 0) {
        languages = Object.entries(langBytes)
          .map(([name, bytes]) => ({
            name,
            percentage: Math.round((bytes / total) * 1000) / 10,
            color: LANG_COLORS[name] || "#6c7086",
          }))
          .sort((a, b) => b.percentage - a.percentage)
          .slice(0, 8);
      }
    }
  } catch (err) {
    console.error("GitHub repos fetch error:", err);
  }

  return { commits, languages, timestamp: Date.now() };
}

export async function GET() {
  // Return cached data if fresh enough
  if (cache && Date.now() - cache.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(
      { commits: cache.commits, languages: cache.languages, cached: true },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  }

  const data = await fetchFreshData();
  cache = data;

  return NextResponse.json(
    { commits: data.commits, languages: data.languages, cached: false },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    }
  );
}
