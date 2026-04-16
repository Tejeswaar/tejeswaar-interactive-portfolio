"use client";

import { useEffect, useRef } from "react";
import { projects, type ProjectStatus } from "../lib/content";

const statusStyles: Record<ProjectStatus, string> = {
  "IN DEV": "bg-ctp-yellow/15 text-ctp-yellow border-ctp-yellow/30",
  LIVE: "bg-ctp-green/15 text-ctp-green border-ctp-green/30",
  SHIPPED: "bg-ctp-blue/15 text-ctp-blue border-ctp-blue/30",
};

function ProjectCard({
  project,
  index,
}: {
  project: (typeof projects)[0];
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.transitionDelay = `${index * 120}ms`;
          el.classList.add("visible");
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [index]);

  return (
    <div
      ref={ref}
      className="reveal project-card rounded-xl border border-ctp-surface1/40 bg-ctp-surface0/20 p-6 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-mono text-lg font-bold text-ctp-text">
          {project.name}
        </h3>
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border shrink-0 ${statusStyles[project.status]}`}
        >
          {project.status}
        </span>
      </div>

      {/* Status detail */}
      {project.statusDetail && (
        <p className="text-xs font-mono text-ctp-overlay1 mb-2">
          ↳ {project.statusDetail}
        </p>
      )}

      {/* Description */}
      <p className="text-sm text-ctp-subtext0 leading-relaxed mb-4 flex-1">
        {project.description}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {project.tags.map((tag) => (
          <span
            key={tag}
            className="px-2 py-0.5 rounded text-[11px] font-mono bg-ctp-surface0 text-ctp-overlay1 border border-ctp-surface1/50"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Links */}
      <div className="flex gap-3 pt-2 border-t border-ctp-surface1/30">
        {project.github && (
          <a
            href={project.github}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-ctp-blue hover:text-ctp-lavender transition-colors flex items-center gap-1"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            Source
          </a>
        )}
        {project.live && (
          <a
            href={project.live}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-ctp-green hover:text-ctp-teal transition-colors flex items-center gap-1"
          >
            <span>↗</span> Live
          </a>
        )}
        {project.demo && (
          <a
            href={project.demo}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-ctp-mauve hover:text-ctp-pink transition-colors flex items-center gap-1"
          >
            <span>▶</span> Demo
          </a>
        )}
      </div>
    </div>
  );
}

export default function Projects() {
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
    <section id="projects" ref={sectionRef} className="reveal py-24 px-6 max-w-5xl mx-auto">
      <h2 className="font-mono text-2xl text-ctp-blue mb-2 flex items-center gap-2">
        <span className="text-ctp-mauve">02.</span> projects
      </h2>
      <div className="section-divider mb-10" />

      <div className="grid sm:grid-cols-2 gap-5">
        {projects.map((project, i) => (
          <ProjectCard key={project.name} project={project} index={i} />
        ))}
      </div>
    </section>
  );
}
