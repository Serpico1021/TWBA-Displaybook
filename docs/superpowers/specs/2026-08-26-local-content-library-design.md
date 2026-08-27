# 本地内容库设计

## 目标

为篮球战术展示页建立本地内容库，让战术内容以结构化标准数据注册，而不是只存在于 `src/scenarios.js` 的硬编码数组中。

第一版继续保持纯静态 HTML 页面。浏览器侧使用 IndexedDB 作为本地数据库，通过标准 JSON 文件导入新内容，并保留当前 2-3 联防演示作为内置默认内容。

## 建设目标

- 将战术内容写入标准本地数据库结构。
- 使用 `type: "defense"` 和 `type: "offense"` 区分防守 / 进攻内容。
- 后续注册新战术包时，不需要改动渲染逻辑。
- 页面仍支持直接打开 `index.html` 使用。
- 支持 JSON 导入、删除导入内容、恢复默认内容。
- 本阶段不引入 npm、Playwright、后端服务或构建工具。

## 非目标

- 不做浏览器内可视化情景编辑器。
- 不使用 SQLite 或服务端数据库。
- 不做账号、云同步或多设备共享。
- 不搭建浏览器自动化测试。
- 不引入完整 JSON Schema 依赖，校验使用本地小函数完成。

## 当前状态

应用当前渲染一个硬编码全局数组：

- `src/scenarios.js` 定义 `window.TWBA_SCENARIOS`。
- `src/app.js` 直接读取该数组，并渲染球场、控制区、号码筛选、文字说明和拖动状态。
- 拖动后的站位只保存在页面内存状态中。

这个结构适合第一版静态演示，但无法为新的进攻或防守内容提供稳定注册边界。

## 推荐架构

使用 IndexedDB 作为本地数据库，使用 JSON 文件作为内容注册包。

应用分为三层内容来源：

1. 内置种子数据：由当前 6 个防守情景转换成默认战术包。
2. 本地数据库：IndexedDB 保存所有可用战术包和情景。
3. 渲染状态：`src/app.js` 渲染当前选中战术包的情景，并继续把临时拖动调整保存在内存中。

渲染层不再直接依赖 `window.TWBA_SCENARIOS`，而是从内容服务拿到当前情景列表。

## 数据模型

### Playbook

`playbook` 表示一套已注册的战术内容。

```json
{
  "id": "zone-2-3-rotated-131",
  "title": "2-3联防：强侧旋转",
  "type": "defense",
  "version": "1.0.0",
  "description": "公司篮球队 2-3 联防入门内容",
  "source": "builtin",
  "createdAt": "2026-08-26T00:00:00.000Z",
  "updatedAt": "2026-08-26T00:00:00.000Z"
}
```

必填字段：

- `id`：稳定唯一字符串。
- `title`：展示名称。
- `type`：只能是 `defense` 或 `offense`。
- `version`：内容版本字符串。
- `source`：只能是 `builtin` 或 `imported`。

可选字段：

- `description`
- `createdAt`
- `updatedAt`

### Scenario

`scenario` 表示战术包中的一个具体图示和说明。

```json
{
  "id": "one-side-wing",
  "playbookId": "zone-2-3-rotated-131",
  "sortOrder": 20,
  "phase": "rotation",
  "title": "球到1号同侧45度",
  "principle": "1号上前压球，全队向强侧旋转，形成从持球人看来接近1-3-1的防守重心。",
  "ball": { "x": 27, "y": 38 },
  "offense": [],
  "defenders": {},
  "arrows": [],
  "zones": [],
  "responsibilities": {},
  "coachNotes": "这是核心画面：从持球人角度看，最前是1号，中间是2、5、3，最后是4。"
}
```

必填字段：

- `id`
- `playbookId`
- `sortOrder`
- `phase`
- `title`
- `principle`
- `ball`
- `defenders`
- `responsibilities`

可选字段，缺失时归一化为空值：

- `offense`
- `arrows`
- `zones`
- `coachNotes`

对于当前防守战术包，防守人使用 `"1"` 到 `"5"` 作为 key，每个防守人使用 SVG 相对坐标：

```json
{
  "1": { "x": 48, "y": 28, "status": "pressure" }
}
```

坐标沿用当前球场的 `0-100` SVG 坐标系统。

## IndexedDB 存储结构

数据库名：`twba-displaybook`

数据库版本：`1`

对象仓库：

- `playbooks`
  - keyPath：`id`
  - 索引：
    - `type`
    - `source`
    - `updatedAt`
- `scenarios`
  - keyPath：`uid`
  - 索引：
    - `playbookId`
    - `sortOrder`

情景记录使用派生 `uid`，避免不同战术包之间的情景 ID 冲突：

```text
uid = `${playbookId}:${scenario.id}`
```

已存储情景仍保留原始 `id`，便于展示、导出和跨版本阅读。

## 导入 JSON 格式

用户每次导入一个完整战术包。

```json
{
  "schemaVersion": 1,
  "playbook": {
    "id": "zone-2-3-rotated-131",
    "title": "2-3联防：强侧旋转",
    "type": "defense",
    "version": "1.0.0",
    "description": "公司篮球队 2-3 联防入门内容"
  },
  "scenarios": []
}
```

校验规则：

- `schemaVersion` 必须为 `1`。
- 必须包含 `playbook.id`、`playbook.title`、`playbook.type` 和 `playbook.version`。
- `playbook.type` 必须是 `defense` 或 `offense`。
- `scenarios` 必须是非空数组。
- 每个情景必须包含 `id`、`title`、`principle`、`ball`、`defenders` 和 `responsibilities`。
- `ball.x`、`ball.y`、防守人 `x`、防守人 `y` 必须是 `0` 到 `100` 之间的有限数字。
- 缺失的可选数组或对象会归一化为空值。
- 导入包无论文件里写什么，入库时都保存为 `source: "imported"`。

