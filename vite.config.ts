import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import http from "node:http";
import https from "node:https";
import path from "node:path";
import { ProxyAgent, fetch as undiciFetch } from "undici";
import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";

// =============================================================================
// Manus Debug Collector - Vite Plugin
// Writes browser logs directly to files, trimmed when exceeding size limit
// =============================================================================

const PROJECT_ROOT = import.meta.dirname;
const LOG_DIR = path.join(PROJECT_ROOT, ".manus-logs");
const MAX_LOG_SIZE_BYTES = 1 * 1024 * 1024; // 1MB per log file
const TRIM_TARGET_BYTES = Math.floor(MAX_LOG_SIZE_BYTES * 0.6); // Trim to 60% to avoid constant re-trimming

type LogSource = "browserConsole" | "networkRequests" | "sessionReplay";

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function trimLogFile(logPath: string, maxSize: number) {
  try {
    if (!fs.existsSync(logPath) || fs.statSync(logPath).size <= maxSize) {
      return;
    }

    const lines = fs.readFileSync(logPath, "utf-8").split("\n");
    const keptLines: string[] = [];
    let keptBytes = 0;

    // Keep newest lines (from end) that fit within 60% of maxSize
    const targetSize = TRIM_TARGET_BYTES;
    for (let i = lines.length - 1; i >= 0; i--) {
      const lineBytes = Buffer.byteLength(`${lines[i]}\n`, "utf-8");
      if (keptBytes + lineBytes > targetSize) break;
      keptLines.unshift(lines[i]);
      keptBytes += lineBytes;
    }

    fs.writeFileSync(logPath, keptLines.join("\n"), "utf-8");
  } catch {
    /* ignore trim errors */
  }
}

function writeToLogFile(source: LogSource, entries: unknown[]) {
  if (entries.length === 0) return;

  ensureLogDir();
  const logPath = path.join(LOG_DIR, `${source}.log`);

  // Format entries with timestamps
  const lines = entries.map((entry) => {
    const ts = new Date().toISOString();
    return `[${ts}] ${JSON.stringify(entry)}`;
  });

  // Append to log file
  fs.appendFileSync(logPath, `${lines.join("\n")}\n`, "utf-8");

  // Trim if exceeds max size
  trimLogFile(logPath, MAX_LOG_SIZE_BYTES);
}

/**
 * Vite plugin to fetch GitHub content via API (bypass CORS and proxy issues)
 * Uses Node.js https module which works with system proxy
 */
function vitePluginGitHubProxy(): Plugin {
  let env: Record<string, string> = {};

  return {
    name: "github-proxy",
    config(_, { mode }) {
      env = loadEnv(mode, process.cwd(), "");
    },
    configureServer(server: ViteDevServer) {
      server.middlewares.use("/api/github-proxy", async (req, res, next) => {
        if (req.method !== "GET") {
          return next();
        }

        try {
          const urlObj = new URL(req.url || "", `http://localhost:${server.config.server.port}`);
          const targetUrl = urlObj.searchParams.get("url");

          if (!targetUrl) {
            res.writeHead(400, { "Content-Type": "text/plain" });
            res.end("Missing 'url' parameter");
            return;
          }

          console.log(`[GitHub Proxy] Fetching: ${targetUrl}`);

          const token = env.GITHUB_TOKEN;
          const headers: Record<string, string> = { "User-Agent": "Mozilla/5.0" };
          if (token) headers["Authorization"] = `Bearer ${token}`;

          const proxyUrl =
            env.HTTPS_PROXY || env.https_proxy || env.HTTP_PROXY || env.http_proxy;
          const dispatcher = proxyUrl ? new ProxyAgent(proxyUrl) : undefined;

          console.log(`[GitHub Proxy] Via proxy: ${proxyUrl || "none"}`);

          const response = await undiciFetch(targetUrl, {
            headers,
            dispatcher,
          } as Parameters<typeof undiciFetch>[1]);

          if (!response.ok) {
            console.error(`[GitHub Proxy] Error: ${response.status}`);
            res.writeHead(response.status, { "Content-Type": "text/plain" });
            res.end(await response.text());
            return;
          }

          console.log(`[GitHub Proxy] Success: 200`);
          res.writeHead(200, {
            "Content-Type": "text/plain; charset=utf-8",
            "Access-Control-Allow-Origin": "*",
          });
          res.end(await response.text());
        } catch (err) {
          console.error(`[GitHub Proxy] Error:`, err);
          res.writeHead(500, { "Content-Type": "text/plain" });
          res.end(`Error: ${err instanceof Error ? err.message : String(err)}`);
        }
      });
    },
  };
}

