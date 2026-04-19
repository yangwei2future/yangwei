import { Link } from "wouter";
import { getCategoryById } from "@/lib/categories";

/**
 * ArticleCard Component
 * 
 * Design: Modern Minimalism
 * - Subtle shadow and hover effects
 * - Clean typography with clear hierarchy
 * - Responsive grid layout
 */

interface ArticleCardProps {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  createdAt?: string;
  updatedAt?: string;
  categories?: string[];
  tags?: string[];
}

export default function ArticleCard({
  id,
  title,
  excerpt,
  date,
  createdAt,
  updatedAt,
  categories,
  tags = [],
}: ArticleCardProps) {
  const displayDate = updatedAt ?? createdAt ?? date;
  const cats = (categories ?? []).map(getCategoryById).filter(Boolean) as import("@/lib/categories").Category[];
  return (
    <Link href={`/article/${id}`} className="block group">
      <article className="p-6 bg-card rounded-lg border border-border hover:border-[oklch(0.78_0.003_286)] transition-colors duration-150">
        {/* Date */}
        <time className="text-sm text-muted-foreground">
          {new Date(displayDate).toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </time>

        {/* Title */}
        <h3 className="mt-2 text-xl font-bold text-foreground group-hover:text-primary transition-colors">
          {title}
        </h3>

        {/* Categories */}
        {cats.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {cats.map((cat) => (
              <span key={cat.id} className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${cat.badgeClass}`}>
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </span>
            ))}
          </div>
        )}

        {/* Excerpt */}
        <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
          {excerpt}
        </p>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-block px-2 py-1 text-xs bg-accent text-accent-foreground rounded-lg"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </article>
    </Link>
  );
}
