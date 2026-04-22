import { useState, useMemo } from "react";
import Navigation from "@/components/Navigation";
import ArticleCard from "@/components/ArticleCard";
import { useArticles } from "@/lib/useArticles";
import { useCategories } from "@/contexts/CategoriesContext";
import { getBadgeClass } from "@/lib/categories";
import { Loader2 } from "lucide-react";

export default function Articles() {
  const { articles, loading, error } = useArticles();
  const { categories, getCategoryById } = useCategories();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Only show categories that have at least one article
  const activeCategories = useMemo(() => {
    const usedIds = new Set<string>();
    articles.forEach((a) => (a.categories ?? []).forEach((id) => usedIds.add(id)));
    return categories.filter((c) => usedIds.has(c.id));
  }, [articles, categories]);

  const filteredArticles = useMemo(() => {
    if (!selectedCategory) return articles;
    return articles.filter((a) => (a.categories ?? []).includes(selectedCategory));
  }, [articles, selectedCategory]);

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

  const selectedCat = selectedCategory ? getCategoryById(selectedCategory) : null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Header */}
      <section className="py-16 border-b border-border">
        <div className="container max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">所有文章</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            {selectedCat ? (
              <>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-sm font-medium rounded-full ${getBadgeClass(selectedCat.color)}`}>
                  <span>{selectedCat.icon}</span>
                  <span>{selectedCat.label}</span>
                </span>
                <span className="ml-2">共 {filteredArticles.length} 篇</span>
              </>
            ) : (
              `共 ${articles.length} 篇文章`
            )}
          </p>
        </div>
      </section>

      {/* Category Filter */}
      {activeCategories.length > 0 && (
        <section className="py-6 border-b border-border">
          <div className="container max-w-4xl">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1.5 text-sm rounded-full font-medium transition-all duration-150 ${
                  selectedCategory === null
                    ? "bg-foreground text-background shadow-sm"
                    : "bg-accent text-accent-foreground hover:bg-border"
                }`}
              >
                全部
              </button>
              {activeCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full font-medium transition-all duration-150 ${
                    selectedCategory === cat.id
                      ? `${getBadgeClass(cat.color)} ring-2 ring-offset-1 ring-current shadow-sm`
                      : `${getBadgeClass(cat.color)} opacity-60 hover:opacity-100`
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

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
                  createdAt={article.createdAt}
                  updatedAt={article.updatedAt}
                  categories={article.categories}
                  tags={article.tags}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-lg text-muted-foreground">该分类下暂无文章</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container text-center">
          <p className="text-sm text-muted-foreground">© 2026 个人博客. 保留所有权利。</p>
        </div>
      </footer>
    </div>
  );
}
