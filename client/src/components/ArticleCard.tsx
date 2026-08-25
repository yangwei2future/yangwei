import { ArrowUpRight, CalendarDays } from "lucide-react";
import { Link } from "wouter";
import { useCategories } from "@/contexts/CategoriesContext";

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
  categories,
}: ArticleCardProps) {
  const { getCategoryById } = useCategories();
  const cats = (categories ?? []).map(getCategoryById).filter(Boolean);
  const displayDate = new Date(createdAt ?? date);

  return (
    <Link href={`/article/${id}`} className="article-card group">
      <article>
        <div className="article-card-meta">
          <span><CalendarDays size={14} />{displayDate.toLocaleDateString("zh-CN", { year: "numeric", month: "short", day: "numeric" })}</span>
          <div className="article-card-categories">
            {cats.slice(0, 2).map((cat) => cat && <span key={cat.id}>{cat.label}</span>)}
          </div>
        </div>
        <h2>{title}</h2>
        <p>{excerpt || "一篇关于工程实践、工具与思考的技术笔记。"}</p>
        <span className="article-card-link">阅读全文 <ArrowUpRight size={15} /></span>
      </article>
    </Link>
  );
}
