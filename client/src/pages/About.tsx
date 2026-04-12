import Navigation from "@/components/Navigation";
import { Mail, Github, Linkedin, ExternalLink } from "lucide-react";

/**
 * About Page
 * 
 * Design: Modern Minimalism
 * - Personal introduction and background
 * - Skills showcase
 * - Contact information
 */

export default function About() {
  const skills = [
    "Java",
    "大数据平台开发",
    "Mysql",
    "OceanBase",
    "MatrixDB",
    "PostgreSQL",
    "Agentic RAG",
    "MCP",
    "NL2SQL",
  ];

  const experience = [
    {
      role: "大数据开发工程师",
      company: "理想汽车",
      period: "2023年06月 - 至今",
      description:
        "负责汽车行业数智平台后端开发，主导数据服务平台、指标中心从0到1建设，覆盖数据服务、数据消费、数据指标等多个业务方向",
    },
  ];

  const projects = [
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
      metrics: [
        "平台应用数：100+",
        "API日均调用量：百万级",
        "API接入至发布：5s内完成",
      ],
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
      metrics: [
        "OpenAPI接口数：20+核心接口",
        "知识库规模：指标总数757个、维度总数931个",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Header */}
      <section className="py-16 border-b border-border">
        <div className="container max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            关于我
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            大数据开发工程师 | 理想汽车 | 探索AI大模型落地应用
          </p>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-12 border-b border-border">
        <div className="container max-w-2xl">
          <h2 className="text-2xl font-bold text-foreground mb-6">个人简介</h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              我是一名大数据开发工程师，目前就职于理想汽车企业智能-大数据平台团队。专注于数据服务平台建设、指标知识库开发，以及AI大模型在业务场景的落地应用。
            </p>
            <p>
              拥有从0到1建设多个核心系统的实战经验，包括数据服务平台、指标中心、达芬奇BI等。积极探索前沿技术，致力于通过技术创新为业务创造价值。
            </p>
            <p>
              工作之余，我是<strong>Vibe Coding倡导者</strong>，热爱踢球，坚持技术分享与学习。这个博客是我记录技术成长和分享思考的地方。
            </p>
          </div>
        </div>
      </section>

      {/* Skills */}
      <section className="py-12 border-b border-border">
        <div className="container max-w-2xl">
          <h2 className="text-2xl font-bold text-foreground mb-6">技能</h2>
          <div className="flex flex-wrap gap-3">
            {skills.map((skill) => (
              <span
                key={skill}
                className="px-4 py-2 bg-accent text-accent-foreground rounded-sm text-sm font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Experience */}
      <section className="py-12 border-b border-border">
        <div className="container max-w-2xl">
          <h2 className="text-2xl font-bold text-foreground mb-6">工作经历</h2>
          <div className="space-y-8">
            {experience.map((item, index) => (
              <div key={index}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {item.role}
                    </h3>
                    <p className="text-sm text-primary">{item.company}</p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {item.period}
                  </span>
                </div>
                <p className="mt-2 text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Projects */}
      <section className="py-12 border-b border-border">
        <div className="container max-w-2xl">
          <h2 className="text-2xl font-bold text-foreground mb-6">项目经历</h2>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-border" />

            <div className="space-y-12">
              {projects.map((project, index) => (
                <div key={index} className="relative pl-8">
                  {/* Timeline dot */}
                  <div className="absolute left-0 top-2 w-3.5 h-3.5 rounded-full bg-primary border-2 border-background" />

                  <div className="mb-2">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="text-lg font-semibold text-foreground">
                        {project.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-primary font-medium">
                        {project.role}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">
                        {project.period}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2 mb-3">
                    {project.highlights.map((highlight, i) => (
                      <p key={i} className="text-sm text-muted-foreground">
                        • {highlight}
                      </p>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {project.metrics.map((metric, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-accent/50 text-accent-foreground rounded-sm text-xs font-medium"
                      >
                        {metric}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-12 border-b border-border">
        <div className="container max-w-2xl">
          <h2 className="text-2xl font-bold text-foreground mb-6">联系方式</h2>
          <p className="text-muted-foreground mb-6">
            如果您有任何问题或合作机会，欢迎通过以下方式与我联系。
          </p>
          <div className="space-y-3">
            <a
              href="mailto:ywei_20@126.com"
              className="flex items-center gap-3 p-4 rounded-sm border border-border hover:border-primary hover:shadow-md transition-all group"
            >
              <Mail size={20} className="text-primary" />
              <div>
                <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                  邮箱
                </p>
                <p className="text-sm text-muted-foreground">
                  ywei_20@126.com
                </p>
              </div>
            </a>

            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-sm border border-border hover:border-primary hover:shadow-md transition-all group"
            >
              <Github size={20} className="text-primary" />
              <div className="flex-1">
                <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                  GitHub
                </p>
                <p className="text-sm text-muted-foreground">
                  查看我的开源项目
                </p>
              </div>
              <ExternalLink size={16} className="text-muted-foreground" />
            </a>

            <div className="flex items-center gap-3 p-4 rounded-sm border border-border">
              <Mail size={20} className="text-primary" />
              <div>
                <p className="font-medium text-foreground">微信</p>
                <p className="text-sm text-muted-foreground">yangw_0122</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-sm border border-border">
              <Mail size={20} className="text-primary" />
              <div>
                <p className="font-medium text-foreground">电话</p>
                <p className="text-sm text-muted-foreground">17695965214</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container text-center">
          <p className="text-sm text-muted-foreground">
            © 2026 个人博客. 保留所有权利。
          </p>
        </div>
      </footer>
    </div>
  );
}
