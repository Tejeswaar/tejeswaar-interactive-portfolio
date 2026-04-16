import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, validateAdminToken } from "../../../lib/admin";

// PUT — update a post (admin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = req.cookies.get("admin_token")?.value;
  if (!token || !validateAdminToken(token)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, content, youtube_url, published } = body;

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("posts")
      .update({
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(youtube_url !== undefined && { youtube_url }),
        ...(published !== undefined && { published }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ post: data });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}

// DELETE — delete a post (admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = req.cookies.get("admin_token")?.value;
  if (!token || !validateAdminToken(token)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", params.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete post." }, { status: 500 });
  }
}
