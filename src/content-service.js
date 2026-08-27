(function () {
  const validation = window.TWBAContentValidation;
  const db = window.TWBAContentDB;
  const builtinPackages = window.TWBA_BUILTIN_PLAYBOOKS || [];
  let fallback = false;
  let memoryPackages = [];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function preparePackage(packageData, source) {
    return validation.validateContentPackage(
      validation.normalizePackageSource(packageData, source)
    );
  }

  function expandMemoryPackages() {
    return memoryPackages.map((contentPackage) => ({
      ...clone(contentPackage.playbook),
      scenarios: clone(contentPackage.scenarios)
    }));
  }

  async function seedBuiltinPackages() {
    const prepared = builtinPackages.map((contentPackage) => preparePackage(contentPackage, "builtin"));
    if (fallback) {
      if (memoryPackages.length === 0) memoryPackages = prepared;
      return;
    }
    const existing = await db.getPlaybooks();
    const existingIds = new Set(existing.map((item) => item.id));
    const missing = prepared.filter((contentPackage) => !existingIds.has(contentPackage.playbook.id));
    await Promise.all(missing.map((contentPackage) => db.savePackage(contentPackage)));
  }

  async function init() {
    try {
      await db.open();
      fallback = false;
      await seedBuiltinPackages();
      return getLibrary();
    } catch (error) {
      fallback = true;
      memoryPackages = builtinPackages.map((contentPackage) => preparePackage(contentPackage, "builtin"));
      const library = await getLibrary();
      library.message = `IndexedDB 不可用，已使用本次页面内存数据：${error.message}`;
      return library;
    }
  }

  async function getLibrary() {
    if (fallback) {
      return {
        fallback,
        message: "",
        playbooks: expandMemoryPackages()
      };
    }

    const playbooks = await db.getPlaybooks();
    const expanded = await Promise.all(
      playbooks.map(async (playbook) => ({
        ...playbook,
        scenarios: await db.getScenarios(playbook.id)
      }))
    );
    return {
      fallback,
      message: "",
      playbooks: expanded
    };
  }

  async function getPlaybook(playbookId) {
    const library = await getLibrary();
    return library.playbooks.find((playbook) => playbook.id === playbookId) || library.playbooks[0];
  }

  async function importPackage(packageData) {
    const contentPackage = preparePackage(packageData, "imported");
    if (fallback) {
      memoryPackages = memoryPackages.filter((item) => item.playbook.id !== contentPackage.playbook.id);
      memoryPackages.push(contentPackage);
      return contentPackage.playbook;
    }
    await db.savePackage(contentPackage);
    return contentPackage.playbook;
  }

  async function updateScenario(playbookId, scenarioId, patch) {
    const library = await getLibrary();
    const playbook = library.playbooks.find((item) => item.id === playbookId);
    if (!playbook) throw new Error("未找到战术包。");
    const { scenarios: currentScenarios, ...playbookOnly } = playbook;
    if (!currentScenarios.some((scenario) => scenario.id === scenarioId)) {
      throw new Error("未找到情景。");
    }
    const scenarios = currentScenarios.map((scenario) =>
      scenario.id === scenarioId ? { ...scenario, ...patch } : scenario
    );
    const contentPackage = preparePackage(
      { schemaVersion: 1, playbook: playbookOnly, scenarios },
      playbookOnly.source
    );

    if (fallback) {
      memoryPackages = memoryPackages.map((item) =>
        item.playbook.id === playbookId ? contentPackage : item
      );
      return contentPackage.scenarios.find((scenario) => scenario.id === scenarioId);
    }
    await db.savePackage(contentPackage);
    return contentPackage.scenarios.find((scenario) => scenario.id === scenarioId);
  }

  async function deleteImportedPlaybook(playbookId) {
    const playbook = await getPlaybook(playbookId);
    if (!playbook) throw new Error("未找到要删除的战术包。");
    if (playbook.source !== "imported") throw new Error("内置内容不能删除。");

    if (fallback) {
      memoryPackages = memoryPackages.filter((item) => item.playbook.id !== playbookId);
      return;
    }
    await db.deletePlaybook(playbookId);
  }

  async function restoreBuiltin() {
    const prepared = builtinPackages.map((contentPackage) => preparePackage(contentPackage, "builtin"));
    if (fallback) {
      memoryPackages = prepared;
      return;
    }
    await db.clearAll();
    await Promise.all(prepared.map((contentPackage) => db.savePackage(contentPackage)));
  }

  window.TWBAContentService = {
    deleteImportedPlaybook,
    getLibrary,
    getPlaybook,
    importPackage,
    init,
    restoreBuiltin,
    updateScenario
  };
})();
