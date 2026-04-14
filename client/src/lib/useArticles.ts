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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadArticles();
  }, []);

  async function loadArticles() {
    try {
      setLoading(true);
      setError(null);

      const urls: string[] = await fetch("/api/articles").then((r) => r.json());

      if (urls.length === 0) {
        setArticles([]);
        setLoading(false);
        return;
      }

      // Check cache first
      const cached = getCachedArticles();
      if (cached) {
        console.log("Using cached articles");
        setArticles(cached);
        setLoading(false);
        return;
      }

      console.log("Fetching articles from GitHub");
      const fetchedArticles = await fetchArticlesFromGitHub(urls);

      setArticles(fetchedArticles);
      cacheArticles(fetchedArticles);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载文章失败");
      console.error("Error loading articles:", err);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Force refresh all articles (clear cache)
   */
  async function refreshArticles() {
    clearCache();
    await loadArticles();
  }

  return { articles, loading, error, reload: loadArticles, refresh: refreshArticles };
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
    .then((urls: string[]) => {
      if (urls.length === 0) return;
      return fetchArticlesFromGitHub(urls).then((articles) => {
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