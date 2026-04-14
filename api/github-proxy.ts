import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).end("Method Not Allowed");
  }

  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    return res.status(400).end("Missing 'url' parameter");
  }

  const token = process.env.GITHUB_TOKEN || process.env.github_token;
  const headers: Record<string, string> = { "User-Agent": "Mozilla/5.0" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(targetUrl, { headers });

  if (!response.ok) {
    return res.status(response.status).end(await response.text());
  }

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  return res.status(200).end(await response.text());
}
