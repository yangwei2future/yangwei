import matter from "gray-matter";
import type { Article } from "./types";

/**
 * GitHub Markdown Loader
 *
 * Fetches Markdown files from GitHub raw URLs and parses them into Article objects
 */

interface GitHubMarkdown {
  title: string;
  date: string;
  tags: string[];
  author: string;
  excerpt?: string;
}

/**
 * Fetch Markdown content from GitHub raw URL
 */
export async function fetchMarkdownFromGitHub(url: string): Promise<Article> {
  try {
    // Convert GitHub URL to raw URL if needed
    const rawUrl = convertToRawUrl(url);

    // Fetch content
    const response = await fetch(rawUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const markdownContent = await response.text();

    // Parse frontmatter and content
    const { data, content } = matter(markdownContent);

    // Extract metadata
    const metadata: GitHubMarkdown = {
      title: data.title || "Untitled",
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
 * Convert regular GitHub URL to raw content URL
 */
function convertToRawUrl(url: string): string {
  // Already a raw URL
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

  // If pattern doesn't match, return original URL
  return url;
}

/**
 * Generate excerpt from content (first 150 characters)
 */
function generateExcerpt(content: string): string {
  const plainText = content
    .replace(/#+ /g, "") // Remove headings
    .replace(/\*\*/g, "") // Remove bold
    .replace(/`/g, "") // Remove code marks
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Remove links
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