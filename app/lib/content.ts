// ============================================================
// content.ts — Single source of truth for all portfolio data.
// Update your info here; components pull from this file only.
// ============================================================

export const identity = {
  name: "Tejeswaar Reddy",
  greeting: "Hey! I'm Tejeswaar",
  roles: [
    "Game Systems Programmer",
    "Engine Developer",
    "Technical Artist",
  ],
  tagline:
    "I build the systems that make worlds feel real — from low-level C++ engines to modular combat in Unreal Engine 5.",
  location: "Hyderabad, Telangana, India",
  timezone: "IST (UTC+5:30)",
  email: "tejeswaarreddy@gmail.com",
  phone: "+91-7330666605",
  bio: "Systems-focused game developer with experience in Unity and Unreal Engine (C++, Blueprints, GAS). Contributed to MixMash (5K+ downloads), gaining real-world experience shipping games. Interested in gameplay systems, ECS architectures, and rendering pipelines. Currently working toward building a custom game engine with a focus on performance and clean design.",
};

export const links = {
  github: "https://github.com/tejeswaar",
  artstation: "https://artstation.com/tejeswaar",
  rookies: "https://therookies.co/tejeswaar",
  youtube: "https://youtube.com/@tejeswaar",
  resume: "https://drive.google.com/file/d/11wzT0wru3nvntGwH6sIHSW3CZezROEjo/view?usp=sharing",
};

export const statusTags = [
  { label: "Retina Engine — In Dev", color: "blue" as const },
  { label: "Land of Souls — In Dev", color: "mauve" as const },
  { label: "Open to Work ✓", color: "green" as const },
];

export const currently = {
  building: "Retina Engine (C++ / SDL2)",
  playing: "Elden Ring: Nightreign",
  reading: "ECS Architecture & Data-Oriented Design",
};

export const skills = [
  { name: "C++", level: 85, color: "#89b4fa" },
  { name: "C#", level: 81, color: "#f9e2af" },
  { name: "Unreal (GAS/BP/C++)", level: 75, color: "#cba6f7" },
  { name: "Unity", level: 65, color: "#89dceb" },
  { name: "SDL", level: 70, color: "#a6e3a1" },
  { name: "3D Art", level: 75, color: "#f38ba8" },
];

export type ProjectStatus = "IN DEV" | "LIVE" | "SHIPPED";

export interface Project {
  name: string;
  description: string;
  tags: string[];
  status: ProjectStatus;
  statusDetail?: string;
  github?: string;
  live?: string;
  demo?: string;
}

export const projects: Project[] = [
  {
    name: "Land of Souls",
    description:
      "Dark-fantasy action game built in UE5 using Gameplay Ability System — modular combat, stamina mechanics, combo logic, and attribute management.",
    tags: ["Unreal Engine 5", "GAS", "C++", "Dark Fantasy"],
    status: "IN DEV",
  },
  {
    name: "Retina Engine",
    description:
      "Custom 2D game engine from scratch. Rendering pipeline, entity-component system, and input systems focused on low-level graphics programming.",
    tags: ["C++", "SDL2", "OpenGL", "GLM", "Dear ImGui", "ECS"],
    status: "IN DEV",
    github: "https://github.com/tejeswaar/retina-engine",
  },
  {
    name: "QuestBoard",
    description:
      "AI-assisted game design tool for managing GDDs, questlines, and 3D asset pipelines. Built as the tool I wished existed.",
    tags: ["Firebase", "Gemini AI", "Fullstack", "Game Dev Tools"],
    status: "LIVE",
    statusDetail: "questboard.app",
    live: "https://studio--questboard-89q6g.us-central1.hosted.app/",
  },
  {
    name: "Mix Mash",
    description:
      "Engineered core merge-mechanic gameplay loop, in-game economy, monetization systems, and event-driven audio. Launched on Google Play.",
    tags: ["Unity", "C#", "Mobile", "Google Play"],
    status: "SHIPPED",
    statusDetail: "5,000+ downloads",
  },
];

export interface ExperienceEntry {
  period: string;
  company: string;
  role: string;
  description: string;
}

export const experience: ExperienceEntry[] = [
  {
    period: "2026 – NOW",
    company: "Neuro Education Research Institute",
    role: "Game Developer",
    description:
      "Designed boss encounters, navigation layouts, and environment assets in UE5 with Quixel Megascans. UI/HUD systems and SFX.",
  },
  {
    period: "2025 – 2026",
    company: "Tharros Game Studio (Volunteer)",
    role: "Game Systems Programmer",
    description:
      "Built a reaction-based game prototype with real-time input handling, gameplay systems, UI, and scoring — delivered in ~1 hour.",
  },
];

export const buildingStatus = [
  {
    name: "Retina Engine",
    progress: 35,
    sprint: "Sprint 4 — ECS Refactor",
    color: "#89b4fa",
  },
  {
    name: "Land of Souls",
    progress: 22,
    sprint: "Sprint 2 — Combat Polish",
    color: "#cba6f7",
  },
];

export const footer = {
  builtBy: "Tejeswaar",
  poweredBy: "Next.js",
  hostedOn: "Vercel",
};

// GitHub username for API fetches
export const githubUsername = "tejeswaar";
