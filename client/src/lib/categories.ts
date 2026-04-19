export interface Category {
  id: string;
  label: string;
  icon: string;
  badgeClass: string;
}

export const CATEGORIES: Category[] = [
  { id: "ai",           label: "AI",   icon: "🤖", badgeClass: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
  { id: "backend",      label: "后端",  icon: "⚙️", badgeClass: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  { id: "frontend",     label: "前端",  icon: "🎨", badgeClass: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300" },
  { id: "tools",        label: "工具",  icon: "🛠️", badgeClass: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
  { id: "architecture", label: "架构",  icon: "📐", badgeClass: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300" },
  { id: "essay",        label: "随笔",  icon: "📝", badgeClass: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
];

export function getCategoryById(id?: string): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}
