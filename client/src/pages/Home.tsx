import { Link } from "wouter";
import Navigation from "@/components/Navigation";
import ArticleCard from "@/components/ArticleCard";
import { getAllArticles } from "@/lib/articles";
import { Mail, Github, Linkedin } from "lucide-react";

/**
 * Home Page
 * 
 * Design: Modern Minimalism
 * - Clean hero section with personal introduction
 * - Recent articles showcase
 * - Call-to-action for contact
 */

export default function Home() {
  const articles = getAllArticles().slice(0, 6);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="py-20 border-b border-border">
        <div className="container max-w-2xl">
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                欢迎来到我的博客
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                分享关于前端开发、技术思考和职业成长的文章。
              </p>
            </div>

            {/* Social Links */}
            <div className="flex gap-4 pt-4">
              <a
                href="mailto:your-email@example.com"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                <Mail size={18} />
                邮箱
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                <Github size={18} />
                GitHub
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                <Linkedin size={18} />
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Articles Section */}
      <section className="py-20">
        <div className="container">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-foreground">最新文章</h2>
            <p className="mt-2 text-muted-foreground">
              探索我最近发布的技术文章和思考
            </p>
          </div>

          {/* Articles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {articles.map((article) => (
              <ArticleCard
                key={article.id}
                id={article.id}
                title={article.title}
                excerpt={article.excerpt}
                date={article.date}
                tags={article.tags}
              />
            ))}
          </div>

          {/* View All Articles Link */}
          <div className="text-center">
            <Link href="/articles" className="inline-block px-6 py-3 text-sm font-medium text-primary hover:text-primary/80 transition-colors border border-primary rounded-sm hover:bg-primary/5">
              查看所有文章 →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 个人博客. 保留所有权利。
          </p>
        </div>
      </footer>
    </div>
  );
}
