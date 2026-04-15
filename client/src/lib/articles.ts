import { Article } from "./types";

export type { Article };

/**
 * Sample Articles Data
 * 
 * In a real application, this would come from a database or CMS.
 * For now, we're using static data for demonstration.
 */

export const articles: Article[] = [
  {
    id: "react-hooks-guide",
    title: "深入理解 React Hooks",
    excerpt: "探索 React Hooks 的核心概念，从 useState 和 useEffect 开始，到自定义 Hooks 的最佳实践。",
    content: `# 深入理解 React Hooks

React Hooks 是 React 16.8 引入的新特性，它让你在不编写类组件的情况下使用 state 和其他 React 特性。

## 为什么需要 Hooks？

在 Hooks 出现之前，React 开发者需要在类组件中管理状态和生命周期。这导致了以下问题：

1. **逻辑复用困难**：高阶组件和 render props 会导致组件树过深
2. **生命周期分散**：相关逻辑分散在不同的生命周期方法中
3. **this 绑定问题**：需要手动绑定或使用箭头函数

## 常用 Hooks

### useState

\`\`\`jsx
const [count, setCount] = useState(0);
\`\`\`

### useEffect

\`\`\`jsx
useEffect(() => {
  // 副作用逻辑
  return () => {
    // 清理逻辑
  };
}, [dependencies]);
\`\`\`

## 最佳实践

1. 只在顶层调用 Hooks
2. 只在 React 函数中调用 Hooks
3. 使用 ESLint 插件检查 Hooks 规则
4. 合理使用依赖数组`,
    date: "2024-03-15",
    tags: ["React", "JavaScript", "前端"],
    author: "杨卫",
    createdAt: new Date().toISOString(),
  },
  {
    id: "typescript-best-practices",
    title: "TypeScript 最佳实践",
    excerpt: "学习如何在项目中有效使用 TypeScript，提高代码质量和开发效率。",
    content: `# TypeScript 最佳实践

TypeScript 是 JavaScript 的超集，添加了静态类型检查。它可以帮助我们在开发阶段发现错误，提高代码质量。

## 类型定义

### 基础类型

\`\`\`typescript
const name: string = "Alice";
const age: number = 25;
const active: boolean = true;
\`\`\`

### 接口定义

\`\`\`typescript
interface User {
  id: number;
  name: string;
  email: string;
}
\`\`\`

## 泛型

泛型允许我们编写可重用的代码，同时保持类型安全。

\`\`\`typescript
function identity<T>(arg: T): T {
  return arg;
}
\`\`\`

## 避免常见错误

1. 不要过度使用 \`any\` 类型
2. 使用 \`unknown\` 代替 \`any\`
3. 启用严格模式 (\`strict: true\`)
4. 使用类型守卫进行类型检查`,
    date: "2024-03-10",
    tags: ["TypeScript", "JavaScript", "最佳实践"],
    author: "杨卫",
    createdAt: new Date().toISOString(),
  },
  {
    id: "web-performance-optimization",
    title: "Web 性能优化指南",
    excerpt: "从加载时间、运行时性能和用户体验三个方面优化你的 Web 应用。",
    content: `# Web 性能优化指南

Web 性能对用户体验至关重要。一个快速的网站能够提高用户满意度和转化率。

## 加载时间优化

### 代码分割

\`\`\`javascript
// 使用动态导入
const Component = React.lazy(() => import('./Component'));
\`\`\`

### 资源优化

- 压缩图片
- 使用 WebP 格式
- 启用 Gzip 压缩
- 使用 CDN

## 运行时性能

### 避免布局抖动

\`\`\`javascript
// 不好的做法
for (let i = 0; i < 100; i++) {
  element.style.width = element.offsetWidth + 1 + 'px';
}

// 好的做法
const width = element.offsetWidth;
for (let i = 0; i < 100; i++) {
  element.style.width = width + 1 + 'px';
}
\`\`\`

## 监测性能

使用 Performance API 和 Web Vitals 监测应用性能。`,
    date: "2024-03-05",
    tags: ["性能优化", "Web", "前端"],
    author: "杨卫",
    createdAt: new Date().toISOString(),
  },
];

export function getArticleById(id: string): Article | undefined {
  return articles.find((article) => article.id === id);
}

export function getAllArticles(): Article[] {
  return articles.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function getArticlesByTag(tag: string): Article[] {
  return articles.filter((article) => article.tags.includes(tag));
}
