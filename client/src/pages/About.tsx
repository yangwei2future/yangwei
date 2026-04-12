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
    "React",
    "TypeScript",
    "JavaScript",
    "Tailwind CSS",
    "Node.js",
    "Web Performance",
    "UI/UX Design",
    "Git",
  ];

  const experience = [
    {
      role: "前端工程师",
      company: "示例公司",
      period: "2023 - 至今",
      description: "负责前端架构设计和性能优化",
    },
    {
      role: "初级前端开发",
      company: "示例公司",
      period: "2022 - 2023",
      description: "参与多个项目的前端开发",
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
            一个热爱前端开发的工程师，致力于创建高性能、用户友好的 Web 应用。
          </p>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-12 border-b border-border">
        <div className="container max-w-2xl">
          <h2 className="text-2xl font-bold text-foreground mb-6">个人简介</h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              我是一名前端工程师，拥有多年的 Web 开发经验。我对现代 JavaScript 框架、性能优化和用户体验设计充满热情。
            </p>
            <p>
              在我的职业生涯中，我参与了多个大型项目的开发，积累了丰富的实战经验。我相信代码质量和用户体验同样重要，致力于编写清晰、可维护的代码。
            </p>
            <p>
              除了工作，我还积极参与开源社区，分享技术知识和最佳实践。这个博客是我记录学习过程和分享思考的地方。
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

      {/* Contact */}
      <section className="py-12 border-b border-border">
        <div className="container max-w-2xl">
          <h2 className="text-2xl font-bold text-foreground mb-6">联系方式</h2>
          <p className="text-muted-foreground mb-6">
            如果您有任何问题或合作机会，欢迎通过以下方式与我联系。
          </p>
          <div className="space-y-3">
            <a
              href="mailto:your-email@example.com"
              className="flex items-center gap-3 p-4 rounded-sm border border-border hover:border-primary hover:shadow-md transition-all group"
            >
              <Mail size={20} className="text-primary" />
              <div>
                <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                  邮箱
                </p>
                <p className="text-sm text-muted-foreground">
                  your-email@example.com
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
                  github.com/your-username
                </p>
              </div>
              <ExternalLink size={16} className="text-muted-foreground" />
            </a>

            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-sm border border-border hover:border-primary hover:shadow-md transition-all group"
            >
              <Linkedin size={20} className="text-primary" />
              <div className="flex-1">
                <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                  LinkedIn
                </p>
                <p className="text-sm text-muted-foreground">
                  linkedin.com/in/your-profile
                </p>
              </div>
              <ExternalLink size={16} className="text-muted-foreground" />
            </a>
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
