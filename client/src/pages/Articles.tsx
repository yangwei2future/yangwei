import { useState, useMemo } from "react";
import Navigation from "@/components/Navigation";
import ArticleCard from "@/components/ArticleCard";
import { useArticles } from "@/lib/useArticles";
import { Loader2 } from "lucide-react";

/**
 * Articles Page
 *
 * Design: Modern Minimalism
 * - Clean list of all articles
 * - Tag filtering functionality
 * - Responsive grid layout
 */

export default function Articles() {
  const { articles, loading, error } = useArticles();
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Extract unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    articles.forEach((article) => {
      article.tags.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [articles]);

  // Filter articles by tag
  const filteredArticles = useMemo(() => {
    if (!selectedTag) return articles;
    return articles.filter((article) => article.tags.includes(selectedTag));
  }, [articles, selectedTag]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">正在从 GitHub 加载文章...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Header */}
      <section className="py-16 border-b border-border">
        <div className="container max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            所有文章
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            共 {filteredArticles.length} 篇文章
          </p>
        </div>
      </section>

      {/* Filter Tags */}
      <section className="py-8 border-b border-border">
        <div className="container max-w-4xl">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                selectedTag === null
                  ? "bg-primary text-primary-foreground"
                  : "bg-accent text-accent-foreground hover:bg-border"
              }`}
            >
              全部
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  selectedTag === tag
                    ? "bg-primary text-primary-foreground"
                    : "bg-accent text-accent-foreground hover:bg-border"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Articles List */}
      <section className="py-16">
        <div className="container max-w-4xl">
          {filteredArticles.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {filteredArticles.map((article) => (
                <ArticleCard
                  key={article.id}
                  id={article.id}
                  title={article.title}
                  excerpt={article.excerpt}
                  date={article.date}
                  tags={article.tags}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">
                暂无该标签的文章
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container text-center">
          <p className="text-sm text-muted-foreground">
            © 2026 个人博客. 保留所有权利。
          </p>
        </div>
      </footer>
    </div>
  );
}
