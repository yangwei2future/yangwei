import { useLocation } from "wouter";
import Footer from "@/components/Footer";
import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import ArticleCard from "@/components/ArticleCard";
import { useArticles } from "@/lib/useArticles";
import type { Article } from "@/lib/types";
import { searchArticles } from "@/lib/search";
import { Search as SearchIcon } from "lucide-react";

/**
 * Search Results Page
 *
 * Design: Modern Minimalism
 * - Clean search interface
 * - Results displayed in familiar card format
 * - Empty state when no results found
 */

export default function Search() {
  const [, setLocation] = useLocation();
  const { articles, loading, error } = useArticles();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Article[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Get query from URL search params
  useEffect(() => {
    if (!loading && articles.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("q") || "";
      setQuery(q);
      setHasSearched(true); // Always show results

      const searchResults = searchArticles(articles, q);
      setResults(searchResults);
    }
  }, [loading, articles]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocation(`/search?q=${encodeURIComponent(query)}`);
    const searchResults = searchArticles(articles, query);
    setResults(searchResults);
    setHasSearched(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">加载中...</p>
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

      {/* Search Header */}
      <section className="py-12 border-b border-border">
        <div className="container max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            搜索文章
          </h1>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={query}
                onChange={handleInputChange}
                placeholder="搜索标题、内容或标签..."
                className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <SearchIcon
                size={20}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
            >
              搜索
            </button>
          </form>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-12">
        <div className="container max-w-2xl">
          {hasSearched ? (
            <>
              {results.length > 0 ? (
                <>
                  <p className="text-sm text-muted-foreground mb-6">
                    找到 <span className="font-semibold text-foreground">{results.length}</span> 篇相关文章
                  </p>
                  <div className="grid grid-cols-1 gap-6">
                    {results.map((article: Article) => (
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
                </>
              ) : (
                <div className="text-center py-12">
                  <SearchIcon size={48} className="mx-auto text-muted-foreground mb-4 opacity-50" />
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    未找到相关文章
                  </h2>
                  <p className="text-muted-foreground">
                    尝试使用不同的关键词或浏览所有文章
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <SearchIcon size={48} className="mx-auto text-muted-foreground mb-4 opacity-50" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                开始搜索
              </h2>
              <p className="text-muted-foreground">
                输入关键词来搜索文章标题、内容或标签
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
