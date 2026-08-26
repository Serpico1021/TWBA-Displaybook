# 2-3 Zone Defense Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a directly openable static HTML page that teaches the team's compact 2-3 zone defense rotation through six FIBA half-court scenarios, role-focused explanations, and manual position adjustment.

**Architecture:** Use a static single-page app with no runtime backend. `index.html` owns semantic structure, `src/styles.css` owns all layout and responsive styling, `src/scenarios.js` owns data, and `src/app.js` renders the SVG court plus interactive controls from that data.

**Tech Stack:** HTML5, CSS3, vanilla JavaScript, SVG, npm scripts, Vite for local serving, Playwright for browser verification.

---

## Source Spec

Implement from `docs/superpowers/specs/2026-08-26-2-3-zone-defense-demo-design.md`.

## Verification Update

User updated the execution constraint after this plan was written: do not install or use Playwright, and do not require npm dependencies. The implemented first version is a directly openable static page verified with JavaScript syntax checks, scenario data validation, and user-operated browser testing.

## File Structure

- Create `package.json`: development scripts and test dependencies.
- Create `playwright.config.js`: serve the static page with Vite during tests.
- Create `index.html`: app shell, court container, side panel, script loading.
- Create `src/styles.css`: court styling, controls, cards, role focus, responsive layout.
- Create `src/scenarios.js`: six scenario data objects using 0-100 relative coordinates.
- Create `src/app.js`: render functions, state management, scenario switching, role filtering, drag and reset behavior.
- Create `tests/app.spec.js`: browser tests for initial render, scenario switching, role focus, drag/reset, and responsive overflow.
- Create `README.md`: local usage, testing, and teaching notes.

## Coordinate Conventions

- Use SVG `viewBox="0 0 100 100"` for the half-court drawing.
- Treat `x=0` as the left sideline, `x=100` as the right sideline, `y=0` as the half-court line, and `y=100` as the baseline.
- The basket is centered at approximately `{ x: 50, y: 92 }`.
- All scenario data uses percentage coordinates so the court can resize without recalculating positions.

## Task 1: Static App Shell And Test Harness

**Files:**
- Create: `package.json`
- Create: `playwright.config.js`
- Create: `index.html`
- Create: `src/styles.css`
- Create: `tests/app.spec.js`

- [ ] **Step 1: Create the first failing browser test**

Create `tests/app.spec.js`:

```js
const { test, expect } = require("@playwright/test");

test("loads the teaching page shell", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/2-3联防/);
  await expect(page.getByRole("heading", { name: "2-3联防轮转演示" })).toBeVisible();
  await expect(page.locator("#court")).toBeVisible();
  await expect(page.locator("#scenarioList")).toBeVisible();
  await expect(page.locator("#roleFilter")).toBeVisible();
});
```

- [ ] **Step 2: Add npm and Playwright configuration**

Create `package.json`:

```json
{
  "name": "twba-displaybook",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "test": "playwright test"
  },
  "devDependencies": {
    "@playwright/test": "^1.46.0",
    "vite": "^5.4.0"
  }
}
```

Create `playwright.config.js`:

```js
const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",
  use: {
    baseURL: "http://127.0.0.1:4173",
    viewport: { width: 1280, height: 800 }
  },
  webServer: {
    command: "npm run dev -- --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI
  }
});
```

- [ ] **Step 3: Run the test and confirm it fails before the page exists**

Run:

```bash
npm test
```

Expected: FAIL because `index.html` and visible app elements are not implemented yet.

- [ ] **Step 4: Create the static HTML shell**

Create `index.html`:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>2-3联防轮转演示</title>
    <link rel="stylesheet" href="./src/styles.css">
  </head>
  <body>
    <main class="app-shell">
      <section class="court-panel" aria-label="FIBA半场战术板">
        <div class="top-bar">
          <div>
            <p class="kicker">TWBA Displaybook</p>
            <h1>2-3联防轮转演示</h1>
          </div>
          <button id="resetBtn" class="icon-text-button" type="button">重置站位</button>
        </div>
        <div id="court" class="court-wrap" aria-label="FIBA半场"></div>
      </section>

      <aside class="side-panel" aria-label="情景与职责说明">
        <section>
          <h2>情景</h2>
          <div id="scenarioList" class="scenario-list" aria-label="情景列表"></div>
        </section>

        <section>
          <h2>视角</h2>
          <div id="roleFilter" class="role-filter" aria-label="号码筛选"></div>
        </section>

        <section class="display-controls" aria-label="显示控制">
          <label><input id="toggleArrows" type="checkbox" checked> 轮转箭头</label>
          <label><input id="toggleOffense" type="checkbox" checked> 进攻参照</label>
          <label><input id="toggleZones" type="checkbox" checked> 区域高亮</label>
        </section>

        <section id="explanation" class="explanation" aria-live="polite"></section>
      </aside>
    </main>
    <script src="./src/scenarios.js"></script>
    <script src="./src/app.js"></script>
  </body>
</html>
```

- [ ] **Step 5: Add minimal styles needed for the shell**

Create `src/styles.css`:

```css
:root {
  color-scheme: light;
  --ink: #17202a;
  --muted: #5d6975;
  --panel: #f7f9fb;
  --line: #d7dee8;
  --court: #f2c17b;
  --court-line: #ffffff;
  --defense: #155e75;
  --defense-focus: #0f3f53;
  --ball: #d97706;
  --offense: #7c8794;
  --rotation: #0f766e;
  --help: #2563eb;
  --pass: #9333ea;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  background: #eef2f6;
  color: var(--ink);
  font-family: Arial, "Microsoft YaHei", sans-serif;
}

