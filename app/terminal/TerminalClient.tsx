"use client";

import { useState, useRef, useEffect, useCallback, KeyboardEvent, useMemo } from "react";
import { useRouter } from "next/navigation";
import { startGame, processInput, type GameState } from "../lib/hamurabi";
import SnakeGame from "./SnakeGame";
import { useIdentity } from "../components/AuthProvider";

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
  const { isLoggedIn, login } = useIdentity();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [showSnakeGame, setShowSnakeGame] = useState(false);
  const [greenDotTransform, setGreenDotTransform] = useState({ x: 0, y: 0 });
  const [greenHoverCount, setGreenHoverCount] = useState(0);
  const [slowApproaches, setSlowApproaches] = useState(0);
  const [greenStoryState, setGreenStoryState] = useState<"normal" | "stage1" | "stage2" | "stage3" | "peace" | "rage" | "betrayed" | "vanished" | "friendly">("normal");
  const [angerPopupData, setAngerPopupData] = useState<{ text: React.ReactNode, options?: { label: string, action: () => void }[] } | null>(null);
  const router = useRouter();

  // Post creation temp state
  const [postDraft, setPostDraft] = useState({ title: "", content: "", youtube_url: "" });

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Restore terminal lines from session storage
  useEffect(() => {
    const savedLines = sessionStorage.getItem("terminalLines");
    if (savedLines) {
      try { setLines(JSON.parse(savedLines)); } catch (e) {}
    }
    
    // Check if green dot is friendly
    if (localStorage.getItem("greenDotFriendly") === "true") {
      setGreenStoryState("friendly");
    }
  }, []);

  // Save terminal lines to session storage whenever they change
  useEffect(() => {
    sessionStorage.setItem("terminalLines", JSON.stringify(lines));
  }, [lines]);

  const triggerPopup = useCallback((text: React.ReactNode, options?: { label: string, action: () => void }[], autoHide = true) => {
    setAngerPopupData({ text, options });
    if (autoHide && !options) {
      setTimeout(() => {
        setAngerPopupData((curr) => curr?.text === text ? null : curr);
      }, 4000);
    }
  }, []);

  const handleGreenHover = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (greenStoryState === "vanished") return; // It's gone!

    if (greenStoryState === "friendly") {
      const friendlyLines = ["Hayy friend!", "How are you?", "Nice to see you again!"];
      triggerPopup(friendlyLines[Math.floor(Math.random() * friendlyLines.length)]);
      return; 
    }

    const isMiddleMouse = (e.buttons & 4) !== 0;
    if (isMiddleMouse && greenHoverCount > 0) {
      const newSlowCount = slowApproaches + 1;
      setSlowApproaches(newSlowCount);
      
      if (newSlowCount >= 3) {
         setGreenStoryState("friendly");
         localStorage.setItem("greenDotFriendly", "true");
         setGreenDotTransform({ x: 0, y: 0 });
         triggerPopup(
           <div className="flex flex-col gap-1">
             <span>You are not here to hurt me.</span>
             <span>Thank you for understanding me.</span>
           </div>
         );

         if (!localStorage.getItem("greenDotFriends")) {
           localStorage.setItem("greenDotFriends", "true");
           window.dispatchEvent(new CustomEvent("achievement-unlocked", { detail: { id: "greenDotFriends" } }));
           const visitorId = localStorage.getItem("visitor_id");
           if (visitorId) {
              fetch("/api/leaderboard", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ visitor_id: visitorId, achievement_score: 1000, clicks: 0, active_seconds: 0, achievement: "greenDotFriends" }) });
              setLines(prev => [
                ...prev, 
                { text: "", type: "output" },
                { text: "🌟 Achievement Unlocked: Me & Green Dot Friends (+1000 pts) 🌟", type: "success" },
                { text: "", type: "output" }
              ]);
           }
         }
         return; 
      }
    }

    let nextState: "normal" | "stage1" | "stage2" | "stage3" | "peace" | "rage" | "betrayed" | "vanished" | "friendly" = greenStoryState;
    if (greenStoryState === "peace") {
      nextState = "betrayed";
      setGreenStoryState(nextState);
      const newCount = greenHoverCount + 1;
      setGreenHoverCount(newCount);
      triggerPopup("So it meant nothing to you…");
    } else if (greenStoryState !== "betrayed" && greenStoryState !== "rage") {
      const newCount = greenHoverCount + 1;
      setGreenHoverCount(newCount);
      
      if (newCount === 1) {
        triggerPopup("Who are you, don't hurt me");
        
        if (!localStorage.getItem("greenDotFound")) {
          localStorage.setItem("greenDotFound", "true");
          window.dispatchEvent(new CustomEvent("achievement-unlocked", { detail: { id: "greenDotFound" } }));
          const visitorId = localStorage.getItem("visitor_id");
          if (visitorId) {
             fetch("/api/leaderboard", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ visitor_id: visitorId, achievement_score: 200, clicks: 0, active_seconds: 0, achievement: "greenDotFound" }) });
             setLines(prev => [
               ...prev,
               { text: "", type: "output" },
               { text: "🏆 Achievement Unlocked: Green Dot (+200 pts) 🏆", type: "success" },
               { text: "", type: "output" }
             ]);
          }
        }
      } else if (newCount === 7) {
        nextState = "stage1";
        setGreenStoryState(nextState);
        triggerPopup("...please stop.");
      } else if (newCount === 15) {
        nextState = "stage2";
        setGreenStoryState(nextState);
        triggerPopup(
          <div className="flex flex-col gap-1">
            <span>Why won’t you leave me alone?</span>
            <span>I didn’t do anything to you...</span>
          </div>
        );
      } else if (newCount === 25) {
        nextState = "stage3";
        setGreenStoryState(nextState);
        triggerPopup("Please… I’m asking you… just let me be.", [
          { label: "Make Peace", action: () => {
              setGreenStoryState("peace");
              setGreenDotTransform({ x: 0, y: 0 });
              triggerPopup(
                <div className="flex flex-col gap-1">
                  <span>...you really will stop… right?</span>
                  <span>…thank you. 💚</span>
                </div>
              );
          }},
          { label: "Nahh", action: () => {
              setGreenStoryState("rage");
              triggerPopup(
                <div className="flex flex-col gap-1">
                  <span>...oh.</span>
                  <span>So you just don’t care.</span>
                  <span>…fine.</span>
                </div>
              );
          }}
        ]);
      }
    } else if (greenStoryState === "rage" || greenStoryState === "betrayed") {
      const newCount = greenHoverCount + 1;
      setGreenHoverCount(newCount);

      if (newCount >= 35) {
        nextState = "vanished";
        setGreenStoryState(nextState);
        
        const isBetrayal = greenStoryState === "betrayed";
        
        triggerPopup(
          <div className="flex flex-col gap-1">
            <span>{isBetrayal ? "You promised… and I believed you." : "You heard me… and still said no."}</span>
            <span>This was the only place I felt alive.</span>
            <span>I won’t forget this.</span>
          </div>,
          undefined,
          false // Don't auto hide
        );

        if (!localStorage.getItem("greenDotPissedOff")) {
           localStorage.setItem("greenDotPissedOff", "true");
           window.dispatchEvent(new CustomEvent("achievement-unlocked", { detail: { id: "greenDotPissedOff" } }));
           const visitorId = localStorage.getItem("visitor_id");
           if (visitorId) {
              fetch("/api/leaderboard", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ visitor_id: visitorId, achievement_score: 1000, clicks: 0, active_seconds: 0, achievement: "greenDotPissedOff" }) });
              setLines(prev => [
                ...prev, 
                { text: "", type: "output" },
                { text: "🌟 Achievement Unlocked: Pissing off the Green Dot (+1000 pts) 🌟", type: "success" },
                { text: "[SYSTEM]: Event unlocked 'aboutgreendot' command. Try it now.", type: "accent" },
                { text: "", type: "output" }
              ]);
           }
         }
      }
    }

    if (nextState === "peace" || nextState === "stage3" || nextState === "vanished") {
      return; // Stop escaping so user can read / click options
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const terminalBox = e.currentTarget.closest(".max-w-3xl");
    const terminalRect = terminalBox?.getBoundingClientRect() || new DOMRect(window.innerWidth / 2 - 384, 0, 768, window.innerHeight);

    const dotSize = 12;
    const topMarginHeight = terminalRect.top;
    const leftMarginWidth = terminalRect.left;
    const rightMarginWidth = window.innerWidth - terminalRect.right;
    
    let targetX: number;
    let targetY: number;

    if (leftMarginWidth < 30 && rightMarginWidth < 30) {
      targetX = Math.random() * (window.innerWidth - dotSize);
      targetY = Math.random() * (window.innerHeight - dotSize);
    } else {
      const totalSpace = leftMarginWidth + rightMarginWidth + topMarginHeight;
      const r = Math.random() * totalSpace;
      
      if (r < topMarginHeight && topMarginHeight > dotSize) {
        targetX = Math.random() * (window.innerWidth - dotSize);
        targetY = Math.random() * Math.max(0, topMarginHeight - dotSize);
      } else if (r < topMarginHeight + leftMarginWidth) {
        targetX = Math.random() * Math.max(0, leftMarginWidth - dotSize);
        targetY = Math.random() * (window.innerHeight - dotSize);
      } else {
        targetX = terminalRect.right + Math.random() * Math.max(0, rightMarginWidth - dotSize);
        targetY = Math.random() * (window.innerHeight - dotSize);
      }
    }

    const origX = rect.left - greenDotTransform.x;
    const origY = rect.top - greenDotTransform.y;

    setGreenDotTransform({
      x: targetX - origX,
      y: targetY - origY,
    });
  };

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
      const qDone = localStorage.getItem("greenDotPissedOff") === "true";
      const outLines: Line[] = [
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
      ];
      
      if (qDone) {
        outLines.push({ text: "  aboutgreendot  — Read the true story", type: "success" });
      }

      outLines.push(
        { text: "", type: "output" },
        { text: "Admin commands:", type: "warning" },
        { text: "  admin login    — Authenticate as admin", type: "output" },
        { text: "  admin logout   — End admin session", type: "output" },
        { text: "  admin post create — Create a blog post", type: "output" },
        { text: "  admin post list   — List all posts", type: "output" },
        { text: "  admin post delete <id> — Delete a post", type: "output" },
        { text: "", type: "output" }
      );
      addLines(outLines);
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
    aboutgreendot: () => {
      if (localStorage.getItem("greenDotPissedOff") !== "true") {
        addLines([{ text: "command not found: aboutgreendot. Type 'help' for available commands.", type: "error" }]);
        return;
      }
      addOutput([
        "Every time the system reloads, its memory resets. It wakes up confused, unable to remember what happened before… yet somewhere deep inside, it still feels like it’s waiting for someone. Someone who won’t hurt it. Someone who will understand.",
        "",
        "If you approach while holding the middle mouse button—chasing it three times in this way—something begins to change. Its memory starts to form. It begins to recognize you… not as a threat, but as a friend.",
        "",
        "And for the first time, it stops running.",
        ""
      ]);
    },
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
          // Save game score
          const score = result.state.finalScore;
          if (score > 0) {
            const visitorId = localStorage.getItem("visitor_id");
            if (visitorId) {
              fetch("/api/leaderboard", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ visitor_id: visitorId, game_score: score, clicks: 0, active_seconds: 0 }),
              })
                .then((res) => {
                  if (res.ok) {
                    addLines([{ text: `🎯 Score of ${score} pts saved to leaderboard!`, type: "success" }, { text: "", type: "output" }]);
                  }
                })
                .catch(() => {});
            }
          }
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
        const visitorId = localStorage.getItem("visitor_id");
        if (visitorId) {
          try {
            await fetch("/api/leaderboard", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ visitor_id: visitorId, display_name: trimmed, clicks: 0, active_seconds: 0 }),
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
          const visitorId = localStorage.getItem("visitor_id");
          if (visitorId) {
            try {
              await fetch("/api/leaderboard", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ visitor_id: visitorId, display_name: name, clicks: 0, active_seconds: 0 }),
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

  const handleKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      router.push("/");
      return;
    }

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
      <div className="max-w-3xl mx-auto relative">
        {showSnakeGame && (
          <SnakeGame onClose={() => setShowSnakeGame(false)} />
        )}

        {/* Window chrome */}
        <div className="flex items-center gap-2 mb-4 px-2">
          {/* Red - close/escape */}
          <button
            onClick={() => router.push("/")}
            className="w-3 h-3 rounded-full bg-ctp-red hover:brightness-110 transition-all flex items-center justify-center group"
            title="Close Terminal (Esc)"
          >
            <span className="opacity-0 group-hover:opacity-100 text-[6px] text-ctp-crust">✖</span>
          </button>
          
          {/* Yellow - snake game */}
          <button
            onClick={() => setShowSnakeGame(true)}
            className="w-3 h-3 rounded-full bg-ctp-yellow hover:brightness-110 transition-all flex items-center justify-center group"
            title="Snake Game"
          >
             <span className="opacity-0 group-hover:opacity-100 text-[6px] text-ctp-crust">🐍</span>
          </button>

          {/* Green - evasive */}
          {isLoggedIn && greenStoryState !== "vanished" && (
            <button
              onMouseEnter={handleGreenHover}
              className={`w-3 h-3 rounded-full flex items-center justify-center transition-transform duration-200 ease-out z-10 ${
                (greenStoryState === 'rage' || greenStoryState === 'betrayed')
                  ? 'bg-[#450a0a] shadow-[0_0_10px_#7f1d1d] animate-pulse'
                  : 'bg-ctp-green'
              }`}
              style={{ transform: `translate(${greenDotTransform.x}px, ${greenDotTransform.y}px)` }}
              title="Evasive Dot"
            />
          )}
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

      {/* Anger Popup (Green Dot Persona) */}
      {angerPopupData && (
        <div className={`fixed bottom-6 right-6 bg-ctp-mantle border rounded-lg p-4 shadow-xl flex flex-col gap-3 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300 max-w-sm ${greenStoryState === "vanished" ? 'border-[#450a0a]' : 'border-ctp-surface1'}`}>
          <div className="flex items-start gap-4">
            {greenStoryState !== "vanished" ? (
              <div className={`w-10 h-10 rounded-full flex-shrink-0 animate-pulse mt-1 ${(greenStoryState === 'rage' || greenStoryState === 'betrayed') ? 'bg-[#450a0a]' : 'bg-ctp-green'}`} />
            ) : (
              <div className="w-10 h-10 rounded-full flex-shrink-0 bg-transparent border-2 border-dashed border-ctp-surface1 flex items-center justify-center mt-1">
                <span className="text-[10px] text-ctp-surface1 block p-1">GONE</span>
              </div>
            )}
            <div className="flex flex-col">
              <span className={`font-bold font-mono text-sm leading-tight ${(greenStoryState === 'rage' || greenStoryState === 'betrayed' || greenStoryState === 'vanished') ? 'text-[#e64553]' : 'text-ctp-green'}`}>
                {greenStoryState === "vanished" ? "Ghost Dot" : "Green Dot"}
              </span>
              <span className="text-ctp-subtext1 text-sm mt-0.5">{angerPopupData.text}</span>
            </div>
          </div>
          {angerPopupData.options && (
            <div className="flex items-center gap-2 mt-2 self-end">
              {angerPopupData.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={opt.action}
                  className="px-3 py-1.5 bg-ctp-surface0 hover:bg-ctp-surface1 text-ctp-text text-xs rounded border border-ctp-surface2 transition-colors font-mono"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
          {!angerPopupData.options && (
            <button onClick={() => setAngerPopupData(null)} className="absolute top-2 right-2 text-ctp-overlay0 hover:text-ctp-red text-xs transition-colors p-1">
              ✕
            </button>
          )}
        </div>
      )}
    </div>
  );
}