function vitePluginArticlesApi(): Plugin {
  let env: Record<string, string> = {};

  return {
    name: "articles-api",
    config(_, { mode }) {
      env = loadEnv(mode, process.cwd(), "");
    },
    configureServer(server: ViteDevServer) {
      const token = () => env.GITHUB_TOKEN || env.github_token || "";
      const owner = () => env.GITHUB_OWNER || "yangwei2future";
      const repo = () => env.GITHUB_REPO || "yangwei";
      const filePath = "articles-config.json";
      const proxyUrl = () =>
        env.HTTPS_PROXY || env.https_proxy || env.HTTP_PROXY || env.http_proxy;

      const githubFetch = (url: string, init?: RequestInit) => {
        const dispatcher = proxyUrl() ? new ProxyAgent(proxyUrl()!) : undefined;
        return undiciFetch(url, {
          ...init,
          headers: {
            Authorization: `Bearer ${token()}`,
            "Content-Type": "application/json",
            ...(init?.headers as Record<string, string>),
          },
          dispatcher,
        } as Parameters<typeof undiciFetch>[1]);
      };

      const getConfig = async (): Promise<{ urls: string[]; sha: string }> => {
        const r = await githubFetch(
          `https://api.github.com/repos/${owner()}/${repo()}/contents/${filePath}`
        );
        if ((r as any).status === 404) return { urls: [], sha: "" };
        if (!(r as any).ok) throw new Error(`GitHub error: ${(r as any).status}`);
        const data = await (r as any).json();
        const content = Buffer.from(data.content, "base64").toString("utf-8");
        return { urls: JSON.parse(content), sha: data.sha };
      };

      const saveConfig = async (urls: string[], sha: string) => {
        const content = Buffer.from(JSON.stringify(urls, null, 2)).toString("base64");
        const body: Record<string, unknown> = {
          message: "Update article links",
          content,
          committer: { name: "Blog Admin", email: "admin@blog.com" },
        };
        if (sha) body.sha = sha;
        const r = await githubFetch(
          `https://api.github.com/repos/${owner()}/${repo()}/contents/${filePath}`,
          { method: "PUT", body: JSON.stringify(body) }
        );
        if (!(r as any).ok) throw new Error(`Save failed: ${(r as any).status}`);
      };

      server.middlewares.use("/api/articles", async (req, res) => {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Content-Type", "application/json");

        try {
          if (req.method === "GET") {
            const { urls } = await getConfig();
            return res.end(JSON.stringify(urls));
          }

          let body = "";
          await new Promise<void>((resolve) => {
            req.on("data", (chunk) => (body += chunk));
            req.on("end", resolve);
          });
          const parsed = body ? JSON.parse(body) : {};

          if (req.method === "POST") {
            const { url } = parsed;
            const { urls, sha } = await getConfig();
            if (urls.includes(url)) {
              res.writeHead(409);
              return res.end(JSON.stringify({ error: "此链接已存在" }));
            }
            await saveConfig([...urls, url], sha);
            return res.end(JSON.stringify({ ok: true }));
          }

          if (req.method === "DELETE") {
            const { url } = parsed;
            const { urls, sha } = await getConfig();
            await saveConfig(urls.filter((u: string) => u !== url), sha);
            return res.end(JSON.stringify({ ok: true }));
          }
        } catch (err) {
          res.writeHead(500);
          res.end(JSON.stringify({ error: String(err) }));
        }
      });
    },
  };
}

