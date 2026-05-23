import type { Article } from "./types";

/**
 * GitHub Markdown Loader
 *
 * Fetches Markdown files from GitHub API and parses them into Article objects
 */

interface GitHubMarkdown {
  title: string;
  date: string;
  tags: string[];
  author: string;
  excerpt?: string;
}

function toBeijingISOString(): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}+08:00`;
}

/**
 * Simple frontmatter parser (works in browser)
 */
function parseFrontmatter(content: string): { data: Record<string, any>; content: string } {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { data: {}, content: content.trim() };
  }

  const frontmatterStr = match[1];
  const bodyContent = content.slice(match[0].length);

  // Parse YAML-like frontmatter
  const data: Record<string, any> = {};
  const lines = frontmatterStr.split("\n");

  for (const line of lines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    let value: any = line.slice(colonIndex + 1).trim();

    // Handle arrays (simple format: [item1, item2])
    if (value.startsWith("[") && value.endsWith("]")) {
      value = value
        .slice(1, -1)
        .split(",")
        .map((item: string) => item.trim());
    }

    data[key] = value;
  }

  return { data, content: bodyContent.trim() };
}

/**
 * Fetch Markdown content from GitHub raw URL
 */
export async function fetchMarkdownFromGitHub(url: string, customTitle?: string, fallbackDate?: string, customId?: string): Promise<Article> {
  try {
    // Convert GitHub URL to API URL
    const apiUrl = convertToApiUrl(url);

    const fetchUrl = `/api/github-proxy?url=${encodeURIComponent(apiUrl)}`;

    console.log("Fetching from:", fetchUrl);

    const response = await fetch(fetchUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const markdownContent = await response.text();

    // Parse frontmatter and content (using custom parser for browser compatibility)
    const { data, content } = parseFrontmatter(markdownContent);

    // Extract metadata
    const metadata: GitHubMarkdown = {
      title: customTitle || data.title || extractTitleFromContent(content) || "Untitled",
      date: (data.date && /\d{4}-\d{2}-\d{2}/.test(data.date))
        ? data.date + (data.date.includes("T") ? "" : "T00:00:00+08:00")
        : (fallbackDate || toBeijingISOString()),
      tags: Array.isArray(data.tags) ? data.tags : [],
      author: data.author || "杨卫",
      excerpt: data.excerpt || generateExcerpt(content),
    };

    const id = customId || generateIdFromUrl(url);
    const rawBase = apiUrl.substring(0, apiUrl.lastIndexOf("/") + 1);
    const finalContent = rewriteImageUrls(content.trim(), rawBase);

    return {
      id,
      title: metadata.title,
      excerpt: metadata.excerpt ?? "",
      content: finalContent,
      date: metadata.date,
      tags: metadata.tags,
      author: metadata.author,
      createdAt: metadata.date,
    };
  } catch (error) {
    console.error("Error fetching markdown:", error);
    throw error;
  }
}

/**
 * Convert GitHub URL to raw.githubusercontent.com URL
 */
function convertToApiUrl(url: string): string {
  // Already a raw URL - use as-is
  if (url.includes("raw.githubusercontent.com")) {
    return url;
  }

  // Convert blob URL to raw URL
  // https://github.com/user/repo/blob/branch/path/file.md
  // -> https://raw.githubusercontent.com/user/repo/branch/path/file.md
  const githubBlobPattern = /github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)/;
  const match = url.match(githubBlobPattern);

  if (match) {
    const [, user, repo, branch, path] = match;
    return `https://raw.githubusercontent.com/${user}/${repo}/${branch}/${path}`;
  }

  return url;
}

/**
 * Rewrite relative image URLs in markdown to absolute GitHub raw URLs
 */
function rewriteImageUrls(content: string, baseUrl: string): string {
  // Rewrite markdown image syntax: ![alt](relative/path)
  content = content.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
    if (/^https?:\/\/|^data:/.test(src)) return match;
    return `![${alt}](${new URL(src, baseUrl).href})`;
  });

  // Rewrite src attribute in <img>, <video>, <source> tags
  content = content.replace(/<(img|video|source)([^>]*?)src=(["'])([^"']+)\3/gi, (match, tag, before, quote, src) => {
    if (/^https?:\/\/|^data:/.test(src)) return match;
    return `<${tag}${before}src=${quote}${new URL(src, baseUrl).href}${quote}`;
  });

  return content;
}

/**
 * Extract title from markdown content (first H1 heading)
 */
function extractTitleFromContent(content: string): string | null {
  const h1Match = content.match(/^#\s+(.+)$/m);
  return h1Match ? h1Match[1].trim() : null;
}

/**
 * Generate excerpt from content (first 150 characters)
 */
function generateExcerpt(content: string): string {
  const plainText = content
    .replace(/^#+\s+/gm, "") // Remove headings
    .replace(/\*\*/g, "") // Remove bold
    .replace(/`/g, "") // Remove code marks
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Remove links
    .replace(/^\|.*\|$/gm, "") // Remove table rows
    .trim();

  return plainText.substring(0, 150) + (plainText.length > 150 ? "..." : "");
}

/**
 * Generate unique ID from URL (filename only, legacy)
 * Used for backward compatibility with articles created before stored IDs
 */
function generateIdFromUrlLegacy(url: string): string {
  const filename = url.split("/").pop()?.replace(/\.md$/i, "") || "article";
  return decodeURIComponent(filename);
}

/**
 * Generate unique ID from URL (path-based, used for new articles)
 * Uses the full path after the branch to avoid filename collisions
 * e.g. .../blob/main/src/concurrent/locks/README.md → src-concurrent-locks-README
 */
export function generateIdFromUrl(url: string): string {
  const blobMatch = url.match(/github\.com\/[^/]+\/[^/]+\/blob\/[^/]+\/(.+)/);
  if (blobMatch) return blobMatch[1].replace(/\.md$/i, "").replace(/\//g, "-");
  const rawMatch = url.match(/raw\.githubusercontent\.com\/[^/]+\/[^/]+\/[^/]+\/(.+)/);
  if (rawMatch) return rawMatch[1].replace(/\.md$/i, "").replace(/\//g, "-");
  return generateIdFromUrlLegacy(url);
}

/** Resolve effective article id: stored id first, then legacy fallback */
export function resolveArticleId(entry: { url: string; id?: string }): string {
  return entry.id ?? generateIdFromUrlLegacy(entry.url);
}

/**
 * Batch fetch multiple articles from GitHub URLs
 */
export async function fetchArticlesFromGitHub(
  entries: { url: string; id?: string; title?: string; createdAt?: string }[]
): Promise<Article[]> {
  return Promise.all(
    entries.map((e) => fetchMarkdownFromGitHub(e.url, e.title, e.createdAt, e.id))
  );
}