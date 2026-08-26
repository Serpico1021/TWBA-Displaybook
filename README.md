# TWBA Displaybook

静态 HTML 篮球战术演示页，用于讲解 2-3 联防从起手站位到强侧旋转、底角压迫、高位收缩和投篮篮板的核心原则。

## 使用方式

直接用浏览器打开 `index.html`。页面不需要后端服务，不需要安装 npm 依赖。

## 页面能力

- 6 个中文战术情景。
- 内容以 `playbook + scenario` 标准结构注册，区分防守 / 进攻类型。
- 浏览器本地 IndexedDB 保存内容库。
- 支持 JSON 导入新战术包、删除导入内容、恢复内置默认内容。
- FIBA 半场 SVG 战术板。
- 防守人以 1-5 标识。
- 按全部或单个号码筛选职责说明。
- 显示或隐藏轮转箭头、进攻参照、区域高亮。
- 拖动篮球和防守 1-5 做临时讲解微调。
- 点击“重置站位”恢复当前情景默认坐标。
- 桌面左右布局，窄屏上下布局。

## 手动验证

用户可自行打开 `index.html` 在浏览器中检查：

- 默认情景是“球在弧顶正中”。
- 6 个情景按钮都能切换球、防守人、箭头、区域和文字说明。
- 号码筛选能突出对应防守人，并只显示该号码职责。
- 三个显示开关能分别隐藏或显示对应图层。
- 篮球和 1-5 号防守人可以拖动。
- 重置后当前情景恢复默认站位。
- 导入合法 JSON 后，战术包下拉框可切换到新内容。
- 删除导入内容不会删除内置默认战术包。
- 恢复默认内容会清空已导入战术包并重建内置战术包。
- 浏览器窄屏时页面不横向溢出。

## JSON 导入格式

导入文件必须是 UTF-8 JSON，第一版 `schemaVersion` 固定为 `1`：

```json
{
  "schemaVersion": 1,
  "playbook": {
    "id": "example-defense-package",
    "title": "示例防守战术包",
    "type": "defense",
    "version": "1.0.0",
    "description": "一句话说明战术包用途"
  },
  "scenarios": [
    {
      "id": "top",
      "title": "球在弧顶",
      "phase": "站位",
      "principle": "一句话说明这个情景的原则。",
      "ball": { "x": 50, "y": 20 },
      "offense": [{ "id": "O1", "label": "持球", "x": 50, "y": 20 }],
      "defenders": {
        "1": { "x": 48, "y": 28 },
        "2": { "x": 58, "y": 35 },
        "3": { "x": 26, "y": 63 },
        "4": { "x": 74, "y": 63 },
        "5": { "x": 50, "y": 57 }
      },
      "arrows": [],
      "zones": [],
      "responsibilities": {
        "1": { "where": "站位说明", "watch": "观察重点", "why": "原因" },
        "2": { "where": "站位说明", "watch": "观察重点", "why": "原因" },
        "3": { "where": "站位说明", "watch": "观察重点", "why": "原因" },
        "4": { "where": "站位说明", "watch": "观察重点", "why": "原因" },
        "5": { "where": "站位说明", "watch": "观察重点", "why": "原因" }
      },
      "coachNotes": "教练备注"
    }
  ]
}
```

`playbook.type` 只能是 `"defense"` 或 `"offense"`。所有坐标使用 `0-100` 的相对坐标。

## 实现说明

页面由 `index.html`、`src/styles.css`、`src/builtin-content.js`、`src/content-validation.js`、`src/content-db.js`、`src/content-service.js`、`src/app.js` 组成。

内置内容从 `src/builtin-content.js` 写入 IndexedDB。IndexedDB 不可用时，页面会回退到本次页面内存数据；拖动后的站位调整仍只保存在当前页面状态中，不写入内容库。
