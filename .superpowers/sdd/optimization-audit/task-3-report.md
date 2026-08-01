# Task 3：可恢复保存、草稿和热更新

## RED → GREEN

1. 新增服务级测试，确认携带过期 `documentId` 的保存曾错误返回 `200`；实现版本校验后返回 `409`，且原文件不变。
2. 新增模拟原子写失败测试，先确认服务返回 `400`；拆分验证和写入错误后，写入失败返回 `500`，源文件保持可读。
3. 新增真实临时目录保存测试：保存使用同目录临时文件、`fsync`、替换和单个 `.bak`，响应返回新文档版本。该测试在 Windows 环境实际通过。
4. 新增真实 SSE/文件系统测试：连续两次以重命名替换源文件后均收到 reload；删除源文件时收到可读的 SSE 错误状态。先前实现对读取错误不发送事件，测试超时；切换到父目录 watch 后通过。
5. 新增控件覆盖测试：同一元素同一属性多次更新只保留最新规则；根 token 同理；恢复一个元素默认不影响另一个元素。先前规则会累积，修复后通过。

## 修改文件

- `bin/resume-skills.mjs`：版本冲突、可恢复原子保存、`.bak`、父目录监听与 SSE 状态事件。
- `public/app.js`、`public/editor.html`：带版本保存、成功立即清草稿、草稿节流/提交即写、计算样式回显、恢复所选文本默认样式、SSE 错误提示。
- `lib/editor-controls.mjs`：按“元素 ID + 属性”覆盖 CSS、根 token 覆盖、移除单个元素的覆盖。
- `tests/editor-reliability.test.mjs`：新增服务和文件系统回归。
- 既有编辑器测试：更新保存请求以携带 `documentId`，补充 CSS 覆盖回归。

## 验证

- `node --test tests/editor-reliability.test.mjs`：5/5 通过。
- `node --test tests/editor-boundaries.test.mjs tests/editor-cli.test.mjs tests/editor-controls.test.mjs tests/editor-reliability.test.mjs`：36 通过，1 个 IPv6 环境跳过。
- `node --check public/app.js` 与 `git diff --check`：通过。
- `npm test`：62 通过，1 个 IPv6 loopback 环境跳过。

## 顾虑

- 原子替换依赖 Node `renameSync` 对同目录目标替换的 Windows 行为；本任务的真实 Windows 临时目录测试已覆盖成功替换和 `.bak` 保留。
- SSE 读取错误已回报；底层 watch 的操作系统级 `error` 事件较难在不替换 Node watcher 的情况下稳定触发，因此以删除源文件后的真实读取错误回归覆盖前端可见状态。

## 审查修复（第二轮）

1. **保存前磁盘版本校验**：`POST /api/save` 现在会同步读取、prepare 并哈希源文件，再和提交的 `documentId` 比较。新增真实临时目录回归：外部写入后立刻提交旧版本（不等待 watch debounce）返回 `409`，外部内容没有被覆盖。
2. **可执行前端交互测试**：抽取 `createDraftController`、`computedControlValues` 和恢复所选项函数。测试以真实 `setTimeout` 驱动输入拖动、`change/blur` 提交和保存后清理序列，并验证计算样式（包括根 token）回显与单项恢复；`public/app.js` 使用这些函数。
3. **原子保存故障路径**：`atomicSave` 允许注入最小文件操作集合用于测试；fsync 与 rename 的失败回归使用真实临时目录和真实文件描述符，断言源文件不变、临时文件位于目标同目录且被清理。
4. **SSE 生命周期**：同时在 response 的 `error` 与 `close` 上移除客户端。

第二轮验证：

- `node --check public/app.js`
- `node --test tests/editor-reliability.test.mjs tests/editor-draft.test.mjs tests/editor-controls.test.mjs`：21/21 通过。
