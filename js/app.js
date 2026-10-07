// app.js — shell do app: router (hash-based) + navegação

const App = (() => {
  const ROUTES = [
    { hash: '#/', label: 'Início', icon: '🏠', module: () => DashboardModule },
    { hash: '#/orcamento', label: 'Orçamento', icon: '💰', module: () => BudgetModule },
    { hash: '#/fornecedores', label: 'Fornecedores', icon: '🤝', module: () => VendorsModule },
    { hash: '#/checklist', label: 'Checklist', icon: '✅', module: () => ChecklistModule },
    { hash: '#/configuracoes', label: 'Configurações', icon: '⚙️', module: () => SettingsModule },
  ];

  const mainEl = () => document.getElementById('main-content');

  function currentRoute() {
    const hash = window.location.hash || '#/';
    return ROUTES.find(r => r.hash === hash) || ROUTES[0];
  }

  function renderNav() {
    const active = currentRoute().hash;
    const navHtml = ROUTES.map(r => `
      <a href="${r.hash}" class="nav-item ${r.hash === active ? 'active' : ''}" data-hash="${r.hash}">
        <span class="nav-icon">${r.icon}</span>
        <span class="nav-label">${r.label}</span>
      </a>
    `).join('');
    document.getElementById('sidebar-nav').innerHTML = navHtml;
    document.getElementById('bottom-nav').innerHTML = navHtml;
  }

  let activeModule = null;

  // Guarda a tela atual (com hora) pra se recuperar de uma recarga que a
  // gente não pediu — ver NAV_STATE_KEY abaixo.
  const NAV_STATE_KEY = 'meuCasamentoNavState_v1';
  function saveNavState() {
    try {
      localStorage.setItem(NAV_STATE_KEY, JSON.stringify({ hash: currentRoute().hash, ts: Date.now() }));
    } catch (e) { /* localStorage indisponível: sem problema, é só uma conveniência */ }
  }

  // render(isNavigation): troca real de tela (clique no menu, voltar no
  // navegador) deve subir a página pro topo; uma atualização de dados na
  // MESMA tela (marcar um quadradinho, salvar um formulário) deve manter a
  // posição da rolagem onde o usuário estava — por isso a rolagem só é
  // zerada quando isNavigation é true.
  function render(isNavigation) {
    const scrollY = isNavigation ? 0 : window.scrollY;
    const route = currentRoute();
    const mod = route.module();
    if (activeModule && activeModule !== mod && typeof activeModule.cleanup === 'function') {
      activeModule.cleanup();
    }
    mainEl().innerHTML = mod.render();
    if (mod.afterRender) mod.afterRender();
    activeModule = mod;
    renderNav();
    document.body.classList.remove('sidebar-open');
    window.scrollTo(0, scrollY);
    saveNavState();
  }

  function rerender() {
    render(false);
  }

  // Quando o app está publicado como Claude Artifact (ver sync.js), toda
  // vez que os dados mudam o documento inteiro é republicado — e a própria
  // aba recarrega para a versão nova. Isso fazia a tela voltar pro Início
  // sempre que algo era marcado no checklist (ou em qualquer outra tela),
  // porque a recarga não preserva em qual tela a pessoa estava. Pra
  // corrigir: se a página está carregando "do zero" (sem uma tela
  // específica na URL) mas tínhamos salvo uma tela há poucos segundos,
  // entendemos que foi uma dessas recargas automáticas e voltamos direto
  // pra lá, em vez de cair no Início.
  function restoreRecentNavIfReload() {
    const hash = window.location.hash;
    if (hash && hash !== '#/') return false; // já tem uma tela explícita na URL
    try {
      const raw = localStorage.getItem(NAV_STATE_KEY);
      if (!raw) return false;
      const saved = JSON.parse(raw);
      if (!saved || !saved.hash || saved.hash === '#/') return false;
      if (Date.now() - saved.ts > 8000) return false; // passou muito tempo: não é uma recarga automática
      window.location.hash = saved.hash;
      return true;
    } catch (e) {
      return false;
    }
  }

  function init() {
    window.addEventListener('hashchange', () => render(true));
    document.getElementById('menu-toggle')?.addEventListener('click', () => {
      document.body.classList.toggle('sidebar-open');
    });
    document.getElementById('sidebar-backdrop')?.addEventListener('click', () => {
      document.body.classList.remove('sidebar-open');
    });
    // Se restoreRecentNavIfReload() mudar o hash, o próprio evento
    // "hashchange" já dispara o render(true) — não precisa renderizar de novo aqui.
    if (!restoreRecentNavIfReload()) {
      render(true);
    }
  }

  return { init, rerender, ROUTES };
})();

document.addEventListener('DOMContentLoaded', App.init);

// Registro do service worker para funcionamento offline (PWA)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => {
      console.warn('Falha ao registrar service worker:', err);
    });
  });
}
