import { Article } from "./types";

/**
 * Search Utility Functions
 * 
 * Provides full-text search capabilities for articles
 * Searches across title, content, and tags
 */

/**
 * Normalize search text for case-insensitive comparison
 */
function normalizeText(text: string): string {
  return text.toLowerCase().trim();
}

/**
 * Calculate relevance score for an article based on search query
 * Higher score = more relevant
 */
function calculateRelevanceScore(
  article: Article,
  query: string
): number {
  const normalizedQuery = normalizeText(query);
  let score = 0;

  // Title match (highest priority)
  if (normalizeText(article.title).includes(normalizedQuery)) {
    score += 100;
    // Exact title match gets even higher score
    if (normalizeText(article.title) === normalizedQuery) {
      score += 50;
    }
  }

  // Tag match (medium priority)
  article.tags.forEach((tag) => {
    if (normalizeText(tag).includes(normalizedQuery)) {
      score += 30;
    }
  });

  // Content match (lower priority)
  if (normalizeText(article.content).includes(normalizedQuery)) {
    score += 10;
  }

  // Excerpt match
  if (normalizeText(article.excerpt).includes(normalizedQuery)) {
    score += 15;
  }

  return score;
}

/**
 * Search articles by query string
 * Returns articles sorted by relevance
 */
export function searchArticles(
  articles: Article[],
  query: string
): Article[] {
  if (!query.trim()) {
    // Return all articles sorted by date (descending)
    return articles.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  const results = articles
    .map((article) => ({
      article,
      score: calculateRelevanceScore(article, query),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ article }) => article);

  return results;
}

/**
 * Highlight search query in text
 * Returns text with query wrapped in span tags
 */
export function highlightText(text: string, query: string): string {
  if (!query.trim()) {
    return text;
  }

  const normalizedQuery = normalizeText(query);
  const regex = new RegExp(`(${query})`, "gi");

  return text.replace(regex, "<mark>$1</mark>");
}

/**
 * Get search suggestions based on partial query
 * Returns array of matching tags and article titles
 */
export function getSearchSuggestions(
  articles: Article[],
  query: string
): string[] {
  if (!query.trim()) {
    return [];
  }

  const normalizedQuery = normalizeText(query);
  const suggestions = new Set<string>();

  // Add matching tags
  articles.forEach((article) => {
    article.tags.forEach((tag) => {
      if (normalizeText(tag).includes(normalizedQuery)) {
        suggestions.add(tag);
      }
    });
  });

  // Add matching titles
  articles.forEach((article) => {
    if (normalizeText(article.title).includes(normalizedQuery)) {
      suggestions.add(article.title);
    }
  });

  return Array.from(suggestions).slice(0, 8); // Limit to 8 suggestions
}
