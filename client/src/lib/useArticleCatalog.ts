import { useEffect, useState } from "react";
import type { ArticleLink } from "./article-links";
import { fetchMarkdownFromGitHub, resolveArticleId, resolvePublishedAt } from "./markdown-loader";
import summaries from "./article-summaries.json";
import type { Article } from "./types";

const bundledSummaries = new Map(Object.entries(summaries));
let pendingCatalog: Promise<ArticleLink[]> | undefined;

function fetchCatalog() {
  if (!pendingCatalog) {
    pendingCatalog = fetch("/api/articles")
      .then(async (response) => {
        if (!response.ok) throw new Error(`文章列表请求失败（${response.status}）`);
        const entries: ArticleLink[] = await response.json();
        if (!Array.isArray(entries)) throw new Error("文章列表格式无效");
        return entries;
      })
      .finally(() => { pendingCatalog = undefined; });
  }
  return pendingCatalog;
}

function summarize(entry: ArticleLink): Article {
  const summary = bundledSummaries.get(entry.url);
  const id = resolveArticleId(entry);
  const date = resolvePublishedAt(undefined, entry.createdAt ?? entry.updatedAt);

  return {
    id,
    title: entry.title || summary?.title || id,
    excerpt: summary?.excerpt ?? "",
    tags: summary?.tags ?? [],
    author: "杨卫",
    content: "",
    date,
    createdAt: date,
    updatedAt: entry.updatedAt,
    categories: entry.categories,
    refs: entry.refs,
  };
}

export function loadCatalogArticle(entry: ArticleLink): Promise<Article> {
  return fetchMarkdownFromGitHub(
    entry.url, entry.title, entry.createdAt ?? entry.updatedAt, resolveArticleId(entry),
  ).then((article) => ({
    ...article,
    createdAt: entry.createdAt ?? entry.updatedAt ?? article.createdAt,
    updatedAt: entry.updatedAt,
    categories: entry.categories,
    refs: entry.refs,
    hidden: entry.hidden,
  }));
}

export function useArticleCatalog({ enrich = false } = {}) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [allLinks, setAllLinks] = useState<ArticleLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchCatalog()
      .then((entries) => {
        if (!active) return;
        const visible = entries.filter((entry) => !entry.hidden);
        setAllLinks(entries);
        setArticles(visible.map(summarize).sort(
          (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
        ));
        setLoading(false);
        if (!enrich) return;

        // Fill in missing or outdated summaries after the list has rendered.
        for (const entry of visible) {
          const summary = bundledSummaries.get(entry.url);
          if (summary && summary.updatedAt === entry.updatedAt) continue;
          void loadCatalogArticle(entry)
            .then(({ content: _content, ...article }) => {
              if (!active) return;
              setArticles((current) => current.map((item) =>
                item.id === article.id ? { ...article, content: "" } : item
              ).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)));
            })
            .catch(() => { /* Keep the available catalog metadata. */ });
        }
      })
      .catch((cause: Error) => {
        if (!active) return;
        setError(cause.message);
        setLoading(false);
      });
    return () => { active = false; };
  }, [enrich]);

  return { articles, allLinks, loading, error };
}
