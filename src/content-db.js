(function () {
  const dbName = "twba-displaybook";
  const dbVersion = 1;
  let dbPromise = null;

  function requestToPromise(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function transactionDone(transaction) {
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  }

  function open() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error("当前浏览器不支持 IndexedDB。"));
        return;
      }

      const request = window.indexedDB.open(dbName, dbVersion);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("playbooks")) {
          const playbooks = db.createObjectStore("playbooks", { keyPath: "id" });
          playbooks.createIndex("type", "type", { unique: false });
          playbooks.createIndex("source", "source", { unique: false });
          playbooks.createIndex("updatedAt", "updatedAt", { unique: false });
        }
        if (!db.objectStoreNames.contains("scenarios")) {
          const scenarios = db.createObjectStore("scenarios", { keyPath: "uid" });
          scenarios.createIndex("playbookId", "playbookId", { unique: false });
          scenarios.createIndex("sortOrder", "sortOrder", { unique: false });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return dbPromise;
  }

  async function getPlaybooks() {
    const db = await open();
    const transaction = db.transaction("playbooks", "readonly");
    const items = await requestToPromise(transaction.objectStore("playbooks").getAll());
    return items.sort((a, b) => String(a.title).localeCompare(String(b.title), "zh-CN"));
  }

  async function getScenarios(playbookId) {
    const db = await open();
    const transaction = db.transaction("scenarios", "readonly");
    const index = transaction.objectStore("scenarios").index("playbookId");
    const items = await requestToPromise(index.getAll(playbookId));
    return items
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(({ uid, playbookId: _playbookId, sortOrder, ...scenario }) => scenario);
  }

  async function savePackage(contentPackage) {
    const db = await open();
    const now = new Date().toISOString();
    const { playbook, scenarios } = contentPackage;
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(["playbooks", "scenarios"], "readwrite");
      const playbookStore = transaction.objectStore("playbooks");
      const scenarioStore = transaction.objectStore("scenarios");
      const keysRequest = scenarioStore.index("playbookId").getAllKeys(playbook.id);

      keysRequest.onsuccess = () => {
        keysRequest.result.forEach((uid) => scenarioStore.delete(uid));
        playbookStore.put({
          ...playbook,
          createdAt: playbook.createdAt || now,
          updatedAt: now
        });
        scenarios.forEach((scenario, index) => {
          scenarioStore.put({
            ...scenario,
            uid: `${playbook.id}:${scenario.id}`,
            playbookId: playbook.id,
            sortOrder: index
          });
        });
      };
      keysRequest.onerror = () => reject(keysRequest.error);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  }

  async function deletePlaybook(playbookId) {
    const db = await open();
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(["playbooks", "scenarios"], "readwrite");
      const playbookStore = transaction.objectStore("playbooks");
      const scenarioStore = transaction.objectStore("scenarios");
      const keysRequest = scenarioStore.index("playbookId").getAllKeys(playbookId);

      keysRequest.onsuccess = () => {
        keysRequest.result.forEach((uid) => scenarioStore.delete(uid));
        playbookStore.delete(playbookId);
      };
      keysRequest.onerror = () => reject(keysRequest.error);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  }

  window.TWBAContentDB = {
    deletePlaybook,
    getPlaybooks,
    getScenarios,
    open,
    savePackage
  };
})();
