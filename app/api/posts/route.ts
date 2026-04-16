import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, validateAdminToken } from "../../lib/admin";
import { generateSlug } from "../../lib/markdown";

// GET — fetch all published posts (public)
export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("posts")
      .select("id, title, slug, content, youtube_url, published, created_at, updated_at")
      .eq("published", true)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ posts: data || [] });
  } catch {
    return NextResponse.json({ error: "Failed to fetch posts." }, { status: 500 });
  }
}

// POST — create a new post (admin only)
export async function POST(req: NextRequest) {
  const token = req.cookies.get("admin_token")?.value;
  if (!token || !validateAdminToken(token)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, content, youtube_url, published = false } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content required." }, { status: 400 });
    }

    const slug = generateSlug(title);
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("posts")
      .insert({
        title,
        slug,
        content,
        youtube_url: youtube_url || null,
        published,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ post: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
