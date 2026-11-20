# coopanion-world-think-chinese

> 让 Coopanion 的桌宠每一轮都用简体中文思考。Make her reason in Simplified Chinese, every round.

一个 Coopanion World 插件：往每一轮的系统前缀里加一段「思考过程语言：简体中文」规则。
模型从第一步起就用中文推理，思维链面板和桌宠气泡直接读中文原文——0 次翻译调用、0 翻译延迟。

## 为什么

Coopanion 的桌宠对话带一堆工具（`pet_say`、`browser_search`……）。实测在这种「工具调用型任务」里，
deepseek-flash 默认用英文打腹稿：真实会话的 58 段思考里 57 段是英文，于是气泡只能等翻译。

加一条规则就能把推理语言钉住：同一条前缀、同一套工具，英文占比从 95% 掉到 16%（剩下的大多是工具名/标识符）。

## 原理

Cortico 的系统前缀由 Persona 按段拼（`{{persona.constitution}}`、`{{worlds.envPrompts}}`……）。
这个 World 提供 `role = envPrompt` 的模板 `ENV_PROMPT.md`，它的正文作为「环境说明」段进入前缀。
每次前缀重建（每轮请求）都会重新读模板、重新调用 `envPromptVars()`，所以改完下一轮就生效。

没有工具、不推事件、不改界面；停用这个 World，规则立刻从前缀里消失。

## 安装

桌面端（Coopanion 的 `data/extensions`）：

1. 把本目录放进 `data/extensions/`（或建一个 junction 指过去）；
2. `data/extensions/package.json` 的 dependencies 加 `"coopanion-world-think-chinese": "link:<本目录>"`；
3. `data/extensions/world-owners.json` 加 `"think-chinese": "coopanion-world-think-chinese"`；
4. `data/home/companion/config.json` 的 `worlds` 加 `"think-chinese": { "enabled": true }`；
5. 重启 Coopanion（World 定义在启动时导入）。

## 配置

| 字段 | 默认 | 说明 |
| --- | --- | --- |
| `enabled` | `false` | 只有部署配置 `worlds.think-chinese.enabled = true` 才挂载 |

规则正文在 `ENV_PROMPT.md`。World 页的「思考中文 · 规则」面板能看当前文本；提示词页能直接编辑。

## 验证

- 世界页出现「思考中文」，灯是 online；
- 下一轮请求的 system 前缀里能看到 `## 思考过程语言：简体中文`；
- 桌宠气泡直接显示中文原文（配合 `coopanion-world-thoughts` 0.2.5+）。

## 注意

- **每轮都要付这段的 token**：约 150 字（≈100–150 token）。它在前缀中段，会让其后少量缓存失效；
  按 deepseek-flash 的价（input 缓存 $0.003/M、未缓存 $0.15/M），一天几十轮大约几分钱。
- **强指令，不是硬约束**：极端情况下仍会夹英文术语或整段英文；这时 thoughts 插件的翻译兜底。
- **中文原文不再重复翻译**：thoughts 插件检测到原文是中文时直接沿用，省掉那一次调用。

## 目录

```text
coopanion-world-think-chinese/
├── package.json      # cortico.kind = world
├── ENV_PROMPT.md     # 进入系统前缀的规则正文
├── src/index.ts      # 只做一件事：声明这个 World
├── describe.json     # 无工具、无事件
└── CHANGELOG.md
```

## License

MIT
