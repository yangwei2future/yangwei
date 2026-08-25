import { useEffect, useMemo } from "react";
import { ArrowRight, Braces, Database, Github, Sparkles } from "lucide-react";
import { Link } from "wouter";
import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";
import { useCategories } from "@/contexts/CategoriesContext";
import { preloadArticles, useArticles } from "@/lib/useArticles";
import type { Article } from "@/lib/types";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function FeaturedArticle({ article, index }: { article: Article; index: number }) {
  const { getCategoryById } = useCategories();
  const category = article.categories?.map(getCategoryById).find(Boolean);

  return (
    <Link href={`/article/${article.id}`} className="featured-card">
      <article>
        <div className="featured-index">0{index + 1}</div>
        <div className="featured-content">
          <div className="eyebrow-row">
            <span>{category?.label ?? "技术笔记"}</span>
            <time>{formatDate(article.createdAt ?? article.date)}</time>
          </div>
          <h2>{article.title}</h2>
          <p>{article.excerpt || "从问题出发，记录方案、权衡与实践过程。"}</p>
          <span className="read-more">阅读文章 <ArrowRight size={15} /></span>
        </div>
      </article>
    </Link>
  );
}

export default function Home() {
  const { articles, loading } = useArticles();
  const { categories } = useCategories();
  const featured = articles.slice(0, 2);
  const recent = articles.slice(2, 8);
  const visibleCategoryCount = useMemo(
    () => categories.filter((category) => articles.some((article) => article.categories?.includes(category.id))).length,
    [articles, categories],
  );

  useEffect(() => { preloadArticles(); }, []);

  return (
    <div className="site-page">
      <Navigation />
      <main>
        <section className="hero-section">
          <div className="container hero-grid">
            <div className="hero-copy">
              <p className="hero-kicker"><span /> 大数据开发 · AI 应用实践</p>
              <h1>把复杂系统，<br />写成<span>清晰答案。</span></h1>
              <p className="hero-description">
                你好，我是杨卫。这里记录后端工程、大数据平台与 AI 落地过程中的设计选择、踩坑经验和可复用方案。
              </p>
              <div className="hero-actions">
                <Link href="/articles" className="primary-action">开始阅读 <ArrowRight size={16} /></Link>
                <a href="https://github.com/yangwei2future" target="_blank" rel="noreferrer" className="secondary-action"><Github size={16} /> GitHub</a>
              </div>
            </div>

            <aside className="hero-panel" aria-label="博客概览">
              <div className="hero-panel-top">
                <span className="status-dot" /> NOW EXPLORING
              </div>
              <blockquote>“技术写作，是把一次解决问题的经验，变成很多次解决问题的起点。”</blockquote>
              <div className="topic-list">
                <div><Database size={17} /><span>数据平台与后端架构</span></div>
                <div><Sparkles size={17} /><span>Agent、RAG 与 MCP</span></div>
                <div><Braces size={17} /><span>工程工具与效率实践</span></div>
              </div>
              <div className="hero-stats">
                <div><strong>{articles.length || "—"}</strong><span>篇文章</span></div>
                <div><strong>{visibleCategoryCount || "—"}</strong><span>个主题</span></div>
                <div><strong>2026</strong><span>持续更新</span></div>
              </div>
            </aside>
          </div>
        </section>

        <section className="container content-section">
          <div className="section-heading">
            <div><p>FEATURED NOTES</p><h2>最近在写</h2></div>
            <Link href="/articles">查看全部文章 <ArrowRight size={15} /></Link>
          </div>

          {loading ? (
            <div className="article-skeleton-grid" aria-label="正在加载文章"><span /><span /></div>
          ) : featured.length > 0 ? (
            <div className="featured-grid">
              {featured.map((article, index) => <FeaturedArticle key={article.id} article={article} index={index} />)}
            </div>
          ) : (
            <div className="empty-state">文章正在路上，稍后再来看看。</div>
          )}
        </section>

        {recent.length > 0 && (
          <section className="container recent-section">
            <div className="section-heading compact"><div><p>ARCHIVE</p><h2>更多笔记</h2></div></div>
            <div className="recent-list">
              {recent.map((article, index) => (
                <Link key={article.id} href={`/article/${article.id}`} className="recent-row">
                  <span className="recent-number">{String(index + 3).padStart(2, "0")}</span>
                  <span className="recent-title">{article.title}</span>
                  <time>{formatDate(article.createdAt ?? article.date)}</time>
                  <ArrowRight size={16} />
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