function vitePluginCategoriesApi(): Plugin {
  let env: Record<string, string> = {};
  const DEFAULT_CATEGORIES = [
    { id: "ai", label: "AI", icon: "🤖", color: "purple" },
    { id: "backend", label: "后端", icon: "⚙️", color: "blue" },
    { id: "frontend", label: "前端", icon: "🎨", color: "pink" },
    { id: "tools", label: "工具", icon: "🛠️", color: "orange" },
    { id: "architecture", label: "架构", icon: "📐", color: "cyan" },
    { id: "essay", label: "随笔", icon: "📝", color: "green" },
  ];

  return {
    name: "categories-api",
    config(_, { mode }) { env = loadEnv(mode, process.cwd(), ""); },
    configureServer(server: ViteDevServer) {
      const token = () => env.GITHUB_TOKEN || env.github_token || "";
      const owner = () => env.GITHUB_OWNER || "yangwei2future";
      const repo = () => env.GITHUB_REPO || "yangwei";
      const filePath = "categories-config.json";
      const proxyUrl = () => env.HTTPS_PROXY || env.https_proxy || env.HTTP_PROXY || env.http_proxy;

      const githubFetch = (url: string, init?: RequestInit) => {
        const dispatcher = proxyUrl() ? new ProxyAgent(proxyUrl()!) : undefined;
        return undiciFetch(url, { ...init, headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json", ...(init?.headers as Record<string, string>) }, dispatcher } as Parameters<typeof undiciFetch>[1]);
      };

      const getConfig = async () => {
        const r = await githubFetch(`https://api.github.com/repos/${owner()}/${repo()}/contents/${filePath}`);
        if ((r as any).status === 404) return { categories: DEFAULT_CATEGORIES, sha: "" };
        if (!(r as any).ok) throw new Error(`GitHub error: ${(r as any).status}`);
        const data = await (r as any).json();
        return { categories: JSON.parse(Buffer.from(data.content, "base64").toString("utf-8")), sha: data.sha };
      };

      const saveConfig = async (categories: unknown[], sha: string) => {
        const content = Buffer.from(JSON.stringify(categories, null, 2)).toString("base64");
        const body: Record<string, unknown> = { message: "Update categories", content, committer: { name: "Blog Admin", email: "admin@blog.com" } };
        if (sha) body.sha = sha;
        const r = await githubFetch(`https://api.github.com/repos/${owner()}/${repo()}/contents/${filePath}`, { method: "PUT", body: JSON.stringify(body) });
        if (!(r as any).ok) throw new Error(`Save failed: ${(r as any).status}`);
      };

      server.middlewares.use("/api/categories", async (req, res) => {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Content-Type", "application/json");
        try {
          if (req.method === "GET") {
            const { categories } = await getConfig();
            return res.end(JSON.stringify(categories));
          }
          let body = "";
          await new Promise<void>((resolve) => { req.on("data", (c) => (body += c)); req.on("end", resolve); });
          const parsed = body ? JSON.parse(body) : {};

          if (req.method === "POST") {
            const { categories, sha } = await getConfig();
            if (categories.some((c: any) => c.id === parsed.id)) { res.writeHead(409); return res.end(JSON.stringify({ error: "分类ID已存在" })); }
            await saveConfig([...categories, { id: parsed.id, label: parsed.label, icon: parsed.icon || "📁", color: parsed.color || "gray" }], sha);
            return res.end(JSON.stringify({ ok: true }));
          }
          if (req.method === "PATCH") {
            const { categories, sha } = await getConfig();
            await saveConfig(categories.map((c: any) => c.id !== parsed.id ? c : { ...c, ...(parsed.label !== undefined && { label: parsed.label }), ...(parsed.icon !== undefined && { icon: parsed.icon }), ...(parsed.color !== undefined && { color: parsed.color }) }), sha);
            return res.end(JSON.stringify({ ok: true }));
          }
          if (req.method === "DELETE") {
            const { categories, sha } = await getConfig();
            await saveConfig(categories.filter((c: any) => c.id !== parsed.id), sha);
            return res.end(JSON.stringify({ ok: true }));
          }
        } catch (err) {
          res.writeHead(500);
          res.end(JSON.stringify({ error: String(err) }));
        }
      });
    },
  };
}

/**
 * Vite plugin to collect browser debug logs
 * - POST /__manus__/logs: Browser sends logs, written directly to files
 * - Files: browserConsole.log, networkRequests.log, sessionReplay.log
 * - Auto-trimmed when exceeding 1MB (keeps newest entries)
 */
function vitePluginManusDebugCollector(): Plugin {
  return {
    name: "manus-debug-collector",

    transformIndexHtml(html) {
      if (process.env.NODE_ENV === "production") {
        return html;
      }
      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: {
              src: "/__manus__/debug-collector.js",
              defer: true,
            },
            injectTo: "head",
          },
        ],
      };
    },

    configureServer(server: ViteDevServer) {
      // POST /__manus__/logs: Browser sends logs (written directly to files)
      server.middlewares.use("/__manus__/logs", (req, res, next) => {
        if (req.method !== "POST") {
          return next();
        }

        const handlePayload = (payload: any) => {
          // Write logs directly to files
          if (payload.consoleLogs?.length > 0) {
            writeToLogFile("browserConsole", payload.consoleLogs);
          }
          if (payload.networkRequests?.length > 0) {
            writeToLogFile("networkRequests", payload.networkRequests);
          }
          if (payload.sessionEvents?.length > 0) {
            writeToLogFile("sessionReplay", payload.sessionEvents);
          }

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        };

        const reqBody = (req as { body?: unknown }).body;
        if (reqBody && typeof reqBody === "object") {
          try {
            handlePayload(reqBody);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
          return;
        }

        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });

        req.on("end", () => {
          try {
            const payload = JSON.parse(body);
            handlePayload(payload);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
        });
      });
    },
  };
}

