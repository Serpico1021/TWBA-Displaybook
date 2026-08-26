(function () {
  const scenarios = window.TWBA_SCENARIOS || [];
  const firstScenario = scenarios[0] || {};
  const roles = ["1", "2", "3", "4", "5"];
  const state = {
    scenarioId: firstScenario.id || "",
    focusedRole: "all",
    showArrows: true,
    showOffense: true,
    showZones: true,
    positions: clone(firstScenario.defenders || {}),
    ball: clone(firstScenario.ball || { x: 50, y: 20 }),
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

  function getScenario() {
    return scenarios.find((scenario) => scenario.id === state.scenarioId) || scenarios[0];
  }

  function getResponsibility(scenario, role) {
    return (scenario.responsibilities && scenario.responsibilities[role]) || {
      where: "当前情景未配置该号码的站位说明。",
      watch: "当前情景未配置该号码的观察重点。",
      why: "当前情景未配置该号码的防守原因。"
    };
  }

  function number(value) {
    return Number(value).toFixed(1).replace(/\.0$/, "");
  }

  function sameRole(role) {
    return state.focusedRole === "all" || state.focusedRole === role;
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
    return (scenario.offense || []).map((player) => `
      <g data-marker="offense" class="offense-marker" transform="translate(${number(player.x)} ${number(player.y)})">
        <circle r="3"></circle>
        <text y="1.1">${escapeHtml(player.label)}</text>
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
    const x = number(state.ball.x);
    const y = number(state.ball.y);
    return `
      <g data-marker="ball" class="ball-marker" tabindex="0" role="button" aria-label="篮球">
        <circle class="hit-target" cx="${x}" cy="${y}" r="6.5"></circle>
        <circle cx="${x}" cy="${y}" r="2.7"></circle>
        <path d="M ${number(state.ball.x - 2.1)} ${y} H ${number(state.ball.x + 2.1)}"></path>
        <path d="M ${x} ${number(state.ball.y - 2.1)} V ${number(state.ball.y + 2.1)}"></path>
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
          <circle class="hit-target" r="7"></circle>
          <circle r="4.4"></circle>
          <text y="1.55">${role}</text>
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

  function renderScenarioButtons() {
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
    renderScenarioButtons();
    renderRoleButtons();
    renderCourt();
    renderExplanation();
  }

  function loadScenario(id) {
    const scenario = scenarios.find((item) => item.id === id);
    if (!scenario) return;
    state.scenarioId = scenario.id;
    state.positions = clone(scenario.defenders || {});
    state.ball = clone(scenario.ball || { x: 50, y: 20 });
    render();
  }

  function pointFromEvent(event) {
    const svg = court.querySelector("svg");
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

  if (scenarios.length > 0) {
    render();
  } else {
    renderScenarioButtons();
    renderRoleButtons();
    renderCourt();
    renderExplanation();
  }
})();
