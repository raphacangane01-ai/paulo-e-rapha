// theme.js — alterna entre modo claro/escuro manualmente (botão no canto
// superior direito). Preferência salva por dispositivo (localStorage);
// se nunca escolhida, segue o tema do sistema (prefers-color-scheme).

(function () {
  const KEY = 'mc-theme';

  function getStored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function setStored(v) {
    try { localStorage.setItem(KEY, v); } catch (e) { /* ignora */ }
  }

  function systemPrefersDark() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function currentTheme() {
    return getStored() || (systemPrefersDark() ? 'dark' : 'light');
  }

  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.getElementById('theme-toggle');
    if (btn) {
      const goingToDark = theme !== 'dark';
      btn.textContent = theme === 'dark' ? '☀️' : '🌙';
      btn.setAttribute('aria-label', goingToDark ? 'Ativar modo escuro' : 'Ativar modo claro');
      btn.setAttribute('title', goingToDark ? 'Ativar modo escuro' : 'Ativar modo claro');
    }
  }

  function toggle() {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    setStored(next);
    apply(next);
  }

  // Aplica o quanto antes para evitar "flash" da cor errada.
  apply(currentTheme());

  document.addEventListener('DOMContentLoaded', function () {
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.addEventListener('click', toggle);
    apply(currentTheme());
  });

  window.MCTheme = { toggle, apply, currentTheme };
})();


