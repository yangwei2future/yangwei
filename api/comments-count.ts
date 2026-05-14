import type { VercelRequest, VercelResponse } from "@vercel/node";

const TOKEN = process.env.GITHUB_TOKEN || process.env.github_token || "";
const OWNER = process.env.GITHUB_OWNER || "yangwei2future";
const REPO = process.env.GITHUB_REPO || "yangwei";
const FILE_PATH = "comments.json";

type CommentsStore = Record<string, unknown[]>;

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "GET") return res.status(405).end("Method Not Allowed");

  try {
    const { store } = await getStore();
    const counts: Record<string, number> = {};
    for (const [articleId, comments] of Object.entries(store)) {
      counts[articleId] = (comments as unknown[]).length;
    }
    return res.status(200).json(counts);
  } catch (err) {
    console.error("[API comments-count] Error:", err);
    return res.status(500).json({ error: String(err) });
  }
}
