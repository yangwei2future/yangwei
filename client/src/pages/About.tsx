import { useState, useEffect } from "react";
import type React from "react";
import Navigation from "@/components/Navigation";
import { Mail, Github, ExternalLink, Pencil, Check, X, Plus, Trash2, Phone, MessageCircle, Copy } from "lucide-react";
import { isAuthenticated } from "@/lib/article-links";

interface AboutConfig {
  subtitle: string;
  intro: string[];
  skills: string[];
  experience: Array<{ role: string; company: string; period: string; description: string }>;
  projects: Array<{ name: string; role: string; period: string; highlights: string[]; metrics: string[] }>;
  contact: { email: string; github: string; wechat: string; phone: string };
}

const CACHE_KEY = "blog_about_cache";
const CACHE_TTL = 30 * 60 * 1000;

const DEFAULT: AboutConfig = {
  subtitle: "大数据开发工程师 | 理想汽车 | 探索AI大模型落地应用",
  intro: [
    "我是一名大数据开发工程师，目前就职于理想汽车企业智能-大数据平台团队。专注于数据服务平台建设、指标知识库开发，以及AI大模型在业务场景的落地应用。",
    "拥有从0到1建设多个核心系统的实战经验，包括数据服务平台、指标中心、达芬奇BI等。积极探索前沿技术，致力于通过技术创新为业务创造价值。",
    "工作之余，我是**Vibe Coding倡导者**，热爱踢球，坚持技术分享与学习。这个博客是我记录技术成长和分享思考的地方。",
  ],
  skills: ["Java", "大数据平台开发", "Mysql", "OceanBase", "MatrixDB", "PostgreSQL", "Agentic RAG", "MCP", "NL2SQL"],
  experience: [
    {
      role: "大数据开发工程师",
      company: "理想汽车",
      period: "2023年06月 - 至今",
      description: "负责汽车行业数智平台后端开发，主导数据服务平台、指标中心从0到1建设，覆盖数据服务、数据消费、数据指标等多个业务方向",
    },
  ],
  projects: [
    {
      name: "数据服务平台（共享平台+开放平台）",
      role: "管理端owner",
      period: "2025年03月 - 至今",
      highlights: [
        "完成开放平台从0到1建设（6期迭代）",
        "构建文档中心门户、管理控制台、运营分析大盘",
        "支持Mysql、OceanBase、MatrixDB、PostgreSQL等6种主流数据库",
        "实现自然语言转SQL能力（Agentic RAG + MCP）",
      ],
      metrics: ["平台应用数：100+", "API日均调用量：百万级", "API接入至发布：5s内完成"],
    },
    {
      name: "指标知识库项目",
      role: "项目owner",
      period: "2024年07月 - 2025年03月",
      highlights: [
        "建设管理端5大核心模块（指标、维度、Schema知识资产管理）",
        "建设OpenAPI服务模块（指标定位、智能推荐、知识检索、数据合成）",
        "建设Job服务模块（数据同步、数据告警）",
      ],
      metrics: ["OpenAPI接口数：20+核心接口", "知识库规模：指标总数757个、维度总数931个"],
    },
  ],
  contact: { email: "ywei_20@126.com", github: "https://github.com", wechat: "yangw_0122", phone: "17695965214" },
};

// ── tiny helpers ──────────────────────────────────────────────────────────────

function EditBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="ml-2 p-1 rounded-md text-muted-foreground/50 hover:text-muted-foreground hover:bg-accent transition-all opacity-0 group-hover:opacity-100"
    >
      <Pencil size={13} />
    </button>
  );
}

function SaveRow({ onSave, onCancel, saving }: { onSave: () => void; onCancel: () => void; saving: boolean }) {
  return (
    <div className="flex items-center group gap-2 mt-3">
      <button
        onClick={onSave}
        disabled={saving}
        className="inline-flex items-center group gap-1.5 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-full hover:opacity-90 disabled:opacity-50"
      >
        <Check size={11} />{saving ? "保存中…" : "保存"}
      </button>
      <button onClick={onCancel} className="text-xs text-muted-foreground hover:text-foreground">
        <X size={11} className="inline mr-0.5" />取消
      </button>
    </div>
  );
}

// ── contact cards ──────────────────────────────────────────────────────────────

