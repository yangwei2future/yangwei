import { useParams, Link } from "wouter";
import Navigation from "@/components/Navigation";
import { getArticleById, getAllArticles } from "@/lib/articles";
import { Streamdown } from "streamdown";
import { ArrowLeft } from "lucide-react";

/**
 * Article Detail Page
 * 
 * Design: Modern Minimalism
 * - Centered reading area with optimal line length
 * - Markdown rendering with proper typography
 * - Navigation and related articles
 */

export default function Article() {
  const { id } = useParams<{ id: string }>();
  const article = id ? getArticleById(id) : null;
  const allArticles = getAllArticles();

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground">文章未找到</h1>
          <Link href="/articles" className="mt-4 inline-block text-primary hover:text-primary/80">
            返回文章列表
          </Link>
        </div>
      </div>
    );
  }

  // Get related articles (same tags)
  const relatedArticles = allArticles
    .filter(
      (a) =>
        a.id !== article.id &&
        a.tags.some((tag) => article.tags.includes(tag))
    )
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Article Header */}
      <section className="py-12 border-b border-border">
        <div className="container max-w-2xl">
          <Link href="/articles" className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors mb-6">
            <ArrowLeft size={16} />
            返回文章列表
          </Link>

          <article>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              {article.title}
            </h1>

            <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
              <time>
                {new Date(article.date).toLocaleDateString("zh-CN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
              <span>{article.author}</span>
            </div>

            {/* Tags */}
            {article.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-block px-2 py-1 text-xs bg-accent text-accent-foreground rounded-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </article>
        </div>
      </section>

      {/* Article Content */}
      <section className="py-12">
        <div className="container max-w-2xl">
          <div className="prose prose-sm max-w-none">
            <Streamdown>{article.content}</Streamdown>
          </div>
        </div>
      </section>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="py-12 border-t border-border bg-accent/30">
          <div className="container max-w-2xl">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              相关文章
            </h2>
            <div className="space-y-4">
              {relatedArticles.map((related) => (
                <Link key={related.id} href={`/article/${related.id}`} className="block p-4 rounded-sm border border-border hover:border-primary hover:shadow-md transition-all group">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {related.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {related.excerpt}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 个人博客. 保留所有权利。
          </p>
        </div>
      </footer>
    </div>
  );
}
