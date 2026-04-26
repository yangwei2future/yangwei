import { useState, useMemo } from "react";
import Footer from "@/components/Footer";
import { Link } from "wouter";
import Navigation from "@/components/Navigation";
import ArticleCard from "@/components/ArticleCard";
import { useArticles } from "@/lib/useArticles";
import { useCategories } from "@/contexts/CategoriesContext";
import { getBadgeClass } from "@/lib/categories";
import { Loader2, LayoutGrid, AlignLeft } from "lucide-react";
import type { Article } from "@/lib/types";

// ── timeline helpers ───────────────────────────────────────────────────────────

function articleDate(a: Article): Date {
  return new Date(a.createdAt ?? a.date);
}

function groupByYear(articles: Article[]): [string, Article[]][] {
  const map = new Map<string, Article[]>();
  for (const a of articles) {
    const year = articleDate(a).getFullYear().toString();
    if (!map.has(year)) map.set(year, []);
    map.get(year)!.push(a);
  }
  // descending year order
  return Array.from(map.entries()).sort((a, b) => Number(b[0]) - Number(a[0]));
}

function formatMonthDay(d: Date) {
  return d.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" });
}

// ── view-mode toggle ───────────────────────────────────────────────────────────

type ViewMode = "grid" | "timeline";

function getInitialView(): ViewMode {
  try { return (localStorage.getItem("articles_view") as ViewMode) ?? "timeline"; } catch { return "timeline"; }
}

// ── timeline component ─────────────────────────────────────────────────────────

function TimelineView({ articles, categories: _cats }: { articles: Article[]; categories: ReturnType<typeof useCategories>["categories"] }) {
  const { getCategoryById } = useCategories();
  const groups = groupByYear(articles);

  return (
    <div className="relative">
      {/* Vertical spine */}
      <div className="absolute left-[5.5rem] top-0 bottom-0 w-px bg-border" />

      <div className="space-y-12">
        {groups.map(([year, items]) => (
          <div key={year}>
            {/* Year marker */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-[5.5rem] flex justify-end pr-4">
                <span className="text-sm font-bold text-muted-foreground/60 tracking-widest select-none">{year}</span>
              </div>
              <div className="relative z-10 w-3 h-3 rounded-full bg-border border-2 border-background ring-2 ring-border shrink-0 -ml-1.5" />
            </div>

            {/* Articles */}
            <div className="space-y-0">
              {items.map((article, i) => {
                const d = articleDate(article);
                const cats = (article.categories ?? []).map(getCategoryById).filter(Boolean) as NonNullable<ReturnType<typeof getCategoryById>>[];
                return (
                  <div key={article.id} className="group flex items-start gap-4">
                    {/* Date label */}
                    <div className="w-[5.5rem] flex justify-end pr-4 pt-4 shrink-0">
                      <time className="text-xs text-muted-foreground/60 tabular-nums">{formatMonthDay(d)}</time>
                    </div>

                    {/* Dot */}
                    <div className="relative z-10 mt-[1.1rem] shrink-0 -ml-1.5">
                      <div className="w-3 h-3 rounded-full bg-background border-2 border-muted-foreground/30 group-hover:border-primary transition-colors duration-150" />
                      {/* connector line to next */}
                      {i < items.length - 1 && <div className="absolute left-1/2 top-3 -translate-x-1/2 w-px bg-border" style={{ height: "calc(100% + 0px)" }} />}
                    </div>

                    {/* Card */}
                    <Link
                      href={`/article/${article.id}`}
                      className="flex-1 min-w-0 pb-4"
                    >
                      <article className="p-4 rounded-lg border border-transparent hover:border-border hover:bg-accent/30 transition-all duration-150 -mx-2 px-3">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
                            {article.title}
                          </h3>
                          {cats.length > 0 && (
                            <div className="flex flex-wrap gap-1 shrink-0">
                              {cats.map((cat) => (
                                <span key={cat.id} className={`inline-flex items-center gap-0.5 px-2 py-0.5 text-xs font-medium rounded-full ${getBadgeClass(cat.color)}`}>
                                  <span>{cat.icon}</span>
                                  <span>{cat.label}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        {article.excerpt && (
                          <p className="mt-1 text-sm text-muted-foreground/70 line-clamp-2 leading-relaxed">
                            {article.excerpt}
                          </p>
                        )}
                      </article>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── main page ──────────────────────────────────────────────────────────────────

export default function Articles() {
  const { articles, loading, error } = useArticles();
  const { categories, getCategoryById } = useCategories();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(getInitialView);

  const activeCategories = useMemo(() => {
    const usedIds = new Set<string>();
    articles.forEach((a) => (a.categories ?? []).forEach((id) => usedIds.add(id)));
    return categories.filter((c) => usedIds.has(c.id));
  }, [articles, categories]);

  const filteredArticles = useMemo(() => {
    if (!selectedCategory) return articles;
    return articles.filter((a) => (a.categories ?? []).includes(selectedCategory));
  }, [articles, selectedCategory]);

  function switchView(mode: ViewMode) {
    setViewMode(mode);
    try { localStorage.setItem("articles_view", mode); } catch {}
  }

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
    <div className="min-h-screen bg-background pb-10">
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

      {/* Articles */}
      <section className="py-16">
        <div className="container max-w-4xl">
          {filteredArticles.length > 0 ? (
            <>
              {/* View toggle */}
              <div className="flex justify-end mb-8">
                <div className="flex items-center gap-1 p-1 rounded-lg bg-accent/50 border border-border">
                  <button
                    onClick={() => switchView("grid")}
                    title="卡片视图"
                    className={`p-1.5 rounded-md transition-all ${
                      viewMode === "grid"
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <LayoutGrid size={15} />
                  </button>
                  <button
                    onClick={() => switchView("timeline")}
                    title="时间轴视图"
                    className={`p-1.5 rounded-md transition-all ${
                      viewMode === "timeline"
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <AlignLeft size={15} />
                  </button>
                </div>
              </div>

              {viewMode === "grid" ? (
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
                <TimelineView articles={filteredArticles} categories={categories} />
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <p className="text-lg text-muted-foreground">该分类下暂无文章</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