function CopyableCard({
  icon, iconBg, label, value, hint,
}: { icon: React.ReactNode; iconBg: string; label: string; value: string; hint?: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }
  return (
    <button
      onClick={handleCopy}
      className="group relative flex flex-col items-start gap-3 p-5 rounded-2xl border border-border bg-card hover:border-muted-foreground/30 hover:shadow-sm transition-all duration-200 text-left w-full"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="text-sm font-medium text-foreground">{hint ?? value}</p>
      </div>
      <span className={`absolute top-3 right-3 flex items-center gap-1 text-xs transition-opacity duration-150 ${copied ? "opacity-100 text-primary" : "opacity-0 group-hover:opacity-60 text-muted-foreground"}`}>
        {copied ? <Check size={11} /> : <Copy size={11} />}
        {copied ? "已复制" : "复制"}
      </span>
    </button>
  );
}

function ContactCards({ contact }: { contact: AboutConfig["contact"] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Email */}
      <a
        href={`mailto:${contact.email}`}
        className="group flex flex-col items-start gap-3 p-5 rounded-2xl border border-border bg-card hover:border-muted-foreground/30 hover:shadow-sm transition-all duration-200"
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/10">
          <Mail size={18} className="text-blue-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground mb-0.5">邮箱</p>
          <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{contact.email}</p>
        </div>
        <ExternalLink size={13} className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors self-end" />
      </a>

      {/* GitHub */}
      <a
        href={contact.github}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex flex-col items-start gap-3 p-5 rounded-2xl border border-border bg-card hover:border-muted-foreground/30 hover:shadow-sm transition-all duration-200"
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-foreground/8 dark:bg-foreground/10">
          <Github size={18} className="text-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground mb-0.5">GitHub</p>
          <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">查看开源项目</p>
        </div>
        <ExternalLink size={13} className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors self-end" />
      </a>

      {/* WeChat */}
      <CopyableCard
        icon={<MessageCircle size={18} className="text-green-500" />}
        iconBg="bg-green-500/10"
        label="微信"
        value={contact.wechat}
      />

      {/* Phone */}
      <CopyableCard
        icon={<Phone size={18} className="text-violet-500" />}
        iconBg="bg-violet-500/10"
        label="电话"
        value={contact.phone}
      />
    </div>
  );
}

// ── main component ─────────────────────────────────────────────────────────────

