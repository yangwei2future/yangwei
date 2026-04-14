import type { VercelRequest, VercelResponse } from "@vercel/node";

const TOKEN = process.env.GITHUB_TOKEN || process.env.github_token || "";
const OWNER = process.env.GITHUB_OWNER || "yangwei2future";
const REPO = process.env.GITHUB_REPO || "yangwei";
const FILE_PATH = "articles-config.json";

async function getConfig(): Promise<{ urls: string[]; sha: string }> {
  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`,
    { headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/json" } }
  );
  if (res.status === 404) return { urls: [], sha: "" };
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  const data = await res.json();
  const content = Buffer.from(data.content, "base64").toString("utf-8");
  return { urls: JSON.parse(content), sha: data.sha };
}

async function saveConfig(urls: string[], sha: string): Promise<void> {
  const content = Buffer.from(JSON.stringify(urls, null, 2)).toString("base64");
  const body: Record<string, unknown> = {
    message: "Update article links",
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
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    if (req.method === "GET") {
      const { urls } = await getConfig();
      return res.status(200).json(urls);
    }

    if (req.method === "POST") {
      const { url } = req.body;
      if (!url) return res.status(400).json({ error: "Missing url" });
      const { urls, sha } = await getConfig();
      if (urls.includes(url)) return res.status(409).json({ error: "此链接已存在" });
      await saveConfig([...urls, url], sha);
      return res.status(200).json({ ok: true });
    }

    if (req.method === "DELETE") {
      const { url } = req.body;
      if (!url) return res.status(400).json({ error: "Missing url" });
      const { urls, sha } = await getConfig();
      await saveConfig(urls.filter((u) => u !== url), sha);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).end("Method Not Allowed");
  } catch (err) {
    console.error("[API articles] Error:", err);
    return res.status(500).json({ error: String(err) });
  }
}
