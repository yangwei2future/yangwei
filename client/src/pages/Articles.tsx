import { useMemo, useState } from "react";
import { AlignLeft, CalendarDays, LayoutGrid, Loader2 } from "lucide-react";
import { Link } from "wouter";
import ArticleCard from "@/components/ArticleCard";
import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";
import { useCategories } from "@/contexts/CategoriesContext";
import { useArticleCatalog } from "@/lib/useArticleCatalog";
import type { Article } from "@/lib/types";

type ViewMode = "grid" | "list" | "timeline";

function initialView(): ViewMode {
  try {
    const saved = localStorage.getItem("articles_view");
    if (saved === "timeline") return "list"; // Previous releases saved the list under this value.
    if (saved === "list" || saved === "chronological") {
      return saved === "list" ? "list" : "timeline";
    }
    return "grid";
  }
  catch { return "grid"; }
}

function formatDate(article: Article) {
  return new Date(article.createdAt ?? article.date).toLocaleDateString("zh-CN", {
    year: "numeric", month: "2-digit", day: "2-digit",
  });
}

export default function Articles() {
  const { articles, loading, error } = useArticleCatalog({ enrich: true });
  const { categories, getCategoryById } = useCategories();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(initialView);

  const activeCategories = useMemo(() => {
    const ids = new Set(articles.flatMap((article) => article.categories ?? []));
    return categories.filter((category) => ids.has(category.id));
  }, [articles, categories]);

  const filtered = useMemo(
    () => selectedCategory ? articles.filter((article) => article.categories?.includes(selectedCategory)) : articles,
    [articles, selectedCategory],
  );

  const groups = useMemo(() => {
    if (viewMode !== "timeline") return [];
    const months = new Map<string, Article[]>();
    for (const article of filtered) {
      const date = new Date(article.createdAt ?? article.date);
      const month = Number.isNaN(date.getTime()) || date.getFullYear() === 1970
        ? "日期未标注"
        : date.toLocaleDateString("zh-CN", { year: "numeric", month: "long" });
      const entries = months.get(month) ?? [];
      entries.push(article);
      months.set(month, entries);
    }
    return Array.from(months);
  }, [filtered, viewMode]);

  const setView = (view: ViewMode) => {
    setViewMode(view);
    try { localStorage.setItem("articles_view", view === "timeline" ? "chronological" : view); } catch {}
  };

  return (
    <div className="site-page">
      <Navigation />
      <main>
        <header className="archive-hero">
          <div className="container archive-hero-inner">
            <div>
              <p className="page-kicker">WRITING ARCHIVE</p>
              <h1>文章归档</h1>
              <p>关于后端、数据平台、AI 与工程效率的长期笔记。</p>
            </div>
            <div className="archive-count"><strong>{articles.length}</strong><span>ARTICLES</span></div>
          </div>
        </header>

        <section className="container archive-content">
          <div className="archive-toolbar">
            <div className="category-filters" aria-label="文章分类">
              <button className={!selectedCategory ? "active" : ""} onClick={() => setSelectedCategory(null)}>全部</button>
              {activeCategories.map((category) => (
                <button
                  key={category.id}
                  className={selectedCategory === category.id ? "active" : ""}
                  onClick={() => setSelectedCategory(category.id === selectedCategory ? null : category.id)}
                >
                  {category.label}
                </button>
              ))}
            </div>
            <div className="view-toggle" aria-label="切换文章视图">
              <button className={viewMode === "grid" ? "active" : ""} onClick={() => setView("grid")} aria-label="卡片视图" aria-pressed={viewMode === "grid"} title="卡片视图"><LayoutGrid size={16} /></button>
              <button className={viewMode === "list" ? "active" : ""} onClick={() => setView("list")} aria-label="列表视图" aria-pressed={viewMode === "list"} title="列表视图"><AlignLeft size={16} /></button>
              <button className={viewMode === "timeline" ? "active" : ""} onClick={() => setView("timeline")} aria-label="时间轴视图" aria-pressed={viewMode === "timeline"} title="时间轴视图"><CalendarDays size={16} /></button>
            </div>
          </div>

          {loading && <div className="loading-state"><Loader2 className="animate-spin" /> 正在整理文章…</div>}
          {error && <div className="empty-state">文章加载失败：{error}</div>}
          {!loading && !error && filtered.length === 0 && <div className="empty-state">这个分类下还没有文章。</div>}

          {!loading && !error && viewMode === "grid" && (
            <div className="archive-grid">
              {filtered.map((article) => <ArticleCard key={article.id} {...article} />)}
            </div>
          )}

          {!loading && !error && viewMode === "list" && (
            <div className="archive-list">
              {filtered.map((article, index) => {
                const category = article.categories?.map(getCategoryById).find(Boolean);
                return (
                  <Link key={article.id} href={`/article/${article.id}`} className="archive-row">
                    <span className="archive-index">{String(index + 1).padStart(2, "0")}</span>
                    <div><h2>{article.title}</h2><p>{article.excerpt}</p></div>
                    <span className="archive-category">{category?.label ?? "技术笔记"}</span>
                    <time>{formatDate(article)}</time>
                  </Link>
                );
              })}
            </div>
          )}
          {!loading && !error && viewMode === "timeline" && groups.map(([month, entries]) => (
            <section className="archive-month" key={month}>
              <h2>{month}</h2>
              <ol>
                {entries.map((article) => {
                  const category = article.categories?.map(getCategoryById).find(Boolean);
                  const date = article.createdAt ?? article.date;
                  return (
                    <li key={article.id}>
                      <Link href={`/article/${article.id}`} className="archive-timeline-link">
                        {month !== "日期未标注" && <time dateTime={date}>{formatDate(article)}</time>}
                        <h3>{article.title}</h3>
                        {category && <span>{category.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </section>
      </main>
      <Footer />
    </div>
  );
}
