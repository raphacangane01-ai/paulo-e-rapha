// store.js — camada de dados única do app.
//
// Modo local: tudo é salvo em um único objeto JSON no localStorage (funciona
// 100% offline, sem login) — é o modo usado quando o app roda fora do
// ambiente de artifacts do Claude (ex: hospedado no GitHub Pages).
//
// Modo sincronizado (quando disponível): os dados iniciais podem vir
// embutidos no próprio HTML (window.__MC_INITIAL_DATA__) e, a cada
// alteração, um hook externo (window.__mcOnPersist__, plugado pelo
// sync.js) é chamado para republicar o documento inteiro, para que
// qualquer pessoa que abra o link veja os mesmos dados.
//
// Amanhã: quando o Supabase for configurado (ver config.js), este mesmo
// objeto pode ser sincronizado como uma linha JSON por usuário, sem
// precisar mudar nenhum módulo que consome o Store — todos falam apenas
// com Store.get/Store.set.

const Store = (() => {
  const STORAGE_KEY = 'meuCasamentoData_v1';

  const CHECKLIST_CATEGORIES = [
    'Cerimonial', 'Cerimônia', 'Recepção', 'Música', 'Festa', 'Alimentação',
    'Decoração', 'Lembrancinhas', 'Beleza do Noivo', 'Beleza da Noiva',
    'Vestuário', 'Padrinhos', 'Madrinhas', 'Dama de Honra', 'Mãe da Noiva',
    'Mãe do Noivo', 'Pai da Noiva', 'Avós', 'Documentação/Cartório',
    'Convites', 'Fotografia e Vídeo', 'Outros',
  ];

  const SEED_CHECKLIST_TITLES = {
    'Cerimonial': ['Pesquisar e contratar cerimonialista', 'Alinhar roteiro da cerimônia com o cerimonial', 'Confirmar horários com o cerimonial na semana do evento'],
    'Cerimônia': ['Escolher leituras/votos da cerimônia religiosa', 'Providenciar documentação para o cartório'],
    'Recepção': ['Definir layout da recepção', 'Confirmar horário de início e fim (17h às 0h/2h)', 'Combinar montagem e desmontagem do espaço'],
    'Música': ['Pesquisar e contratar banda ou DJ', 'Montar playlist para os momentos-chave'],
    'Festa': ['Definir cronograma da festa', 'Combinar horário de brinde/discursos'],
    'Alimentação': ['Fechar cardápio do buffet (salgados/entradas)', 'Definir jantar simples', 'Definir lanche da madrugada', 'Marcar degustação com o buffet'],
    'Decoração': ['Contratar decoração', 'Definir paleta de cores e estilo'],
    'Lembrancinhas': ['Escolher modelo de lembrancinha', 'Definir quantidade (75 convidados)', 'Encomendar lembrancinhas'],
    'Beleza do Noivo': ['Agendar corte de cabelo/barba para o dia'],
    'Beleza da Noiva': ['Contratar cabelo e maquiagem', 'Marcar teste de cabelo e maquiagem'],
    'Vestuário': ['Escolher e provar traje da noiva', 'Escolher e provar traje do noivo', 'Última prova dos trajes'],
    'Padrinhos': ['Definir lista de padrinhos', 'Convidar padrinhos (convite físico)', 'Combinar trajes dos padrinhos'],
    'Madrinhas': ['Definir lista de madrinhas', 'Convidar madrinhas (convite físico)', 'Combinar trajes das madrinhas'],
    'Dama de Honra': ['Escolher dama de honra', 'Combinar traje da dama de honra'],
    'Mãe da Noiva': ['Combinar traje da mãe da noiva'],
    'Mãe do Noivo': ['Combinar traje da mãe do noivo'],
    'Pai da Noiva': ['Combinar traje do pai da noiva', 'Alinhar entrada com o pai da noiva'],
    'Avós': ['Confirmar presença dos avós', 'Reservar lugar de destaque para os avós'],
    'Documentação/Cartório': ['Reunir documentos para o registro civil', 'Agendar data no cartório', 'Solicitar certidão após o casamento'],
    'Convites': ['Definir modelo do convite digital', 'Enviar convites digitais aos convidados', 'Providenciar convite físico só para os padrinhos'],
    'Fotografia e Vídeo': ['Contratar fotógrafo', 'Alinhar lista de fotos essenciais'],
    'Outros': ['Revisar lista de convidados final', 'Confirmar fornecedores na semana do evento'],
  };

  function buildSeedChecklist() {
    const items = [];
    CHECKLIST_CATEGORIES.forEach((cat) => {
      (SEED_CHECKLIST_TITLES[cat] || []).forEach((title) => {
        items.push({ id: Utils.uid(), title, category: cat, dueDate: null, done: false });
      });
    });
    return items;
  }

  function defaultData() {
    return {
      meta: { createdAt: new Date().toISOString(), version: 1 },
      settings: {
        weddingDate: window.MEU_CASAMENTO_CONFIG?.weddingDate || null,
        weddingLocation: window.MEU_CASAMENTO_CONFIG?.weddingLocation || '',
        coupleNames: window.MEU_CASAMENTO_CONFIG?.coupleNames || '',
        budgetCap: window.MEU_CASAMENTO_CONFIG?.defaultBudgetCap || 0,
      },
      guests: [],
      budgetItems: [],     // { id, category, vendorId, plannedValue, notes }
      payments: [],        // { id, budgetItemId, description, amount, dueDate, paidDate, status, groupId? }
      vendors: [],         // { id, name, category, contact, status, contractNotes }
      checklist: buildSeedChecklist(), // { id, title, dueDate, done, category }
      timeline: [],        // { id, time, title, notes, day: 'planning' | 'event' }
      tables: [],          // { id, name, capacity, guestIds: [] }
      gifts: [],           // { id, name, estimatedValue, link, status, givenBy }
      inspirations: [],    // { id, title, url, notes, category, file: {name, type, dataUrl} | null }
    };
  }

  let data = load();
  const listeners = new Set();

  function load() {
    // 1) Prioridade: dados embutidos no próprio HTML (modo sincronizado)
    if (window.__MC_INITIAL_DATA__ && typeof window.__MC_INITIAL_DATA__ === 'object') {
      return { ...defaultData(), ...window.__MC_INITIAL_DATA__ };
    }
    // 2) Modo local: localStorage
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultData();
      const parsed = JSON.parse(raw);
      // merge com defaults para tolerar novas chaves adicionadas depois
      return { ...defaultData(), ...parsed };
    } catch (e) {
      console.error('Falha ao carregar dados locais, iniciando vazio.', e);
      return defaultData();
    }
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Não foi possível salvar localmente:', e);
    }
    listeners.forEach((fn) => {
      try { fn(data); } catch (e) { console.error(e); }
    });
    // Ponto único de extensão: sincronização ativa (ver sync.js) ou Supabase futuro.
    if (typeof window.__mcOnPersist__ === 'function') {
      try { window.__mcOnPersist__(data); } catch (e) { console.error(e); }
    }
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

  function addItems(collection, items) {
    const withIds = items.map((item) => ({ id: item.id || Utils.uid(), ...item }));
    update(collection, (list) => list.concat(withIds));
    return withIds;
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
    data = { ...defaultData(), ...newData };
    persist();
  }

  function resetAll() {
    data = defaultData();
    persist();
  }

  return {
    get, set, update, addItem, addItems, updateItem, removeItem,
    subscribe, exportAll, importAll, resetAll,
    CHECKLIST_CATEGORIES,
  };
})();

window.Store = Store;
