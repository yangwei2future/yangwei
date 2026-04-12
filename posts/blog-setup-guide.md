---
title: 从零开始搭建个人博客
date: 2026-04-12
tags: [博客, Vercel, React, Vite]
author: yangwei
excerpt: 使用 Manus + Claude Code + GitHub + Vercel，零成本搭建现代化个人博客的完整实践。
---

# 从零开始搭建个人博客

## 项目背景

作为一个技术人员，拥有一个个人博客是展示技术能力、沉淀思考成果的重要方式。本文记录了从零开始搭建现代化个人博客的完整流程。

## 技术架构

### 前端技术栈
- **Vite**：新一代前端构建工具，开发体验极佳
- **React 19**：最新版本的 React，支持并发特性
- **TypeScript**：类型安全，提升代码质量
- **Tailwind CSS v4**：原子化 CSS，快速开发
- **shadcn/ui**：精美的 React 组件库
- **Wouter**：轻量级路由方案

### 部署方案
- **GitHub**：代码托管与版本控制
- **Vercel**：静态站点托管，自动部署

## 实现流程

### 第一步：项目生成

使用 Manus 生成项目骨架，获得：
- 完整的 React + TypeScript 配置
- Tailwind CSS 和 shadcn/ui 组件库集成
- Express 生产服务器
- Manus Debug 插件（开发调试工具）

### 第二步：功能定制

使用 Claude Code 进行功能调整：

**搜索优化**：
```typescript
// 空查询时返回所有文章
export function searchArticles(articles: Article[], query: string): Article[] {
  if (!query.trim()) {
    return articles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  // ... 搜索逻辑
}
```

**Vercel 配置**：
```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": "dist/public",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### 第三步：部署上线

**Git 版本管理**：
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin git@github.com:yangwei2future/yangwei.git
git push -u origin main
```

**Vercel 自动部署**：
1. 连接 GitHub 仓库
2. 自动识别 Vite 项目
3. 每次 push 自动触发构建部署
4. 获得免费域名：`yangwei.vercel.app`

## 项目结构

```
client/          # React 前端
  src/
    pages/       # 页面组件（Home, Articles, Search 等）
    components/  # UI 组件（shadcn/ui）
    lib/         # 业务逻辑（articles.ts, search.ts）
server/          # Express 生产服务器
posts/           # Markdown 文章目录（未来扩展）
shared/          # 共享常量
```

## 关键设计决策

### 为什么选择静态部署？

**优势**：
- 零成本（Vercel 免费）
- CDN 加速，访问速度快
- 自动部署，无需运维
- 安全性高（无后端服务器）

**劣势**：
- 无动态数据（文章管理）
- 需要通过 Git 更新内容

### 为什么不使用 CMS？

**CMS（内容管理系统）** 如 WordPress、Notion 等：
- 编辑体验好
- 可视化管理
- 但需要额外成本或限制

**Git + Markdown 方案**：
- 技术人友好（熟悉的工具）
- 版本控制（历史可追溯）
- 完全免费
- 手机也能编辑（GitHub App）

## 成本分析

| 项目 | 成本 |
|------|------|
| GitHub 托管 | 免费 |
| Vercel 部署 | 免费 |
| 唯一花费 | 域名（可选，50-100元/年） |

**总成本**：0-100元/年

## 未来扩展计划

### 短期目标
- [ ] Markdown 文件管理（posts/ 目录）
- [ ] 图片/视频链接自动识别
- [ ] 代码块语法高亮
- [ ] 文章目录自动生成

### 长期目标
- [ ] 评论系统
- [ ] 访问统计（Google Analytics）
- [ ] RSS 订阅
- [ ] 文章分类与标签管理

## 写作流程

**添加新文章**：
```bash
# 1. 创建 Markdown 文件
vim posts/my-new-article.md

# 2. 推送到 GitHub
git add posts/my-new-article.md
git commit -m "Add: 我的文章标题"
git push

# 3. Vercel 自动部署（1-2 分钟）
```

## 技术亮点

### 1. 现代化技术栈
- React 19（最新特性）
- Vite（极速构建）
- TypeScript（类型安全）

### 2. 工具链优化
- pnpm（快速包管理）
- Tailwind CSS v4（最新版）
- Manus Debug（开发调试）

### 3. 自动化部署
- GitHub → Vercel 自动化流程
- 无需手动操作
- 每次推送立即生效

## 总结

这个项目展示了如何用现代化的技术栈和工具，零成本搭建一个高质量的个人博客。

**核心价值**：
- 技术栈先进（React 19 + Vite + TypeScript）
- 完全免费（除域名可选）
- 自动化部署（Git push 即更新）
- 易于扩展（清晰的项目结构）

**适用场景**：
- 个人技术博客
- 作品展示网站
- 项目文档站点
- 简历/个人主页

希望这个实践能给想搭建个人博客的朋友一些参考。有问题欢迎留言讨论！

---

**相关链接**：
- [GitHub 仓库](https://github.com/yangwei2future/yangwei)
- [博客地址](https://yangwei.vercel.app)
- [Vercel 官网](https://vercel.com)