import Hero from "./components/Hero";
import About from "./components/About";
import Projects from "./components/Projects";
import Experience from "./components/Experience";
import Dashboard from "./components/Dashboard";
import Footer from "./components/Footer";
import { fetchRecentCommits, fetchLanguageStats } from "./lib/github";
import { createAdminClient } from "./lib/admin";

export default async function Home() {
  // Fetch GitHub data server-side with ISR (revalidate every hour)
  const [commits, languages] = await Promise.all([
    fetchRecentCommits(5),
    fetchLanguageStats(),
  ]);

  // Fetch latest published posts for the dashboard widget
  let posts: { title: string; slug: string; created_at: string }[] = [];
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("posts")
      .select("title, slug, created_at")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(5);
    posts = data || [];
  } catch {
    // DB might not be set up yet - that's fine
  }

  return (
    <>
      <Hero />
      <About />
      <Projects />
      <Experience />
      <Dashboard commits={commits} languages={languages} posts={posts} />
      <Footer />
    </>
  );
}
