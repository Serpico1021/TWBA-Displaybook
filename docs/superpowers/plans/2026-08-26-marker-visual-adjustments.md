# 标记视觉调整 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: 用户已指定默认不使用 subagent，本计划由 main agent 直接执行。Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 缩小球员与篮球标记，避免球与人视觉重合，并让进攻参照按 1-5 编号显示。

**Architecture:** 保持现有纯静态 HTML 与 SVG 渲染结构。站位数据继续表达真实坐标，视觉错位只发生在 `src/app.js` 渲染层，避免破坏 IndexedDB 内容包和后续 JSON 注册格式。

**Tech Stack:** 原生 HTML、CSS、JavaScript、SVG、IndexedDB；不引入 npm、Playwright 或构建流程。

---

### Task 1: SVG 标记渲染

**Files:**
- Modify: `src/app.js`
- Modify: `src/styles.css`

- [ ] **Step 1: 增加渲染常量**

在 `roles` 后增加统一尺寸和偏移常量：

```js
const markerSize = {
  offenseRadius: 2.45,
  defenderRadius: 3.75,
  defenderHitRadius: 6,
  ballRadius: 2.15,
  ballHitRadius: 5.4,
  ballSeam: 1.7
};
const offenseVisualOffset = { x: -2.1, y: -1.6 };
const ballVisualOffset = { x: 2, y: 1.6 };
```

- [ ] **Step 2: 调整进攻参照渲染**

`renderOffense()` 使用 `index + 1` 显示 `1-5`，坐标使用 `offenseVisualOffset`，圆半径使用 `markerSize.offenseRadius`。

- [ ] **Step 3: 调整篮球渲染**

`renderBall()` 保持命中区域围绕真实 `state.ball` 坐标，球体图形使用 `ballVisualOffset` 错开显示，并用 `markerSize.ballRadius` 与 `markerSize.ballSeam` 控制大小。

- [ ] **Step 4: 调整防守人渲染**

`renderDefenders()` 将命中半径和可视半径改为 `markerSize.defenderHitRadius` 与 `markerSize.defenderRadius`，让防守标记更紧凑。

- [ ] **Step 5: 强化进攻颜色区分**

`src/styles.css` 将 `--offense` 从灰色调整为区别于防守蓝和篮球橙的红紫色，并同步调整 `.offense-marker text` 的文字颜色。

### Task 2: 验证与提交

**Files:**
- Verify: `src/app.js`
- Commit: `docs/superpowers/plans/2026-08-26-marker-visual-adjustments.md`, `src/app.js`, `src/styles.css`

- [ ] **Step 1: 运行语法检查**

```powershell
node --check src\app.js
```

Expected: 无输出且退出码为 0。

- [ ] **Step 2: 检查工作区差异**

```powershell
git diff -- src\app.js src\styles.css docs\superpowers\plans\2026-08-26-marker-visual-adjustments.md
```

Expected: 只包含本次视觉调整和计划文档。

- [ ] **Step 3: 提交**

```powershell
git add docs\superpowers\plans\2026-08-26-marker-visual-adjustments.md src\app.js src\styles.css
git commit -m "feat: adjust court marker visuals"
```
