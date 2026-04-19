import type { VercelRequest, VercelResponse } from "@vercel/node";

const TOKEN = process.env.GITHUB_TOKEN || process.env.github_token || "";
const OWNER = process.env.GITHUB_OWNER || "yangwei2future";
const REPO = process.env.GITHUB_REPO || "yangwei";
const FILE_PATH = "categories-config.json";

export interface CategoryEntry {
  id: string;
  label: string;
  icon: string;
  color: string;
}

const DEFAULT_CATEGORIES: CategoryEntry[] = [
  { id: "ai", label: "AI", icon: "🤖", color: "purple" },
  { id: "backend", label: "后端", icon: "⚙️", color: "blue" },
  { id: "frontend", label: "前端", icon: "🎨", color: "pink" },
  { id: "tools", label: "工具", icon: "🛠️", color: "orange" },
  { id: "architecture", label: "架构", icon: "📐", color: "cyan" },
  { id: "essay", label: "随笔", icon: "📝", color: "green" },
];

async function getConfig(): Promise<{ categories: CategoryEntry[]; sha: string }> {
  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`,
    { headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/json" } }
  );
  if (res.status === 404) return { categories: DEFAULT_CATEGORIES, sha: "" };
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  const data = await res.json();
  const content = Buffer.from(data.content, "base64").toString("utf-8");
  return { categories: JSON.parse(content), sha: data.sha };
}

async function saveConfig(categories: CategoryEntry[], sha: string): Promise<void> {
  const content = Buffer.from(JSON.stringify(categories, null, 2)).toString("base64");
  const body: Record<string, unknown> = {
    message: "Update categories",
    content,
    committer: { name: "Blog Admin", email: "admin@blog.com" },
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
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    if (req.method === "GET") {
      const { categories } = await getConfig();
      return res.status(200).json(categories);
    }

    if (req.method === "POST") {
      const { id, label, icon, color } = req.body;
      if (!id || !label) return res.status(400).json({ error: "Missing id or label" });
      const { categories, sha } = await getConfig();
      if (categories.some((c) => c.id === id)) return res.status(409).json({ error: "分类ID已存在" });
      await saveConfig([...categories, { id, label, icon: icon || "📁", color: color || "gray" }], sha);
      return res.status(200).json({ ok: true });
    }

    if (req.method === "PATCH") {
      const { id, label, icon, color } = req.body;
      if (!id) return res.status(400).json({ error: "Missing id" });
      const { categories, sha } = await getConfig();
      await saveConfig(
        categories.map((c) => {
          if (c.id !== id) return c;
          return { ...c, ...(label !== undefined && { label }), ...(icon !== undefined && { icon }), ...(color !== undefined && { color }) };
        }),
        sha
      );
      return res.status(200).json({ ok: true });
    }

    if (req.method === "DELETE") {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: "Missing id" });
      const { categories, sha } = await getConfig();
      await saveConfig(categories.filter((c) => c.id !== id), sha);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).end("Method Not Allowed");
  } catch (err) {
    console.error("[API categories] Error:", err);
    return res.status(500).json({ error: String(err) });
  }
}
