(async function () {
  const roles = ["1", "2", "3", "4", "5"];
  const markerSize = {
    offenseRadius: 2.9,
    offenseHitRadius: 5.2,
    defenderRadius: 2.9,
    defenderHitRadius: 5.2,
    ballRadius: 2.15,
    ballHitRadius: 5.4,
    ballSeam: 1.7
  };
  const offenseVisualOffset = { x: -2.1, y: -1.6 };
  const ballVisualOffset = { x: 2, y: 1.6 };
  const DRAW_COLORS = ["#eef1f5", "#ffd447", "#ff5c5c", "#33b1ff"];
  const ZONE_COLORS = [
    { key: "red", hex: "#ff4d4d" },
    { key: "blue", hex: "#4d7cff" },
    { key: "green", hex: "#33d17a" },
    { key: "amber", hex: "#ffa53d" },
    { key: "violet", hex: "#a855f7" },
    { key: "cyan", hex: "#22d3ee" }
  ];
  const LEGACY_ZONE_TYPE_TO_COLOR = { strong: "red", middle: "blue", last: "green" };
  const ZONE_COLOR_KEYS = ZONE_COLORS.map((color) => color.key);
  const DRAW_WIDTHS = [
    { value: 0.5, label: "细" },
    { value: 1, label: "中" },
    { value: 1.8, label: "粗" }
  ];
  const state = {
    library: { playbooks: [], fallback: false, message: "" },
    playbookId: "",
    scenarioId: "",
    focusedRole: "all",
    editMode: false,
    editTool: "none",
    drawMode: false,
    drawColor: DRAW_COLORS[0],
    drawWidth: DRAW_WIDTHS[1].value,
    strokes: [],
    isDrawingStroke: false,
    arrows: [],
    zones: [],
    showArrows: true,
    showOffense: true,
    showZones: true,
    offensePositions: [],
    positions: {},
    ball: { x: 50, y: 20 },
    dragTarget: null,
    animation: { playing: false, progress: 0, speed: 1, raf: null, lastTs: null }
  };

  const court = document.querySelector("#court");
  const scenarioSelect = document.querySelector("#scenarioSelect");
  const addScenarioBtn = document.querySelector("#addScenarioBtn");
  const deleteScenarioBtn = document.querySelector("#deleteScenarioBtn");
  const roleFilter = document.querySelector("#roleFilter");
  const explanation = document.querySelector("#explanation");
  const resetBtn = document.querySelector("#resetBtn");
  const editModeBtn = document.querySelector("#editModeBtn");
  const drawModeBtn = document.querySelector("#drawModeBtn");
  const toggleArrows = document.querySelector("#toggleArrows");
  const toggleOffense = document.querySelector("#toggleOffense");
  const toggleZones = document.querySelector("#toggleZones");
  const playbookSelect = document.querySelector("#playbookSelect");
  const playbookType = document.querySelector("#playbookType");
  const importBtn = document.querySelector("#importBtn");
  const importFile = document.querySelector("#importFile");
  const deletePlaybookBtn = document.querySelector("#deletePlaybookBtn");
  const exportPlaybookBtn = document.querySelector("#exportPlaybookBtn");
  const exportCustomContentBtn = document.querySelector("#exportCustomContentBtn");
  const newDefensePlaybookBtn = document.querySelector("#newDefensePlaybookBtn");
  const newOffensePlaybookBtn = document.querySelector("#newOffensePlaybookBtn");
  const libraryStatus = document.querySelector("#libraryStatus");
  const transportEl = document.querySelector("#transport");
  const transportPlayBtn = document.querySelector("#transportPlayBtn");
  const transportTrack = document.querySelector("#transportTrack");
  const transportFill = document.querySelector("#transportFill");
  const transportThumb = document.querySelector("#transportThumb");
  const transportTime = document.querySelector("#transportTime");

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function clonePositions(players) {
    return (players || []).map((player) => ({ ...player }));
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function getPlaybook() {
    return state.library.playbooks.find((playbook) => playbook.id === state.playbookId) ||
      state.library.playbooks[0];
  }

  function getScenarios() {
    const playbook = getPlaybook();
    return playbook ? playbook.scenarios || [] : [];
  }

  function getScenario() {
    const scenarios = getScenarios();
    return scenarios.find((scenario) => scenario.id === state.scenarioId) || scenarios[0];
  }

  function getResponsibility(scenario, role) {
    return (scenario.responsibilities && scenario.responsibilities[role]) || {
      where: "当前情景未配置该号码的站位说明。",
      watch: "当前情景未配置该号码的观察重点。",
      why: "当前情景未配置该号码的轮转原因。"
    };
  }

  function number(value) {
    return Number(value).toFixed(2).replace(/\.?0+$/, "");
  }

  function sameRole(role) {
    return state.focusedRole === "all" || state.focusedRole === role;
  }

  function typeLabel(type) {
    return type === "offense" ? "进攻" : "防守";
  }

  function setStatus(message, tone) {
    libraryStatus.textContent = message || "";
    libraryStatus.dataset.tone = tone || "";
  }

  function applyLibrary(library, preferredPlaybookId, preferredScenarioId) {
    state.library = library;
    const playbooks = library.playbooks || [];
    const playbook = playbooks.find((item) => item.id === preferredPlaybookId) || playbooks[0];
    state.playbookId = playbook ? playbook.id : "";
    const scenarios = playbook ? playbook.scenarios || [] : [];
    const scenario = scenarios.find((item) => item.id === preferredScenarioId) || scenarios[0];
    state.scenarioId = scenario ? scenario.id : "";
    state.positions = clone((scenario && scenario.defenders) || {});
    state.ball = clone((scenario && scenario.ball) || { x: 50, y: 20 });
    state.offensePositions = clonePositions((scenario && scenario.offense) || []);
    state.arrows = clone((scenario && scenario.arrows) || []);
    state.zones = clone((scenario && scenario.zones) || []);
    state.strokes = [];
    state.editTool = "none";
    resetAnimation();
  }

  async function refreshLibrary(preferredPlaybookId, preferredScenarioId) {
    const library = await window.TWBAContentService.getLibrary();
    applyLibrary(library, preferredPlaybookId || state.playbookId, preferredScenarioId || state.scenarioId);
    render();
  }

  function renderCourtLines() {
    return `
      <rect class="court-bg" x="0" y="0" width="100" height="100"></rect>
      <rect class="court-boundary" x="1" y="1" width="98" height="98"></rect>
      <line class="court-line" x1="1" y1="1" x2="99" y2="1"></line>
      <rect class="court-line no-fill" x="34" y="58" width="32" height="41"></rect>
      <line class="court-line" x1="34" y1="58" x2="66" y2="58"></line>
      <circle class="court-line no-fill" cx="50" cy="58" r="12"></circle>
      <path class="court-line no-fill court-dash" d="M 38 58 A 12 12 0 0 0 62 58"></path>
      <path class="court-line no-fill" d="M 6 99 L 6 83 M 94 99 L 94 83 M 6 83 A 44 44 0 0 1 94 83"></path>
      <circle class="court-line no-fill" cx="50" cy="92" r="2.2"></circle>
      <line class="rim-board" x1="45" y1="95" x2="55" y2="95"></line>
      <path class="court-line no-fill" d="M 43.5 92 A 6.5 6.5 0 0 0 56.5 92"></path>
    `;
  }

  function zoneCenter(zone) {
    return { cx: zone.x + zone.width / 2, cy: zone.y + zone.height / 2 };
  }

  function zoneColorKey(zone) {
    if (ZONE_COLOR_KEYS.includes(zone.color)) return zone.color;
    return LEGACY_ZONE_TYPE_TO_COLOR[zone.type] || "red";
  }

  function zoneRotateAttr(zone) {
    if (!zone.rotation) return "";
    const { cx, cy } = zoneCenter(zone);
    return ` transform="rotate(${number(zone.rotation)} ${number(cx)} ${number(cy)})"`;
  }

  function renderZones() {
    if (!state.showZones) return "";
    const bodies = state.zones.map((zone) => `
      <g class="zone-group"${zoneRotateAttr(zone)}>
        <rect class="zone zone-${escapeHtml(zoneColorKey(zone))}" x="${number(zone.x)}" y="${number(zone.y)}" width="${number(zone.width)}" height="${number(zone.height)}"></rect>
        <text class="zone-label" x="${number(zoneCenter(zone).cx)}" y="${number(zone.y + 5)}">${escapeHtml(zone.label)}</text>
      </g>
    `).join("");

    if (!(state.editMode && state.editTool === "zone")) return bodies;

    const handles = state.zones.map((zone, index) => {
      const { cx, cy } = zoneCenter(zone);
      return `
        <g class="zone-handle-group"${zoneRotateAttr(zone)}>
          <line class="zone-handle-rotate-stem" x1="${number(cx)}" y1="${number(zone.y)}" x2="${number(cx)}" y2="${number(zone.y - 6)}"></line>
          <circle class="zone-handle zone-handle-rotate" data-marker="zone-rotate" data-index="${index}"
            cx="${number(cx)}" cy="${number(zone.y - 6)}" r="1.8"></circle>
          <rect class="zone-handle zone-handle-move" data-marker="zone-move" data-index="${index}"
            x="${number(cx - 2.5)}" y="${number(cy - 2.5)}" width="5" height="5"></rect>
          <rect class="zone-handle zone-handle-resize" data-marker="zone-resize" data-index="${index}"
            x="${number(zone.x + zone.width - 2)}" y="${number(zone.y + zone.height - 2)}" width="4" height="4"></rect>
        </g>
      `;
    }).join("");

    return bodies + handles;
  }

  function renderOffense(scenario, movedMap) {
    if (!state.showOffense) return "";
    const offense = state.offensePositions.length > 0 ? state.offensePositions : scenario.offense || [];
    return offense.map((player, index) => {
      const moved = movedMap.get(`offense:${index}`);
      const x = moved ? moved.x : player.x;
      const y = moved ? moved.y : player.y;
      return `
      <g data-marker="offense" data-index="${index}" class="offense-marker" transform="translate(${number(x + offenseVisualOffset.x)} ${number(y + offenseVisualOffset.y)})">
        <circle class="hit-target" r="${number(markerSize.offenseHitRadius)}"></circle>
        <circle r="${number(markerSize.offenseRadius)}"></circle>
        <text y="1">${escapeHtml(String(index + 1))}</text>
      </g>
    `;
    }).join("");
  }

  function buildWavyPath(from, to) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.hypot(dx, dy) || 0.001;
    const ux = dx / len;
    const uy = dy / len;
    const px = -uy;
    const py = ux;
    const amplitude = 1.6;
    const waves = Math.max(2, Math.round(len / 6));
    let d = `M ${number(from.x)} ${number(from.y)}`;
    for (let i = 0; i < waves; i++) {
      const sign = i % 2 === 0 ? 1 : -1;
      const tMid = (i + 0.5) / waves;
      const tEnd = (i + 1) / waves;
      const midX = from.x + dx * tMid + px * amplitude * sign;
      const midY = from.y + dy * tMid + py * amplitude * sign;
      const endX = from.x + dx * tEnd;
      const endY = from.y + dy * tEnd;
      d += ` Q ${number(midX)} ${number(midY)} ${number(endX)} ${number(endY)}`;
    }
    return d;
  }

  function screenBarPoints(from, to) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.hypot(dx, dy) || 0.001;
    const px = -(dy / len);
    const py = dx / len;
    const half = 2.4;
    return {
      x1: to.x + px * half,
      y1: to.y + py * half,
      x2: to.x - px * half,
      y2: to.y - py * half
    };
  }

  function moverKey(mover) {
    if (!mover) return null;
    if (mover.type === "defender") return `defender:${mover.role}`;
    if (mover.type === "offense") return `offense:${mover.index}`;
    if (mover.type === "ball") return "ball";
    return null;
  }

  function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  function animatableArrows() {
    return state.arrows.filter((arrow) => arrow.mover);
  }

  function arrowFromPoint(arrow) {
    if (!arrow.mover) return arrow.from;
    if (arrow.mover.type === "defender") {
      const point = state.positions[arrow.mover.role];
      return point ? { x: point.x, y: point.y } : arrow.from;
    }
    if (arrow.mover.type === "offense") {
      const player = state.offensePositions[arrow.mover.index];
      return player
        ? { x: player.x + offenseVisualOffset.x, y: player.y + offenseVisualOffset.y }
        : arrow.from;
    }
    if (arrow.mover.type === "ball") {
      return { x: state.ball.x + ballVisualOffset.x, y: state.ball.y + ballVisualOffset.y };
    }
    return arrow.from;
  }

  function animatedMoverMap() {
    const map = new Map();
    if (state.animation.progress <= 0) return map;
    const t = easeInOutQuad(Math.min(1, state.animation.progress));
    state.arrows.forEach((arrow) => {
      const key = moverKey(arrow.mover);
      if (!key || map.has(key)) return;
      const from = arrowFromPoint(arrow);
      map.set(key, {
        x: from.x + (arrow.to.x - from.x) * t,
        y: from.y + (arrow.to.y - from.y) * t
      });
    });
    return map;
  }

  function stopAnimation() {
    if (state.animation.raf) cancelAnimationFrame(state.animation.raf);
    state.animation.raf = null;
    state.animation.playing = false;
    state.animation.lastTs = null;
  }

  function resetAnimation() {
    stopAnimation();
    state.animation.progress = 0;
  }

  function resolveMoverFromEvent(event) {
    const defender = event.target.closest("[data-marker='defender']");
    if (defender) {
      const role = defender.dataset.role;
      const point = state.positions[role];
      if (!point) return null;
      return { point: { x: point.x, y: point.y }, ref: { type: "defender", role } };
    }
    const offense = event.target.closest("[data-marker='offense']");
    if (offense) {
      const index = Number(offense.dataset.index);
      const player = state.offensePositions[index];
      if (!player) return null;
      return {
        point: { x: player.x + offenseVisualOffset.x, y: player.y + offenseVisualOffset.y },
        ref: { type: "offense", index }
      };
    }
    const ball = event.target.closest("[data-marker='ball']");
    if (ball) {
      return {
        point: { x: state.ball.x + ballVisualOffset.x, y: state.ball.y + ballVisualOffset.y },
        ref: { type: "ball" }
      };
    }
    return null;
  }

  function renderArrow(arrow) {
    const style = arrow.style || "solid";
    const typeClass = `arrow-${escapeHtml(arrow.type)}`;
    const title = `<title>${escapeHtml(arrow.label || arrow.type)}</title>`;
    const from = arrowFromPoint(arrow);

    if (style === "wavy") {
      return `
        <path class="arrow arrow-wavy ${typeClass}" d="${buildWavyPath(from, arrow.to)}"
          marker-end="url(#arrow-${escapeHtml(arrow.type)})">${title}</path>
      `;
    }

    if (style === "screen") {
      const bar = screenBarPoints(from, arrow.to);
      return `
        <g class="arrow-screen-group">
          <line class="arrow arrow-screen ${typeClass}"
            x1="${number(from.x)}" y1="${number(from.y)}"
            x2="${number(arrow.to.x)}" y2="${number(arrow.to.y)}">${title}</line>
          <line class="arrow-screen-bar ${typeClass}"
            x1="${number(bar.x1)}" y1="${number(bar.y1)}" x2="${number(bar.x2)}" y2="${number(bar.y2)}"></line>
        </g>
      `;
    }

    const dashClass = style === "dashed" ? "arrow-dashed" : "";
    return `
      <line class="arrow ${typeClass} ${dashClass}"
        x1="${number(from.x)}" y1="${number(from.y)}"
        x2="${number(arrow.to.x)}" y2="${number(arrow.to.y)}"
        marker-end="url(#arrow-${escapeHtml(arrow.type)})">${title}</line>
    `;
  }

  function renderArrows() {
    if (!state.showArrows) return "";
    return state.arrows
      .filter((arrow) => state.editMode || state.focusedRole === "all" || (arrow.roles || []).includes(state.focusedRole))
      .map((arrow) => renderArrow(arrow)).join("");
  }

  function renderBall(movedMap) {
    const base = movedMap.get("ball") || state.ball;
    const hitX = number(base.x);
    const hitY = number(base.y);
    const x = base.x + ballVisualOffset.x;
    const y = base.y + ballVisualOffset.y;
    return `
      <g data-marker="ball" class="ball-marker" tabindex="0" role="button" aria-label="篮球">
        <circle class="hit-target" cx="${hitX}" cy="${hitY}" r="${number(markerSize.ballHitRadius)}"></circle>
        <circle cx="${number(x)}" cy="${number(y)}" r="${number(markerSize.ballRadius)}"></circle>
        <path d="M ${number(x - markerSize.ballSeam)} ${number(y)} H ${number(x + markerSize.ballSeam)}"></path>
        <path d="M ${number(x)} ${number(y - markerSize.ballSeam)} V ${number(y + markerSize.ballSeam)}"></path>
      </g>
    `;
  }

  function renderDefenders(movedMap) {
    return roles.map((role) => {
      const basePoint = state.positions[role];
      if (!basePoint) return "";
      const point = movedMap.get(`defender:${role}`) || basePoint;
      const focusedClass = sameRole(role) ? "is-focused" : "is-muted";
      return `
        <g data-marker="defender" data-role="${role}" class="defender-marker ${focusedClass}"
          tabindex="0" role="button" aria-label="${role}号防守人"
          transform="translate(${number(point.x)} ${number(point.y)})">
          <circle class="hit-target" r="${number(markerSize.defenderHitRadius)}"></circle>
          <circle r="${number(markerSize.defenderRadius)}"></circle>
          <text y="1.35">${role}</text>
        </g>
      `;
    }).join("");
  }

  function renderDrawLayer() {
    return state.strokes.map((stroke) => {
      if (stroke.points.length === 1) {
        const point = stroke.points[0];
        return `<circle class="draw-stroke draw-dot" cx="${number(point.x)}" cy="${number(point.y)}" r="${number(stroke.width)}" fill="${escapeHtml(stroke.color)}"></circle>`;
      }
      if (stroke.points.length < 2) return "";
      const d = stroke.points
        .map((point, index) => `${index === 0 ? "M" : "L"} ${number(point.x)} ${number(point.y)}`)
        .join(" ");
      return `<path class="draw-stroke" d="${d}" stroke="${escapeHtml(stroke.color)}" stroke-width="${number(stroke.width)}"></path>`;
    }).join("");
  }

  function renderDrawToolbar() {
    if (!state.drawMode) return "";
    const swatches = DRAW_COLORS.map((color) => `
      <button type="button" class="draw-swatch" data-draw-color="${color}" style="background:${color}"
        aria-pressed="${state.drawColor === color}" aria-label="选择画笔颜色"></button>
    `).join("");
    const widths = DRAW_WIDTHS.map((item) => `
      <button type="button" class="icon-only" data-draw-width="${item.value}" aria-pressed="${state.drawWidth === item.value}">${item.label}</button>
    `).join("");
    return `
      <div class="draw-toolbar">
        ${swatches}
        <span class="draw-divider"></span>
        ${widths}
        <span class="draw-divider"></span>
        <button type="button" class="draw-clear" data-draw-clear>清除</button>
      </div>
    `;
  }

  function renderCourt() {
    court.classList.toggle("is-tool-arrow", state.editMode && state.editTool === "arrow");
    court.classList.toggle("is-tool-zone", state.editMode && state.editTool === "zone");
    const scenario = getScenario();
    if (!scenario) {
      court.innerHTML = `<div class="empty-state">暂无战术情景数据。</div>`;
      return;
    }
    const movedMap = animatedMoverMap();
    court.innerHTML = `
      <svg class="court-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="FIBA半场示意图">
        <defs>
          <marker id="arrow-rotation" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z"></path>
          </marker>
          <marker id="arrow-help" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z"></path>
          </marker>
          <marker id="arrow-pass" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z"></path>
          </marker>
        </defs>
        ${renderCourtLines()}
        ${renderZones()}
        ${renderOffense(scenario, movedMap)}
        ${renderArrows()}
        ${renderBall(movedMap)}
        ${renderDefenders(movedMap)}
        ${renderDrawLayer()}
      </svg>
      ${renderDrawToolbar()}
    `;
  }

  function renderLibraryControls() {
    const playbook = getPlaybook();
    playbookSelect.innerHTML = state.library.playbooks.map((item) => `
      <option value="${escapeHtml(item.id)}" ${item.id === state.playbookId ? "selected" : ""}>
        ${escapeHtml(item.title)}
      </option>
    `).join("");
    playbookSelect.disabled = state.library.playbooks.length === 0;
    playbookType.textContent = playbook ? typeLabel(playbook.type) : "-";
    playbookType.dataset.type = playbook ? playbook.type : "";
    deletePlaybookBtn.disabled = !playbook || playbook.source !== "imported";
  }

  function renderScenarioOptions() {
    const scenarios = getScenarios();
    if (scenarios.length === 0) {
      scenarioSelect.innerHTML = `<option value="">暂无情景</option>`;
      scenarioSelect.disabled = true;
      deleteScenarioBtn.disabled = true;
      return;
    }
    scenarioSelect.disabled = false;
    scenarioSelect.innerHTML = scenarios.map((scenario, index) => `
      <option value="${escapeHtml(scenario.id)}" ${scenario.id === state.scenarioId ? "selected" : ""}>
        ${index + 1}. ${escapeHtml(scenario.title)}
      </option>
    `).join("");
    deleteScenarioBtn.disabled = scenarios.length <= 1;
  }

  function renderRoleButtons() {
    const options = ["all"].concat(roles);
    roleFilter.innerHTML = options.map((role) => {
      const label = role === "all" ? "全部" : `${role}号`;
      return `<button type="button" data-role-filter="${role}" aria-pressed="${state.focusedRole === role}">${label}</button>`;
    }).join("");
  }

  function arrowTypeLabel(type) {
    return { rotation: "轮转", help: "协防", pass: "传球" }[type] || type;
  }

  function arrowStyleLabel(style) {
    return { solid: "实线·跑动", dashed: "虚线·掩护跑位", wavy: "波浪线·运球", screen: "挡拆·丁字" }[style] || style;
  }

  function moverLabel(mover) {
    if (!mover) return "未绑定起点（仅示意，不参与播放演示）";
    if (mover.type === "defender") return `播放起点：${mover.role}号防守人`;
    if (mover.type === "offense") return `播放起点：进攻${mover.index + 1}号位`;
    if (mover.type === "ball") return "播放起点：篮球";
    return "未绑定起点（仅示意，不参与播放演示）";
  }

  function renderArrowRows() {
    if (state.arrows.length === 0) {
      return `<p class="empty-state">暂无箭头，点击下方按钮后在球场空白处拖拽绘制。</p>`;
    }
    return state.arrows.map((arrow, index) => {
      const roleChips = roles.map((role) => `
        <button type="button" class="chip" data-arrow-role="${role}" data-arrow-index="${index}"
          aria-pressed="${(arrow.roles || []).includes(role)}">${role}</button>
      `).join("");
      return `
        <fieldset class="editor-arrow">
          <label>类型
            <select data-arrow-field="type" data-arrow-index="${index}">
              ${["rotation", "help", "pass"].map((type) => `
                <option value="${type}" ${arrow.type === type ? "selected" : ""}>${arrowTypeLabel(type)}</option>
              `).join("")}
            </select>
          </label>
          <label>线型
            <select data-arrow-field="style" data-arrow-index="${index}">
              ${["solid", "dashed", "wavy", "screen"].map((style) => `
                <option value="${style}" ${(arrow.style || "solid") === style ? "selected" : ""}>${arrowStyleLabel(style)}</option>
              `).join("")}
            </select>
          </label>
          <label>说明
            <input type="text" data-arrow-field="label" data-arrow-index="${index}"
              value="${escapeHtml(arrow.label || "")}" placeholder="例如：1号前压">
          </label>
          <p class="editor-hint">${moverLabel(arrow.mover)}</p>
          <div class="editor-arrow-roles" aria-label="适用视角，不选则所有视角可见">${roleChips}</div>
          <button type="button" class="icon-text-button" data-delete-arrow="${index}">删除箭头</button>
        </fieldset>
      `;
    }).join("");
  }

  function refreshArrowEditorList() {
    const container = explanation.querySelector("[data-arrows-list]");
    if (container) container.innerHTML = renderArrowRows();
    const summary = container && container.closest("details")?.querySelector("summary");
    if (summary) summary.textContent = `轮转箭头${state.arrows.length ? `（${state.arrows.length}）` : ""}`;
  }

  function renderZoneRows() {
    if (state.zones.length === 0) {
      return `<p class="empty-state">暂无区域高亮，点击"新增区域"后可在球场上拖动方块调整位置和大小。</p>`;
    }
    return state.zones.map((zone, index) => `
      <fieldset class="editor-arrow">
        <label>名称
          <input type="text" data-zone-field="label" data-zone-index="${index}"
            value="${escapeHtml(zone.label || "")}" placeholder="例如：强侧压迫">
        </label>
        <div class="zone-color-picker" role="group" aria-label="区域颜色">
          ${ZONE_COLORS.map((color) => `
            <button type="button" class="zone-color-swatch" data-zone-color="${color.key}" data-zone-index="${index}"
              style="background:${color.hex}" aria-pressed="${zoneColorKey(zone) === color.key}" aria-label="${color.key}"></button>
          `).join("")}
        </div>
        <button type="button" class="icon-text-button" data-delete-zone="${index}">删除区域</button>
      </fieldset>
    `).join("");
  }

  function refreshZoneEditorList() {
    const container = explanation.querySelector("[data-zones-list]");
    if (container) container.innerHTML = renderZoneRows();
    const summary = container && container.closest("details")?.querySelector("summary");
    if (summary) summary.textContent = `区域高亮${state.zones.length ? `（${state.zones.length}）` : ""}`;
  }

  function renderExplanationEditor(scenario) {
    const cards = roles.map((role) => {
      const item = getResponsibility(scenario, role);
      return `
        <details class="editor-section editor-role">
          <summary>${role}号职责</summary>
          <div class="editor-section-body">
            <label>站哪里
              <textarea data-edit-field="where" data-role="${role}" rows="2">${escapeHtml(item.where)}</textarea>
            </label>
            <label>看什么
              <textarea data-edit-field="watch" data-role="${role}" rows="2">${escapeHtml(item.watch)}</textarea>
            </label>
            <label>为什么
              <textarea data-edit-field="why" data-role="${role}" rows="2">${escapeHtml(item.why)}</textarea>
            </label>
          </div>
        </details>
      `;
    }).join("");

    explanation.innerHTML = `
      <form class="scenario-editor" data-scenario-editor>
        <div class="edit-actions edit-actions--sticky">
          <button type="submit" class="icon-text-button" data-edit-save>保存修改</button>
          <button type="button" class="icon-text-button" data-edit-cancel>取消</button>
        </div>
        <label>情景标题
          <input type="text" data-edit-field="title" value="${escapeHtml(scenario.title)}">
        </label>
        <label>讲解要点
          <textarea data-edit-field="principle" rows="2">${escapeHtml(scenario.principle || "")}</textarea>
        </label>
        <details class="editor-section editor-role-group" open>
          <summary>号位职责（${roles.length}）</summary>
          <div class="editor-section-body editor-role-group-body">${cards}</div>
        </details>
        <details class="editor-section editor-arrows">
          <summary>轮转箭头${state.arrows.length ? `（${state.arrows.length}）` : ""}</summary>
          <div class="editor-section-body">
            <p class="editor-hint">开启绘制后，从球员或篮球图标按住拖拽，可绑定其为播放起点（支持下方"轮转播放"动态演示）；在空白处拖拽则只作为示意箭头。保存后成为该情景的默认标注，非临时讲解。</p>
            <button type="button" class="icon-text-button editor-tool-toggle" data-toggle-arrow-tool
              aria-pressed="${state.editTool === "arrow"}">
              ${state.editTool === "arrow" ? "● 正在绘制箭头（点击停止）" : "在球场上绘制箭头"}
            </button>
            <div data-arrows-list>${renderArrowRows()}</div>
          </div>
        </details>
        <details class="editor-section editor-arrows">
          <summary>区域高亮${state.zones.length ? `（${state.zones.length}）` : ""}</summary>
          <div class="editor-section-body">
            <p class="editor-hint">开启调整后，拖动区域上方圆点可旋转、中心方块可移动、右下角方块可缩放。</p>
            <button type="button" class="icon-text-button editor-tool-toggle" data-toggle-zone-tool
              aria-pressed="${state.editTool === "zone"}">
              ${state.editTool === "zone" ? "● 正在调整区域（点击停止）" : "在球场上调整区域"}
            </button>
            <div data-zones-list>${renderZoneRows()}</div>
            <button type="button" class="icon-text-button" data-add-zone>新增区域</button>
          </div>
        </details>
        <label>教练备注
          <textarea data-edit-field="coachNotes" rows="2">${escapeHtml(scenario.coachNotes || "")}</textarea>
        </label>
        <p class="editor-hint">拖动球场上的球员/篮球可调整站位，保存修改会一并写入为新的初始站位。</p>
      </form>
    `;
  }

  function renderExplanation() {
    const scenario = getScenario();
    if (!scenario) {
      explanation.innerHTML = `<h2>暂无情景</h2><p class="principle">请先配置战术情景数据。</p>`;
      return;
    }
    if (state.editMode) {
      renderExplanationEditor(scenario);
      return;
    }
    const visibleRoles = state.focusedRole === "all" ? roles : [state.focusedRole];
    const cards = visibleRoles.map((role) => {
      const item = getResponsibility(scenario, role);
      return `
        <article class="responsibility-card">
          <h3>${role}号</h3>
          <p><strong>站哪里：</strong>${escapeHtml(item.where)}</p>
          <p><strong>看什么：</strong>${escapeHtml(item.watch)}</p>
          <p><strong>为什么：</strong>${escapeHtml(item.why)}</p>
        </article>
      `;
    }).join("");

    explanation.innerHTML = `
      <h2>${escapeHtml(scenario.title)}</h2>
      <p class="principle">${escapeHtml(scenario.principle)}</p>
      ${cards}
      <p class="coach-note"><strong>教练备注：</strong>${escapeHtml(scenario.coachNotes)}</p>
    `;
  }

  function render() {
    editModeBtn.setAttribute("aria-pressed", String(state.editMode));
    drawModeBtn.setAttribute("aria-pressed", String(state.drawMode));
    court.classList.toggle("is-editing", state.editMode);
    court.classList.toggle("is-drawing", state.drawMode);
    renderLibraryControls();
    renderScenarioOptions();
    renderRoleButtons();
    renderCourt();
    renderExplanation();
    updateTransportUI();
  }

  function loadScenario(id) {
    const scenario = getScenarios().find((item) => item.id === id);
    if (!scenario) return;
    state.scenarioId = scenario.id;
    state.positions = clone(scenario.defenders || {});
    state.ball = clone(scenario.ball || { x: 50, y: 20 });
    state.offensePositions = clonePositions(scenario.offense || []);
    state.arrows = clone(scenario.arrows || []);
    state.zones = clone(scenario.zones || []);
    state.strokes = [];
    state.editTool = "none";
    resetAnimation();
    render();
  }

  function pointFromEvent(event) {
    const svg = court.querySelector("svg");
    if (!svg) return state.ball;
    const rect = svg.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    return {
      x: Math.max(2, Math.min(98, Number(x.toFixed(1)))),
      y: Math.max(2, Math.min(98, Number(y.toFixed(1))))
    };
  }

  function pointWithoutVisualOffset(point, offset) {
    return {
      x: Math.max(2, Math.min(98, Number((point.x - offset.x).toFixed(1)))),
      y: Math.max(2, Math.min(98, Number((point.y - offset.y).toFixed(1))))
    };
  }

  scenarioSelect.addEventListener("change", () => {
    if (scenarioSelect.value) loadScenario(scenarioSelect.value);
  });

  addScenarioBtn.addEventListener("click", async () => {
    const scenario = getScenario();
    const playbook = getPlaybook();
    if (!scenario || !playbook) return;
    const newScenario = clone(scenario);
    newScenario.id = `${scenario.id}-copy-${Date.now()}`;
    newScenario.title = `${scenario.title} 副本`;
    try {
      await window.TWBAContentService.addScenario(playbook.id, newScenario);
      await refreshLibrary(playbook.id, newScenario.id);
      state.editMode = true;
      render();
      setStatus("已新增情景（复制自当前情景），可在编辑模式中修改名称与内容。", "success");
    } catch (error) {
      setStatus(`新增失败：${error.message}`, "error");
    }
  });

  deleteScenarioBtn.addEventListener("click", async () => {
    const scenario = getScenario();
    const playbook = getPlaybook();
    if (!scenario || !playbook) return;
    if (getScenarios().length <= 1) {
      setStatus("至少保留一个情景，无法删除。", "error");
      return;
    }
    if (!window.confirm(`删除情景「${scenario.title}」？`)) return;
    try {
      await window.TWBAContentService.deleteScenario(playbook.id, scenario.id);
      await refreshLibrary(playbook.id);
      setStatus("已删除情景。", "success");
    } catch (error) {
      setStatus(`删除失败：${error.message}`, "error");
    }
  });

  roleFilter.addEventListener("click", (event) => {
    const button = event.target.closest("[data-role-filter]");
    if (!button) return;
    state.focusedRole = button.dataset.roleFilter;
    render();
  });

  resetBtn.addEventListener("click", () => loadScenario(state.scenarioId));
  editModeBtn.addEventListener("click", () => {
    state.editMode = !state.editMode;
    state.editTool = "none";
    if (state.editMode) state.drawMode = false;
    resetAnimation();
    render();
  });
  drawModeBtn.addEventListener("click", () => {
    state.drawMode = !state.drawMode;
    if (state.drawMode) {
      state.editMode = false;
      state.editTool = "none";
    }
    resetAnimation();
    render();
  });

  function transportStatusText() {
    if (state.editMode || state.drawMode) return "编辑中，退出后可播放";
    if (animatableArrows().length === 0) return "暂无可播放轮转";
    return `${Math.round(state.animation.progress * 100)}%`;
  }

  function updateTransportUI() {
    const disabled = animatableArrows().length === 0 || state.editMode || state.drawMode;
    transportPlayBtn.disabled = disabled;
    transportEl.classList.toggle("is-disabled", disabled);
    transportPlayBtn.textContent = state.animation.playing ? "⏸" : "▶";
    transportPlayBtn.setAttribute("aria-pressed", String(state.animation.playing));
    const pct = Math.round(state.animation.progress * 100);
    transportFill.style.width = `${pct}%`;
    transportThumb.style.left = `${pct}%`;
    transportTrack.setAttribute("aria-valuenow", String(pct));
    transportTime.textContent = transportStatusText();
    transportEl.querySelectorAll("[data-speed]").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(Number(btn.dataset.speed) === state.animation.speed));
    });
  }

  function stepAnimation(ts) {
    if (!state.animation.playing) return;
    if (state.animation.lastTs == null) state.animation.lastTs = ts;
    const dt = (ts - state.animation.lastTs) / 1000;
    state.animation.lastTs = ts;
    const baseDuration = 2.4;
    state.animation.progress = Math.min(1, state.animation.progress + (dt * state.animation.speed) / baseDuration);
    renderCourt();
    updateTransportUI();
    if (state.animation.progress >= 1) {
      stopAnimation();
      return;
    }
    state.animation.raf = requestAnimationFrame(stepAnimation);
  }

  function playAnimation() {
    if (animatableArrows().length === 0 || state.editMode || state.drawMode) return;
    if (state.animation.progress >= 1) state.animation.progress = 0;
    state.animation.playing = true;
    state.animation.lastTs = null;
    state.animation.raf = requestAnimationFrame(stepAnimation);
    updateTransportUI();
  }

  function pauseAnimation() {
    stopAnimation();
    updateTransportUI();
  }

  transportPlayBtn.addEventListener("click", () => {
    if (state.animation.playing) pauseAnimation(); else playAnimation();
  });

  transportEl.addEventListener("click", (event) => {
    const speedBtn = event.target.closest("[data-speed]");
    if (!speedBtn) return;
    state.animation.speed = Number(speedBtn.dataset.speed);
    updateTransportUI();
  });

  function seekFromEvent(event) {
    const rect = transportTrack.getBoundingClientRect();
    const ratio = rect.width > 0 ? Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)) : 0;
    state.animation.progress = ratio;
    renderCourt();
    updateTransportUI();
  }

  let isSeekingTransport = false;
  transportTrack.addEventListener("pointerdown", (event) => {
    if (animatableArrows().length === 0 || state.editMode || state.drawMode) return;
    pauseAnimation();
    isSeekingTransport = true;
    transportTrack.setPointerCapture(event.pointerId);
    seekFromEvent(event);
  });
  transportTrack.addEventListener("pointermove", (event) => {
    if (!isSeekingTransport) return;
    seekFromEvent(event);
  });
  transportTrack.addEventListener("pointerup", (event) => {
    isSeekingTransport = false;
    if (transportTrack.hasPointerCapture(event.pointerId)) {
      transportTrack.releasePointerCapture(event.pointerId);
    }
  });

  court.addEventListener("click", (event) => {
    const swatch = event.target.closest("[data-draw-color]");
    if (swatch) {
      state.drawColor = swatch.dataset.drawColor;
      renderCourt();
      return;
    }
    const widthBtn = event.target.closest("[data-draw-width]");
    if (widthBtn) {
      state.drawWidth = Number(widthBtn.dataset.drawWidth);
      renderCourt();
      return;
    }
    if (event.target.closest("[data-draw-clear]")) {
      state.strokes = [];
      renderCourt();
    }
  });

  function setEditorToolButtonState(selector, isActive, activeLabel, inactiveLabel) {
    const button = explanation.querySelector(selector);
    if (!button) return;
    button.setAttribute("aria-pressed", String(isActive));
    button.textContent = isActive ? activeLabel : inactiveLabel;
  }

  function syncEditorToolButtons() {
    setEditorToolButtonState("[data-toggle-arrow-tool]", state.editTool === "arrow",
      "● 正在绘制箭头（点击停止）", "在球场上绘制箭头");
    setEditorToolButtonState("[data-toggle-zone-tool]", state.editTool === "zone",
      "● 正在调整区域（点击停止）", "在球场上调整区域");
  }

  explanation.addEventListener("click", (event) => {
    if (event.target.closest("[data-edit-cancel]")) {
      state.editMode = false;
      state.editTool = "none";
      resetAnimation();
      render();
      return;
    }
    const toggleArrowToolBtn = event.target.closest("[data-toggle-arrow-tool]");
    if (toggleArrowToolBtn) {
      state.editTool = state.editTool === "arrow" ? "none" : "arrow";
      syncEditorToolButtons();
      renderCourt();
      return;
    }
    const toggleZoneToolBtn = event.target.closest("[data-toggle-zone-tool]");
    if (toggleZoneToolBtn) {
      state.editTool = state.editTool === "zone" ? "none" : "zone";
      syncEditorToolButtons();
      renderCourt();
      return;
    }
    const deleteArrowBtn = event.target.closest("[data-delete-arrow]");
    if (deleteArrowBtn) {
      state.arrows.splice(Number(deleteArrowBtn.dataset.deleteArrow), 1);
      renderCourt();
      refreshArrowEditorList();
      return;
    }
    const addZoneBtn = event.target.closest("[data-add-zone]");
    if (addZoneBtn) {
      state.zones.push({ label: "新区域", color: "red", x: 40, y: 40, width: 20, height: 20 });
      state.editTool = "zone";
      syncEditorToolButtons();
      renderCourt();
      refreshZoneEditorList();
      return;
    }
    const deleteZoneBtn = event.target.closest("[data-delete-zone]");
    if (deleteZoneBtn) {
      state.zones.splice(Number(deleteZoneBtn.dataset.deleteZone), 1);
      renderCourt();
      refreshZoneEditorList();
      return;
    }
    const zoneColorSwatch = event.target.closest("[data-zone-color]");
    if (zoneColorSwatch) {
      const zone = state.zones[Number(zoneColorSwatch.dataset.zoneIndex)];
      if (zone) {
        zone.color = zoneColorSwatch.dataset.zoneColor;
        delete zone.type;
        renderCourt();
        refreshZoneEditorList();
      }
      return;
    }
    const roleChip = event.target.closest("[data-arrow-role]");
    if (roleChip) {
      const arrow = state.arrows[Number(roleChip.dataset.arrowIndex)];
      if (!arrow) return;
      const roleSet = new Set(arrow.roles || []);
      const role = roleChip.dataset.arrowRole;
      if (roleSet.has(role)) roleSet.delete(role); else roleSet.add(role);
      if (roleSet.size === 0) delete arrow.roles; else arrow.roles = Array.from(roleSet);
      renderCourt();
      refreshArrowEditorList();
    }
  });

  explanation.addEventListener("change", (event) => {
    const arrowFieldSelect = event.target.closest("[data-arrow-field]");
    if (arrowFieldSelect && arrowFieldSelect.tagName === "SELECT") {
      const arrow = state.arrows[Number(arrowFieldSelect.dataset.arrowIndex)];
      if (arrow) {
        arrow[arrowFieldSelect.dataset.arrowField] = arrowFieldSelect.value;
        renderCourt();
      }
      return;
    }
  });

  explanation.addEventListener("input", (event) => {
    const labelInput = event.target.closest('[data-arrow-field="label"]');
    if (labelInput) {
      const arrow = state.arrows[Number(labelInput.dataset.arrowIndex)];
      if (arrow) arrow.label = labelInput.value;
      return;
    }
    const zoneLabelInput = event.target.closest('[data-zone-field="label"]');
    if (zoneLabelInput) {
      const zone = state.zones[Number(zoneLabelInput.dataset.zoneIndex)];
      if (zone) {
        zone.label = zoneLabelInput.value;
        renderCourt();
      }
    }
  });

  explanation.addEventListener("submit", async (event) => {
    const form = event.target.closest("[data-scenario-editor]");
    if (!form) return;
    event.preventDefault();
    const scenario = getScenario();
    if (!scenario) return;

    const responsibilities = {};
    roles.forEach((role) => {
      responsibilities[role] = {
        where: form.querySelector(`[data-edit-field="where"][data-role="${role}"]`).value.trim(),
        watch: form.querySelector(`[data-edit-field="watch"][data-role="${role}"]`).value.trim(),
        why: form.querySelector(`[data-edit-field="why"][data-role="${role}"]`).value.trim()
      };
    });
    const arrows = state.arrows.map((arrow) => {
      const from = arrowFromPoint(arrow);
      const clean = {
        from: { x: from.x, y: from.y },
        to: { x: arrow.to.x, y: arrow.to.y },
        type: arrow.type || "rotation",
        style: arrow.style || "solid"
      };
      if (arrow.roles && arrow.roles.length > 0) clean.roles = arrow.roles;
      const label = (arrow.label || "").trim();
      if (label) clean.label = label;
      if (arrow.mover) clean.mover = arrow.mover;
      return clean;
    });
    const zones = state.zones.map((zone) => {
      const clean = {
        label: (zone.label || "").trim() || "区域",
        color: zoneColorKey(zone),
        x: Number(zone.x.toFixed(1)),
        y: Number(zone.y.toFixed(1)),
        width: Number(zone.width.toFixed(1)),
        height: Number(zone.height.toFixed(1))
      };
      if (zone.rotation) clean.rotation = Number(zone.rotation.toFixed(1));
      return clean;
    });
    const patch = {
      title: form.querySelector('[data-edit-field="title"]').value.trim(),
      principle: form.querySelector('[data-edit-field="principle"]').value.trim(),
      coachNotes: form.querySelector('[data-edit-field="coachNotes"]').value.trim(),
      responsibilities,
      defenders: clone(state.positions),
      offense: clonePositions(state.offensePositions),
      ball: clone(state.ball),
      arrows,
      zones
    };

    const saveButton = form.querySelector("[data-edit-save]");
    saveButton.disabled = true;
    try {
      await window.TWBAContentService.updateScenario(state.playbookId, scenario.id, patch);
      state.editMode = false;
      state.editTool = "none";
      resetAnimation();
      await refreshLibrary(state.playbookId, scenario.id);
      setStatus("已保存修改。", "success");
    } catch (error) {
      setStatus(`保存失败：${error.message}`, "error");
      saveButton.disabled = false;
    }
  });
  toggleArrows.addEventListener("change", () => {
    state.showArrows = toggleArrows.checked;
    renderCourt();
  });
  toggleOffense.addEventListener("change", () => {
    state.showOffense = toggleOffense.checked;
    renderCourt();
  });
  toggleZones.addEventListener("change", () => {
    state.showZones = toggleZones.checked;
    renderCourt();
  });

  playbookSelect.addEventListener("change", () => {
    const playbook = state.library.playbooks.find((item) => item.id === playbookSelect.value);
    if (!playbook) return;
    state.playbookId = playbook.id;
    const scenario = (playbook.scenarios || [])[0];
    state.scenarioId = scenario ? scenario.id : "";
    state.positions = clone((scenario && scenario.defenders) || {});
    state.ball = clone((scenario && scenario.ball) || { x: 50, y: 20 });
    state.offensePositions = clonePositions((scenario && scenario.offense) || []);
    state.arrows = clone((scenario && scenario.arrows) || []);
    state.zones = clone((scenario && scenario.zones) || []);
    state.strokes = [];
    state.editTool = "none";
    resetAnimation();
    setStatus("");
    render();
  });

  importBtn.addEventListener("click", () => importFile.click());

  importFile.addEventListener("change", async () => {
    const file = importFile.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const packageData = JSON.parse(text);
      const incomingId = packageData && packageData.playbook && packageData.playbook.id;
      const exists = state.library.playbooks.some((playbook) => playbook.id === incomingId);
      if (exists && !window.confirm("已存在同 ID 战术包，是否替换？")) {
        setStatus("已取消导入。", "muted");
        return;
      }
      const playbook = await window.TWBAContentService.importPackage(packageData);
      await refreshLibrary(playbook.id);
      setStatus(`已导入：${playbook.title}`, "success");
    } catch (error) {
      setStatus(`导入失败：${error.message}`, "error");
    } finally {
      importFile.value = "";
    }
  });

  deletePlaybookBtn.addEventListener("click", async () => {
    const playbook = getPlaybook();
    if (!playbook || playbook.source !== "imported") return;
    if (!window.confirm(`删除导入战术包「${playbook.title}」？`)) return;
    try {
      await window.TWBAContentService.deleteImportedPlaybook(playbook.id);
      await refreshLibrary();
      setStatus("已删除导入内容。", "success");
    } catch (error) {
      setStatus(`删除失败：${error.message}`, "error");
    }
  });

  function buildExportPackage(playbook) {
    const { scenarios, ...playbookOnly } = playbook;
    return {
      schemaVersion: 1,
      playbook: playbookOnly,
      scenarios: clone(scenarios || [])
    };
  }

  async function saveTextFile(filename, content, mimeType) {
    if (window.showSaveFilePicker) {
      try {
        const extension = filename.includes(".") ? `.${filename.split(".").pop()}` : "";
        const handle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [{ description: filename, accept: { [mimeType]: extension ? [extension] : [] } }]
        });
        const writable = await handle.createWritable();
        await writable.write(content);
        await writable.close();
        return true;
      } catch (error) {
        if (error && error.name === "AbortError") return false;
        // fall through to plain download if the picker itself failed
      }
    }
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  }

  async function downloadJson(filename, data) {
    await saveTextFile(filename, JSON.stringify(data, null, 2), "application/json");
  }

  function buildCustomContentSource(playbooks) {
    const packages = playbooks
      .filter((playbook) => playbook.source !== "builtin")
      .map((playbook) => buildExportPackage(playbook));
    return `window.TWBA_CUSTOM_PLAYBOOKS = ${JSON.stringify(packages, null, 2)};\n`;
  }

  exportPlaybookBtn.addEventListener("click", async () => {
    const playbook = getPlaybook();
    if (!playbook) {
      setStatus("没有可导出的战术包。", "error");
      return;
    }
    if (state.editMode) {
      setStatus("导出的是最近一次已保存的内容，请先保存修改再导出。", "muted");
    }
    await downloadJson(`${playbook.id || "playbook"}.json`, buildExportPackage(playbook));
    setStatus(`已导出：${playbook.title}`, "success");
  });

  exportCustomContentBtn.addEventListener("click", async () => {
    const playbooks = state.library.playbooks || [];
    const customOnly = playbooks.filter((playbook) => playbook.source !== "builtin");
    if (customOnly.length === 0) {
      setStatus("没有可导出的自定义/导入内容。", "error");
      return;
    }
    if (state.editMode) {
      setStatus("导出的是最近一次已保存的内容，请先保存修改再导出。", "muted");
    }
    const source = buildCustomContentSource(playbooks);
    await saveTextFile("custom-content.js", source, "text/javascript");
    setStatus(`已导出 ${customOnly.length} 个战术包，覆盖 src/custom-content.js 后 git add+commit+push 即可。`, "success");
  });

  async function createPlaybook(type) {
    const defaultTitle = type === "offense" ? "新进攻战术包" : "新防守战术包";
    const title = window.prompt("战术包名称", defaultTitle);
    if (title === null) return;
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setStatus("战术包名称不能为空。", "error");
      return;
    }
    const id = `custom-${type}-${Date.now()}`;
    const responsibilities = {};
    roles.forEach((role) => {
      responsibilities[role] = { where: "待补充", watch: "待补充", why: "待补充" };
    });
    const packageData = {
      schemaVersion: 1,
      playbook: { id, title: trimmedTitle, type, version: "1.0" },
      scenarios: [{
        id: `${id}-s1`,
        title: "情景 1",
        principle: "",
        ball: { x: 50, y: 20 },
        offense: [],
        defenders: {
          "1": { x: 50, y: 15 },
          "2": { x: 25, y: 30 },
          "3": { x: 75, y: 30 },
          "4": { x: 35, y: 55 },
          "5": { x: 65, y: 55 }
        },
        responsibilities,
        coachNotes: ""
      }]
    };
    try {
      const playbook = await window.TWBAContentService.importPackage(packageData);
      await refreshLibrary(playbook.id);
      state.editMode = true;
      render();
      setStatus(`已新建战术包「${playbook.title}」，可在编辑模式中完善内容。`, "success");
    } catch (error) {
      setStatus(`新建失败：${error.message}`, "error");
    }
  }

  newDefensePlaybookBtn.addEventListener("click", () => createPlaybook("defense"));
  newOffensePlaybookBtn.addEventListener("click", () => createPlaybook("offense"));

  court.addEventListener("pointerdown", (event) => {
    if (state.drawMode) {
      if (event.target.closest(".draw-toolbar")) return;
      const point = pointFromEvent(event);
      state.strokes.push({ color: state.drawColor, width: state.drawWidth, points: [point] });
      state.isDrawingStroke = true;
      court.setPointerCapture(event.pointerId);
      renderCourt();
      return;
    }
    const arrowToolActive = state.editMode && state.editTool === "arrow";
    if (arrowToolActive) {
      const mover = resolveMoverFromEvent(event);
      const point = mover ? mover.point : pointFromEvent(event);
      const defaultType = mover && mover.ref.type === "ball" ? "pass" : "rotation";
      const arrow = { from: point, to: point, type: defaultType, style: "solid", label: "" };
      if (mover) arrow.mover = mover.ref;
      state.arrows.push(arrow);
      state.dragTarget = { type: "arrow", index: state.arrows.length - 1 };
      court.setPointerCapture(event.pointerId);
      return;
    }

    const defender = event.target.closest("[data-marker='defender']");
    const offense = event.target.closest("[data-marker='offense']");
    const ball = event.target.closest("[data-marker='ball']");
    const zoneToolActive = state.editMode && state.editTool === "zone";
    const zoneMove = zoneToolActive ? event.target.closest("[data-marker='zone-move']") : null;
    const zoneResize = zoneToolActive ? event.target.closest("[data-marker='zone-resize']") : null;
    const zoneRotate = zoneToolActive ? event.target.closest("[data-marker='zone-rotate']") : null;
    if (!defender && !offense && !ball && !zoneMove && !zoneResize && !zoneRotate) {
      return;
    }
    if (defender) {
      state.dragTarget = { type: "defender", role: defender.dataset.role };
    } else if (offense) {
      state.dragTarget = { type: "offense", index: Number(offense.dataset.index) };
    } else if (zoneMove) {
      const index = Number(zoneMove.dataset.index);
      const zone = state.zones[index];
      const point = pointFromEvent(event);
      state.dragTarget = {
        type: "zone-move",
        index,
        offsetX: point.x - zone.x,
        offsetY: point.y - zone.y
      };
    } else if (zoneResize) {
      const index = Number(zoneResize.dataset.index);
      const zone = state.zones[index];
      const { cx, cy } = zoneCenter(zone);
      state.dragTarget = { type: "zone-resize", index, cx, cy, angle: zone.rotation || 0 };
    } else if (zoneRotate) {
      const index = Number(zoneRotate.dataset.index);
      const zone = state.zones[index];
      const { cx, cy } = zoneCenter(zone);
      state.dragTarget = { type: "zone-rotate", index, cx, cy };
    } else {
      state.dragTarget = { type: "ball" };
    }
    court.setPointerCapture(event.pointerId);
  });

  court.addEventListener("pointermove", (event) => {
    if (state.drawMode) {
      if (!state.isDrawingStroke) return;
      const point = pointFromEvent(event);
      state.strokes[state.strokes.length - 1].points.push(point);
      renderCourt();
      return;
    }
    if (!state.dragTarget) return;
    const point = pointFromEvent(event);
    if (state.dragTarget.type === "defender") {
      state.positions[state.dragTarget.role] = {
        ...state.positions[state.dragTarget.role],
        x: point.x,
        y: point.y
      };
    } else if (state.dragTarget.type === "offense") {
      const player = state.offensePositions[state.dragTarget.index];
      if (!player) return;
      const adjustedPoint = pointWithoutVisualOffset(point, offenseVisualOffset);
      state.offensePositions[state.dragTarget.index] = {
        ...player,
        x: adjustedPoint.x,
        y: adjustedPoint.y
      };
    } else if (state.dragTarget.type === "arrow") {
      state.arrows[state.dragTarget.index].to = point;
    } else if (state.dragTarget.type === "zone-move") {
      const zone = state.zones[state.dragTarget.index];
      if (!zone) return;
      const newX = point.x - state.dragTarget.offsetX;
      const newY = point.y - state.dragTarget.offsetY;
      zone.x = Math.max(0, Math.min(100 - zone.width, Number(newX.toFixed(1))));
      zone.y = Math.max(0, Math.min(100 - zone.height, Number(newY.toFixed(1))));
    } else if (state.dragTarget.type === "zone-resize") {
      const zone = state.zones[state.dragTarget.index];
      if (!zone) return;
      const { cx, cy, angle } = state.dragTarget;
      const rad = (-angle * Math.PI) / 180;
      const dx = point.x - cx;
      const dy = point.y - cy;
      const localX = dx * Math.cos(rad) - dy * Math.sin(rad);
      const localY = dx * Math.sin(rad) + dy * Math.cos(rad);
      const minSize = 6;
      zone.width = Math.min(100, Number(Math.max(minSize, Math.abs(localX) * 2).toFixed(1)));
      zone.height = Math.min(100, Number(Math.max(minSize, Math.abs(localY) * 2).toFixed(1)));
      zone.x = Math.max(0, Math.min(100 - zone.width, Number((cx - zone.width / 2).toFixed(1))));
      zone.y = Math.max(0, Math.min(100 - zone.height, Number((cy - zone.height / 2).toFixed(1))));
    } else if (state.dragTarget.type === "zone-rotate") {
      const zone = state.zones[state.dragTarget.index];
      if (!zone) return;
      const { cx, cy } = state.dragTarget;
      const angleDeg = (Math.atan2(point.y - cy, point.x - cx) * 180) / Math.PI + 90;
      zone.rotation = Number((((angleDeg % 360) + 360) % 360).toFixed(1));
    } else {
      state.ball = pointWithoutVisualOffset(point, ballVisualOffset);
    }
    renderCourt();
  });

  function discardEmptyDraftArrow() {
    if (!state.dragTarget || state.dragTarget.type !== "arrow") return;
    const arrow = state.arrows[state.dragTarget.index];
    if (!arrow) return;
    const dx = arrow.to.x - arrow.from.x;
    const dy = arrow.to.y - arrow.from.y;
    if (Math.hypot(dx, dy) < 3) state.arrows.splice(state.dragTarget.index, 1);
  }

  court.addEventListener("pointerup", (event) => {
    const wasDrawingArrow = state.dragTarget && state.dragTarget.type === "arrow";
    discardEmptyDraftArrow();
    state.dragTarget = null;
    state.isDrawingStroke = false;
    if (court.hasPointerCapture(event.pointerId)) {
      court.releasePointerCapture(event.pointerId);
    }
    if (wasDrawingArrow) {
      renderCourt();
      refreshArrowEditorList();
    }
  });

  court.addEventListener("pointercancel", () => {
    discardEmptyDraftArrow();
    state.dragTarget = null;
    state.isDrawingStroke = false;
  });

  court.addEventListener("lostpointercapture", () => {
    discardEmptyDraftArrow();
    state.dragTarget = null;
    state.isDrawingStroke = false;
  });

  try {
    const library = await window.TWBAContentService.init();
    applyLibrary(library);
    render();
    if (library.message) setStatus(library.message, "error");
  } catch (error) {
    court.innerHTML = `<div class="empty-state">内容库初始化失败。</div>`;
    explanation.innerHTML = `<h2>无法加载</h2><p class="principle">${escapeHtml(error.message)}</p>`;
    setStatus(`初始化失败：${error.message}`, "error");
  }
})();
