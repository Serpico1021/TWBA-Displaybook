# 五号位罚球线策应与进攻拖拽 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: 本项目用户已明确默认不使用 subagent，本计划由 main agent 逐项 inline 执行。Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将默认高位情景替换为进攻 5 号位罚球线策应，并支持进攻球员拖动，同时缩小防守标记避免遮挡。

**Architecture:** 继续沿用纯静态 HTML 架构。内置内容只修改 `src/builtin-content.js` 的场景数据；拖拽能力在 `src/app.js` 的页面状态和指针事件中扩展；视觉尺寸在 `src/app.js` 的 marker 配置和必要 CSS 中完成。

**Tech Stack:** HTML、CSS、原生 JavaScript、SVG、IndexedDB 内容库；不引入 npm、Playwright、后端或构建流程。

---

### Task 1: 替换高位内置情景

**Files:**
- Modify: `src/builtin-content.js`

- [ ] **Step 1: 修改情景标题和原则**

将原 `title: "球进入罚球线 / 高位"` 改为：

```js
title: "5号上提罚球线策应",
principle: "5号上提到罚球线策应时，防守先堵中路视野，再用上线收窄和底线收缩切断顺下与短角。"
```

- [ ] **Step 2: 修改进攻站位**

将该情景的 `offense` 改为 5 号在罚球线附近，其余人拉开：

```js
offense: [
  { id: "O1", label: "弧顶", x: 50, y: 24 },
  { id: "O2", label: "左45", x: 24, y: 40 },
  { id: "O3", label: "右45", x: 76, y: 40 },
  { id: "O4", label: "底角", x: 15, y: 79 },
  { id: "O5", label: "高位策应", x: 50, y: 51 }
]
```

- [ ] **Step 3: 修改球和防守站位**

将 `ball` 放在 `O5` 高位策应点；防守 5 号顶高位，上线收窄，底线保护短角和篮下：

```js
ball: { x: 50, y: 51 },
defenders: {
  "1": { x: 40, y: 43, status: "pinch" },
  "2": { x: 60, y: 43, status: "pinch" },
  "3": { x: 30, y: 74, status: "short-corner" },
  "4": { x: 70, y: 74, status: "short-corner" },
  "5": { x: 50, y: 58, status: "high-post" }
}
```

- [ ] **Step 4: 修改职责说明**

职责说明聚焦 5 号高位策应：

```js
"1": {
  where: "从前压点回收到罚球线左侧上沿，身体朝球，手干扰5号位回传弧顶。",
  watch: "看5号位的中轴脚、弧顶1号和左45度回传。",
  why: "上线不能被高位一接球就打穿，1号收窄后能先压视野，再回扑外线。"
}
```

其他角色同样改为高位顶防、短角保护、弱侧收缩逻辑。

### Task 2: 增加进攻球员页面状态

**Files:**
- Modify: `src/app.js`

- [ ] **Step 1: 在 state 增加进攻位置**

增加当前页面态字段：

```js
offensePositions: [],
```

- [ ] **Step 2: 初始化和重置进攻位置**

在加载情景时从 `scenario.offense` 克隆到 `state.offensePositions`：

```js
state.offensePositions = clonePositions(scenario.offense || []);
```

`resetCurrentScenario()` 同时恢复球、防守和进攻位置。

- [ ] **Step 3: 保持内容库数据不被拖拽污染**

新增 `clonePositions(players)` 工具，只复制 `id`、`label`、`x`、`y` 等普通字段：

```js
function clonePositions(players) {
  return (players || []).map((player) => ({ ...player }));
}
```

### Task 3: 支持进攻球员拖拽

**Files:**
- Modify: `src/app.js`

- [ ] **Step 1: 渲染进攻球员使用页面态**

`renderOffense()` 改为读取 `state.offensePositions`，并为每个进攻球员写入 `data-index`：

```js
<g data-marker="offense" data-index="${index}" class="offense-marker" ...>
```

- [ ] **Step 2: pointerdown 识别进攻球员**

在现有防守和球之外增加：

```js
const offense = event.target.closest("[data-marker='offense']");
```

当命中进攻球员时：

```js
state.dragTarget = { type: "offense", index: Number(offense.dataset.index) };
```

- [ ] **Step 3: pointermove 更新进攻位置**

拖动进攻球员时，只更新 `state.offensePositions[index].x/y`：

```js
state.offensePositions[state.dragTarget.index] = {
  ...state.offensePositions[state.dragTarget.index],
  x: point.x,
  y: point.y
};
```

### Task 4: 调整标记尺寸和验证

**Files:**
- Modify: `src/app.js`
- Modify if needed: `src/styles.css`

- [ ] **Step 1: 缩小防守可视圆圈**

将 `markerSize.defenderRadius` 继续下调，保留 `defenderHitRadius` 略大：

```js
defenderRadius: 2.9,
defenderHitRadius: 5.2
```

- [ ] **Step 2: 保持篮球清晰**

球继续独立渲染在球层，避免被人完全覆盖；不改变数据坐标，只保留视觉偏移。

- [ ] **Step 3: 运行本地验证**

执行：

```powershell
node --check src\builtin-content.js
node --check src\app.js
git diff --check
```

期望：三条命令均无错误输出。

- [ ] **Step 4: 提交**

```powershell
git add src\builtin-content.js src\app.js src\styles.css docs\superpowers\plans\2026-08-26-offense-five-high-post-and-drag.md
git commit -m "feat: add high post offense drag support"
```
