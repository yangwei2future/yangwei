export interface Category {
  id: string;
  label: string;
  icon: string;
  color: string;
}

export const COLOR_OPTIONS = [
  { id: "purple", label: "紫色", badgeClass: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300", swatch: "bg-purple-400" },
  { id: "blue",   label: "蓝色", badgeClass: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",     swatch: "bg-blue-400" },
  { id: "pink",   label: "粉色", badgeClass: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",     swatch: "bg-pink-400" },
  { id: "orange", label: "橙色", badgeClass: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300", swatch: "bg-orange-400" },
  { id: "cyan",   label: "青色", badgeClass: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",     swatch: "bg-cyan-400" },
  { id: "green",  label: "绿色", badgeClass: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300", swatch: "bg-green-400" },
  { id: "red",    label: "红色", badgeClass: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",         swatch: "bg-red-400" },
  { id: "yellow", label: "黄色", badgeClass: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300", swatch: "bg-yellow-400" },
  { id: "indigo", label: "靛色", badgeClass: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300", swatch: "bg-indigo-400" },
  { id: "gray",   label: "灰色", badgeClass: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",        swatch: "bg-gray-400" },
];

export function getBadgeClass(color: string): string {
  return COLOR_OPTIONS.find((c) => c.id === color)?.badgeClass ?? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
}