function vitePluginCommentsApi(): Plugin {
  let env: Record<string, string> = {};

  return {
    name: "comments-api",
    config(_, { mode }) { env = loadEnv(mode, process.cwd(), ""); },
    configureServer(server: ViteDevServer) {
      const token = () => env.GITHUB_TOKEN || env.github_token || "";
      const owner = () => env.GITHUB_OWNER || "yangwei2future";
      const repo = () => env.GITHUB_REPO || "yangwei";
      const filePath = "comments.json";
      const proxyUrl = () => env.HTTPS_PROXY || env.https_proxy || env.HTTP_PROXY || env.http_proxy;

      const githubFetch = (url: string) => {
        const dispatcher = proxyUrl() ? new ProxyAgent(proxyUrl()!) : undefined;
        return undiciFetch(url, { headers: { Authorization: `Bearer ${token()}`, Accept: "application/json" }, dispatcher } as Parameters<typeof undiciFetch>[1]);
      };

      const getStore = async () => {
        const r = await githubFetch(`https://api.github.com/repos/${owner()}/${repo()}/contents/${filePath}`);
        if ((r as any).status === 404) return { store: {}, sha: "" };
        if (!(r as any).ok) throw new Error(`GitHub error: ${(r as any).status}`);
        const data = await (r as any).json();
        return { store: JSON.parse(Buffer.from(data.content, "base64").toString("utf-8")), sha: data.sha };
      };

      // /api/comments-count
      server.middlewares.use("/api/comments-count", async (_req, res) => {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Content-Type", "application/json");
        try {
          const { store } = await getStore();
          const counts: Record<string, number> = {};
          for (const [articleId, comments] of Object.entries(store)) {
            counts[articleId] = (comments as unknown[]).length;
          }
          return res.end(JSON.stringify(counts));
        } catch (err) {
          res.writeHead(500);
          res.end(JSON.stringify({ error: String(err) }));
        }
      });

      // /api/comments
      server.middlewares.use("/api/comments", async (req, res) => {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Content-Type", "application/json");
        try {
          if (req.method === "GET") {
            const urlObj = new URL(req.url || "", `http://localhost:${server.config.server.port}`);
            const articleId = urlObj.searchParams.get("articleId");
            if (!articleId) { res.writeHead(400); return res.end(JSON.stringify({ error: "Missing articleId" })); }
            const { store } = await getStore();
            return res.end(JSON.stringify((store as Record<string, unknown[]>)[articleId] ?? []));
          }
          if (req.method === "POST") {
            let body = "";
            await new Promise<void>((resolve) => { req.on("data", (c) => (body += c)); req.on("end", resolve); });
            const parsed = JSON.parse(body);
            const { store, sha } = await getStore();
            const comment = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), articleId: parsed.articleId, nickname: parsed.nickname?.trim().slice(0, 20) || "匿名", content: parsed.content.trim(), createdAt: new Date().toISOString() };
            const list = (store[parsed.articleId] ?? []) as unknown[];
            const newStore = { ...store, [parsed.articleId]: [...list, comment] };
            const content = Buffer.from(JSON.stringify(newStore, null, 2)).toString("base64");
            const putRes = await undiciFetch(`https://api.github.com/repos/${owner()}/${repo()}/contents/${filePath}`, {
              method: "PUT",
              headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
              body: JSON.stringify({ message: "Add comment", content, committer: { name: "Blog", email: "blog@blog.com" }, ...(sha ? { sha } : {}) }),
              dispatcher: proxyUrl() ? new ProxyAgent(proxyUrl()!) : undefined,
            } as Parameters<typeof undiciFetch>[1]);
            if (!(putRes as any).ok) { res.writeHead(500); return res.end(JSON.stringify({ error: "Save failed" })); }
            return res.end(JSON.stringify(comment));
          }
          res.writeHead(405);
          res.end("Method Not Allowed");
        } catch (err) {
          res.writeHead(500);
          res.end(JSON.stringify({ error: String(err) }));
        }
      });
    },
  };
}

const plugins = [
  react(),
  tailwindcss(),
  jsxLocPlugin(),
  vitePluginManusRuntime(),
  vitePluginGitHubProxy(),
  vitePluginArticlesApi(),
  vitePluginCategoriesApi(),
  vitePluginCommentsApi(),
  vitePluginManusDebugCollector(),
];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    strictPort: false, // Will find next available port if 3000 is busy
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
