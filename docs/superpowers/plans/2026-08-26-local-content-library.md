# 本地内容库 Implementation Plan

> **For agentic workers:** REQUIRED EXECUTION: 本项目用户指定默认不使用 subagent，由 main agent 按本计划 task-by-task 执行。Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将当前 2-3 联防演示内容迁移为 IndexedDB 本地内容库，并支持 JSON 导入、删除导入内容、恢复内置默认内容。

**Architecture:** 保持纯静态 HTML，不引入构建流程。内置战术包作为浏览器侧种子数据，`content-service` 统一向页面提供当前战术包和情景列表，`app.js` 只负责渲染和交互状态。

**Tech Stack:** HTML、CSS、原生 JavaScript、IndexedDB、JSON 文件导入、Node.js 语法校验。

---

## 文件边界

- `src/builtin-content.js`：内置默认内容包，替代旧 `src/scenarios.js`。
- `src/content-validation.js`：校验 JSON 注册包、坐标、角色职责和基础字段。
- `src/content-db.js`：封装 IndexedDB 打开、读取、写入、删除和重置。
- `src/content-service.js`：封装内置种子、导入、删除、恢复默认和 UI 所需查询。
- `src/app.js`：改为异步加载内容库，增加战术包选择、导入、删除、恢复默认的事件处理。
- `src/styles.css`：补充内容管理区、状态提示和错误提示样式。
- `index.html`：替换脚本加载顺序，加入内容库操作控件。
- `README.md`：更新使用方式和 JSON 导入格式。

## 任务

### Task 1: 迁移内置数据

**Files:**
- Create: `src/builtin-content.js`
- Delete: `src/scenarios.js`
- Modify: `index.html`

- [ ] **Step 1: 将当前 6 个情景包装为标准 playbook**

在 `src/builtin-content.js` 暴露：

```js
window.TWBA_BUILTIN_PLAYBOOKS = [
  {
    schemaVersion: 1,
    playbook: {
      id: "zone-2-3-rotated-131",
      title: "2-3联防：强侧旋转",
      type: "defense",
      version: "1.0.0",
      description: "默认上线两名防守人中1号位相对靠前，整体随强侧上提形成近似旋转后的1-3-1。",
      source: "builtin"
    },
    scenarios: [
      // 从 src/scenarios.js 原样迁移当前 6 个情景
    ]
  }
];
```

- [ ] **Step 2: 调整脚本入口**

将 `index.html` 的 `src/scenarios.js` 替换为 `src/builtin-content.js`，后续任务再加入数据库脚本。

- [ ] **Step 3: 运行语法校验**

```powershell
node --check src\builtin-content.js
```

Expected: 输出不报错。

### Task 2: 增加内容校验模块

**Files:**
- Create: `src/content-validation.js`

- [ ] **Step 1: 实现注册包校验**

提供 `window.TWBAContentValidation.validateContentPackage(packageData)`，返回规范化后的 `{ schemaVersion, playbook, scenarios }`，并在错误时抛出包含中文可操作信息的 `Error`。

校验规则：

```js
schemaVersion === 1
playbook.id/title/type/version 必填
playbook.type in ["defense", "offense"]
scenarios 是非空数组
ball.x/ball.y 坐标在 0-100
offense 坐标在 0-100
defenders 必须包含 "1" 到 "5"，坐标在 0-100
responsibilities 必须包含 "1" 到 "5"
```

- [ ] **Step 2: 暴露辅助方法**

暴露 `normalizePackageSource(packageData, source)`，导入包强制写入 `source: "imported"`，内置包写入 `source: "builtin"`。

- [ ] **Step 3: 运行语法校验**

```powershell
node --check src\content-validation.js
```

Expected: 输出不报错。

### Task 3: 增加 IndexedDB 封装

**Files:**
- Create: `src/content-db.js`

- [ ] **Step 1: 实现数据库结构**

数据库名为 `twba-displaybook`，版本 `1`，对象仓库：

