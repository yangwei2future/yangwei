import { Link } from "wouter";
import { Sun, Moon } from "lucide-react";
import SearchBar from "./SearchBar";
import { useTheme } from "@/contexts/ThemeContext";

export default function Navigation() {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="container flex items-center justify-between h-16 gap-4">
        {/* Logo/Brand */}
        <Link href="/" className="text-2xl font-bold text-foreground hover:text-primary transition-colors flex-shrink-0">
          个人博客
        </Link>

        {/* Search Bar */}
        <SearchBar />

        {/* Navigation Links + Theme Toggle */}
        <div className="flex items-center gap-6 flex-shrink-0">
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

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "切换亮色模式" : "切换暗色模式"}
            className="relative flex items-center w-14 h-7 rounded-full bg-accent border border-border transition-colors duration-300 hover:border-muted-foreground/40 focus:outline-none"
          >
            {/* Track fill */}
            <span
              className={`absolute inset-0 rounded-full transition-colors duration-300 ${
                theme === "dark" ? "bg-slate-700" : "bg-amber-50"
              }`}
            />
            {/* Icons */}
            <Sun
              size={11}
              className={`absolute left-2 transition-opacity duration-200 text-amber-500 ${
                theme === "dark" ? "opacity-30" : "opacity-100"
              }`}
            />
            <Moon
              size={11}
              className={`absolute right-2 transition-opacity duration-200 text-slate-400 ${
                theme === "dark" ? "opacity-100" : "opacity-30"
              }`}
            />
            {/* Thumb */}
            <span
              className={`relative z-10 flex items-center justify-center w-5 h-5 rounded-full shadow-sm transition-all duration-300 ${
                theme === "dark"
                  ? "translate-x-8 bg-slate-900 border border-slate-600"
                  : "translate-x-1 bg-white border border-amber-200"
              }`}
            >
              {theme === "dark" ? (
                <Moon size={9} className="text-slate-300" />
              ) : (
                <Sun size={9} className="text-amber-500" />
              )}
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
}
