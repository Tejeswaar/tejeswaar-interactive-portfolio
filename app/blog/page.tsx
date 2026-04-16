import { createAdminClient } from "../lib/admin";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog — Tejeswaar Reddy",
  description: "Thoughts on game development, engine programming, and technical art.",
};

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  youtube_url: string | null;
  created_at: string;
}

export const revalidate = 60; // ISR: revalidate every 60 seconds

export default async function BlogPage() {
  let posts: Post[] = [];

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("posts")
      .select("id, title, slug, content, youtube_url, created_at")
      .eq("published", true)
      .order("created_at", { ascending: false });
    posts = data || [];
  } catch {
    // DB might not be set up yet
  }

  return (
    <div className="min-h-screen pt-20 pb-16 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-mono text-3xl font-bold text-ctp-text mb-2">
          <span className="text-ctp-mauve">~/</span>blog
        </h1>
        <p className="text-ctp-subtext0 text-sm mb-10">
          Thoughts on game dev, engine programming, and technical art.
        </p>

        {posts.length === 0 ? (
          <div className="rounded-xl border border-ctp-surface1/40 bg-ctp-surface0/20 p-10 text-center">
            <p className="text-ctp-overlay1 font-mono text-sm">
              No posts yet. Check back soon!
            </p>
            <p className="text-ctp-overlay0 text-xs mt-2">
              Hint: Posts are created via the terminal 🖥️
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => {
              const excerpt = post.content.slice(0, 200).replace(/[#*`\[\]]/g, "") + "…";
              const readTime = Math.max(1, Math.ceil(post.content.split(/\s+/).length / 200));
              const date = new Date(post.created_at).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              });

              return (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="block group rounded-xl border border-ctp-surface1/40 bg-ctp-surface0/20 p-6 hover:border-ctp-blue/40 hover:bg-ctp-surface0/30 transition-all"
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h2 className="font-mono text-lg font-bold text-ctp-text group-hover:text-ctp-blue transition-colors">
                      {post.title}
                    </h2>
                    {post.youtube_url && (
                      <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-mono bg-ctp-red/15 text-ctp-red border border-ctp-red/30">
                        VIDEO
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-ctp-subtext0 leading-relaxed mb-3">
                    {excerpt}
                  </p>
                  <div className="flex items-center gap-3 text-xs font-mono text-ctp-overlay1">
                    <span>{date}</span>
                    <span className="text-ctp-surface1">·</span>
                    <span>{readTime} min read</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
