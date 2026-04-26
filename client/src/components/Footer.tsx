import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="border-t border-border mt-8">
      <div className="container max-w-5xl flex items-center justify-between h-12 gap-4">
        <p className="text-xs text-muted-foreground/60">© 2026 个人博客</p>
        <nav className="flex items-center gap-4">
          <Link href="/" className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors">首页</Link>
          <Link href="/articles" className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors">文章</Link>
          <Link href="/about" className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors">关于</Link>
        </nav>
      </div>
    </footer>
  );
}
