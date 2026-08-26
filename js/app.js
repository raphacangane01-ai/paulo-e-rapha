// app.js — shell do app: router (hash-based) + navegação

const App = (() => {
  const ROUTES = [
    { hash: '#/', label: 'Início', icon: '🏠', module: () => DashboardModule },
    { hash: '#/convidados', label: 'Convidados', icon: '👥', module: () => GuestsModule },
    { hash: '#/orcamento', label: 'Orçamento', icon: '💰', module: () => BudgetModule },
    { hash: '#/fornecedores', label: 'Fornecedores', icon: '🤝', module: () => VendorsModule },
    { hash: '#/checklist', label: 'Checklist', icon: '✅', module: () => ChecklistModule },
    { hash: '#/cronograma', label: 'Cronograma', icon: '🗓️', module: () => TimelineModule },
    { hash: '#/mesas', label: 'Mesas', icon: '🍽️', module: () => SeatingModule },
    { hash: '#/presentes', label: 'Presentes', icon: '🎁', module: () => GiftsModule },
    { hash: '#/inspiracoes', label: 'Inspirações', icon: '✨', module: () => InspirationModule },
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

  function render() {
    const route = currentRoute();
    const mod = route.module();
    if (activeModule && activeModule !== mod && typeof activeModule.cleanup === 'function') {
      activeModule.cleanup();
    }
    mainEl().innerHTML = mod.render();
    if (mod.afterRender) mod.afterRender();
    activeModule = mod;
    renderNav();
    window.scrollTo(0, 0);
  }

  function rerender() {
    render();
  }

  function init() {
    window.addEventListener('hashchange', render);
    document.getElementById('menu-toggle')?.addEventListener('click', () => {
      document.body.classList.toggle('sidebar-open');
    });
    document.getElementById('sidebar-backdrop')?.addEventListener('click', () => {
      document.body.classList.remove('sidebar-open');
    });
    render();
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
