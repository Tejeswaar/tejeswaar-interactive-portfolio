import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, generateDisplayName } from "../../lib/admin";

/**
 * Resolve the visitor row based on identity priority: user_id > visitor_id.
 */
function resolveIdentity(body: { visitor_id?: string; user_id?: string }): {
  column: string;
  value: string;
} | null {
  if (body.user_id) return { column: "user_id", value: body.user_id };
  if (body.visitor_id) return { column: "visitor_id", value: body.visitor_id };
  return null;
}

// GET — top 20 leaderboard
export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("visitors")
      .select(
        "display_name, clicks, active_seconds, game_score, achievement_score, score, last_seen, avatar_url, github_username, achievements"
      )
      .order("score", { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ leaderboard: data || [] });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch leaderboard." },
      { status: 500 }
    );
  }
}

// POST — update visitor activity (upsert)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      clicks = 0,
      active_seconds = 0,
      game_score = 0,
      achievement_score = 0,
      display_name,
      achievement,
    } = body;

    const identity = resolveIdentity(body);
    if (!identity) {
      return NextResponse.json(
        { error: "visitor_id or user_id required." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Check if visitor exists
    const { data: existing } = await supabase
      .from("visitors")
      .select("id, clicks, active_seconds, game_score, achievement_score, display_name, achievements")
      .eq(identity.column, identity.value)
      .single();

    if (existing) {
      // Update existing row
      const previousAchievements = existing.achievements || [];
      const updatedAchievements = [...previousAchievements];
      if (achievement && !updatedAchievements.includes(achievement)) {
        updatedAchievements.push(achievement);
      }

      const updates: Record<string, unknown> = {
        clicks: existing.clicks + clicks,
        active_seconds: existing.active_seconds + active_seconds,
        game_score: (existing.game_score || 0) + game_score,
        achievement_score: (existing.achievement_score || 0) + achievement_score,
        last_seen: new Date().toISOString(),
        achievements: updatedAchievements,
      };
      if (display_name && display_name !== existing.display_name) {
        updates.display_name = display_name;
      }

      const { error } = await supabase
        .from("visitors")
        .update(updates)
        .eq("id", existing.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({
        success: true,
        display_name: display_name || existing.display_name,
        totalClicks: existing.clicks + clicks,
        totalSeconds: existing.active_seconds + active_seconds,
        totalGameScore: (existing.game_score || 0) + game_score,
      });
    } else {
      // Create new visitor row via insert
      const name = display_name || generateDisplayName();
      const insertData: Record<string, unknown> = {
        [identity.column]: identity.value,
        clicks,
        active_seconds,
        game_score,
        achievement_score,
        display_name: name,
        achievements: achievement ? [achievement] : [],
      };

      const { error } = await supabase.from("visitors").insert(insertData);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({
        success: true,
        display_name: name,
        totalClicks: clicks,
        totalSeconds: active_seconds,
        totalGameScore: game_score,
        totalAchievementScore: achievement_score,
        achievements: insertData.achievements,
      });
    }
  } catch {
    return NextResponse.json(
      { error: "Failed to update activity." },
      { status: 500 }
    );
  }
}
