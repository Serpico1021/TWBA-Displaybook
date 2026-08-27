# Zone Color Highlight Design

## Background

区域高亮（zone）目前只有 3 个固定 `type`（strong/middle/last），颜色由 CSS 写死映射（`--zone-strong` 红、`--zone-middle` 蓝、`--zone-last` 绿）。`type` 下拉框在编辑面板里唯一的作用就是选颜色，并不承载其他语义。教练希望能给每个区域自由挑选颜色，用于区分更多种类的战术区域（例如同时标出强侧压迫、协防区、篮板卡位区、夹击陷阱区等），不再受限于 3 种。

## Goals

- 每个区域可以从一套策展色板中独立选择颜色，不再与固定的“强侧/中路/底线”语义绑定。
- 新色板需与现有深色战术板视觉体系协调，且与球员/箭头标记色（defense/offense/ball/pass/help/rotation）有清晰区分。
- 已保存的旧场景（内置 6 个情景 + 用户在 IndexedDB 中保存的自定义情景）在升级后依然正确显示颜色，不需要用户手动修复。

## Non-Goals

- 不提供完全自由的 RGB/HEX 取色器。
- 不改变区域的形状、拖动、旋转、缩放交互。
- 不引入按区域类型驱动的其它逻辑（本次 `type` 概念整体让位给 `color`，不保留语义分类）。

## Data Model

`zone.type`（`"strong" | "middle" | "last"`）替换为 `zone.color`，取值为以下 6 个 key 之一：

| key | 说明 | hex |
| --- | --- | --- |
| `red` | 红（= 旧 zone-strong） | `#ff4d4d` |
| `blue` | 蓝（= 旧 zone-middle） | `#4d7cff` |
| `green` | 绿（= 旧 zone-last） | `#33d17a` |
| `amber` | 琥珀 | `#ffa53d` |
| `violet` | 紫罗兰 | `#a855f7` |
| `cyan` | 青 | `#22d3ee` |

新增区域默认 `color: "red"`。

## Backward Compatibility

写入路径（`content-validation.js` 的 `normalizePackageSource`，被 `content-service.js` 的 `init`/`importPackage`/`updateScenario`/`addScenario` 统一调用）：若 `zone.color` 缺失但 `zone.type` 存在，按 `strong→red / middle→blue / last→green` 映射写入 `color` 字段并删除 `type` 字段。这样所有经过写入流程的数据（含首次初始化时的内置数据种子）都会被迁移为新字段。

读取路径兜底：`getLibrary()`/`getPlaybook()` 直接从 IndexedDB 读取，不会重新跑 normalize，因此本功能上线前已保存在用户浏览器 IndexedDB 里的自定义情景可能仍是旧 `type` 字段。`app.js` 渲染层需要一个兜底函数（`zone.color || legacyTypeToColor[zone.type] || "red"`），保证这些旧数据依然能正确显示颜色。用户下次编辑并保存该情景后，会经过写入路径被彻底迁移。

`builtin-content.js` 的 6 个内置情景直接在源码里把 `type: "strong"/"middle"/"last"` 改写为对应的 `color: "red"/"blue"/"green"`，不依赖运行时兜底。

## Validation

`content-validation.js`：
- `zoneTypes` 常量改为 `zoneColors = ["red", "blue", "green", "amber", "violet", "cyan"]`。
- `assertZones` 校验 `zone.color` 是否属于 `zoneColors`（而不是 `zone.type`）。

## UI

编辑面板 `renderZoneRows`：原来的 `<select data-zone-field="type">` 下拉框替换为一排 6 个圆形色块按钮（约 18-20px，`data-zone-field="color"` + `data-zone-color="<key>"`），当前选中颜色显示描边高亮。名称输入框保持不变。

事件委托：原先监听 `[data-zone-field="type"]` 的 `change` 处理，替换为监听色块按钮的 `click`，写入 `zone.color` 后重渲染 `refreshZoneEditorList`。

保存/导出逻辑（`app.js` 收集 zone 数据处）：把原先 `clean.type = zone.type || "middle"` 改成 `clean.color = zone.color || "red"`。

球场上的区域渲染（`renderZones`）：`zone-${escapeHtml(zone.type)}` 的 CSS class 改为 `zone-${escapeHtml(zoneColorKey(zone))}`（`zoneColorKey` 即上文的兼容取值函数）。

## CSS

`:root` 新增/调整 6 个 `--zone-*` 变量（复用已有 3 个 red/blue/green 数值，新增 amber/violet/cyan）。

`.zone-strong`/`.zone-middle`/`.zone-last` 三条规则改名为 `.zone-red`/`.zone-blue`/`.zone-green`/`.zone-amber`/`.zone-violet`/`.zone-cyan`，`fill` 分别取对应变量，`.zone { opacity: 0.22 }` 语义不变。

新增 `.zone-color-swatch` 系列样式：圆形色块按钮、选中态外圈描边、hover 态。

## Acceptance Criteria

- 编辑区域时，可以从 6 个色块中点选任意一个作为该区域颜色，球场上的填充色立即更新。
- 新增区域默认是红色。
- 保存/导出的场景 JSON 里区域字段为 `color`，不再包含 `type`。
- 6 个内置情景升级后颜色与升级前肉眼一致（strong→red、middle→blue、last→green）。
- 页面加载本功能上线前保存在 IndexedDB 中的旧自定义情景时，区域颜色仍正确显示（走兼容兜底）。
- `content-validation.js` 拒绝 `zone.color` 不在允许的 6 个 key 内的数据。
