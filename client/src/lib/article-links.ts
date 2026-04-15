/**
 * Article Links Storage
 *
 * Manages GitHub Markdown URLs via /api/articles (server-side, persists across deployments)
 */

const CACHE_KEY = "blog_articles_cache";
const AUTH_PASSWORD = "123456";

function clearArticleCache() {
  try { localStorage.removeItem(CACHE_KEY); } catch {}
}

export interface ArticleLink {
  url: string;
  title?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Get stored article links from server
 */
export async function getArticleLinks(): Promise<ArticleLink[]> {
  const entries: { url: string; title?: string; createdAt?: string; updatedAt?: string }[] =
    await fetch("/api/articles").then((r) => r.json());
  return entries.map((e) => ({ url: e.url, title: e.title, createdAt: e.createdAt, updatedAt: e.updatedAt }));
}

/**
 * Add a new article link
 */
export async function addArticleLink(url: string, title?: string): Promise<void> {
  const res = await fetch("/api/articles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, title }),
  });
  if (!res.ok) {
    const { error } = await res.json();
    throw new Error(error || "添加失败");
  }
  clearArticleCache();
}

/**
 * Remove an article link
 */
export async function removeArticleLink(url: string): Promise<void> {
  const res = await fetch("/api/articles", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) throw new Error("删除失败");
  clearArticleCache();
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
    return sessionStorage.getItem("blog_authenticated") === "true";
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
  } catch {}
}

/**
 * Logout
 */
export function logout(): void {
  setAuthenticated(false);
}
