import { useEffect, useState } from "react";
import { fetchArticlesFromGitHub } from "./markdown-loader";
import type { Article } from "./types";

/**
 * Articles Hook
 *
 * Loads articles from GitHub URLs stored in localStorage
 * with caching to improve performance
 */

const CACHE_KEY = "blog_articles_cache";
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

interface CacheData {
  articles: Article[];
  timestamp: number;
}

export function useArticles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [allLinks, setAllLinks] = useState<import("./article-links").ArticleLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadArticles();
  }, []);

  async function loadArticles() {
    try {
      setLoading(true);
      setError(null);

      const allEntries: import("./article-links").ArticleLink[] =
        await fetch("/api/articles").then((r) => r.json());
      setAllLinks(allEntries);
      // Filter out hidden articles for public view
      const entries = allEntries.filter((e) => !e.hidden);

      if (entries.length === 0) {
        setArticles([]);
        setLoading(false);
        return;
      }

      // Check cache first, but filter out any hidden articles
      const cached = getCachedArticles();
      if (cached) {
        const visibleIds = new Set(entries.map((e) => decodeURIComponent(e.url.split("/").pop()?.replace(".md", "") ?? "")));
        const filteredCache = cached
          .filter((a) => visibleIds.has(a.id))
          .map((article) => {
            const entry = entries.find((e) => e.url.includes(encodeURIComponent(article.id)) || e.url.endsWith(article.id + ".md"));
            return {
              ...article,
              createdAt: entry?.createdAt ?? article.createdAt,
              updatedAt: entry?.updatedAt ?? article.updatedAt,
              categories: entry?.categories ?? article.categories,
              refs: entry?.refs,
              hidden: entry?.hidden ?? false,
            };
          })
          .sort((a, b) => {
            const aTime = new Date(a.createdAt).getTime();
            const bTime = new Date(b.createdAt).getTime();
            return bTime - aTime;
          });
        console.log("Using cached articles");
        setArticles(filteredCache);
        setLoading(false);
        return;
      }

      console.log("Fetching articles from GitHub");
      const fetchedArticles = await fetchArticlesFromGitHub(entries);

      // Merge server-side timestamps into articles
      const articlesWithTs = fetchedArticles.map((article) => {
        const entry = entries.find((e) => e.url.includes(encodeURIComponent(article.id)) || e.url.endsWith(article.id + ".md"));
        return {
          ...article,
          createdAt: entry?.createdAt || new Date().toISOString(),
          updatedAt: entry?.updatedAt,
          categories: entry?.categories,
          refs: entry?.refs,
          hidden: entry?.hidden ?? false,
        };
      });

      const sorted = [...articlesWithTs].sort((a, b) => {
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();
        return bTime - aTime;
      });

      setArticles(sorted);
      cacheArticles(sorted);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载文章失败");
      console.error("Error loading articles:", err);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Force refresh all articles (clear cache and update updatedAt on server)
   */
  async function refreshArticles() {
    await fetch("/api/articles", { method: "PATCH" });
    clearCache();
    await loadArticles();
  }

  /**
   * Refresh a single article by URL
   */
  async function refreshSingleArticle(url: string) {
    await fetch("/api/articles", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const entry: { url: string; title?: string; createdAt?: string; updatedAt?: string } =
      await fetch("/api/articles").then((r) => r.json()).then((entries: any[]) =>
        entries.find((e) => e.url === url)
      );
    if (!entry) return;
    const [fetched] = await fetchArticlesFromGitHub([entry]);
    const updated = {
      ...fetched,
      createdAt: entry.createdAt || new Date().toISOString(),
      updatedAt: entry.updatedAt,
    };
    setArticles((prev) => {
      const next = prev.map((a) => (a.id === updated.id ? updated : a));
      cacheArticles(next);
      return next;
    });
  }

  /**
   * Update title for a single article
   */
  async function updateArticleTitle(url: string, title: string) {
    await fetch("/api/articles", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, title }),
    });
    setArticles((prev) => {
      const next = prev.map((a) =>
        (a.id === url.split("/").pop()?.replace(".md", "") || a.id === decodeURIComponent(url.split("/").pop()?.replace(".md", "") ?? ""))
          ? { ...a, title: title || a.title }
          : a
      );
      cacheArticles(next);
      return next;
    });
  }

  /**
   * Toggle hidden state for a single article
   */
  async function toggleHidden(url: string, hidden: boolean) {
    await fetch("/api/articles", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, hidden }),
    });
    // Remove from public list if hidden, reload if un-hiding
    if (hidden) {
      const id = decodeURIComponent(url.split("/").pop()?.replace(".md", "") ?? "");
      setArticles((prev) => {
        const next = prev.filter((a) => a.id !== id);
        cacheArticles(next);
        return next;
      });
    } else {
      clearCache();
      await loadArticles();
    }
  }

  async function updateArticleRefs(url: string, refs: string[]) {
    await fetch("/api/articles", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, refs }),
    });
    const id = decodeURIComponent(url.split("/").pop()?.replace(".md", "") ?? "");
    setArticles((prev) => {
      const next = prev.map((a) => (a.id === id ? { ...a, refs: refs.length > 0 ? refs : undefined } : a));
      cacheArticles(next);
      return next;
    });
  }

  async function updateArticleCategory(url: string, categories: string[]) {
    await fetch("/api/articles", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, categories }),
    });
    const id = decodeURIComponent(url.split("/").pop()?.replace(".md", "") ?? "");
    setArticles((prev) => {
      const next = prev.map((a) => (a.id === id ? { ...a, categories: categories.length > 0 ? categories : undefined } : a));
      cacheArticles(next);
      return next;
    });
  }

  return { articles, allLinks, loading, error, reload: loadArticles, refresh: refreshArticles, refreshSingle: refreshSingleArticle, updateTitle: updateArticleTitle, updateCategory: updateArticleCategory, updateRefs: updateArticleRefs, toggleHidden };
}

/**
 * Preload articles (for use in Home page)
 * This will trigger article loading in background
 */
export function preloadArticles(): void {
  const cached = getCachedArticles();
  if (cached) return;

  fetch("/api/articles")
    .then((r) => r.json())
    .then((entries: { url: string; title?: string }[]) => {
      if (entries.length === 0) return;
      return fetchArticlesFromGitHub(entries).then((articles) => {
        cacheArticles(articles);
      });
    })
    .catch((err) => console.error("Error preloading articles:", err));
}

/**
 * Get cached articles if still valid
 */
function getCachedArticles(): Article[] | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const data: CacheData = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is still valid
    if (now - data.timestamp < CACHE_DURATION) {
      return data.articles;
    }

    return null;
  } catch (error) {
    console.error("Error reading cache:", error);
    return null;
  }
}

/**
 * Cache articles to localStorage
 */
function cacheArticles(articles: Article[]): void {
  try {
    const data: CacheData = {
      articles,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Error caching articles:", error);
  }
}

/**
 * Clear article cache
 */
function clearCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error("Error clearing cache:", error);
  }
}