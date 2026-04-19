import { createContext, useContext, useEffect, useState } from "react";
import type { Category } from "@/lib/categories";

const CACHE_KEY = "blog_categories_cache";
const CACHE_DURATION = 30 * 60 * 1000;

interface CategoriesContextValue {
  categories: Category[];
  reload: () => Promise<void>;
  addCategory: (cat: Category) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Omit<Category, "id">>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  getCategoryById: (id: string) => Category | undefined;
}

const CategoriesContext = createContext<CategoriesContextValue>({
  categories: [],
  reload: async () => {},
  addCategory: async () => {},
  updateCategory: async () => {},
  deleteCategory: async () => {},
  getCategoryById: () => undefined,
});

export function CategoriesProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => { loadCategories(); }, []);

  async function loadCategories() {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          setCategories(data);
          return;
        }
      }
    } catch {}
    try {
      const data: Category[] = await fetch("/api/categories").then((r) => r.json());
      setCategories(data);
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
    } catch (e) {
      console.error("Failed to load categories", e);
    }
  }

  function clearCache() {
    try { localStorage.removeItem(CACHE_KEY); } catch {}
  }

  async function addCategory(cat: Category) {
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cat),
    });
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error || "添加失败");
    }
    clearCache();
    await loadCategories();
  }

  async function updateCategory(id: string, updates: Partial<Omit<Category, "id">>) {
    await fetch("/api/categories", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    });
    clearCache();
    await loadCategories();
  }

  async function deleteCategory(id: string) {
    await fetch("/api/categories", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    clearCache();
    await loadCategories();
  }

  function getCategoryById(id: string) {
    return categories.find((c) => c.id === id);
  }

  return (
    <CategoriesContext.Provider value={{ categories, reload: loadCategories, addCategory, updateCategory, deleteCategory, getCategoryById }}>
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories() {
  return useContext(CategoriesContext);
}
