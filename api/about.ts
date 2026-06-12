import type { VercelRequest, VercelResponse } from "@vercel/node";
import { isAuthenticatedRequest } from "../server/auth/http.js";

const TOKEN = process.env.GITHUB_TOKEN || process.env.github_token || "";
const OWNER = process.env.GITHUB_OWNER || "yangwei2future";
const REPO = process.env.GITHUB_REPO || "yangwei";
const FILE_PATH = "about-config.json";

export interface AboutConfig {
  subtitle: string;
  intro: string[];
  skills: string[];
  experience: Array<{
    role: string;
    company: string;
    period: string;
    description: string;
  }>;
  projects: Array<{
    name: string;
    role: string;
    period: string;
    highlights: string[];
    metrics: string[];
  }>;
  contact: {
    email: string;
    github: string;
    wechat: string;
    phone: string;
  };
}

async function getConfig(): Promise<{ data: AboutConfig | null; sha: string }> {
  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`,
    { headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/json" } }
  );
  if (res.status === 404) return { data: null, sha: "" };
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  const file = await res.json();
  const content = Buffer.from(file.content, "base64").toString("utf-8");
  return { data: JSON.parse(content), sha: file.sha };
}

async function saveConfig(data: AboutConfig, sha: string): Promise<void> {
  const content = Buffer.from(JSON.stringify(data, null, 2)).toString("base64");
  const body: Record<string, unknown> = {
    message: "Update about config",
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
  res.setHeader("Access-Control-Allow-Methods", "GET, PUT, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    if (req.method === "GET") {
      const { data } = await getConfig();
      return res.status(200).json(data);
    }

    if (req.method === "PUT") {
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { sha } = await getConfig();
      await saveConfig(req.body as AboutConfig, sha);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).end("Method Not Allowed");
  } catch (err) {
    console.error("[API about] Error:", err);
    return res.status(500).json({ error: String(err) });
  }
}
