"use client";

import { useEffect, useRef } from "react";
import { experience } from "../lib/content";

export default function Experience() {
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
    <section id="experience" ref={sectionRef} className="reveal py-24 px-6 max-w-5xl mx-auto">
      <h2 className="font-mono text-2xl text-ctp-blue mb-2 flex items-center gap-2">
        <span className="text-ctp-mauve">03.</span> experience
      </h2>
      <div className="section-divider mb-10" />

      <div className="space-y-0">
        {experience.map((entry, i) => (
          <div
            key={i}
            className="grid grid-cols-[120px_1fr] md:grid-cols-[160px_1fr] gap-4 md:gap-8 py-6 border-l-2 border-ctp-surface1/50 pl-6 relative"
          >
            {/* Timeline dot */}
            <div className="absolute left-[-5px] top-8 w-2 h-2 rounded-full bg-ctp-blue" />

            {/* Timestamp */}
            <div className="font-mono text-sm text-ctp-overlay1 pt-0.5 shrink-0">
              {entry.period}
            </div>

            {/* Content */}
            <div>
              <h3 className="font-mono text-base font-semibold text-ctp-text mb-0.5">
                {entry.company}
              </h3>
              <p className="font-mono text-sm text-ctp-blue mb-2">{entry.role}</p>
              <p className="text-sm text-ctp-subtext0 leading-relaxed">
                {entry.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