如果导入的 `playbook.id` 已存在，应用需要先确认是否替换该战术包和它的所有情景。

## 内置默认内容

当前 6 个情景转换成一个内置战术包：

- `id`：`zone-2-3-rotated-131`
- `title`：`2-3联防：强侧旋转`
- `type`：`defense`
- `version`：`1.0.0`
- `source`：`builtin`

启动流程：

1. 打开 IndexedDB。
2. 读取 `playbooks`。
3. 如果没有任何战术包，写入内置默认战术包和情景。
4. 从本地偏好读取已选战术包 ID。
5. 如果没有已选 ID，或该 ID 已不存在，则使用内置默认内容。
6. 按 `sortOrder` 加载当前战术包的情景。

恢复默认流程：

1. Upsert 内置默认战术包和所有内置情景。
2. 删除内置战术包下不在种子数据里的旧情景。
3. 将当前选中战术包切换为内置默认内容。
4. 重新渲染页面。

## 页面交互

在现有控制区增加一个紧凑的“内容库”区域。

控件：

- 战术包选择器。
- 类型标签：`defense` 显示为 `防守`，`offense` 显示为 `进攻`。
- 导入 JSON 按钮。
- 删除当前导入内容按钮。
- 恢复默认内容按钮。

规则：

- 内置战术包不能删除。
- 当前选中内容为 `source: "builtin"` 时，删除按钮禁用。
- 删除导入战术包时，同时删除该战术包和它的所有情景。
- 如果被删除的是当前选中战术包，删除后切回内置默认内容。
- 导入成功后自动切换到新导入的战术包。
- 导入失败时保持当前战术包不变。

## 数据流

### 应用启动

1. `content-db.js` 打开 IndexedDB，并在需要时创建对象仓库。
2. `builtin-content.js` 暴露默认战术包。
3. `content-service.js` 在内容库为空时写入默认内容。
4. `content-service.js` 加载全部战术包，以及当前选中战术包的情景。
5. `app.js` 根据加载到的情景渲染现有球场 UI。

如果 IndexedDB 无法打开，应用回退到内存中的内置内容，并显示明确警告：导入、删除和持久化不可用。

### JSON 导入

1. 用户选择 `.json` 文件。
2. 应用通过 `FileReader` 读取文件。
3. `content-validation.js` 解析并校验内容。
4. 服务检查 `playbook.id` 是否已存在。
5. 如果需要替换，应用先请求确认。
6. 服务在一个事务中写入战术包和所有情景。
7. 应用重新加载战术包列表，并切换到导入内容。

### 删除导入内容

1. 用户点击删除当前导入战术包。
2. 应用请求确认。
3. 服务删除战术包和它的所有情景。
4. 应用重新加载战术包列表。
5. 应用切回内置默认内容。

## 错误处理

错误必须展示在页面上，不能只写入控制台。

- IndexedDB 打开失败：显示警告，并使用内存中的内置内容。
- JSON 格式错误：显示 `文件不是有效 JSON。`
- Schema 不合法：显示第一条可操作校验信息，例如 `playbook.type 必须是 defense 或 offense。`
- 情景列表为空：显示 `scenarios 至少需要 1 个情景。`
- 重复导入：先确认是否替换。
- 删除内置内容：按钮保持禁用，不调用删除逻辑。

## 文件边界

预计实现文件：

- `src/builtin-content.js`：由现有情景转换成的默认战术包。
- `src/content-db.js`：轻量 IndexedDB 封装，负责打开数据库和执行事务。
- `src/content-validation.js`：导入包归一化和校验。
- `src/content-service.js`：种子写入、列表、加载、导入、删除和恢复默认。
- `src/app.js`：从内容服务拿数据渲染，并接入新控件。
- `src/styles.css`：内容库控件、提示和禁用状态样式。
- `index.html`：脚本标签和控制区标记。
- `README.md`：更新使用方式和导入格式说明。

旧的 `src/scenarios.js` 在迁移后应删除；如果实现中确实需要过渡兼容，也只能保留为兼容 shim。

## 验证

不使用 Playwright，不引入 npm。

必要检查：

- `node --check src/app.js`
- `node --check src/builtin-content.js`
- `node --check src/content-db.js`
- `node --check src/content-validation.js`
- `node --check src/content-service.js`
- 使用 Node 校验内置默认包：
  - `schemaVersion` 为 `1`。
  - 战术包类型为 `defense`。
  - 一共有 6 个情景。
  - 每个情景都有 5 个防守人站位。
  - 每个情景都有 `1` 到 `5` 的职责说明。
  - 所有坐标都在 `0` 到 `100` 之间。

由用户手动浏览器验证：

- 首次打开会写入默认内容。
- 现有 6 个防守情景仍能正确渲染。
- 战术包选择器显示默认战术包。
- 导入合法 JSON 后，新内容被注册并自动切换。
- 导入非法 JSON 时展示错误，并保持当前内容不变。
- 删除导入内容后，该内容消失并回到默认战术包。
- 内置内容不能删除。
- 恢复默认内容可以重新写入默认战术包。

## 验收标准

- 页面不再以 `window.TWBA_SCENARIOS` 作为主要内容来源。
- IndexedDB 保存结构化 `playbook` 和 `scenario` 记录。
- 内容类型显式支持 `defense` 和 `offense`。
- 当前 2-3 联防内容作为内置默认防守战术包可用。
- 用户可以通过标准 JSON 注册新内容。
- 用户可以删除导入内容。
- 用户可以恢复内置默认内容。
- 应用仍然是无需 npm、Playwright 或后端的静态 HTML 页面。
