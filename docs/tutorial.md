---
title: "AI时代的简历制作方式「resume-skills」的超全教程！快来更新你的简历吧，使用 「Workbuddy」 全流程教学"
source: "https://x.com/chasen_liao/status/2077689805752942619"
author:
  - "[[@chasen_liao]]"
published: 2026-07-16
created: 2026-07-17
description: "最近有不少的朋友看过我的skills了，然后一开始是我同学问我是怎么制作简历的，我当时是用 claude code 来制作 HTML 的简历，后来我把这个流程做成了两个 skills 。分别是：从 0 到 1 创建 HTML 简历的，从 1 到 N 根据 JD 来创建简历的，这两..."
tags:
  - "clippings"
---
![图像](https://pbs.twimg.com/media/HNVvvnea4AAGgOj?format=jpg&name=large)

最近有不少的朋友看过我的skills了，然后一开始是我同学问我是怎么制作简历的，我当时是用 claude code 来制作 HTML 的简历，后来我把这个流程做成了两个 skills 。

分别是：从 0 到 1 创建 HTML 简历的，从 1 到 N 根据 JD 来创建简历的，这两个 skills ；还有一些搭配 这两个skills一起运行的 skills

然后我最近大更新了一次 resume-skills ，增加了更加完善的工作流和写作约束，还有 web 端的

我本人是 投递 AI、Agent 的实习岗位，之前用canvas做的简历投出去都是已读不回，用这个skills制作了之后，轻轻松松收到很多加 offer ，所以也希望能把经验分享出来，让大家能优化自己的简历💗

大家可以对比一下我的简历👇左边是canvas，右边是我的skills跑出来的

![图像](https://pbs.twimg.com/media/HNVtkOoacAEtZ8U?format=jpg&name=large)

在我这篇帖子下，有很多朋友评论 HTML 用来做简历非常的方便和好用

![图像](https://pbs.twimg.com/media/HNVI9cpa0AAw3LU?format=jpg&name=large)

确实，HTML 作为 Anthropic 官方推荐的视觉语言，不管是在视觉效果方面还是可交互性上都比 word 文档 和 markdown 文档要好上一万倍！

那么接下来我就教你如何 从 0 到 N 创建自己的简历工作流，整个过程只需要 10 分钟，你就能拥有一份精美的简历了，并且今后 投递不同的岗位的时候，只需要把 JD 解析出来，扔给 AI，就能获得一份针对 JD 修改过的简历的！

# 安装 resume-skills

这个简历 skills 不限制使用的 Agent ，Claude Code、Codex、workbuddy等等 都可以使用，这里我将使用最近很火的对于国内宝宝友好的 workbuddy 来作为演示

首先在本地文件夹新建一个文件夹用来作为 **workbuddy** 的**工作空间**

![图像](https://pbs.twimg.com/media/HNVL9wda8AAUFNw?format=jpg&name=large)

## 使用 npx skills 安装 skills

打开刚刚创建的文件夹，进入终端输入：

```plaintext
npx skills add Chasen-Liao/resume-skills
```

之后能看到：

![图像](https://pbs.twimg.com/media/HNVNq5QawAA3OHp?format=jpg&name=large)

按空格就可以选择需要的skills进行安装

![图像](https://pbs.twimg.com/media/HNVNwjXaAAAViG4?format=jpg&name=large)

之后按下回车 ↩︎

![图像](https://pbs.twimg.com/media/HNVN8nmaYAE-6TO?format=jpg&name=large)

这里就可以选择你要安装的 Agent ，一般很多 Agent 应用会读取 .agents/ 文件夹📂下的 skills ，但是 Claude Code 需要另外选择

![图像](https://pbs.twimg.com/media/HNVObCAbYAAt32e?format=png&name=large)

之后就是选择这个skills的作用域了，这里我推荐选择 「Project」，这样子这些skills只会在这个文件夹下生效，不会影响你的其他工作区。

![图像](https://pbs.twimg.com/media/HNVOvnYbYAAUeIv?format=png&name=large)

这里就选择 Symlink ，简单的链接，方便更新

![图像](https://pbs.twimg.com/media/HNVO8tpacAAXiav?format=png&name=large)

看到这里就成功了，你就可以在以上的这些 Agent 里面去使用 resume-skills 了（是当前文件夹哦）

![图像](https://pbs.twimg.com/media/HNVPmhwbEAACdXh?format=png&name=large)

大家可以放心，我的 skills 非常安全，不会有恶意的提示词

由于 workbuddy 没有默认识别到 .agents 下面的 skills ，所以这里我们可以让 workbuddy 安装到 workbuddy 能生效的 skills

![图像](https://pbs.twimg.com/media/HNVQUOvbEAA0wXG?format=jpg&name=large)

把 .agents/skills 这个文件夹拖给 workbuddy ，让他进行安装，可以参考我的提示词：

```text
skills 把这个文件下的所有skills都安装到 workbuddy 当前工作空间，记住是repo-only
```

等待 workbuddy 进行安装即可，如果觉得用 workbuddy 麻烦也可以直接使用 npx skills 安装过程中显示支持的 Agent 应用，Codex 和 Claude Code 之类的

![图像](https://pbs.twimg.com/media/HNVSQqgboAA7lO7?format=jpg&name=large)

workbuddy 检查了 skills 的合规性之后就会帮你安装

# 开始制作你的简历

假如你当前有在使用的简历，可以吧 PDF 扔给 Workbuddy ，参考我的提示词：

![图像](https://pbs.twimg.com/media/HNVUtOiaQAAabJr?format=jpg&name=large)

之后 skills 会去访问你更多的信息，优化你的表述，让你选择一个风格，然后制作一份 resume.html 文件

![图像](https://pbs.twimg.com/media/HNVVoFubgAA0RgK?format=jpg&name=large)

这里记得要选择有视觉能力的 LLM ，比如说 Kimi-K2.7-Code 就不错

之后 Agent 解析完了你的 PDF，会再询问你简历的细节：⬇️

![图像](https://pbs.twimg.com/media/HNVWJXQbYAA-Zaz?format=jpg&name=large)

这时候你就可以更具 Agent 问题来回答；

skills 会在你的工作区下生成一个 resume-facts.yaml 文件，用来作为简历的事实依据，之后可以让 workbuddy 按照你挑选的样式生成一份「简历母版」

![图像](https://pbs.twimg.com/media/HNVaKIuaUAAcIc5?format=jpg&name=large)

这个母版简历是作为一个通用简历，作为之后 针对岗位JD 来制作对应的简历的基础；

样式的具体可以到我的 repo里面 [https://github.com/Chasen-Liao/resume-skills](https://github.com/Chasen-Liao/resume-skills) 查看 ⬇️

![图像](https://pbs.twimg.com/media/HNValIFa8AA42qC?format=jpg&name=large)

> 后续如果大家有什么更好的简历样式，可以提交 issue，或者这篇文章下面留言，我会一一更新

这里我就选择 「日式极简」 吧

![图像](https://pbs.twimg.com/media/HNVbbrjbMAAJlQD?format=jpg&name=large)

这里 AI 就会开始构建你的 HTML 简历。

这是 workbuddy 制作的效果⬇️

![图像](https://pbs.twimg.com/media/HNVfGBmbAAAxs39?format=jpg&name=large)

制作完之后你可以 和 Agent 讲：

用npx [@chasen](https://x.com/@chasen)\-liao/resume-skills editor "<生成的\_visual.html路径>" 打开本地的预览。

你就能在 web 端看到生成的简历，并且在网页端微调成自己满意的样子后保存；保存会直接覆盖这份 HTML，让它始终保持最新版本。

![图像](https://pbs.twimg.com/media/HNVfWD1awAAX0Jv?format=jpg&name=large)

双击要修改的行，就可以进行修改。觉得没问题后，点击左侧“保存修改”即可。

如果没有或者对以前的简历不满意，那可以直接使用这个skills去创建一份新的简历，这个skills内置了 6 种风格示例，可以产出一模一样的 HTML 文件，后续也可以修改样式

# 针对JD来制作简历

制作完了简历的母版之后，下一步针对你要投递岗位 JD 来制作对应的简历才是重头戏，很多企业筛选简历就是通过关键词先匹配一遍，那么你的简历里面就应该提到 JD 里提到的关键词，这样可以提高你简历被看见概率

那么在制作完简历母版之后，我们可以新开一个会话，还是选择刚刚的工作空间，调用 「jd-tailorer」​ 这个 skills

![图像](https://pbs.twimg.com/media/HNVkWlXawAMmP1F?format=jpg&name=large)

然后你只需要把你要投递的岗位的 JD 复制下来，可以参考我的提示词：⬇️

```plaintext
/jd-tailorer
​我要投递的 JD 是：“小鹏的 AI Agent 开发实习生（通用智能仿真方向）
广州实习研发 - 算法27届AI人才专项计划（实习生专场）
职位描述
职位描述
AI Agent 架构与开发：基于大语言模型（LLM），参与设计与开发面向自动驾驶仿真的智能体（AI Agent）及多智能体协同工作流（Workflow）。
仿真场景与原生 AI 应用：结合自动驾驶仿真平台（如场景生成、车辆动力学、传感器仿真等）及仿真测试数据分析，开发具备复杂任务规划、记忆管理、工具调用（Tool Calling）能力的 AI 应用，提升仿真测试效率。
自动化诊断与工具链建设：利用 Agent 技术重构或赋能仿真自动化诊断、结果分析工具，实现仿真故障的快速定位、场景可视化及测试用例的自动生成。
系统集成与性能优化：负责大模型与仿真平台、API 的对接，持续优化 Prompt，提升 Agent 在仿真环境中的响应速度、稳定性和执行准确率。
职位要求
教育背景：计算机、人工智能或相关专业，具备扎实的专业基础。
编程能力：熟练掌握 Python 开发（熟悉 C++ 为加分项），熟悉异步编程，具有良好的代码规范和工程化落地能力。
AI Agent 经验（核心）：具备 AI Agent 或大模型应用开发经验，深入理解 Agent 的核心组件（如 Planning、Memory、Tools），熟练使用 LangChain、LangGraph、AutoGen 等至少一种主流框架。
大模型基础：熟悉 Prompt Engineering 技巧，了解 RAG（检索增强生成）架构及向量数据库的使用，有实际的 API 接入和 Function Calling 经验。
学习与自驱力：耐心细致，具备快速学习新技术的能力，对 AI 充满热情，且日常熟练使用 AI 工具（如 Claude、Copilot 等）辅助开发。
加分项
实战经验：有完整的 AI Agent、RAG 或复杂 AI 智能体工作流在自动驾驶仿真或虚拟测试领域的落地项目经验者优先。
开源贡献：拥有独立的 GitHub AI/Agent 相关开源项目，或对 LangChain 等开源社区有 PR 贡献者优先。
业务背景：了解自动驾驶仿真平台（如 CARLA、VTD、SUMO 等）、仿真测试框架（如场景描述语言、OpenSCENARIO）或具有仿真测试诊断工具开发经验者优先
职位要求
--”你制作一份对应的简历
```

AI 会根据你给的JD信息，和你的基础简历进行匹配和优化，会在事实范围内去针对JD优化简历，生成像下面这样的匹配表👇

![图像](https://pbs.twimg.com/media/HNVnFtabgAAdBRp?format=jpg&name=large)

然后会给你一些建议，如果你有补充的信息，就可以告诉AI

之后生成的效果👇

![图像](https://pbs.twimg.com/media/HNVrSYTawAAWxea?format=jpg&name=large)

对比简历母版会发现优化过的简历踩到了更多的 JD ，这样子投递简历的时候，通过的概率会大大提高

## 叠甲

这是我自己在制作简历和投递简历的时候会使用的一套工作流，我将其做成了skills，想帮助大家更加方便的制作对应JD的简历。可是我不确定HR是否喜欢这种风格的简历，所以我很希望有人能给我优化的建议

我想把这个 skills 能做成大家都方便用的，好用的一个 skills。。。
