import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "../../lib/admin";

// GET — user stats + rank
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const visitor_id = searchParams.get("visitor_id");
    const user_id = searchParams.get("user_id");

    if (!visitor_id && !user_id) {
      return NextResponse.json(
        { error: "visitor_id or user_id query param required." },
        { status: 400 }
      );
    }

    const column = user_id ? "user_id" : "visitor_id";
    const value = user_id || visitor_id!;

    const supabase = createAdminClient();

    // Get the user's row
    const { data: user, error } = await supabase
      .from("visitors")
      .select(
        "display_name, clicks, active_seconds, game_score, score, avatar_url, github_username, last_seen, achievements"
      )
      .eq(column, value)
      .single();

    if (error || !user) {
      return NextResponse.json({
        found: false,
        stats: {
          display_name: "Guest",
          clicks: 0,
          active_seconds: 0,
          game_score: 0,
          score: 0,
          rank: null,
          achievements: [],
        },
      });
    }

    // Get rank (count of users with higher score)
    const { count } = await supabase
      .from("visitors")
      .select("id", { count: "exact", head: true })
      .gt("score", user.score || 0);

    const rank = (count || 0) + 1;

    return NextResponse.json({
      found: true,
      stats: {
        display_name: user.github_username || user.display_name,
        clicks: user.clicks || 0,
        active_seconds: user.active_seconds || 0,
        game_score: user.game_score || 0,
        score: user.score || 0,
        avatar_url: user.avatar_url || null,
        achievements: user.achievements || [],
        rank,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch user stats." },
      { status: 500 }
    );
  }
}
