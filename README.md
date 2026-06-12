# Resume Skills — Claude Code 插件

一套基于 HTML 的简历生成与 JD 匹配工具集，作为 Claude Code 插件使用。

## 技能概览

### 1. resume-builder — 简历构建器

通过对话式采访，帮用户构建精美的 A4 HTML 简历。

- 逐步引导用户填写：个人信息、教育背景、实习/工作经历、项目经验、技能标签、校园经历、自我评价
- 提供 5 种设计风格可选：现代简约、经典商务、创意个性、日式极简、科技感
- 输出独立的 HTML 文件（inline CSS/JS），A4 尺寸排版（210mm × 297mm）
- 内置「导出 PDF」按钮，通过浏览器打印即可保存为 PDF

### 2. jd-tailorer — JD 简历定制器

根据具体职位描述，对已有简历进行关键词匹配和内容定制。

- 支持粘贴 JD 文本或上传 JD 文件
- 自动解析 JD：提取核心要求、加分项、关键词、公司文化暗示
- 简历与 JD 匹配度分析（不编造经历，只优化呈现）
- 关键词对齐、板块重排序、术语统一
- 输出到 `tailored/<公司名>-<岗位>/` 子文件夹
- 附带匹配分析报告 `matching-analysis.md`

## 推荐工作流

```
resume-builder → 生成通用版简历 → jd-tailorer → 针对不同 JD 生成定制版本
```

## 安装

### 方式一：通过 GitHub 链接安装（推荐）

1. 打开 Claude Code，输入 `/plugin`
2. 在插件管理界面选择「安装插件」
3. 粘贴本仓库地址：
   ```
   https://github.com/Chasen-Liao/resume-skills
   ```
4. 确认安装，Claude Code 会自动拉取仓库并注册两个技能

> 此方式需要本地已安装 Git，且网络可访问 GitHub。

### 方式二：通过 .skill 文件安装

如果你只想安装其中一个技能，或离线环境使用：

1. 从 [Releases](https://github.com/Chasen-Liao/resume-skills) 页面下载 `resume-builder.skill` 或 `jd-tailorer.skill`
2. 打开 Claude Code，输入 `/plugin`
3. 在插件管理界面选择「安装插件」
4. 选择下载的 `.skill` 文件

### 方式三：本地克隆后安装

1. 先克隆仓库到本地：
   ```bash
   git clone https://github.com/Chasen-Liao/resume-skills.git
   ```
2. 打开 Claude Code，输入 `/plugin`
3. 选择「安装插件」→「从本地安装」
4. 指向克隆下来的 `resume-skills` 目录

### 安装后验证

安装成功后，在 Claude Code 中以自然语言输入即可触发技能：

- **测试 resume-builder**：输入「帮我做一份简历」，Claude 会自动加载简历构建器技能
- **测试 jd-tailorer**：输入「帮我针对这个 JD 改一下简历」，Claude 会自动加载 JD 定制器技能

如果技能没有自动触发，可以手动输入 `/skill:resume-builder` 或 `/skill:jd-tailorer` 来激活。

## 项目结构

```
resume-skills/
├── .claude-plugin/
│   └── plugin.json              # 插件元数据
├── skills/
│   ├── resume-builder/
│   │   ├── SKILL.md             # 简历构建器技能定义
│   │   └── references/
│   │       └── design-guidelines.md  # 设计美学指南
│   └── jd-tailorer/
│       └── SKILL.md             # JD 定制器技能定义
├── resume-builder.skill         # 独立安装包
├── jd-tailorer.skill            # 独立安装包
├── .gitignore
└── README.md
```

## 使用示例

### Skill 1: 构建简历

```
/用户: 帮我做一份简历
/Claude: 好的，让我帮你构建一份精美的简历。首先，能告诉我你的姓名和求职意向吗？
```

### Skill 2: 针对 JD 定制

```
/用户: 帮我针对腾讯的 JD 改一下简历
/Claude: 好的，请把腾讯的 JD 内容粘贴给我，我会先分析一下这个岗位的核心要求。
```

## 生成文件示例

```
resume/
├── resume.html                       # 通用版简历
└── tailored/
    ├── alibaba-前端开发/
    │   ├── resume.html               # 针对阿里的定制版
    │   └── matching-analysis.md      # 匹配分析报告
    └── tencent-后端开发/
        ├── resume.html
        └── matching-analysis.md
```

## License

MIT
