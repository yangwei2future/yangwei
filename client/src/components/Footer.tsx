import { Github, Mail } from "lucide-react";
import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div>
          <p className="footer-name">杨卫 · Engineering Notes</p>
          <p className="footer-note">记录工程实践，也记录持续好奇。</p>
        </div>
        <div className="footer-links">
          <Link href="/admin">管理</Link>
          <a href="mailto:ywei_20@126.com" aria-label="发送邮件"><Mail size={16} /></a>
          <a href="https://github.com/yangwei2future" target="_blank" rel="noreferrer" aria-label="GitHub"><Github size={16} /></a>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
}
