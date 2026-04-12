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
        .map((item) => item.trim());
    }

    data[key] = value;
  }

  return { data, content: bodyContent.trim() };
}

/**
 * Fetch Markdown content from GitHub raw URL
 */
export async function fetchMarkdownFromGitHub(url: string): Promise<Article> {
  try {
    // Convert GitHub URL to API URL
    const apiUrl = convertToApiUrl(url);

    // In development, use Vite custom proxy to bypass CORS
    // In production (Vercel), direct fetch works fine
    const isDev = import.meta.env.DEV;
    const fetchUrl = isDev
      ? `/api/github-proxy?url=${encodeURIComponent(apiUrl)}`
      : apiUrl;

    console.log("Fetching from:", fetchUrl);

    // Fetch content
    const response = await fetch(fetchUrl, {
      headers: {
        Accept: "application/vnd.github.v3.raw",
        "User-Agent": "Mozilla/5.0",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const markdownContent = await response.text();

    // Parse frontmatter and content (using custom parser for browser compatibility)
    const { data, content } = parseFrontmatter(markdownContent);

    // Extract metadata
    const metadata: GitHubMarkdown = {
      title: data.title || extractTitleFromContent(content) || "Untitled",
      date: data.date || new Date().toISOString().split("T")[0],
      tags: Array.isArray(data.tags) ? data.tags : [],
      author: data.author || "yangwei",
      excerpt: data.excerpt || generateExcerpt(content),
    };

    // Generate ID from URL
    const id = generateIdFromUrl(url);

    return {
      id,
      title: metadata.title,
      excerpt: metadata.excerpt,
      content: content.trim(),
      date: metadata.date,
      tags: metadata.tags,
      author: metadata.author,
    };
  } catch (error) {
    console.error("Error fetching markdown:", error);
    throw error;
  }
}

/**
 * Convert GitHub URL to GitHub API URL
 */
function convertToApiUrl(url: string): string {
  // Already a raw URL - convert to API
  if (url.includes("raw.githubusercontent.com")) {
    const match = url.match(/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)/);
    if (match) {
      const [, user, repo, branch, path] = match;
      return `https://api.github.com/repos/${user}/${repo}/contents/${path}?ref=${branch}`;
    }
  }

  // Convert blob URL to API URL
  // https://github.com/user/repo/blob/branch/path/file.md
  // -> https://api.github.com/repos/user/repo/contents/path/file.md?ref=branch
  const githubBlobPattern = /github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)/;
  const match = url.match(githubBlobPattern);

  if (match) {
    const [, user, repo, branch, path] = match;
    return `https://api.github.com/repos/${user}/${repo}/contents/${path}?ref=${branch}`;
  }

  // If pattern doesn't match, return original URL
  return url;
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
 * Generate unique ID from URL
 */
function generateIdFromUrl(url: string): string {
  // Extract filename from URL
  const filename = url.split("/").pop()?.replace(".md", "") || "article";
  return filename;
}

/**
 * Batch fetch multiple articles from GitHub URLs
 */
export async function fetchArticlesFromGitHub(
  urls: string[]
): Promise<Article[]> {
  const articles = await Promise.all(
    urls.map((url) => fetchMarkdownFromGitHub(url))
  );

  // Sort by date descending
  return articles.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}