export default function About() {
  const [data, setData] = useState<AboutConfig>(DEFAULT);
  const [isAdmin, setIsAdmin] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  // per-section draft state
  const [draftSubtitle, setDraftSubtitle] = useState("");
  const [draftIntro, setDraftIntro] = useState("");
  const [draftSkills, setDraftSkills] = useState("");
  const [draftExp, setDraftExp] = useState<AboutConfig["experience"]>([]);
  const [draftProjects, setDraftProjects] = useState<AboutConfig["projects"]>([]);
  const [draftContact, setDraftContact] = useState<AboutConfig["contact"]>(DEFAULT.contact);

  useEffect(() => {
    loadData();
  }, []);

  // Re-check auth whenever the page gains focus (e.g. after logging in at /admin)
  useEffect(() => {
    const check = () => setIsAdmin(isAuthenticated());
    check();
    window.addEventListener("focus", check);
    return () => window.removeEventListener("focus", check);
  }, []);

  async function loadData() {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { d, ts } = JSON.parse(cached);
        if (Date.now() - ts < CACHE_TTL) { setData(d); return; }
      }
    } catch {}
    try {
      const res = await fetch("/api/about");
      if (res.ok) {
        const remote = await res.json();
        if (remote) {
          const merged = { ...DEFAULT, ...remote };
          setData(merged);
          try { localStorage.setItem(CACHE_KEY, JSON.stringify({ d: merged, ts: Date.now() })); } catch {}
        }
      }
    } catch {}
  }

  async function persist(next: AboutConfig) {
    setSaving(true);
    try {
      await fetch("/api/about", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      setData(next);
      try { localStorage.setItem(CACHE_KEY, JSON.stringify({ d: next, ts: Date.now() })); } catch {}
      setEditing(null);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(section: string) {
    setEditing(section);
    if (section === "subtitle") setDraftSubtitle(data.subtitle);
    if (section === "intro") setDraftIntro(data.intro.join("\n\n"));
    if (section === "skills") setDraftSkills(data.skills.join("\n"));
    if (section === "experience") setDraftExp(JSON.parse(JSON.stringify(data.experience)));
    if (section === "projects") setDraftProjects(JSON.parse(JSON.stringify(data.projects)));
    if (section === "contact") setDraftContact({ ...data.contact });
  }

  function cancelEdit() { setEditing(null); }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Header */}
      <section className="py-16 border-b border-border">
        <div className="container max-w-2xl group">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">关于我</h1>

          {editing === "subtitle" ? (
            <div className="mt-4">
              <input
                className="w-full text-lg border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={draftSubtitle}
                onChange={(e) => setDraftSubtitle(e.target.value)}
              />
              <SaveRow
                saving={saving}
                onSave={() => persist({ ...data, subtitle: draftSubtitle.trim() || data.subtitle })}
                onCancel={cancelEdit}
              />
            </div>
          ) : (
            <p className="mt-4 text-lg text-muted-foreground inline-flex items-center group">
              {data.subtitle}
              {isAdmin && <EditBtn onClick={() => startEdit("subtitle")} />}
            </p>
          )}
        </div>
      </section>

      {/* Intro */}
      <section className="py-12 border-b border-border">
        <div className="container max-w-2xl">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center group">
            个人简介
            {isAdmin && editing !== "intro" && <EditBtn onClick={() => startEdit("intro")} />}
          </h2>

          {editing === "intro" ? (
            <div>
              <p className="text-xs text-muted-foreground mb-2">每段之间空一行</p>
              <textarea
                rows={10}
                className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
                value={draftIntro}
                onChange={(e) => setDraftIntro(e.target.value)}
              />
              <SaveRow
                saving={saving}
                onSave={() => persist({ ...data, intro: draftIntro.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean) })}
                onCancel={cancelEdit}
              />
            </div>
          ) : (
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              {data.intro.map((p, i) => (
                <p key={i} dangerouslySetInnerHTML={{ __html: p.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") }} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Skills */}
      <section className="py-12 border-b border-border">
        <div className="container max-w-2xl">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center group">
            技能
            {isAdmin && editing !== "skills" && <EditBtn onClick={() => startEdit("skills")} />}
          </h2>

          {editing === "skills" ? (
            <div>
              <p className="text-xs text-muted-foreground mb-2">每行一个技能</p>
              <textarea
                rows={8}
                className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
                value={draftSkills}
                onChange={(e) => setDraftSkills(e.target.value)}
              />
              <SaveRow
                saving={saving}
                onSave={() => persist({ ...data, skills: draftSkills.split("\n").map((s) => s.trim()).filter(Boolean) })}
                onCancel={cancelEdit}
              />
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {data.skills.map((skill) => (
                <span key={skill} className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium">
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Experience */}
      <section className="py-12 border-b border-border">
        <div className="container max-w-2xl">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center group">
            工作经历
            {isAdmin && editing !== "experience" && <EditBtn onClick={() => startEdit("experience")} />}
          </h2>

          {editing === "experience" ? (
            <div className="space-y-4">
              {draftExp.map((item, i) => (
                <div key={i} className="p-4 border border-border rounded-lg space-y-2 relative">
                  <button onClick={() => setDraftExp((prev) => prev.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 p-1 text-muted-foreground/50 hover:text-destructive">
                    <Trash2 size={13} />
                  </button>
                  {(["role", "company", "period"] as const).map((field) => (
                    <input
                      key={field}
                      placeholder={{ role: "职位", company: "公司", period: "时间段" }[field]}
                      className="w-full border border-border rounded px-2.5 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary/30"
                      value={item[field]}
                      onChange={(e) => setDraftExp((prev) => prev.map((it, idx) => idx === i ? { ...it, [field]: e.target.value } : it))}
                    />
                  ))}
                  <textarea
                    rows={3}
                    placeholder="描述"
                    className="w-full border border-border rounded px-2.5 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary/30 resize-y"
                    value={item.description}
                    onChange={(e) => setDraftExp((prev) => prev.map((it, idx) => idx === i ? { ...it, description: e.target.value } : it))}
                  />
                </div>
              ))}
              <button
                onClick={() => setDraftExp((prev) => [...prev, { role: "", company: "", period: "", description: "" }])}
                className="inline-flex items-center group gap-1.5 px-3 py-1.5 text-xs border border-dashed border-muted-foreground/40 rounded-full text-muted-foreground hover:bg-muted"
              >
                <Plus size={11} />新增经历
              </button>
              <SaveRow saving={saving} onSave={() => persist({ ...data, experience: draftExp })} onCancel={cancelEdit} />
            </div>
          ) : (
            <div className="space-y-8">
              {data.experience.map((item, i) => (
                <div key={i}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{item.role}</h3>
                      <p className="text-sm text-primary">{item.company}</p>
                    </div>
                    <span className="text-sm text-muted-foreground">{item.period}</span>
                  </div>
                  <p className="mt-2 text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Projects */}
      <section className="py-12 border-b border-border">
        <div className="container max-w-2xl">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center group">
            项目经历
            {isAdmin && editing !== "projects" && <EditBtn onClick={() => startEdit("projects")} />}
          </h2>

          {editing === "projects" ? (
            <div className="space-y-4">
              {draftProjects.map((proj, i) => (
                <div key={i} className="p-4 border border-border rounded-lg space-y-2 relative">
                  <button onClick={() => setDraftProjects((prev) => prev.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 p-1 text-muted-foreground/50 hover:text-destructive">
                    <Trash2 size={13} />
                  </button>
                  {(["name", "role", "period"] as const).map((field) => (
                    <input
                      key={field}
                      placeholder={{ name: "项目名称", role: "角色", period: "时间段" }[field]}
                      className="w-full border border-border rounded px-2.5 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary/30"
                      value={proj[field]}
                      onChange={(e) => setDraftProjects((prev) => prev.map((it, idx) => idx === i ? { ...it, [field]: e.target.value } : it))}
                    />
                  ))}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">亮点（每行一条）</p>
                    <textarea
                      rows={4}
                      className="w-full border border-border rounded px-2.5 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary/30 resize-y"
                      value={proj.highlights.join("\n")}
                      onChange={(e) => setDraftProjects((prev) => prev.map((it, idx) => idx === i ? { ...it, highlights: e.target.value.split("\n") } : it))}
                    />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">指标（每行一条）</p>
                    <textarea
                      rows={3}
                      className="w-full border border-border rounded px-2.5 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary/30 resize-y"
                      value={proj.metrics.join("\n")}
                      onChange={(e) => setDraftProjects((prev) => prev.map((it, idx) => idx === i ? { ...it, metrics: e.target.value.split("\n") } : it))}
                    />
                  </div>
                </div>
              ))}
              <button
                onClick={() => setDraftProjects((prev) => [...prev, { name: "", role: "", period: "", highlights: [""], metrics: [""] }])}
                className="inline-flex items-center group gap-1.5 px-3 py-1.5 text-xs border border-dashed border-muted-foreground/40 rounded-full text-muted-foreground hover:bg-muted"
              >
                <Plus size={11} />新增项目
              </button>
              <SaveRow saving={saving} onSave={() => persist({ ...data, projects: draftProjects })} onCancel={cancelEdit} />
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-border" />
              <div className="space-y-12">
                {data.projects.map((project, i) => (
                  <div key={i} className="relative pl-8">
                    <div className="absolute left-0 top-2 w-3.5 h-3.5 rounded-full bg-primary border-2 border-background" />
                    <div className="mb-2">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="text-lg font-semibold text-foreground">{project.name}</h3>
                      </div>
                      <div className="flex items-center group gap-2 mb-2">
                        <span className="text-sm text-primary font-medium">{project.role}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">{project.period}</span>
                      </div>
                    </div>
                    <div className="space-y-2 mb-3">
                      {project.highlights.filter(Boolean).map((h, j) => (
                        <p key={j} className="text-sm text-muted-foreground">• {h}</p>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {project.metrics.filter(Boolean).map((m, j) => (
                        <span key={j} className="px-3 py-1 bg-accent/50 text-accent-foreground rounded-lg text-xs font-medium">{m}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Contact */}
      <section className="py-12 border-b border-border">
        <div className="container max-w-2xl">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center group">
            联系方式
            {isAdmin && editing !== "contact" && <EditBtn onClick={() => startEdit("contact")} />}
          </h2>

          {editing === "contact" ? (
            <div className="space-y-3">
              {(["email", "github", "wechat", "phone"] as const).map((field) => (
                <div key={field} className="flex items-center gap-3">
                  <span className="w-14 text-xs text-muted-foreground shrink-0">{{ email: "邮箱", github: "GitHub", wechat: "微信", phone: "电话" }[field]}</span>
                  <input
                    className="flex-1 border border-border rounded px-2.5 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary/30"
                    value={draftContact[field]}
                    onChange={(e) => setDraftContact((prev) => ({ ...prev, [field]: e.target.value }))}
                  />
                </div>
              ))}
              <SaveRow saving={saving} onSave={() => persist({ ...data, contact: draftContact })} onCancel={cancelEdit} />
            </div>
          ) : (
            <ContactCards contact={data.contact} />
          )}
        </div>
      </section>

      <footer className="py-12 border-t border-border">
        <div className="container text-center">
          <p className="text-sm text-muted-foreground">© 2026 个人博客. 保留所有权利。</p>
        </div>
      </footer>
    </div>
  );
}
