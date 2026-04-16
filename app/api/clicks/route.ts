import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "../../lib/admin";

/**
 * Resolve the visitor row based on identity priority: user_id > visitor_id.
 * Returns { column, value } for use in queries.
 */
function resolveIdentity(body: { visitor_id?: string; user_id?: string }): {
  column: string;
  value: string;
} | null {
  if (body.user_id) return { column: "user_id", value: body.user_id };
  if (body.visitor_id) return { column: "visitor_id", value: body.visitor_id };
  return null;
}

// POST — increment global click counter + visitor clicks
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const identity = resolveIdentity(body);

    const supabase = createAdminClient();

    // Increment global counter
    const { data: stats } = await supabase
      .from("global_stats")
      .select("total_clicks")
      .eq("id", 1)
      .single();

    const newTotal = (stats?.total_clicks || 0) + 1;

    await supabase
      .from("global_stats")
      .update({ total_clicks: newTotal })
      .eq("id", 1);

    // Increment visitor clicks if identity provided
    if (identity) {
      const { data: visitor } = await supabase
        .from("visitors")
        .select("id, clicks")
        .eq(identity.column, identity.value)
        .single();

      if (visitor) {
        await supabase
          .from("visitors")
          .update({
            clicks: visitor.clicks + 1,
            last_seen: new Date().toISOString(),
          })
          .eq("id", visitor.id);
      }
    }

    return NextResponse.json({ total_clicks: newTotal });
  } catch {
    return NextResponse.json(
      { error: "Failed to update clicks." },
      { status: 500 }
    );
  }
}

// GET — get current global click count
export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("global_stats")
      .select("total_clicks")
      .eq("id", 1)
      .single();

    return NextResponse.json({ total_clicks: data?.total_clicks || 0 });
  } catch {
    return NextResponse.json({ total_clicks: 0 });
  }
}