```js
playbooks: keyPath "id", indexes "type", "source", "updatedAt"
scenarios: keyPath "uid", indexes "playbookId", "sortOrder"
```

- [ ] **Step 2: 实现基础方法**

暴露 `window.TWBAContentDB`：

```js
open()
getPlaybooks()
getScenarios(playbookId)
savePackage(contentPackage)
deletePlaybook(playbookId)
clearAll()
```

`savePackage` 写入 `uid = playbookId + ":" + scenario.id`。

- [ ] **Step 3: 运行语法校验**

```powershell
node --check src\content-db.js
```

Expected: 输出不报错。

### Task 4: 增加内容服务

**Files:**
- Create: `src/content-service.js`

- [ ] **Step 1: 初始化内置内容**

暴露 `window.TWBAContentService.init()`，打开 IndexedDB，校验并写入内置包；IndexedDB 打开失败时回退到内存内置内容。

- [ ] **Step 2: 提供 UI 查询与操作**

提供：

```js
getLibrary()
getPlaybook(playbookId)
importPackage(packageData)
deleteImportedPlaybook(playbookId)
restoreBuiltin()
```

`getLibrary()` 返回 `{ playbooks, fallback, message }`，其中每个 playbook 带有 `scenarios`。

- [ ] **Step 3: 运行语法校验**

```powershell
node --check src\content-service.js
```

Expected: 输出不报错。

### Task 5: 接入页面 UI

**Files:**
- Modify: `index.html`
- Modify: `src/app.js`
- Modify: `src/styles.css`

- [ ] **Step 1: 增加内容库控件**

在侧栏情景区上方加入战术包选择、类型标签、导入 JSON、删除导入内容、恢复默认内容和状态提示。

- [ ] **Step 2: 改造 `app.js` 初始化**

将同步读取 `window.TWBA_SCENARIOS` 改为：

```js
const library = await window.TWBAContentService.init();
state.playbookId = library.playbooks[0].id;
state.scenarios = library.playbooks[0].scenarios;
```

页面渲染仍复用当前 `renderCourt()`、`renderScenarioButtons()`、`renderExplanation()` 等函数。

- [ ] **Step 3: 增加导入/删除/恢复事件**

导入 JSON 时读取文件、`JSON.parse`、调用 `importPackage`，如 ID 重复用 `confirm()` 确认替换；删除仅允许 `source: "imported"`；恢复默认调用 `restoreBuiltin()`。

- [ ] **Step 4: 样式收口**

内容库控件保持紧凑，不改动主画板比例；错误和成功提示用文本状态条呈现。

### Task 6: 文档与本地验证

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 更新 README**

说明 IndexedDB 本地保存、JSON 导入格式、删除导入内容、恢复内置默认内容，以及仍可直接打开 `index.html` 使用。

- [ ] **Step 2: 运行全部 JS 语法校验**

```powershell
node --check src\builtin-content.js
node --check src\content-validation.js
node --check src\content-db.js
node --check src\content-service.js
node --check src\app.js
```

Expected: 全部无报错。

- [ ] **Step 3: 运行内置数据结构校验**

用 Node 加载 `src/builtin-content.js` 并断言：

```js
schemaVersion === 1
playbook.type === "defense"
scenarios.length === 6
每个情景 defenders 包含 1-5
每个情景 responsibilities 包含 1-5
所有坐标在 0-100
```

Expected: 输出 `builtin content ok`。

- [ ] **Step 4: 提交实现**

```powershell
git add index.html README.md src docs
git commit -m "feat: add local content library"
```

Expected: 生成实现提交，工作区干净。

## 自审

- Spec coverage: 覆盖 IndexedDB、攻防类型、JSON 导入、删除导入内容、恢复内置默认、内置 6 个防守情景和纯静态页面。
- Placeholder scan: 无 `TBD`、`TODO`、`implement later`、`fill in details`。
- Type consistency: `playbook.id`、`scenario.playbookId`、`uid`、`source`、`type` 字段与 spec 保持一致。
