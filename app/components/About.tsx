"use client";

import { useEffect, useRef } from "react";
import { identity, currently, skills } from "../lib/content";

function SkillBar({ name, level, color }: { name: string; level: number; color: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("skill-bar-fill");
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex items-center gap-3 group">
      <span className="font-mono text-sm text-ctp-subtext1 w-28 shrink-0 text-right">
        {name}
      </span>
      <div className="flex-1 h-3 bg-ctp-surface0 rounded-full overflow-hidden">
        <div
          ref={ref}
          className="h-full rounded-full transition-all"
          style={{
            backgroundColor: color,
            ["--target-width" as string]: `${level}%`,
            width: 0,
          }}
        />
      </div>
      <span className="font-mono text-xs text-ctp-overlay1 w-10">{level}%</span>
    </div>
  );
}

export default function About() {
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
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="about" ref={sectionRef} className="reveal py-24 px-6 max-w-5xl mx-auto">
      <h2 className="font-mono text-2xl text-ctp-blue mb-2 flex items-center gap-2">
        <span className="text-ctp-mauve">01.</span> about
      </h2>
      <div className="section-divider mb-10" />

      <div className="grid md:grid-cols-[1fr_300px] gap-10">
        {/* Bio + Skills */}
        <div>
          <p className="text-ctp-subtext1 text-lg leading-relaxed mb-10">
            {identity.bio}
          </p>

          {/* Skills */}
          <div className="space-y-3">
            <h3 className="font-mono text-sm text-ctp-overlay1 uppercase tracking-wider mb-4">
              {"// skill_breakdown"}
            </h3>
            {skills.map((skill) => (
              <SkillBar key={skill.name} {...skill} />
            ))}
          </div>
        </div>

        {/* Currently sidebar */}
        <aside className="rounded-xl border border-ctp-surface1/50 bg-ctp-surface0/20 p-5 h-fit">
          <h3 className="font-mono text-sm text-ctp-overlay1 uppercase tracking-wider mb-4">
            {"// currently"}
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-mono text-ctp-green mb-1">🔨 Building</p>
              <p className="text-sm text-ctp-text">{currently.building}</p>
            </div>
            <div>
              <p className="text-xs font-mono text-ctp-blue mb-1">🎮 Playing</p>
              <p className="text-sm text-ctp-text">{currently.playing}</p>
            </div>
            <div>
              <p className="text-xs font-mono text-ctp-mauve mb-1">📖 Reading about</p>
              <p className="text-sm text-ctp-text">{currently.reading}</p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
