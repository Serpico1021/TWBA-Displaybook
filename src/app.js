(async function () {
  const roles = ["1", "2", "3", "4", "5"];
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
  const state = {
    library: { playbooks: [], fallback: false, message: "" },
    playbookId: "",
    scenarioId: "",
    focusedRole: "all",
    showArrows: true,
    showOffense: true,
    showZones: true,
    positions: {},
    ball: { x: 50, y: 20 },
    dragTarget: null
  };

  const court = document.querySelector("#court");
  const scenarioList = document.querySelector("#scenarioList");
  const roleFilter = document.querySelector("#roleFilter");
  const explanation = document.querySelector("#explanation");
  const resetBtn = document.querySelector("#resetBtn");
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
    return (scenario.offense || []).map((player, index) => `
      <g data-marker="offense" class="offense-marker" transform="translate(${number(player.x + offenseVisualOffset.x)} ${number(player.y + offenseVisualOffset.y)})">
        <circle r="${number(markerSize.offenseRadius)}"></circle>
        <text y="1">${escapeHtml(String(index + 1))}</text>
      </g>
    `).join("");
  }

  function renderArrows(scenario) {
    if (!state.showArrows) return "";
    return (scenario.arrows || [])
      .filter((arrow) => state.focusedRole === "all" || (arrow.roles || []).includes(state.focusedRole))
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
        ${renderArrows(scenario)}
        ${renderBall()}
        ${renderDefenders()}
      </svg>
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

  function renderExplanation() {
    const scenario = getScenario();
    if (!scenario) {
      explanation.innerHTML = `<h2>暂无情景</h2><p class="principle">请先配置战术情景数据。</p>`;
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
    const defender = event.target.closest("[data-marker='defender']");
    const ball = event.target.closest("[data-marker='ball']");
    if (!defender && !ball) return;
    state.dragTarget = defender ? { type: "defender", role: defender.dataset.role } : { type: "ball" };
    court.setPointerCapture(event.pointerId);
  });

  court.addEventListener("pointermove", (event) => {
    if (!state.dragTarget) return;
    const point = pointFromEvent(event);
    if (state.dragTarget.type === "defender") {
      state.positions[state.dragTarget.role] = {
        ...state.positions[state.dragTarget.role],
        x: point.x,
        y: point.y
      };
    } else {
      state.ball = point;
    }
    renderCourt();
  });

  court.addEventListener("pointerup", (event) => {
    state.dragTarget = null;
    if (court.hasPointerCapture(event.pointerId)) {
      court.releasePointerCapture(event.pointerId);
    }
  });

  court.addEventListener("pointercancel", () => {
    state.dragTarget = null;
  });

  court.addEventListener("lostpointercapture", () => {
    state.dragTarget = null;
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
