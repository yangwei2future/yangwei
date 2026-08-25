import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, Moon, Search, Sun, X } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

const links = [
  { href: "/", label: "首页" },
  { href: "/articles", label: "文章" },
  { href: "/about", label: "关于" },
] as const;

export default function Navigation() {
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? location === "/" : location.startsWith(href);

  return (
    <header className="site-header">
      <div className="container nav-shell">
        <Link href="/" className="brand-mark" aria-label="杨卫的个人博客首页">
          <span className="brand-monogram">Y</span>
          <span className="brand-copy">
            <strong>杨卫</strong>
            <small>ENGINEERING NOTES</small>
          </span>
        </Link>

        <nav className="nav-links" aria-label="主导航">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={isActive(link.href) ? "active" : ""}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="nav-actions">
          <Link href="/search" className="icon-button" aria-label="搜索文章">
            <Search size={18} />
          </Link>
          <button className="icon-button" onClick={toggleTheme} aria-label="切换明暗主题">
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            className="icon-button mobile-menu-button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label="打开导航菜单"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav id="mobile-nav" className="mobile-nav container" aria-label="移动端导航">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={isActive(link.href) ? "active" : ""}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/admin" onClick={() => setMenuOpen(false)}>管理后台</Link>
        </nav>
      )}
    </header>
  );
}
