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
    drawMode: false,
    drawColor: DRAW_COLORS[0],
    drawWidth: DRAW_WIDTHS[1].value,
    strokes: [],
    isDrawingStroke: false,
    arrows: [],
    showArrows: true,
    showOffense: true,
    showZones: true,
    offensePositions: [],
    positions: {},
    ball: { x: 50, y: 20 },
    dragTarget: null
  };

  const court = document.querySelector("#court");
  const scenarioList = document.querySelector("#scenarioList");
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
  const restoreBtn = document.querySelector("#restoreBtn");
  const libraryStatus = document.querySelector("#libraryStatus");

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
    state.strokes = [];
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

  function renderZones(scenario) {
    if (!state.showZones) return "";
    return (scenario.zones || []).map((zone) => `
      <g class="zone-group">
        <rect class="zone zone-${escapeHtml(zone.type)}" x="${number(zone.x)}" y="${number(zone.y)}" width="${number(zone.width)}" height="${number(zone.height)}"></rect>
        <text class="zone-label" x="${number(zone.x + zone.width / 2)}" y="${number(zone.y + 5)}">${escapeHtml(zone.label)}</text>
      </g>
    `).join("");
  }

  function renderOffense(scenario) {
    if (!state.showOffense) return "";
    const offense = state.offensePositions.length > 0 ? state.offensePositions : scenario.offense || [];
    return offense.map((player, index) => `
      <g data-marker="offense" data-index="${index}" class="offense-marker" transform="translate(${number(player.x + offenseVisualOffset.x)} ${number(player.y + offenseVisualOffset.y)})">
        <circle class="hit-target" r="${number(markerSize.offenseHitRadius)}"></circle>
        <circle r="${number(markerSize.offenseRadius)}"></circle>
        <text y="1">${escapeHtml(String(index + 1))}</text>
      </g>
    `).join("");
  }

  function renderArrows() {
    if (!state.showArrows) return "";
    return state.arrows
      .filter((arrow) => state.editMode || state.focusedRole === "all" || (arrow.roles || []).includes(state.focusedRole))
      .map((arrow) => `
        <line class="arrow arrow-${escapeHtml(arrow.type)}"
          x1="${number(arrow.from.x)}" y1="${number(arrow.from.y)}"
          x2="${number(arrow.to.x)}" y2="${number(arrow.to.y)}"
          marker-end="url(#arrow-${escapeHtml(arrow.type)})">
          <title>${escapeHtml(arrow.label || arrow.type)}</title>
        </line>
      `).join("");
  }

  function renderBall() {
    const hitX = number(state.ball.x);
    const hitY = number(state.ball.y);
    const x = state.ball.x + ballVisualOffset.x;
    const y = state.ball.y + ballVisualOffset.y;
    return `
      <g data-marker="ball" class="ball-marker" tabindex="0" role="button" aria-label="篮球">
        <circle class="hit-target" cx="${hitX}" cy="${hitY}" r="${number(markerSize.ballHitRadius)}"></circle>
        <circle cx="${number(x)}" cy="${number(y)}" r="${number(markerSize.ballRadius)}"></circle>
        <path d="M ${number(x - markerSize.ballSeam)} ${number(y)} H ${number(x + markerSize.ballSeam)}"></path>
        <path d="M ${number(x)} ${number(y - markerSize.ballSeam)} V ${number(y + markerSize.ballSeam)}"></path>
      </g>
    `;
  }

  function renderDefenders() {
    return roles.map((role) => {
      const point = state.positions[role];
      if (!point) return "";
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
    const scenario = getScenario();
    if (!scenario) {
      court.innerHTML = `<div class="empty-state">暂无战术情景数据。</div>`;
      return;
    }
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
        ${renderZones(scenario)}
        ${renderOffense(scenario)}
        ${renderArrows()}
        ${renderBall()}
        ${renderDefenders()}
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

  function renderScenarioButtons() {
    const scenarios = getScenarios();
    if (scenarios.length === 0) {
      scenarioList.innerHTML = `<p class="empty-state">暂无情景。</p>`;
      return;
    }
    scenarioList.innerHTML = scenarios.map((scenario, index) => {
      const active = scenario.id === state.scenarioId;
      return `<button type="button" data-scenario="${escapeHtml(scenario.id)}" aria-pressed="${active}">
        <span>${index + 1}</span>${escapeHtml(scenario.title)}
      </button>`;
    }).join("");
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

  function renderArrowRows() {
    if (state.arrows.length === 0) {
      return `<p class="empty-state">暂无箭头，在球场空白处拖拽绘制。</p>`;
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
          <label>说明
            <input type="text" data-arrow-field="label" data-arrow-index="${index}"
              value="${escapeHtml(arrow.label || "")}" placeholder="例如：1号前压">
          </label>
          <div class="editor-arrow-roles" aria-label="适用视角，不选则所有视角可见">${roleChips}</div>
          <button type="button" class="icon-text-button" data-delete-arrow="${index}">删除箭头</button>
        </fieldset>
      `;
    }).join("");
  }

  function refreshArrowEditorList() {
    const container = explanation.querySelector("[data-arrows-list]");
    if (container) container.innerHTML = renderArrowRows();
  }

  function renderExplanationEditor(scenario) {
    const cards = roles.map((role) => {
      const item = getResponsibility(scenario, role);
      return `
        <fieldset class="editor-role">
          <legend>${role}号</legend>
          <label>站哪里
            <textarea data-edit-field="where" data-role="${role}" rows="2">${escapeHtml(item.where)}</textarea>
          </label>
          <label>看什么
            <textarea data-edit-field="watch" data-role="${role}" rows="2">${escapeHtml(item.watch)}</textarea>
          </label>
          <label>为什么
            <textarea data-edit-field="why" data-role="${role}" rows="2">${escapeHtml(item.why)}</textarea>
          </label>
        </fieldset>
      `;
    }).join("");

    explanation.innerHTML = `
      <form class="scenario-editor" data-scenario-editor>
        <label>情景标题
          <input type="text" data-edit-field="title" value="${escapeHtml(scenario.title)}">
        </label>
        <label>讲解要点
          <textarea data-edit-field="principle" rows="2">${escapeHtml(scenario.principle || "")}</textarea>
        </label>
        ${cards}
        <div class="editor-arrows">
          <h3>轮转箭头</h3>
          <p class="editor-hint">在球场空白处拖拽绘制新箭头；保存后成为该情景的默认箭头，非临时标注。</p>
          <div data-arrows-list>${renderArrowRows()}</div>
        </div>
        <label>教练备注
          <textarea data-edit-field="coachNotes" rows="2">${escapeHtml(scenario.coachNotes || "")}</textarea>
        </label>
        <p class="editor-hint">拖动球场上的球员/篮球可调整站位，保存修改会一并写入为新的初始站位。</p>
        <div class="edit-actions">
          <button type="submit" class="icon-text-button" data-edit-save>保存修改</button>
          <button type="button" class="icon-text-button" data-edit-cancel>取消</button>
        </div>
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
    renderScenarioButtons();
    renderRoleButtons();
    renderCourt();
    renderExplanation();
  }

  function loadScenario(id) {
    const scenario = getScenarios().find((item) => item.id === id);
    if (!scenario) return;
    state.scenarioId = scenario.id;
    state.positions = clone(scenario.defenders || {});
    state.ball = clone(scenario.ball || { x: 50, y: 20 });
    state.offensePositions = clonePositions(scenario.offense || []);
    state.arrows = clone(scenario.arrows || []);
    state.strokes = [];
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
  editModeBtn.addEventListener("click", () => {
    state.editMode = !state.editMode;
    if (state.editMode) state.drawMode = false;
    render();
  });
  drawModeBtn.addEventListener("click", () => {
    state.drawMode = !state.drawMode;
    if (state.drawMode) state.editMode = false;
    render();
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

  explanation.addEventListener("click", (event) => {
    if (event.target.closest("[data-edit-cancel]")) {
      state.editMode = false;
      render();
      return;
    }
    const deleteArrowBtn = event.target.closest("[data-delete-arrow]");
    if (deleteArrowBtn) {
      state.arrows.splice(Number(deleteArrowBtn.dataset.deleteArrow), 1);
      renderCourt();
      refreshArrowEditorList();
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
    const typeSelect = event.target.closest('[data-arrow-field="type"]');
    if (!typeSelect) return;
    const arrow = state.arrows[Number(typeSelect.dataset.arrowIndex)];
    if (!arrow) return;
    arrow.type = typeSelect.value;
    renderCourt();
  });

  explanation.addEventListener("input", (event) => {
    const labelInput = event.target.closest('[data-arrow-field="label"]');
    if (!labelInput) return;
    const arrow = state.arrows[Number(labelInput.dataset.arrowIndex)];
    if (arrow) arrow.label = labelInput.value;
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
      const clean = {
        from: { x: arrow.from.x, y: arrow.from.y },
        to: { x: arrow.to.x, y: arrow.to.y },
        type: arrow.type || "rotation"
      };
      if (arrow.roles && arrow.roles.length > 0) clean.roles = arrow.roles;
      const label = (arrow.label || "").trim();
      if (label) clean.label = label;
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
      arrows
    };

    const saveButton = form.querySelector("[data-edit-save]");
    saveButton.disabled = true;
    try {
      await window.TWBAContentService.updateScenario(state.playbookId, scenario.id, patch);
      state.editMode = false;
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
    state.strokes = [];
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

  restoreBtn.addEventListener("click", async () => {
    if (!window.confirm("恢复默认内容会清空已导入战术包，是否继续？")) return;
    try {
      await window.TWBAContentService.restoreBuiltin();
      await refreshLibrary("zone-2-3-rotated-131");
      setStatus("已恢复内置默认内容。", "success");
    } catch (error) {
      setStatus(`恢复失败：${error.message}`, "error");
    }
  });

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
    const defender = event.target.closest("[data-marker='defender']");
    const offense = event.target.closest("[data-marker='offense']");
    const ball = event.target.closest("[data-marker='ball']");
    if (!defender && !offense && !ball) {
      if (state.editMode) {
        const point = pointFromEvent(event);
        state.arrows.push({ from: point, to: point, type: "rotation", label: "" });
        state.dragTarget = { type: "arrow", index: state.arrows.length - 1 };
        court.setPointerCapture(event.pointerId);
      }
      return;
    }
    if (defender) {
      state.dragTarget = { type: "defender", role: defender.dataset.role };
    } else if (offense) {
      state.dragTarget = { type: "offense", index: Number(offense.dataset.index) };
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
