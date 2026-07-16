---
name: resume-version-manager
description: 管理简历母版及针对不同公司、岗位和 JD 的定制版本。当用户要保存多个简历版本、比较差异、命名文件、回溯投递版本或维护简历事实源时使用。保护母版，不覆盖已有版本或未经确认的事实。
---

# 简历版本管理器

以母版为事实源，为每次投递建立可回溯、可比较的定制版本。

## 先读

读取 [简历事实契约](../resume-builder/references/resume-contract.md)、[JD 匹配报告模板](../jd-tailorer/references/matching-analysis.md) 和 [写作规范](../resume-builder/references/content-writing.md)。

## 工作流

1. 找到或创建明确标识的母版；它保存候选人全部已确认的事实，不能被定制操作覆盖。
2. 为一个公司/岗位/JD 创建独立目录：`tailored/<公司名>-<岗位>/`。
3. 记录父版本、目标 JD、创建日期、使用的候选人事实、重排项、改写项、关键词来源、未匹配要求和待确认字段。
4. 生成该版本的 `resume-visual.html`，必要时生成 `resume-ats.html` 和 `matching-analysis.md`；验证 PDF 页数与可提取文本。
5. 比较版本时按事实、顺序、措辞和样式分组；发现事实不一致时标记冲突并请求候选人确认。

## 推荐清单

```text
resume/
├── resume.html                         # 母版
└── tailored/
    └── <公司名>-<岗位>/
        ├── resume-visual.html
        ├── resume-ats.html            # 按需生成
        ├── matching-analysis.md
        └── version-notes.md
```

`version-notes.md` 最少记录：父版本、JD 来源/日期、变更摘要、关键词来源、未匹配要求、待确认字段和导出验证结果。

## 约束

- 定制版只能重排、强调或改写已确认事实；回写母版需要用户明确要求。
- 命名可使用 `姓名_岗位_公司_YYYYMM.pdf`，但以目标平台要求为准。
- 不通过删除历史版本、静默覆盖文件或伪造版本记录来“整理”工作区。