button,
input {
  font: inherit;
}

.app-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(0, 7fr) minmax(320px, 3fr);
  gap: 16px;
  padding: 16px;
}

.court-panel,
.side-panel {
  min-width: 0;
}

.top-bar {
  min-height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.kicker {
  margin: 0 0 4px;
  color: var(--muted);
  font-size: 13px;
}

h1,
h2,
p {
  margin-top: 0;
}

h1 {
  margin-bottom: 0;
  font-size: 30px;
}

h2 {
  font-size: 18px;
}

.court-wrap {
  width: 100%;
  aspect-ratio: 15 / 14;
  max-height: calc(100vh - 112px);
  border: 1px solid var(--line);
  background: var(--court);
  overflow: hidden;
}

.side-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background: var(--panel);
  border-left: 1px solid var(--line);
  overflow-y: auto;
}

.scenario-list,
.role-filter {
  display: grid;
  gap: 8px;
}

.scenario-list button,
.role-filter button,
.icon-text-button {
  min-height: 40px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #ffffff;
  color: var(--ink);
  cursor: pointer;
}

.scenario-list button[aria-pressed="true"],
.role-filter button[aria-pressed="true"] {
  border-color: var(--defense);
  background: #e8f6f8;
}

.display-controls {
  display: grid;
  gap: 8px;
  color: var(--muted);
}

