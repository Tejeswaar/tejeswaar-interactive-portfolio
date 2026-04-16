import { Metadata } from "next";
import LeaderboardClient from "./LeaderboardClient";

export const metadata: Metadata = {
  title: "Leaderboard — Tejeswaar Reddy",
  description:
    "See who's spent the most time, clicked the most, and scored highest on the portfolio leaderboard.",
};

export default function LeaderboardPage() {
  return <LeaderboardClient />;
}
