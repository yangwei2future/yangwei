/**
 * Article Links Storage
 *
 * Manages GitHub Markdown URLs via /api/articles (server-side, persists across deployments)
 */

const CACHE_KEY = "blog_articles_cache_v2";
const AUTH_CACHE_KEY = "blog_authenticated";

export interface AuthUser {
  id: string;
  login: string;
  name: string;
  avatarUrl: string;
}

export interface AuthSession {
  authenticated: boolean;
  user: AuthUser | null;
}

function clearArticleCache() {
  try { localStorage.removeItem(CACHE_KEY); } catch {}
}

export interface ArticleLink {
  url: string;
  id?: string;
  title?: string;
  createdAt?: string;
  updatedAt?: string;
  hidden?: boolean;
  categories?: string[];
  refs?: string[];
}

/**
 * Get stored article links from server
 */
export async function getArticleLinks(): Promise<ArticleLink[]> {
  const entries: ArticleLink[] = await fetch("/api/articles").then((r) => r.json());
  return entries.map((e) => ({ url: e.url, id: e.id, title: e.title, createdAt: e.createdAt, updatedAt: e.updatedAt, hidden: e.hidden, categories: e.categories, refs: e.refs }));
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
 * This is only a synchronous UI hint. Server-side authorization always
 * validates the HttpOnly session cookie.
 */
export function isAuthenticated(): boolean {
  try {
    return sessionStorage.getItem(AUTH_CACHE_KEY) === "true";
  } catch {
    return false;
  }
}

function setAuthenticated(status: boolean): void {
  try {
    sessionStorage.setItem(AUTH_CACHE_KEY, status.toString());
  } catch {}
}

export async function getAuthSession(): Promise<AuthSession> {
  try {
    const response = await fetch("/api/auth/session", {
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Unable to load session");
    const session = (await response.json()) as AuthSession;
    setAuthenticated(session.authenticated);
    return session;
  } catch {
    setAuthenticated(false);
    return { authenticated: false, user: null };
  }
}

export function getGithubLoginUrl(): string {
  return "/api/auth/github";
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "same-origin",
  }).catch(() => undefined);
  setAuthenticated(false);
}
