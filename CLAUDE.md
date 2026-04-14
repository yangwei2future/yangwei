# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal blog built with Vite + React + TypeScript. Articles are loaded dynamically from GitHub Markdown files (stored as URLs in `localStorage`), with a fallback set of static articles in `client/src/lib/articles.ts`.

**Package Manager**: pnpm

**Key Commands**:
- `pnpm dev` - Start development server (Vite on port 3000)
- `pnpm build` - Build frontend only (Vite)
- `pnpm build:server` - Build Express server via esbuild to `dist/`
- `pnpm start` - Run production server (`NODE_ENV=production node dist/index.js`)
- `pnpm check` - TypeScript type checking
- `pnpm format` - Format code with Prettier

## Architecture

```
client/src/
  pages/       # Home, Articles, Article, About, Search, Admin, NotFound
  components/  # UI components (shadcn/ui in components/ui/)
  lib/
    types.ts          # Article and BlogConfig interfaces
    articles.ts       # Static fallback articles array + helper fns
    article-links.ts  # localStorage CRUD for GitHub Markdown URLs + auth
    markdown-loader.ts# Fetches & parses GitHub Markdown → Article objects
    useArticles.ts    # React hook: loads articles from GitHub with 30min cache
    search.ts         # Search logic
    utils.ts          # cn() utility (clsx + tailwind-merge)
  contexts/    # ThemeContext (light/dark)
  hooks/       # useMobile, usePersistFn, useComposition
server/index.ts  # Express: serves dist/public, SPA fallback on all routes
shared/const.ts  # Shared constants
```

**Routing**: wouter (client-side, defined in `client/src/App.tsx`)

Routes: `/`, `/articles`, `/article/:id`, `/about`, `/search`, `/admin`

## Article System

Two-tier article source:
1. **GitHub Markdown** (primary): URLs saved to `localStorage` via `/admin` page. The `useArticles` hook fetches them through `markdown-loader.ts`, with 30-minute `localStorage` cache (`blog_articles_cache`).
2. **Static fallback** (`client/src/lib/articles.ts`): Hardcoded articles array used when no GitHub links exist.

In dev, GitHub fetches are proxied through `vitePluginGitHubProxy` at `/api/github-proxy?url=...` to avoid CORS. In production (Vercel), direct fetch works.

Markdown files support YAML frontmatter: `title`, `date`, `tags`, `author`, `excerpt`.

## Admin Page (`/admin`)

Password-protected (hardcoded `123456` in `client/src/lib/article-links.ts`). Auth state stored in `sessionStorage`. Article links stored in `localStorage` under `blog_article_links`.

## Styling

Tailwind CSS v4 + shadcn/ui (new-york style). Theme configured in `client/src/index.css`. `ThemeProvider` in `App.tsx` defaults to `"light"` (pass `switchable` prop to enable toggle).

## Path Aliases

- `@/` → `client/src/`
- `@shared/` → `shared/`
- `@assets/` → `attached_assets/`

## Important Notes

- **wouter patch**: Uses patched wouter@3.7.1 (see `patches/wouter@3.7.1.patch`)
- **Manus debug**: `vitePluginManusDebugCollector` in `vite.config.ts` logs browser console/network to `.manus-logs/` in dev mode only
- **Build output**: Frontend → `dist/public/`, server → `dist/index.js`
- **React 19**: Uses React 19.x
- **No tests**: vitest is installed but no test files exist