@media (max-width: 860px) {
  .app-shell {
    grid-template-columns: 1fr;
    padding: 10px;
  }

  .side-panel {
    border-left: 0;
    border-top: 1px solid var(--line);
  }

  h1 {
    font-size: 24px;
  }
}
```

- [ ] **Step 6: Run the shell test and commit**

Run:

```bash
npm test
```

Expected: PASS for `loads the teaching page shell`.

Commit:

```bash
git add package.json playwright.config.js index.html src/styles.css tests/app.spec.js
git commit -m "feat: scaffold static defense demo shell"
```

## Task 2: Scenario Data Model

**Files:**
- Create: `src/scenarios.js`
- Modify: `tests/app.spec.js`

- [ ] **Step 1: Add a failing scenario data test**

Append to `tests/app.spec.js`:

```js
test("exposes six complete defensive scenarios", async ({ page }) => {
  await page.goto("/");
  const scenarioSummary = await page.evaluate(() => {
    return window.TWBA_SCENARIOS.map((scenario) => ({
      id: scenario.id,
      defenderCount: Object.keys(scenario.defenders).length,
      responsibilityCount: Object.keys(scenario.responsibilities).length,
      hasBall: Boolean(scenario.ball),
      hasPrinciple: scenario.principle.length > 0
    }));
  });

  expect(scenarioSummary).toHaveLength(6);
  for (const scenario of scenarioSummary) {
    expect(scenario.defenderCount).toBe(5);
    expect(scenario.responsibilityCount).toBe(5);
    expect(scenario.hasBall).toBe(true);
    expect(scenario.hasPrinciple).toBe(true);
  }
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run:

```bash
npm test
```

Expected: FAIL because `window.TWBA_SCENARIOS` is not defined.

- [ ] **Step 3: Create the complete six-scenario data file**

Create `src/scenarios.js`:

```js
window.TWBA_SCENARIOS = [
  {
    id: "top",
    title: "球在弧顶正中",
    principle: "1号稍前压迫，后四人保持互相补位距离，先建立整体重心。",
    ball: { x: 50, y: 20 },
    offense: [
      { id: "O1", label: "持球", x: 50, y: 20 },
      { id: "O2", label: "翼侧", x: 22, y: 38 },
      { id: "O3", label: "翼侧", x: 78, y: 38 }
    ],
    defenders: {
      "1": { x: 48, y: 28, status: "pressure" },
      "2": { x: 62, y: 34, status: "contain" },
      "3": { x: 27, y: 67, status: "baseline" },
      "4": { x: 73, y: 67, status: "baseline" },
      "5": { x: 50, y: 61, status: "middle" }
    },
    arrows: [
      { from: { x: 48, y: 33 }, to: { x: 48, y: 25 }, type: "rotation", roles: ["1"] },
      { from: { x: 50, y: 61 }, to: { x: 50, y: 55 }, type: "help", roles: ["5"] }
    ],
    zones: [
      { id: "middle", label: "中路", x: 38, y: 36, width: 24, height: 36, type: "middle" }
    ],
    responsibilities: {
      "1": { where: "站在弧顶持球人前方半步到一步，身体略侧向，压住正面突破。", watch: "先看球，再看两侧第一传。", why: "让持球人不能舒服观察全场，迫使进攻先把球传到边线区域。" },
      "2": { where: "站在弧顶右侧与罚球线延长线之间，保持能补中也能扑翼侧。", watch: "看球、右侧翼位和高位接应。", why: "稳定上线第二层，避免1号压上后中路被直接打穿。" },
      "3": { where: "站在左侧短角到低位之间，离篮下保持一步半补位距离。", watch: "看左侧底角、篮下切入和球的第一传。", why: "守住底线入口，并准备在球到底角时外扩压迫。" },
      "4": { where: "站在右侧短角到低位之间，位置略向篮筐内收。", watch: "看右侧底角、篮下背切和弱侧篮板。", why: "弱侧底线人要优先保护篮下，再决定是否扑外线。" },
      "5": { where: "站在限制区上沿附近，正对球和篮筐。", watch: "看高位接球、中路切入和篮下人。", why: "5号是中路闸门，必须保证后排三人没有被拉散。" }
    },
    coachNotes: "强调起手不是五个人站点，而是五个人保持可补位距离。"
  },
  {
    id: "one-side-wing",
    title: "球到1号同侧45度",
    principle: "1号压球，全队向强侧旋转，形成接近1-3-1的防守重心。",
    ball: { x: 27, y: 38 },
    offense: [
      { id: "O1", label: "持球", x: 27, y: 38 },
      { id: "O2", label: "弧顶", x: 50, y: 22 },
      { id: "O3", label: "底角", x: 12, y: 78 },
      { id: "O4", label: "弱侧", x: 82, y: 45 }
    ],
    defenders: {
      "1": { x: 29, y: 44, status: "pressure" },
      "2": { x: 46, y: 43, status: "middle-line" },
      "3": { x: 24, y: 62, status: "middle-line" },
      "4": { x: 61, y: 75, status: "last-line" },
      "5": { x: 48, y: 61, status: "middle-line" }
    },
    arrows: [
      { from: { x: 45, y: 32 }, to: { x: 29, y: 44 }, type: "rotation", roles: ["1"] },
      { from: { x: 62, y: 34 }, to: { x: 46, y: 43 }, type: "rotation", roles: ["2"] },
      { from: { x: 73, y: 67 }, to: { x: 61, y: 75 }, type: "help", roles: ["4"] }
    ],
    zones: [
      { id: "strong-side", label: "强侧", x: 0, y: 30, width: 42, height: 70, type: "strong" },
      { id: "last-line", label: "最后保护", x: 50, y: 68, width: 28, height: 22, type: "last" }
    ],
    responsibilities: {
      "1": { where: "上前到持球人斜前方，压住中路突破，让球更难回到弧顶。", watch: "看球、持球人脚步和弧顶回传线。", why: "1号的压力决定全队能否把球赶向边线，而不是让进攻从中路重新组织。" },
      "2": { where: "横移到中间三人线外侧，既能补弧顶也能卡高位。", watch: "看弧顶回传、高位接应和弱侧转移。", why: "2号不能跟球过深，否则反向转移会直接打到空位。" },
      "3": { where: "从底线向上提到强侧腰位，和1号、5号形成夹击与补位角度。", watch: "看底角、短角和持球人底线突破。", why: "3号上提后，强侧不是单人防守，而是边线压迫区域。" },
      "4": { where: "从弱侧底线收缩到篮下偏弱侧，作为最后一层。", watch: "看篮下、弱侧底角和背切。", why: "当整体向强侧旋转时，4号必须先保护篮筐，不能站死在外线。" },
      "5": { where: "站在限制区中上部，略向强侧移动。", watch: "看高位、篮下和强侧突破。", why: "5号负责把中路关住，让1号和3号敢于给持球人压力。" }
    },
    coachNotes: "这是本页面的核心图：让队员看到旋转后的1-3-1轮廓。"
  },
  {
    id: "one-side-corner",
    title: "球到1号同侧底角",
    principle: "底角可以压迫，但3号外扩后，5号和4号必须补掉篮下空当。",
    ball: { x: 12, y: 79 },
    offense: [
      { id: "O1", label: "持球", x: 12, y: 79 },
      { id: "O2", label: "45度", x: 27, y: 38 },
      { id: "O3", label: "高位", x: 50, y: 49 },
      { id: "O4", label: "弱底", x: 88, y: 79 }
    ],
    defenders: {
      "1": { x: 24, y: 55, status: "trap-angle" },
      "2": { x: 46, y: 46, status: "deny-high" },
      "3": { x: 16, y: 75, status: "corner-pressure" },
      "4": { x: 60, y: 79, status: "last-line" },
      "5": { x: 42, y: 73, status: "rim" }
    },
    arrows: [
      { from: { x: 24, y: 62 }, to: { x: 16, y: 75 }, type: "rotation", roles: ["3"] },
      { from: { x: 29, y: 44 }, to: { x: 24, y: 55 }, type: "help", roles: ["1"] },
      { from: { x: 50, y: 61 }, to: { x: 42, y: 73 }, type: "help", roles: ["5"] }
    ],
    zones: [
      { id: "corner-trap", label: "底角压迫", x: 0, y: 68, width: 28, height: 30, type: "strong" },
      { id: "rim-cover", label: "篮下保护", x: 36, y: 70, width: 34, height: 22, type: "middle" }
    ],
    responsibilities: {
      "1": { where: "从压球位回收到45度与底角之间，堵回传并准备夹击。", watch: "看底角持球人、45度回传和突破启动。", why: "1号回收后，底角持球人不容易把球轻松传回上线。" },
      "2": { where: "站在罚球线延长线附近，卡住高位和弧顶回传。", watch: "看高位接球、弧顶空位和横传。", why: "如果2号太靠边，高位会成为进攻最舒服的出口。" },
      "3": { where: "外扩到持球人正前或斜前方，手臂封底线传球和突破。", watch: "看球、底线突破和短角人。", why: "底角空间小，3号可以主动施压，但身后必须有人补。" },
      "4": { where: "从弱侧底线收进篮下偏弱侧，准备补背后和弱侧篮板。", watch: "看篮下切入、弱侧底角和投篮篮板。", why: "3号外扩后，4号是篮下最后保护，先保近筐。" },
      "5": { where: "向强侧篮下移动，顶住篮下接应和底线突破。", watch: "看持球人突破路线、篮下人和高位下顺。", why: "5号补到篮下，才能让3号放心扑出到底角。" }
    },
    coachNotes: "强调底角压迫和篮下补位必须同时发生。"
  },
  {
    id: "opposite-wing",
    title: "球快速转移到另一侧45度",
    principle: "反向转移时先保中路和篮下，再完成新的强弱侧分配。",
    ball: { x: 76, y: 39 },
    offense: [
      { id: "O1", label: "持球", x: 76, y: 39 },
      { id: "O2", label: "弧顶", x: 50, y: 22 },
      { id: "O3", label: "底角", x: 88, y: 78 },
      { id: "O4", label: "弱侧", x: 18, y: 45 }
    ],
    defenders: {
      "1": { x: 48, y: 48, status: "recover" },
      "2": { x: 72, y: 45, status: "delay" },
      "3": { x: 39, y: 76, status: "last-line" },
      "4": { x: 76, y: 63, status: "middle-line" },
      "5": { x: 53, y: 62, status: "middle" }
    },
    arrows: [
      { from: { x: 24, y: 55 }, to: { x: 48, y: 48 }, type: "rotation", roles: ["1"] },
      { from: { x: 46, y: 43 }, to: { x: 72, y: 45 }, type: "rotation", roles: ["2"] },
      { from: { x: 61, y: 75 }, to: { x: 39, y: 76 }, type: "help", roles: ["3"] }
    ],
    zones: [
      { id: "middle-first", label: "先保中路", x: 36, y: 42, width: 28, height: 34, type: "middle" }
    ],
    responsibilities: {
      "1": { where: "从原强侧回落到中路协防位置，不追球到另一侧最深处。", watch: "看中路、高位和新的持球人突破方向。", why: "1号回落可以保护被快速转移拉开的中间空隙。" },
      "2": { where: "第一时间顶到新持球人的斜前方，先延误再等队友归位。", watch: "看球、突破和底角传球。", why: "2号先顶上可以避免对方转移后一接球就投或突。" },
      "3": { where: "从原强侧底线收成弱侧最后保护。", watch: "看篮下、弱侧背切和长篮板。", why: "反向转移时原强侧人不能停在边线，必须跟着阵型回收。" },
      "4": { where: "向新强侧上提，准备处理底角和短角。", watch: "看新强侧底角、短角和底线突破。", why: "4号成为新强侧底线防守人，要接上下一拍轮转。" },
      "5": { where: "留在中路偏篮下位置，脚步小幅横移。", watch: "看高位、中路切入和篮筐。", why: "5号不能被横传拉出篮下，先守住最危险区域。" }
    },
    coachNotes: "这个情景用于训练弱侧提前移动，不是等球到才开始跑。"
  },
  {
    id: "high-post",
    title: "球进入罚球线 / 高位",
    principle: "高位接球必须立刻收缩，中路不能让进攻舒服面筐。",
    ball: { x: 50, y: 51 },
    offense: [
      { id: "O1", label: "高位", x: 50, y: 51 },
      { id: "O2", label: "左翼", x: 24, y: 40 },
      { id: "O3", label: "右翼", x: 76, y: 40 },
      { id: "O4", label: "短角", x: 22, y: 78 },
      { id: "O5", label: "短角", x: 78, y: 78 }
    ],
    defenders: {
      "1": { x: 39, y: 45, status: "pinch" },
      "2": { x: 61, y: 45, status: "pinch" },
      "3": { x: 31, y: 75, status: "short-corner" },
      "4": { x: 69, y: 75, status: "short-corner" },
      "5": { x: 50, y: 58, status: "high-post" }
    },
    arrows: [
      { from: { x: 50, y: 64 }, to: { x: 50, y: 56 }, type: "rotation", roles: ["5"] },
      { from: { x: 29, y: 44 }, to: { x: 39, y: 45 }, type: "help", roles: ["1"] },
      { from: { x: 72, y: 45 }, to: { x: 61, y: 45 }, type: "help", roles: ["2"] }
    ],
    zones: [
      { id: "high-post-danger", label: "高位危险区", x: 39, y: 45, width: 22, height: 18, type: "middle" }
    ],
    responsibilities: {
      "1": { where: "向高位左侧收缩，保持能扑回左翼的距离。", watch: "看高位持球人、左翼回传和切入。", why: "1号收缩可以干扰高位向左侧和篮下的传球。" },
      "2": { where: "向高位右侧收缩，保持能扑回右翼的距离。", watch: "看高位持球人、右翼回传和切入。", why: "2号和1号一起压缩高位视野，降低高位策应质量。" },
      "3": { where: "收在左侧短角和篮下之间。", watch: "看左短角、篮下切入和弱侧篮板。", why: "高位被顶住时，进攻常找短角，3号要先占住线路。" },
      "4": { where: "收在右侧短角和篮下之间。", watch: "看右短角、篮下切入和弱侧篮板。", why: "4号要和3号一起保证底线没有空切通道。" },
      "5": { where: "顶到高位持球人身前，身体在球和篮筐之间。", watch: "看转身、下球和篮下传球。", why: "高位是联防核心漏洞，5号必须先让对方不能舒服面筐。" }
    },
    coachNotes: "强调5号顶上后，两个底线人必须同步更靠近篮下。"
  },
  {
    id: "shot-rebound",
    title: "投篮出手 / 篮板",
    principle: "投篮一出手，全队从看球轮转切换为找人卡位。",
    ball: { x: 76, y: 39 },
    offense: [
      { id: "O1", label: "投手", x: 76, y: 39 },
      { id: "O2", label: "冲抢", x: 35, y: 70 },
      { id: "O3", label: "弱侧", x: 84, y: 78 },
      { id: "O4", label: "长板", x: 50, y: 30 }
    ],
    defenders: {
      "1": { x: 49, y: 42, status: "long-rebound" },
      "2": { x: 73, y: 45, status: "shooter-box" },
      "3": { x: 36, y: 76, status: "box-out" },
      "4": { x: 70, y: 78, status: "box-out" },
      "5": { x: 50, y: 75, status: "box-out" }
    },
    arrows: [
      { from: { x: 50, y: 58 }, to: { x: 50, y: 75 }, type: "help", roles: ["5"] },
      { from: { x: 73, y: 45 }, to: { x: 76, y: 39 }, type: "help", roles: ["2"] }
    ],
    zones: [
      { id: "rebound-zone", label: "篮板区", x: 28, y: 64, width: 44, height: 28, type: "last" }
    ],
    responsibilities: {
      "1": { where: "卡住罚球线以上区域，准备控制长篮板和第一传。", watch: "看外线投手、长篮板落点和对方后卫。", why: "上线不回头找人会被对方拿到长篮板继续进攻。" },
      "2": { where: "贴近投手侧上线，投篮后先碰人再看球。", watch: "看投手落地、长篮板和右翼冲抢。", why: "2号要防止投手自己跟进或外线二次进攻。" },
      "3": { where: "卡住左侧底线和弱侧冲抢路线。", watch: "看身边进攻人、篮板弹向和底线空切。", why: "联防没有天然对位，3号必须主动找最近的人卡住。" },
      "4": { where: "卡住右侧底线和投手侧冲抢路线。", watch: "看底角、篮下人和球弹向。", why: "4号负责新强侧底线篮板，不能只站着看球。" },
      "5": { where: "站在篮筐前方，先找中路进攻人身体接触。", watch: "看篮下人、球弹向和二次起跳。", why: "5号是篮板核心，先卡住中路人才能让队友收球。" }
    },
    coachNotes: "联防篮板靠主动找人，不靠固定对位。"
  }
];
```

- [ ] **Step 4: Run the scenario data test and commit**

Run:

```bash
npm test
```

Expected: PASS for shell and scenario data tests.

Commit:

```bash
git add src/scenarios.js tests/app.spec.js
git commit -m "feat: add 2-3 zone scenario data"
```

## Task 3: SVG Court Rendering

**Files:**
- Modify: `src/app.js`
- Modify: `src/styles.css`
- Modify: `tests/app.spec.js`

- [ ] **Step 1: Add failing render test**

Append to `tests/app.spec.js`:

```js
test("renders the default court state from scenario data", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("svg.court-svg")).toBeVisible();
  await expect(page.locator("[data-marker='defender']")).toHaveCount(5);
  await expect(page.locator("[data-marker='ball']")).toHaveCount(1);
  await expect(page.locator("[data-marker='offense']")).toHaveCount(3);
  await expect(page.getByRole("button", { name: "球在弧顶正中" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#explanation")).toContainText("1号稍前压迫");
});
```

- [ ] **Step 2: Create the renderer**

Create `src/app.js`:

```js
const state = {
  scenarioId: window.TWBA_SCENARIOS[0].id,
  focusedRole: "all",
  showArrows: true,
  showOffense: true,
  showZones: true,
  positions: structuredClone(window.TWBA_SCENARIOS[0].defenders),
  ball: structuredClone(window.TWBA_SCENARIOS[0].ball)
};

const court = document.querySelector("#court");
const scenarioList = document.querySelector("#scenarioList");
const roleFilter = document.querySelector("#roleFilter");
const explanation = document.querySelector("#explanation");
const resetBtn = document.querySelector("#resetBtn");
const toggleArrows = document.querySelector("#toggleArrows");
const toggleOffense = document.querySelector("#toggleOffense");
const toggleZones = document.querySelector("#toggleZones");

function getScenario() {
  return window.TWBA_SCENARIOS.find((scenario) => scenario.id === state.scenarioId);
}

function pointAttrs(point) {
  return `cx="${point.x}" cy="${point.y}"`;
}

function renderCourt() {
  const scenario = getScenario();
  const zones = state.showZones
    ? scenario.zones.map((zone) => `<rect class="zone zone-${zone.type}" x="${zone.x}" y="${zone.y}" width="${zone.width}" height="${zone.height}"><title>${zone.label}</title></rect>`).join("")
    : "";
  const offense = state.showOffense
    ? scenario.offense.map((player) => `<g data-marker="offense" class="offense-marker"><circle ${pointAttrs(player)} r="2.8"></circle><text x="${player.x}" y="${player.y + 1.1}">${player.label}</text></g>`).join("")
    : "";
  const arrows = state.showArrows
    ? scenario.arrows.map((arrow, index) => `<line class="arrow arrow-${arrow.type}" data-arrow-role="${arrow.roles.join(" ")}" x1="${arrow.from.x}" y1="${arrow.from.y}" x2="${arrow.to.x}" y2="${arrow.to.y}" marker-end="url(#arrow-${arrow.type})"><title>${arrow.type}</title></line>`).join("")
    : "";
  const defenders = Object.entries(state.positions).map(([role, point]) => {
    const focused = state.focusedRole === "all" || state.focusedRole === role;
    return `<g data-marker="defender" data-role="${role}" class="defender-marker ${focused ? "is-focused" : "is-muted"}" tabindex="0" role="button" aria-label="${role}号防守人" transform="translate(${point.x} ${point.y})"><circle r="4.2"></circle><text y="1.4">${role}</text></g>`;
  }).join("");

  court.innerHTML = `
    <svg class="court-svg" viewBox="0 0 100 100" aria-label="FIBA半场示意图">
      <defs>
        <marker id="arrow-rotation" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z"></path></marker>
        <marker id="arrow-help" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z"></path></marker>
        <marker id="arrow-pass" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z"></path></marker>
      </defs>
      <rect class="court-bg" x="0" y="0" width="100" height="100"></rect>
      ${zones}
      <line class="court-line" x1="0" y1="0" x2="100" y2="0"></line>
      <rect class="court-line-fill" x="34" y="58" width="32" height="36"></rect>
      <circle class="court-line no-fill" cx="50" cy="58" r="12"></circle>
      <path class="court-line no-fill" d="M 8 100 A 42 42 0 0 1 92 100"></path>
      <circle class="court-line no-fill" cx="50" cy="92" r="2"></circle>
      <path class="court-line no-fill" d="M 44 92 A 6 6 0 0 1 56 92"></path>
      ${offense}
      ${arrows}
      <g data-marker="ball" class="ball-marker"><circle ${pointAttrs(state.ball)} r="2.2"></circle></g>
      ${defenders}
    </svg>
  `;
}

function renderScenarioButtons() {
  scenarioList.innerHTML = window.TWBA_SCENARIOS.map((scenario) => {
    const active = scenario.id === state.scenarioId;
    return `<button type="button" data-scenario="${scenario.id}" aria-pressed="${active}">${scenario.title}</button>`;
  }).join("");
}

function renderRoleButtons() {
  const roles = ["all", "1", "2", "3", "4", "5"];
  roleFilter.innerHTML = roles.map((role) => {
    const label = role === "all" ? "全部" : `${role}号`;
    return `<button type="button" data-role-filter="${role}" aria-pressed="${state.focusedRole === role}">${label}</button>`;
  }).join("");
}

function renderExplanation() {
  const scenario = getScenario();
  const roles = state.focusedRole === "all" ? ["1", "2", "3", "4", "5"] : [state.focusedRole];
  const cards = roles.map((role) => {
    const item = scenario.responsibilities[role];
    return `<article class="responsibility-card"><h3>${role}号</h3><p><strong>站哪里：</strong>${item.where}</p><p><strong>看什么：</strong>${item.watch}</p><p><strong>为什么：</strong>${item.why}</p></article>`;
  }).join("");

  explanation.innerHTML = `<h2>${scenario.title}</h2><p class="principle">${scenario.principle}</p>${cards}<p class="coach-note">${scenario.coachNotes}</p>`;
}

function render() {
  renderScenarioButtons();
  renderRoleButtons();
  renderCourt();
  renderExplanation();
}

function loadScenario(id) {
  const scenario = window.TWBA_SCENARIOS.find((item) => item.id === id);
  state.scenarioId = scenario.id;
  state.positions = structuredClone(scenario.defenders);
  state.ball = structuredClone(scenario.ball);
  render();
}

scenarioList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-scenario]");
  if (button) loadScenario(button.dataset.scenario);
});

roleFilter.addEventListener("click", (event) => {
  const button = event.target.closest("[data-role-filter]");
  if (!button) return;
  state.focusedRole = button.dataset.roleFilter;
  render();
});

resetBtn.addEventListener("click", () => loadScenario(state.scenarioId));
toggleArrows.addEventListener("change", () => { state.showArrows = toggleArrows.checked; render(); });
toggleOffense.addEventListener("change", () => { state.showOffense = toggleOffense.checked; render(); });
toggleZones.addEventListener("change", () => { state.showZones = toggleZones.checked; render(); });

render();
```

- [ ] **Step 3: Add SVG and explanation styles**

Append to `src/styles.css`:

```css
.court-svg {
  display: block;
  width: 100%;
  height: 100%;
}

.court-bg {
  fill: var(--court);
}

.court-line,
.court-line-fill {
  stroke: var(--court-line);
  stroke-width: 0.8;
}

.court-line-fill {
  fill: transparent;
}

.no-fill {
  fill: none;
}

.zone {
  opacity: 0.18;
}

.zone-strong {
  fill: #ef4444;
}

.zone-middle {
  fill: #2563eb;
}

.zone-last {
  fill: #16a34a;
}

.offense-marker circle {
  fill: #f4f6f8;
  stroke: var(--offense);
  stroke-width: 0.7;
}

.offense-marker text {
  fill: var(--offense);
  font-size: 3px;
  text-anchor: middle;
  pointer-events: none;
}

.ball-marker circle {
  fill: var(--ball);
  stroke: #7c2d12;
  stroke-width: 0.5;
}

.defender-marker {
  cursor: grab;
}

.defender-marker circle {
  fill: var(--defense);
  stroke: #ffffff;
  stroke-width: 0.8;
}

.defender-marker text {
  fill: #ffffff;
  font-size: 4px;
  font-weight: 700;
  text-anchor: middle;
  pointer-events: none;
}

.defender-marker.is-muted {
  opacity: 0.34;
}

.defender-marker.is-focused circle {
  fill: var(--defense-focus);
}

.arrow {
  fill: none;
  stroke-width: 1.1;
  stroke-linecap: round;
}

.arrow-rotation,
#arrow-rotation path {
  stroke: var(--rotation);
  fill: var(--rotation);
}

.arrow-help,
#arrow-help path {
  stroke: var(--help);
  fill: var(--help);
}

.arrow-pass,
#arrow-pass path {
  stroke: var(--pass);
  fill: var(--pass);
}

.principle {
  color: var(--muted);
  line-height: 1.55;
}

.responsibility-card {
  margin-top: 10px;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #ffffff;
}

.responsibility-card h3 {
  margin: 0 0 8px;
  font-size: 17px;
}

.responsibility-card p,
.coach-note {
  margin: 6px 0;
  line-height: 1.55;
}

.coach-note {
  color: var(--muted);
}
```

- [ ] **Step 4: Run render tests and commit**

Run:

```bash
npm test
```

Expected: PASS for shell, data, and render tests.

Commit:

```bash
git add src/app.js src/styles.css tests/app.spec.js
git commit -m "feat: render zone defense court"
```

## Task 4: Scenario Switching, Role Focus, And Display Toggles

**Files:**
- Modify: `src/app.js`
- Modify: `src/styles.css`
- Modify: `tests/app.spec.js`

- [ ] **Step 1: Add failing interaction tests**

Append to `tests/app.spec.js`:

```js
test("switches scenarios and updates explanation", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "球到1号同侧45度" }).click();
  await expect(page.getByRole("button", { name: "球到1号同侧45度" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#explanation")).toContainText("形成接近1-3-1的防守重心");
  await expect(page.locator("[data-role='4']")).toBeVisible();
});

test("focuses one role and mutes the other defenders", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "4号" }).click();
  await expect(page.locator("#explanation")).toContainText("4号");
  await expect(page.locator("#explanation")).not.toContainText("1号不是盲目抢断");
  await expect(page.locator("[data-role='4']")).toHaveClass(/is-focused/);
  await expect(page.locator("[data-role='1']")).toHaveClass(/is-muted/);
});

test("toggles arrows offense markers and zones", async ({ page }) => {
  await page.goto("/");
  await page.locator("#toggleArrows").uncheck();
  await expect(page.locator(".arrow")).toHaveCount(0);
  await page.locator("#toggleOffense").uncheck();
  await expect(page.locator("[data-marker='offense']")).toHaveCount(0);
  await page.locator("#toggleZones").uncheck();
  await expect(page.locator(".zone")).toHaveCount(0);
});
```

- [ ] **Step 2: Refine role-specific arrow visibility**

Modify the arrow rendering line in `src/app.js` so focused roles show only relevant arrows:

```js
  const visibleArrows = scenario.arrows.filter((arrow) => {
    return state.focusedRole === "all" || arrow.roles.includes(state.focusedRole);
  });
  const arrows = state.showArrows
    ? visibleArrows.map((arrow) => `<line class="arrow arrow-${arrow.type}" data-arrow-role="${arrow.roles.join(" ")}" x1="${arrow.from.x}" y1="${arrow.from.y}" x2="${arrow.to.x}" y2="${arrow.to.y}" marker-end="url(#arrow-${arrow.type})"><title>${arrow.type}</title></line>`).join("")
    : "";
```

- [ ] **Step 3: Run interaction tests and commit**

Run:

```bash
npm test
```

Expected: PASS for scenario switching, role focus, and display toggles.

Commit:

```bash
git add src/app.js tests/app.spec.js
git commit -m "feat: add scenario and role controls"
```

## Task 5: Dragging And Reset Behavior

**Files:**
- Modify: `src/app.js`
- Modify: `src/styles.css`
- Modify: `tests/app.spec.js`

- [ ] **Step 1: Add failing drag and reset test**

Append to `tests/app.spec.js`:

```js
test("drags a defender and reset restores the scenario default", async ({ page }) => {
  await page.goto("/");
  const defender = page.locator("[data-role='1']");
  const before = await defender.evaluate((node) => node.getAttribute("transform"));
  const box = await defender.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 80, box.y + box.height / 2 + 40);
  await page.mouse.up();
  const afterDrag = await defender.evaluate((node) => node.getAttribute("transform"));
  expect(afterDrag).not.toBe(before);
  await page.getByRole("button", { name: "重置站位" }).click();
  await expect(defender).toHaveAttribute("transform", before);
});

test("drags the ball marker", async ({ page }) => {
  await page.goto("/");
  const ball = page.locator("[data-marker='ball']");
  const before = await ball.locator("circle").evaluate((node) => `${node.getAttribute("cx")},${node.getAttribute("cy")}`);
  const box = await ball.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 - 60, box.y + box.height / 2 + 30);
  await page.mouse.up();
  const after = await ball.locator("circle").evaluate((node) => `${node.getAttribute("cx")},${node.getAttribute("cy")}`);
  expect(after).not.toBe(before);
});
```

- [ ] **Step 2: Add pointer-based dragging**

Append these functions and event listeners in `src/app.js` before the final `render();` call:

```js
let dragTarget = null;

function svgPointFromEvent(event) {
  const svg = court.querySelector("svg");
  const rect = svg.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;
  return {
    x: Math.max(2, Math.min(98, Number(x.toFixed(1)))),
    y: Math.max(2, Math.min(98, Number(y.toFixed(1))))
  };
}

court.addEventListener("pointerdown", (event) => {
  const defender = event.target.closest("[data-marker='defender']");
  const ball = event.target.closest("[data-marker='ball']");
  if (!defender && !ball) return;
  dragTarget = defender ? { type: "defender", role: defender.dataset.role } : { type: "ball" };
  court.setPointerCapture(event.pointerId);
});

court.addEventListener("pointermove", (event) => {
  if (!dragTarget) return;
  const point = svgPointFromEvent(event);
  if (dragTarget.type === "defender") {
    state.positions[dragTarget.role] = {
      ...state.positions[dragTarget.role],
      x: point.x,
      y: point.y
    };
  } else {
    state.ball = point;
  }
  renderCourt();
});

court.addEventListener("pointerup", (event) => {
  dragTarget = null;
  if (court.hasPointerCapture(event.pointerId)) {
    court.releasePointerCapture(event.pointerId);
  }
});
```

- [ ] **Step 3: Add drag-specific styles**

Append to `src/styles.css`:

```css
.court-wrap {
  touch-action: none;
}

.ball-marker {
  cursor: grab;
}

.defender-marker:active,
.ball-marker:active {
  cursor: grabbing;
}
```

- [ ] **Step 4: Run drag tests and commit**

Run:

```bash
npm test
```

Expected: PASS for drag and reset tests.

Commit:

```bash
git add src/app.js src/styles.css tests/app.spec.js
git commit -m "feat: support manual court adjustments"
```

## Task 6: Responsive Polish And Projection Readability

**Files:**
- Modify: `src/styles.css`
- Modify: `tests/app.spec.js`

- [ ] **Step 1: Add viewport overflow tests**

Append to `tests/app.spec.js`:

```js
for (const size of [
  { width: 1280, height: 800 },
  { width: 390, height: 844 }
]) {
  test(`does not horizontally overflow at ${size.width}px`, async ({ page }) => {
    await page.setViewportSize(size);
    await page.goto("/");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
  });
}
```

- [ ] **Step 2: Tighten responsive layout and readable controls**

Append to `src/styles.css`:

```css
.scenario-list button {
  padding: 8px 10px;
  text-align: left;
  line-height: 1.35;
}

.role-filter {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.role-filter button {
  padding: 0 8px;
}

@media (min-width: 1200px) {
  .scenario-list {
    grid-template-columns: 1fr 1fr;
  }

  .responsibility-card p,
  .principle,
  .coach-note {
    font-size: 16px;
  }
}

@media (max-width: 520px) {
  .top-bar {
    align-items: stretch;
    flex-direction: column;
  }

  .icon-text-button {
    width: 100%;
  }

  .court-wrap {
    aspect-ratio: 15 / 14;
    max-height: none;
  }

  .role-filter {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
```

- [ ] **Step 3: Run responsive tests and commit**

Run:

```bash
npm test
```

Expected: PASS for desktop and mobile overflow tests.

Commit:

```bash
git add src/styles.css tests/app.spec.js
git commit -m "style: improve projection and mobile layout"
```

## Task 7: README And Final Verification

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create usage documentation**

Create `README.md`:

```md
# TWBA Displaybook

静态 HTML 篮球战术演示页面，用于讲解公司临时篮球队的 2-3 联防轮转。

## 使用方式

直接打开 `index.html` 即可使用页面。现场投屏建议使用桌面浏览器全屏模式。

## 本地开发

```bash
npm install
npm run dev
```

打开 Vite 输出的本地地址。

## 验证

```bash
npm test
```

测试覆盖页面加载、六个情景数据、SVG 球场渲染、情景切换、号码筛选、显示开关、拖动微调、重置站位和响应式横向溢出。

## 教学重点

第一版聚焦防守端。核心策略是 2-3 起手，1号上线前压，全队随球向强侧旋转，形成接近 1-3-1 的防守重心。进攻方只作为球位和传球方向参照，不展开破解联防教学。
```

- [ ] **Step 2: Run the full test suite**

Run:

```bash
npm test
```

Expected: all tests PASS.

- [ ] **Step 3: Manually inspect the page**

Run:

```bash
npm run dev -- --port 4173
```

Open:

```text
http://127.0.0.1:4173
```

Check:

- Default scenario is “球在弧顶正中”.
- All six scenario buttons switch court state and text.
- Role buttons show all roles or a single role.
- Defender `1` to `5` and the ball can be dragged.
- Reset restores the current scenario.
- The page remains readable at desktop projection size and phone width.

- [ ] **Step 4: Commit docs**

Commit:

```bash
git add README.md
git commit -m "docs: add displaybook usage notes"
```

- [ ] **Step 5: Final status check**

Run:

```bash
git status --short --branch
```

Expected: branch is clean except for intentionally uncommitted files created outside this plan.

## Self-Review

Spec coverage:

- Six core scenarios are implemented by Task 2.
- FIBA half-court visual is implemented by Task 3.
- Scenario switching is implemented by Task 4.
- Role focus is implemented by Task 4.
- Display controls are implemented by Task 4.
- Manual dragging and reset are implemented by Task 5.
- Responsive projection and mobile readability are implemented by Task 6.
- Direct static use and developer usage notes are covered by Task 7.

Type consistency:

- Scenario fields are consistently named `id`, `title`, `principle`, `ball`, `offense`, `defenders`, `arrows`, `zones`, `responsibilities`, and `coachNotes`.
- Role ids are string keys `"1"` through `"5"` everywhere.
- Coordinate points use `{ x, y }` values in the 0-100 SVG coordinate system.

Scope:

- The plan builds a single static teaching page.
- It does not add backend services, account systems, cloud sync, export flows, or attack-side teaching modules.
