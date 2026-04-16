import { createAdminClient } from "../../lib/admin";
import { renderMarkdown, renderYouTubeEmbed, estimateReadingTime } from "../../lib/markdown";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Post = {
  id: string;
  title: string;
  slug: string;
  content: string;
  youtube_url: string | null;
  created_at: string;
  updated_at: string;
};

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("posts")
    .select("title, content")
    .eq("slug", params.slug)
    .eq("published", true)
    .single();

  if (!data) return { title: "Post Not Found" };

  return {
    title: `${data.title} — Tejeswaar Reddy`,
    description: data.content.slice(0, 160).replace(/[#*`\[\]]/g, ""),
  };
}

export default async function PostPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createAdminClient();
  const { data: post } = (await supabase
    .from("posts")
    .select("*")
    .eq("slug", params.slug)
    .eq("published", true)
    .single()) as { data: Post | null };

  if (!post) notFound();

  const htmlContent = renderMarkdown(post.content);
  const readTime = estimateReadingTime(post.content);
  const date = new Date(post.created_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="min-h-screen pt-20 pb-16 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Back link */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-1 font-mono text-xs text-ctp-overlay1 hover:text-ctp-blue transition-colors mb-8"
        >
          ← back to blog
        </Link>

        {/* Header */}
        <header className="mb-8">
          <h1 className="font-mono text-2xl sm:text-3xl font-bold text-ctp-text mb-3">
            {post.title}
          </h1>
          <div className="flex items-center gap-3 text-xs font-mono text-ctp-overlay1">
            <span>{date}</span>
            <span className="text-ctp-surface1">·</span>
            <span>{readTime} min read</span>
          </div>
        </header>

        {/* YouTube embed */}
        {post.youtube_url && (
          <div
            className="mb-8"
            dangerouslySetInnerHTML={{
              __html: renderYouTubeEmbed(post.youtube_url),
            }}
          />
        )}

        {/* Content */}
        <article
          className="prose-custom"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>
    </div>
  );
}
