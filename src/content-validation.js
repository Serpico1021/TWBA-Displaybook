(function () {
  const roles = ["1", "2", "3", "4", "5"];
  const contentTypes = ["defense", "offense"];
  const arrowTypes = ["rotation", "help", "pass"];
  const zoneTypes = ["strong", "middle", "last"];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function fail(message) {
    throw new Error(message);
  }

  function isObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function requireText(value, label) {
    if (typeof value !== "string" || value.trim() === "") {
      fail(`${label} 不能为空。`);
    }
    return value.trim();
  }

  function assertCoordinate(point, label) {
    if (!isObject(point)) fail(`${label} 必须是坐标对象。`);
    ["x", "y"].forEach((axis) => {
      const value = point[axis];
      if (typeof value !== "number" || Number.isNaN(value) || value < 0 || value > 100) {
        fail(`${label}.${axis} 必须是 0 到 100 之间的数字。`);
      }
    });
  }

  function assertCoordinateList(list, label) {
    if (!Array.isArray(list)) return;
    list.forEach((point, index) => {
      assertCoordinate(point, `${label}[${index}]`);
    });
  }

  function assertDefenders(defenders, scenarioId) {
    if (!isObject(defenders)) fail(`情景 ${scenarioId} 的 defenders 必须是对象。`);
    roles.forEach((role) => {
      if (!defenders[role]) fail(`情景 ${scenarioId} 缺少 ${role} 号防守人坐标。`);
      assertCoordinate(defenders[role], `情景 ${scenarioId} defenders.${role}`);
    });
  }

  function assertResponsibilities(responsibilities, scenarioId) {
    if (!isObject(responsibilities)) fail(`情景 ${scenarioId} 的 responsibilities 必须是对象。`);
    roles.forEach((role) => {
      const item = responsibilities[role];
      if (!isObject(item)) fail(`情景 ${scenarioId} 缺少 ${role} 号职责说明。`);
      requireText(item.where, `情景 ${scenarioId} ${role}号 where`);
      requireText(item.watch, `情景 ${scenarioId} ${role}号 watch`);
      requireText(item.why, `情景 ${scenarioId} ${role}号 why`);
    });
  }

  function assertArrows(arrows, scenarioId) {
    if (arrows === undefined) return;
    if (!Array.isArray(arrows)) fail(`情景 ${scenarioId} 的 arrows 必须是数组。`);
    arrows.forEach((arrow, index) => {
      const label = `情景 ${scenarioId} arrows[${index}]`;
      if (!isObject(arrow)) fail(`${label} 必须是对象。`);
      assertCoordinate(arrow.from, `${label}.from`);
      assertCoordinate(arrow.to, `${label}.to`);
      if (!arrowTypes.includes(arrow.type)) {
        fail(`${label}.type 必须是 ${arrowTypes.join("/")} 之一。`);
      }
      if (arrow.roles !== undefined) {
        if (!Array.isArray(arrow.roles) || arrow.roles.length === 0) {
          fail(`${label}.roles 必须是非空数组。`);
        }
        arrow.roles.forEach((role) => {
          if (!roles.includes(role)) fail(`${label}.roles 包含无效的号码 "${role}"。`);
        });
      }
      if (arrow.label !== undefined) requireText(arrow.label, `${label}.label`);
    });
  }

  function assertZones(zones, scenarioId) {
    if (zones === undefined) return;
    if (!Array.isArray(zones)) fail(`情景 ${scenarioId} 的 zones 必须是数组。`);
    zones.forEach((zone, index) => {
      const label = `情景 ${scenarioId} zones[${index}]`;
      if (!isObject(zone)) fail(`${label} 必须是对象。`);
      requireText(zone.label, `${label}.label`);
      if (!zoneTypes.includes(zone.type)) {
        fail(`${label}.type 必须是 ${zoneTypes.join("/")} 之一。`);
      }
      ["x", "y"].forEach((axis) => {
        const value = zone[axis];
        if (typeof value !== "number" || Number.isNaN(value) || value < 0 || value > 100) {
          fail(`${label}.${axis} 必须是 0 到 100 之间的数字。`);
        }
      });
      ["width", "height"].forEach((axis) => {
        const value = zone[axis];
        if (typeof value !== "number" || Number.isNaN(value) || value <= 0) {
          fail(`${label}.${axis} 必须是大于 0 的数字。`);
        }
      });
      if (zone.x + zone.width > 100) fail(`${label} 的 x + width 不能超过 100。`);
      if (zone.y + zone.height > 100) fail(`${label} 的 y + height 不能超过 100。`);
    });
  }

  function normalizePackageSource(packageData, source) {
    const normalized = clone(packageData);
    normalized.playbook = normalized.playbook || {};
    normalized.playbook.source = source;
    return normalized;
  }

  function validateContentPackage(packageData) {
    if (!isObject(packageData)) fail("导入内容必须是 JSON 对象。");
    if (packageData.schemaVersion !== 1) fail("schemaVersion 必须为 1。");
    if (!isObject(packageData.playbook)) fail("playbook 必须是对象。");

    const playbook = clone(packageData.playbook);
    playbook.id = requireText(playbook.id, "playbook.id");
    playbook.title = requireText(playbook.title, "playbook.title");
    playbook.type = requireText(playbook.type, "playbook.type");
    playbook.version = requireText(playbook.version, "playbook.version");
    if (!contentTypes.includes(playbook.type)) {
      fail('playbook.type 必须是 "defense" 或 "offense"。');
    }
    playbook.source = playbook.source === "builtin" ? "builtin" : "imported";

    if (!Array.isArray(packageData.scenarios) || packageData.scenarios.length === 0) {
      fail("scenarios 必须是非空数组。");
    }

    const scenarios = packageData.scenarios.map((scenario, index) => {
      if (!isObject(scenario)) fail(`scenarios[${index}] 必须是对象。`);
      const item = clone(scenario);
      item.id = requireText(item.id, `scenarios[${index}].id`);
      item.title = requireText(item.title, `情景 ${item.id} title`);
      assertCoordinate(item.ball, `情景 ${item.id} ball`);
      assertCoordinateList(item.offense, `情景 ${item.id} offense`);
      assertDefenders(item.defenders, item.id);
      assertResponsibilities(item.responsibilities, item.id);
      assertArrows(item.arrows, item.id);
      assertZones(item.zones, item.id);
      return item;
    });

    return {
      schemaVersion: 1,
      playbook,
      scenarios
    };
  }

  window.TWBAContentValidation = {
    normalizePackageSource,
    validateContentPackage
  };
})();
