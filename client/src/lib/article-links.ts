/**
 * Article Links Storage
 *
 * Manages GitHub Markdown URLs with localStorage persistence
 */

const STORAGE_KEY = "blog_article_links";
const CACHE_KEY = "blog_articles_cache";
const AUTH_PASSWORD = "123456";

function clearArticleCache() {
  try { localStorage.removeItem(CACHE_KEY); } catch {}
}

export interface ArticleLink {
  url: string;
  addedAt: string;
}

/**
 * Get stored article links
 */
export function getArticleLinks(): ArticleLink[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error("Error reading article links:", error);
    return [];
  }
}

/**
 * Save article links to localStorage
 */
export function saveArticleLinks(links: ArticleLink[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
  } catch (error) {
    console.error("Error saving article links:", error);
  }
}

/**
 * Add a new article link
 */
export function addArticleLink(url: string): ArticleLink[] {
  const links = getArticleLinks();

  // Check if URL already exists
  if (links.some((link) => link.url === url)) {
    throw new Error("此链接已存在");
  }

  const newLink: ArticleLink = {
    url,
    addedAt: new Date().toISOString(),
  };

  const updatedLinks = [...links, newLink];
  saveArticleLinks(updatedLinks);
  clearArticleCache();

  return updatedLinks;
}

/**
 * Remove an article link
 */
export function removeArticleLink(url: string): ArticleLink[] {
  const links = getArticleLinks();
  const updatedLinks = links.filter((link) => link.url !== url);
  saveArticleLinks(updatedLinks);
  clearArticleCache();
  return updatedLinks;
}

/**
 * Verify password for admin access
 */
export function verifyPassword(password: string): boolean {
  return password === AUTH_PASSWORD;
}

/**
 * Check if user is authenticated (session)
 */
export function isAuthenticated(): boolean {
  try {
    const auth = sessionStorage.getItem("blog_authenticated");
    return auth === "true";
  } catch {
    return false;
  }
}

/**
 * Set authentication status (session)
 */
export function setAuthenticated(status: boolean): void {
  try {
    sessionStorage.setItem("blog_authenticated", status.toString());
  } catch (error) {
    console.error("Error setting auth status:", error);
  }
}

/**
 * Logout
 */
export function logout(): void {
  setAuthenticated(false);
}