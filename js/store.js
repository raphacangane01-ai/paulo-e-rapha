// store.js — camada de dados única do app.
//
// Hoje: tudo é salvo em um único objeto JSON no localStorage (funciona
// 100% offline, sem login).
//
// Amanhã: quando o Supabase for configurado (ver config.js), este mesmo
// objeto pode ser sincronizado como uma linha JSON por usuário (mesmo
// padrão simples usado no projeto anterior), sem precisar mudar nenhum
// módulo que consome o Store — todos falam apenas com Store.get/Store.set.

const Store = (() => {
  const STORAGE_KEY = 'meuCasamentoData_v1';

  const DEFAULT_DATA = {
    meta: { createdAt: new Date().toISOString(), version: 1 },
    settings: {
      weddingDate: window.MEU_CASAMENTO_CONFIG?.weddingDate || null,
      weddingLocation: window.MEU_CASAMENTO_CONFIG?.weddingLocation || '',
      budgetCap: window.MEU_CASAMENTO_CONFIG?.defaultBudgetCap || 0,
    },
    guests: [],
    budgetItems: [],     // { id, category, vendorId, plannedValue, notes }
    payments: [],        // { id, budgetItemId, description, amount, dueDate, paidDate, status }
    vendors: [],         // { id, name, category, contact, status, contractNotes }
    checklist: [],       // { id, title, dueDate, done, category }
    timeline: [],        // { id, time, title, notes, day: 'planning' | 'event' }
    tables: [],          // { id, name, capacity, guestIds: [] }
    gifts: [],           // { id, name, estimatedValue, link, status, givenBy }
    inspirations: [],    // { id, title, url, notes, category }
  };

  let data = load();
  const listeners = new Set();

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(DEFAULT_DATA);
      const parsed = JSON.parse(raw);
      // merge com defaults para tolerar novas chaves adicionadas depois
      return { ...structuredClone(DEFAULT_DATA), ...parsed };
    } catch (e) {
      console.error('Falha ao carregar dados locais, iniciando vazio.', e);
      return structuredClone(DEFAULT_DATA);
    }
  }

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    listeners.forEach((fn) => {
      try { fn(data); } catch (e) { console.error(e); }
    });
    // Ponto único de extensão futura: sincronizar com Supabase aqui.
    // Ex.: if (SupabaseSync.isReady()) SupabaseSync.push(data);
  }

  function get(collection) {
    if (!collection) return structuredClone(data);
    return structuredClone(data[collection]);
  }

  function set(collection, value) {
    data[collection] = value;
    persist();
  }

  function update(collection, updaterFn) {
    data[collection] = updaterFn(structuredClone(data[collection]));
    persist();
  }

  function addItem(collection, item) {
    const withId = { id: item.id || Utils.uid(), ...item };
    update(collection, (list) => {
      list.push(withId);
      return list;
    });
    return withId;
  }

  function updateItem(collection, id, patch) {
    update(collection, (list) => list.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  function removeItem(collection, id) {
    update(collection, (list) => list.filter((it) => it.id !== id));
  }

  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  function exportAll() {
    return structuredClone(data);
  }

  function importAll(newData) {
    data = { ...structuredClone(DEFAULT_DATA), ...newData };
    persist();
  }

  function resetAll() {
    data = structuredClone(DEFAULT_DATA);
    persist();
  }

  return {
    get, set, update, addItem, updateItem, removeItem,
    subscribe, exportAll, importAll, resetAll,
  };
})();

window.Store = Store;
