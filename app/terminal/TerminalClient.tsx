"use client";

import { useState, useRef, useEffect, useCallback, KeyboardEvent, useMemo } from "react";
import { startGame, processInput, type GameState } from "../lib/hamurabi";

type LineType = "output" | "input" | "error" | "accent" | "success" | "warning";
type Line = { text: string; type: LineType };

type TerminalMode = "normal" | "password" | "hamurabi" | "post_title" | "post_content" | "post_youtube" | "post_publish" | "set_name";

const MOTD: Line[] = [
  { text: "╔══════════════════════════════════════════════╗", type: "accent" },
  { text: "║   tejeswaar@portfolio:~$ v2.0.0              ║", type: "accent" },
  { text: "║   Type 'help' for available commands          ║", type: "accent" },
  { text: "╚══════════════════════════════════════════════╝", type: "accent" },
  { text: "", type: "output" },
];

export default function TerminalClient() {
  const [lines, setLines] = useState<Line[]>([...MOTD]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [mode, setMode] = useState<TerminalMode>("normal");
  const [isAdmin, setIsAdmin] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  // Post creation temp state
  const [postDraft, setPostDraft] = useState({ title: "", content: "", youtube_url: "" });

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const addLines = useCallback((newLines: Line[]) => {
    setLines((prev) => [...prev, ...newLines]);
  }, []);

  const addOutput = useCallback((texts: string[]) => {
    addLines(texts.map((t) => ({ text: t, type: "output" as LineType })));
  }, [addLines]);

  // ─── Command handlers ────────────────────
  const commands = useMemo<Record<string, () => void>>(() => ({
    help: () => {
      addLines([
        { text: "Available commands:", type: "output" },
        { text: "  whoami         — Who am I?", type: "output" },
        { text: "  ls projects    — List projects", type: "output" },
        { text: "  cat about      — Read about me", type: "output" },
        { text: "  skills         — Skill breakdown", type: "output" },
        { text: "  contact        — Contact info", type: "output" },
        { text: "  blog           — Recent blog posts", type: "output" },
        { text: "  leaderboard    — Top visitors", type: "output" },
        { text: "  play hamurabi  — Play the classic game", type: "output" },
        { text: "  setname <name> — Set your display name", type: "output" },
        { text: "  neofetch       — System info", type: "output" },
        { text: "  clear          — Clear terminal", type: "output" },
        { text: "  exit           — Back to portfolio", type: "output" },
        { text: "", type: "output" },
        { text: "Admin commands:", type: "warning" },
        { text: "  admin login    — Authenticate as admin", type: "output" },
        { text: "  admin logout   — End admin session", type: "output" },
        { text: "  admin post create — Create a blog post", type: "output" },
        { text: "  admin post list   — List all posts", type: "output" },
        { text: "  admin post delete <id> — Delete a post", type: "output" },
        { text: "", type: "output" },
      ]);
    },
    whoami: () => addOutput([
      "Tejeswaar Reddy",
      "Game Systems Programmer · Engine Developer · Technical Artist",
      "📍 Hyderabad, Telangana, India", "",
    ]),
    "ls projects": () => addOutput([
      "drwxr-xr-x  land-of-souls/    [IN DEV]   UE5 · GAS · Dark Fantasy",
      "drwxr-xr-x  retina-engine/    [IN DEV]   C++ · SDL2 · OpenGL · ECS",
      "drwxr-xr-x  questboard/       [LIVE]     Firebase · Gemini AI",
      "drwxr-xr-x  mix-mash/         [SHIPPED]  Unity · C# · Mobile", "",
    ]),
    "cat about": () => addOutput([
      "I'm a game-obsessed systems programmer who'd rather write a",
      "custom engine from scratch than drag and drop a template.", "",
      "I care about how things work under the hood — ECS architectures,",
      "rendering pipelines, and combat systems that actually *feel* good.", "",
      "If it runs at 60 fps and the code is clean, I'm happy.", "",
    ]),
    skills: () => addOutput([
      "C++         ████████░░  82%",
      "Unreal GAS  ███████░░░  75%",
      "OpenGL/SDL  ███████░░░  70%",
      "Blueprint   ██████░░░░  65%",
      "3D Art      ██████░░░░  60%",
      "C#          █████░░░░░  55%", "",
    ]),
    contact: () => addOutput([
      "📧 tejeswaarreddy@gmail.com",
      "📱 +91-7330666605",
      "🐙 github.com/tejeswaar",
      "🎨 artstation.com/tejeswaar", "",
    ]),
    neofetch: () => addOutput([
      "        ████████          tejeswaar@portfolio",
      "      ██        ██        ─────────────────────",
      "    ██    ████    ██      OS: Developer Brain v2.0",
      "    ██  ██    ██  ██      Host: Hyderabad, India",
      "    ██  ██    ██  ██      Kernel: Next.js 14",
      "    ██    ████    ██      Shell: TypeScript 5",
      "      ██        ██        DE: Catppuccin Mocha",
      "        ████████          Terminal: Portfolio v2.0",
      "                          CPU: Coffee-Powered i∞",
      "                          GPU: Dreams & Ambition", "",
    ]),
  }), [addLines, addOutput]);

  // ─── Main command router ──────────────────
  const runCommand = useCallback(
    async (cmd: string) => {
      const trimmed = cmd.trim();
      const lower = trimmed.toLowerCase();

      // Show input line (mask password)
      if (mode === "password") {
        addLines([{ text: "tejeswaar@portfolio:~$ ••••••••", type: "input" }]);
      } else {
        addLines([{ text: `tejeswaar@portfolio:~$ ${trimmed}`, type: "input" }]);
      }

      // ── Hamurabi mode ─────
      if (mode === "hamurabi" && gameState) {
        if (lower === "quit" || lower === "exit game") {
          setMode("normal");
          setGameState(null);
          addOutput(["Left the game. Back to terminal.", ""]);
          return;
        }
        const result = processInput(gameState, trimmed);
        setGameState({ ...result.state });
        addLines(result.output.map((t) => ({ text: t, type: "output" as LineType })));
        if (result.state.gameOver) {
          setMode("normal");
          setGameState(null);
        }
        return;
      }

      // ── Password mode ─────
      if (mode === "password") {
        addLines([{ text: "Authenticating…", type: "warning" }]);
        try {
          const res = await fetch("/api/admin-auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password: trimmed }),
          });
          const data = await res.json();
          if (res.ok && data.success) {
            setIsAdmin(true);
            addLines([{ text: "✓ Access Granted. Welcome, Teja.", type: "success" }, { text: "", type: "output" }]);
          } else {
            addLines([{ text: "✗ Access Denied.", type: "error" }, { text: "", type: "output" }]);
          }
        } catch {
          addLines([{ text: "✗ Network error.", type: "error" }]);
        }
        setMode("normal");
        return;
      }

      // ── Post creation flow ─────
      if (mode === "post_title") {
        setPostDraft((d) => ({ ...d, title: trimmed }));
        setMode("post_content");
        addOutput(["Enter post content (Markdown). Type END on a new line when done:", ""]);
        return;
      }
      if (mode === "post_content") {
        if (trimmed === "END") {
          setMode("post_youtube");
          addOutput(["YouTube URL (optional, press Enter to skip):"]);
          return;
        }
        setPostDraft((d) => ({ ...d, content: d.content + (d.content ? "\n" : "") + cmd }));
        return;
      }
      if (mode === "post_youtube") {
        setPostDraft((d) => ({ ...d, youtube_url: trimmed || "" }));
        setMode("post_publish");
        addOutput(["Publish immediately? (yes/no):"]);
        return;
      }
      if (mode === "post_publish") {
        const publish = lower === "yes" || lower === "y";
        addLines([{ text: "Creating post…", type: "warning" }]);
        try {
          const res = await fetch("/api/posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: postDraft.title,
              content: postDraft.content,
              youtube_url: postDraft.youtube_url || null,
              published: publish,
            }),
          });
          const data = await res.json();
          if (res.ok) {
            addLines([
              { text: `✓ Post created: "${data.post.title}"`, type: "success" },
              { text: `  Slug: ${data.post.slug}`, type: "output" },
              { text: `  Status: ${publish ? "Published" : "Draft"}`, type: "output" },
              { text: "", type: "output" },
            ]);
          } else {
            addLines([{ text: `✗ Error: ${data.error}`, type: "error" }]);
          }
        } catch {
          addLines([{ text: "✗ Failed to create post.", type: "error" }]);
        }
        setPostDraft({ title: "", content: "", youtube_url: "" });
        setMode("normal");
        return;
      }

      // ── Display name ─────
      if (mode === "set_name") {
        const fp = localStorage.getItem("visitor-fp");
        if (fp) {
          try {
            await fetch("/api/leaderboard", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ fingerprint: fp, display_name: trimmed, clicks: 0, active_seconds: 0 }),
            });
            addLines([{ text: `✓ Display name set to: ${trimmed}`, type: "success" }, { text: "", type: "output" }]);
          } catch {
            addLines([{ text: "✗ Failed to set name.", type: "error" }]);
          }
        }
        setMode("normal");
        return;
      }

      // ── Normal mode commands ─────

      if (lower === "clear") { setLines([]); return; }
      if (lower === "exit") { window.location.href = "/"; return; }

      // Check static commands
      if (commands[lower]) {
        commands[lower]();
        return;
      }

      // Admin login
      if (lower === "admin login") {
        if (isAdmin) {
          addLines([{ text: "Already authenticated.", type: "warning" }, { text: "", type: "output" }]);
          return;
        }
        addOutput(["Enter password:"]);
        setMode("password");
        return;
      }

      // Admin logout
      if (lower === "admin logout") {
        if (!isAdmin) {
          addLines([{ text: "Not logged in.", type: "error" }]);
          return;
        }
        await fetch("/api/admin-logout", { method: "POST" });
        setIsAdmin(false);
        addLines([{ text: "✓ Logged out.", type: "success" }, { text: "", type: "output" }]);
        return;
      }

      // Admin post create
      if (lower === "admin post create") {
        if (!isAdmin) {
          addLines([{ text: "✗ Admin access required. Run 'admin login' first.", type: "error" }]);
          return;
        }
        addOutput(["Enter post title:"]);
        setMode("post_title");
        return;
      }

      // Admin post list
      if (lower === "admin post list") {
        if (!isAdmin) {
          addLines([{ text: "✗ Admin access required.", type: "error" }]);
          return;
        }
        try {
          const res = await fetch("/api/posts");
          const data = await res.json();
          if (data.posts && data.posts.length > 0) {
            addOutput(["ID                                    TITLE                STATUS"]);
            addOutput(["───────────────────────────────────── ──────────────────── ──────"]);
            for (const p of data.posts) {
              const status = p.published ? "PUB" : "DFT";
              addOutput([`${p.id}  ${p.title.padEnd(20).slice(0, 20)}  [${status}]`]);
            }
          } else {
            addOutput(["No posts found."]);
          }
          addOutput([""]);
        } catch {
          addLines([{ text: "✗ Failed to fetch posts.", type: "error" }]);
        }
        return;
      }

      // Admin post delete
      if (lower.startsWith("admin post delete ")) {
        if (!isAdmin) {
          addLines([{ text: "✗ Admin access required.", type: "error" }]);
          return;
        }
        const postId = trimmed.slice(18).trim();
        try {
          const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
          if (res.ok) {
            addLines([{ text: "✓ Post deleted.", type: "success" }, { text: "", type: "output" }]);
          } else {
            const data = await res.json();
            addLines([{ text: `✗ ${data.error}`, type: "error" }]);
          }
        } catch {
          addLines([{ text: "✗ Failed to delete.", type: "error" }]);
        }
        return;
      }

      // Play Hamurabi
      if (lower === "play hamurabi") {
        const { state, output } = startGame();
        setGameState(state);
        setMode("hamurabi");
        addLines(output.map((t) => ({ text: t, type: "accent" as LineType })));
        return;
      }

      // Leaderboard
      if (lower === "leaderboard") {
        try {
          const res = await fetch("/api/leaderboard");
          const data = await res.json();
          if (data.leaderboard && data.leaderboard.length > 0) {
            addOutput(["  # │ NAME                 │ SCORE"]);
            addOutput(["────┼──────────────────────┼──────"]);
            for (let i = 0; i < Math.min(data.leaderboard.length, 10); i++) {
              const l = data.leaderboard[i];
              const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
              addOutput([`  ${medal.padEnd(3)} ${l.display_name.padEnd(22)} ${l.score}`]);
            }
          } else {
            addOutput(["No visitors on the leaderboard yet."]);
          }
          addOutput([""]);
        } catch {
          addLines([{ text: "✗ Failed to load leaderboard.", type: "error" }]);
        }
        return;
      }

      // Blog
      if (lower === "blog") {
        try {
          const res = await fetch("/api/posts");
          const data = await res.json();
          if (data.posts && data.posts.length > 0) {
            addOutput(["Recent posts:"]);
            for (const p of data.posts.slice(0, 5)) {
              const d = new Date(p.created_at).toLocaleDateString();
              addOutput([`  • ${p.title} — ${d}`]);
            }
            addOutput(["", "Visit /blog to read full posts.", ""]);
          } else {
            addOutput(["No posts yet.", ""]);
          }
        } catch {
          addOutput(["Failed to load posts.", ""]);
        }
        return;
      }

      // setname
      if (lower.startsWith("setname ")) {
        const name = trimmed.slice(8).trim();
        if (name) {
          const fp = localStorage.getItem("visitor-fp");
          if (fp) {
            try {
              await fetch("/api/leaderboard", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fingerprint: fp, display_name: name, clicks: 0, active_seconds: 0 }),
              });
              addLines([{ text: `✓ Display name set to: ${name}`, type: "success" }, { text: "", type: "output" }]);
            } catch {
              addLines([{ text: "✗ Failed to set name.", type: "error" }]);
            }
          }
          return;
        }
      }

      // Unknown command
      if (trimmed !== "") {
        addLines([{
          text: `command not found: ${cmd}. Type 'help' for available commands.`,
          type: "error",
        }]);
      }
    },
    [mode, isAdmin, gameState, postDraft, addLines, addOutput, commands]
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      runCommand(input);
      if (mode !== "post_content") {
        setHistory((prev) => [input, ...prev]);
      }
      setHistoryIndex(-1);
      setInput("");
    } else if (e.key === "ArrowUp" && mode === "normal") {
      e.preventDefault();
      if (historyIndex < history.length - 1) {
        const ni = historyIndex + 1;
        setHistoryIndex(ni);
        setInput(history[ni]);
      }
    } else if (e.key === "ArrowDown" && mode === "normal") {
      e.preventDefault();
      if (historyIndex > 0) {
        const ni = historyIndex - 1;
        setHistoryIndex(ni);
        setInput(history[ni]);
      } else {
        setHistoryIndex(-1);
        setInput("");
      }
    }
  };

  const typeColors: Record<LineType, string> = {
    output: "text-ctp-subtext1",
    input: "text-ctp-green",
    error: "text-ctp-red",
    accent: "text-ctp-blue",
    success: "text-ctp-green font-bold",
    warning: "text-ctp-yellow",
  };

  // Prompt text changes based on mode
  const promptSuffix = mode === "hamurabi"
    ? "hamurabi>"
    : mode === "password"
      ? "(password)>"
      : mode === "post_content"
        ? "(markdown)>"
        : mode !== "normal"
          ? "(input)>"
          : "~$";

  return (
    <div
      className="min-h-screen bg-ctp-crust p-4 sm:p-8 font-mono text-sm cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="max-w-3xl mx-auto">
        {/* Window chrome */}
        <div className="flex items-center gap-2 mb-4 px-2">
          <a
            href="/"
            className="w-3 h-3 rounded-full bg-ctp-surface2 hover:brightness-110 transition-all"
            aria-label="Back to home"
          />
          <span className="w-3 h-3 rounded-full bg-ctp-surface2" />
          <span className="w-3 h-3 rounded-full bg-ctp-surface2" />
          <span className="ml-3 text-xs text-ctp-overlay0">
            ~/tejeswaar — terminal
            {isAdmin && <span className="text-ctp-green ml-2">[ADMIN]</span>}
            {mode === "hamurabi" && <span className="text-ctp-yellow ml-2">[GAME]</span>}
          </span>
        </div>

        {/* Output */}
        <div className="space-y-0.5">
          {lines.map((line, i) => (
            <div key={i} className={`${typeColors[line.type]} whitespace-pre-wrap leading-relaxed break-words`}>
              {line.text}
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-ctp-green shrink-0">
            tejeswaar@portfolio:{promptSuffix}
          </span>
          <input
            ref={inputRef}
            type={mode === "password" ? "password" : "text"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none text-ctp-text caret-ctp-blue"
            spellCheck={false}
            autoComplete="off"
          />
        </div>
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
