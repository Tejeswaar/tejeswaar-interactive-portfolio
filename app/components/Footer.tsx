import { footer } from "../lib/content";

export default function Footer() {
  const year = new Date().getFullYear();
  const commitSha = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "dev";

  return (
    <footer className="border-t border-ctp-surface1/30 py-8 px-6">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-ctp-overlay1">
        <div className="flex items-center gap-2">
          <span>
            Built by{" "}
            <span className="text-ctp-text">{footer.builtBy}</span>
          </span>
          <span className="text-ctp-surface1">|</span>
          <span>
            Powered by{" "}
            <span className="text-ctp-text">{footer.poweredBy}</span>
          </span>
          <span className="text-ctp-surface1">|</span>
          <span>
            Hosted on{" "}
            <span className="text-ctp-text">{footer.hostedOn}</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-ctp-green animate-pulse" />
            All Systems Nominal
          </span>
          <span className="text-ctp-surface1">|</span>
          <span>
            <span className="text-ctp-surface2">{commitSha}</span>
          </span>
          <span className="text-ctp-surface1">|</span>
          <span>(c) {year}</span>
        </div>
      </div>
    </footer>
  );
}
