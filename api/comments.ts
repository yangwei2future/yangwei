import type { VercelRequest, VercelResponse } from "@vercel/node";
import { isAuthenticatedRequest } from "../server/auth/http.js";

const TOKEN = process.env.GITHUB_TOKEN || process.env.github_token || "";
const OWNER = process.env.GITHUB_OWNER || "yangwei2future";
const REPO = process.env.GITHUB_REPO || "yangwei";
const FILE_PATH = "comments.json";

export interface Comment {
  id: string;
  articleId: string;
  nickname: string;
  content: string;
  createdAt: string;
}

type CommentsStore = Record<string, Comment[]>;

async function getStore(): Promise<{ store: CommentsStore; sha: string }> {
  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`,
    { headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/json" } }
  );
  if (res.status === 404) return { store: {}, sha: "" };
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  const file = await res.json();
  const content = Buffer.from(file.content, "base64").toString("utf-8");
  return { store: JSON.parse(content), sha: file.sha };
}

async function saveStore(store: CommentsStore, sha: string): Promise<void> {
  const content = Buffer.from(JSON.stringify(store, null, 2)).toString("base64");
  const body: Record<string, unknown> = {
    message: "Add comment",
    content,
    committer: { name: "Blog", email: "blog@blog.com" },
  };
  if (sha) body.sha = sha;
  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) throw new Error(`Failed to save: ${res.status} ${await res.text()}`);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    if (req.method === "GET") {
      const articleId = req.query.articleId as string;
      if (!articleId) return res.status(400).json({ error: "Missing articleId" });
      const { store } = await getStore();
      return res.status(200).json(store[articleId] ?? []);
    }

    if (req.method === "POST") {
      const { articleId, nickname, content } = req.body || {};
      if (!articleId || !content?.trim()) return res.status(400).json({ error: "Missing required fields" });
      if (content.trim().length > 1000) return res.status(400).json({ error: "评论不能超过1000字" });

      const comment: Comment = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        articleId,
        nickname: nickname?.trim().slice(0, 20) || "匿名",
        content: content.trim(),
        createdAt: new Date().toISOString(),
      };

      const { store, sha } = await getStore();
      const list = store[articleId] ?? [];
      await saveStore({ ...store, [articleId]: [...list, comment] }, sha);
      return res.status(200).json(comment);
    }

    if (req.method === "DELETE") {
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { articleId, commentId } = req.body || {};
      if (!articleId || !commentId) return res.status(400).json({ error: "Missing fields" });
      const { store, sha } = await getStore();
      const list = (store[articleId] ?? []).filter((c) => c.id !== commentId);
      await saveStore({ ...store, [articleId]: list }, sha);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).end("Method Not Allowed");
  } catch (err) {
    console.error("[API comments] Error:", err);
    return res.status(500).json({ error: String(err) });
  }
}
