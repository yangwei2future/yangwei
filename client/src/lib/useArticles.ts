import { useEffect, useState } from "react";
import { getArticleLinks } from "./article-links";
import { fetchArticlesFromGitHub } from "./markdown-loader";
import type { Article } from "./types";

/**
 * Articles Hook
 *
 * Loads articles from GitHub URLs stored in localStorage
 */

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

      const links = getArticleLinks();

      if (links.length === 0) {
        setArticles([]);
        setLoading(false);
        return;
      }

      const fetchedArticles = await fetchArticlesFromGitHub(
        links.map((link) => link.url)
      );

      setArticles(fetchedArticles);
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
    await loadArticles();
  }

  return { articles, loading, error, reload: loadArticles, refresh: refreshArticles };
}