# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal blog built with Vite + React + TypeScript. Uses static article data (no CMS/database).

**Package Manager**: pnpm

**Key Commands**:
- `pnpm dev` - Start development server (Vite on port 3000)
- `pnpm build` - Build frontend and backend for production
- `pnpm start` - Run production server (Express)
- `pnpm check` - TypeScript type checking
- `pnpm format` - Format code with Prettier

## Architecture

```
client/          # React frontend
  src/
    components/  # UI components (shadcn/ui in ui/)
    pages/       # Route pages (Home, Articles, Article, About, Search, NotFound)
    lib/         # Core logic (articles.ts, search.ts, types.ts)
    hooks/       # Custom React hooks
    contexts/    # React contexts (ThemeContext)
server/          # Express server for production
shared/          # Shared constants (COOKIE_NAME)
```

**Routing**: wouter (client-side routing in `client/src/App.tsx`)

**Articles**: Static data in `client/src/lib/articles.ts`. Add new articles to the `articles` array.

**Styling**: Tailwind CSS v4 + shadcn/ui (new-york style)

**Path Aliases** (configured in tsconfig.json and vite.config.ts):
- `@/` → `client/src/`
- `@shared/` → `shared/`

## Important Notes

- **wouter patch**: Uses a patched version of wouter@3.7.1 (see `patches/wouter@3.7.1.patch`)
- **Manus debug**: Custom Vite plugin logs browser console/network to `.manus-logs/` in dev mode
- **React 19**: Uses React 19.x
- **No test runner**: Project uses vitest for testing but no test files present
