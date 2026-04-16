// ============================================================
// github.ts — GitHub API data fetching (server-side only)
// ============================================================

import { githubUsername } from "./content";

export interface GitHubCommit {
  repo: string;
  message: string;
  date: string;
  sha: string;
  url: string;
  additions: number | null;
  deletions: number | null;
}

export interface LanguageStat {
  name: string;
  percentage: number;
  color: string;
}

const GITHUB_API = "https://api.github.com";

// Known GitHub language colors
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

function githubHeaders(): Record<string, string> {
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
  const mins = Math.floor(diff / 60000);
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
    const res = await fetch(
      `${GITHUB_API}/repos/${repoFullName}/commits/${sha}`,
      { headers: githubHeaders() }
    );
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

export async function fetchRecentCommits(
  limit = 5
): Promise<GitHubCommit[]> {
  try {
    // Fetch recent events (push events contain commits)
    const res = await fetch(
      `${GITHUB_API}/users/${githubUsername}/events/public?per_page=30`,
      {
        next: { revalidate: 300 },
        headers: githubHeaders(),
      }
    );

    if (!res.ok) {
      console.error("GitHub API error:", res.status);
      return getFallbackCommits();
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const events: any[] = await res.json();

    // First pass: extract raw commit info (need repoFullName for stats fetch)
    const rawCommits: {
      repo: string;
      repoFullName: string;
      message: string;
      createdAt: string;
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
            createdAt: event.created_at,
            sha: commit.sha,
          });
          if (rawCommits.length >= limit) break;
        }
      } else if (event.payload?.head) {
        // No inline commits — fetch the head commit from the commits API
        try {
          const commitRes = await fetch(
            `${GITHUB_API}/repos/${repoFullName}/commits/${event.payload.head}`,
            { headers: githubHeaders() }
          );
          if (commitRes.ok) {
            const commitData = await commitRes.json();
            rawCommits.push({
              repo: repoName,
              repoFullName,
              message: (commitData.commit?.message || "Push event").split("\n")[0],
              createdAt: event.created_at,
              sha: event.payload.head,
            });
          }
        } catch {
          // skip this event
        }
      }
      if (rawCommits.length >= limit) break;
    }

    if (rawCommits.length === 0) return getFallbackCommits();

    // Fetch stats for the commits in parallel (best-effort)
    const statsPromises = rawCommits.map((c) =>
      fetchCommitStats(c.repoFullName, c.sha)
    );
    const stats = await Promise.all(statsPromises);

    const commits: GitHubCommit[] = rawCommits.map((c, i) => ({
      repo: c.repo,
      message:
        c.message.substring(0, 80) + (c.message.length > 80 ? "…" : ""),
      date: timeAgo(c.createdAt),
      sha: c.sha.substring(0, 7),
      url: `https://github.com/${c.repoFullName}/commit/${c.sha}`,
      additions: stats[i]?.additions ?? null,
      deletions: stats[i]?.deletions ?? null,
    }));

    return commits;
  } catch (err) {
    console.error("Failed to fetch GitHub commits:", err);
    return getFallbackCommits();
  }
}

export async function fetchLanguageStats(): Promise<LanguageStat[]> {
  try {
    const res = await fetch(
      `${GITHUB_API}/users/${githubUsername}/repos?per_page=20&sort=updated`,
      {
        next: { revalidate: 300 },
        headers: githubHeaders(),
      }
    );

    if (!res.ok) return getFallbackLanguages();

    const repos = await res.json();
    const langBytes: Record<string, number> = {};

    // Fetch language breakdown for each repo
    const langPromises = repos.slice(0, 10).map(async (repo: { languages_url: string }) => {
      try {
        const langRes = await fetch(repo.languages_url, {
          next: { revalidate: 300 },
          headers: githubHeaders(),
        });
        if (langRes.ok) {
          const langs = await langRes.json();
          for (const [lang, bytes] of Object.entries(langs)) {
            langBytes[lang] = (langBytes[lang] || 0) + (bytes as number);
          }
        }
      } catch {
        // skip individual repo failures
      }
    });

    await Promise.all(langPromises);

    const total = Object.values(langBytes).reduce((a, b) => a + b, 0);
    if (total === 0) return getFallbackLanguages();

    return Object.entries(langBytes)
      .map(([name, bytes]) => ({
        name,
        percentage: Math.round((bytes / total) * 1000) / 10,
        color: LANG_COLORS[name] || "#6c7086",
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 8);
  } catch {
    return getFallbackLanguages();
  }
}

function getFallbackCommits(): GitHubCommit[] {
  return [
    {
      repo: "retina-engine",
      message: "feat: implement ECS entity registry",
      date: "2h ago",
      sha: "a3f8c21",
      url: "#",
      additions: null,
      deletions: null,
    },
    {
      repo: "retina-engine",
      message: "fix: SDL2 window resize event handling",
      date: "5h ago",
      sha: "e7d2b19",
      url: "#",
      additions: null,
      deletions: null,
    },
    {
      repo: "land-of-souls",
      message: "refactor: GAS attribute set for stamina",
      date: "1d ago",
      sha: "c4a9f32",
      url: "#",
      additions: null,
      deletions: null,
    },
    {
      repo: "questboard",
      message: "feat: Gemini AI prompt templates",
      date: "2d ago",
      sha: "fb1e847",
      url: "#",
      additions: null,
      deletions: null,
    },
    {
      repo: "portfolio",
      message: "style: update hero animations",
      date: "3d ago",
      sha: "d92c1a5",
      url: "#",
      additions: null,
      deletions: null,
    },
  ];
}

function getFallbackLanguages(): LanguageStat[] {
  return [
    { name: "C++", percentage: 42.3, color: "#f34b7d" },
    { name: "C#", percentage: 18.7, color: "#178600" },
    { name: "TypeScript", percentage: 15.2, color: "#3178c6" },
    { name: "HLSL", percentage: 8.1, color: "#aace60" },
    { name: "Blueprint", percentage: 6.4, color: "#89dceb" },
    { name: "GLSL", percentage: 5.8, color: "#5686a5" },
    { name: "Python", percentage: 3.5, color: "#3572A5" },
  ];
}
