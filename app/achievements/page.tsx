import Link from "next/link";
import ClientAchievements from "./ClientAchievements";

export const metadata = {
  title: "Achievements | Tejeswaar Reddy",
  description: "Unlocked achievements and secrets.",
};

export default function AchievementsPage() {
  return (
    <div className="min-h-screen bg-ctp-base text-ctp-text font-sans p-6 sm:p-12">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-ctp-blue hover:text-ctp-lavender font-mono text-sm mb-8 transition-colors"
        >
          ← cd ~
        </Link>
        <h1 className="text-3xl sm:text-4xl font-mono font-bold text-ctp-mauve mb-2">
          Achievements
        </h1>
        <p className="text-sm text-ctp-subtext0 mb-10">
          A collection of hidden interactions and secrets you can find around the portfolio.
        </p>

        <ClientAchievements />
      </div>
    </div>
  );
}
