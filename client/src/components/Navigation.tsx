import { Link } from "wouter";
import SearchBar from "./SearchBar";

/**
 * Navigation Component
 *
 * Design: Modern Minimalism
 * - Minimal header with clean typography
 * - Simple navigation links with subtle hover effects
 * - Integrated search functionality
 * - Responsive design for mobile and desktop
 */
export default function Navigation() {
  return (
    <nav className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="container flex items-center justify-between h-16 gap-4">
        {/* Logo/Brand */}
        <Link href="/" className="text-2xl font-bold text-foreground hover:text-primary transition-colors flex-shrink-0">
          个人博客
        </Link>

        {/* Search Bar */}
        <SearchBar />

        {/* Navigation Links */}
        <div className="flex items-center gap-8 flex-shrink-0">
          <Link href="/" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            首页
          </Link>
          <Link href="/articles" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            文章
          </Link>
          <Link href="/about" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            关于
          </Link>
          <Link href="/admin" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            管理
          </Link>
        </div>
      </div>
    </nav>
  );
}
