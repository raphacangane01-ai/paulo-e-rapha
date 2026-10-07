// sync.js — sincronização ativa via capability "artifact" do Claude.
//
// Só existe efeito quando esta página está rodando publicada como Artifact
// do Claude (não se aplica à versão hospedada no GitHub Pages, onde
// window.claude não existe — o app continua funcionando normalmente,
// apenas em modo local/offline).
//
// Quando disponível: a cada mudança nos dados, republicamos o documento
// inteiro (HTML completo, com os dados atuais embutidos) via
// artifact.publish(html). Isso faz com que QUALQUER pessoa que abra o
// link do artifact veja a versão mais recente dos dados.

const MCSync = (() => {
  const SHELL_HTML = `<button id="theme-toggle" class="theme-toggle-btn" aria-label="Ativar modo escuro" title="Ativar modo escuro">\u{1F319}</button>
<div class="app-shell">
  <div class="sidebar-backdrop" id="sidebar-backdrop"></div>

  <aside class="sidebar">
    <div class="sidebar-brand">\u{1F48D} Rapha & Paulo</div>
    <nav id="sidebar-nav"></nav>
  </aside>

  <div style="flex:1; display:flex; flex-direction:column; min-width:0;">
    <header class="topbar">
      <button id="menu-toggle" aria-label="Abrir menu">☰</button>
      <h1>\u{1F48D} Rapha & Paulo</h1>
    </header>

    <main class="content" id="main-content">
      <!-- conteúdo renderizado via JS -->
    </main>
  </div>

  <nav class="bottom-nav" id="bottom-nav"></nav>
</div>`;

  let artifactApi = null;
  let downloadsApi = null;
  let ready = false;

  function isHosted() {
    return typeof window.claude !== 'undefined' && window.claude && typeof window.claude.use === 'function';
  }

  async function init() {
    if (!isHosted()) {
      console.info('[meu-casamento] Sincronização ativa indisponível neste ambiente — usando apenas armazenamento local.');
      return;
    }
    try {
      artifactApi = await window.claude.use('artifact');
    } catch (e) {
      artifactApi = null;
    }
    try {
      downloadsApi = await window.claude.use('downloads');
    } catch (e) {
      downloadsApi = null;
    }
    if (artifactApi) {
      ready = true;
      window.__mcOnPersist__ = schedulePublish;
      window.__MC_SYNC_ACTIVE__ = true;
    }
  }

  const schedulePublish = Utils.debounce((data) => {
    doPublish(data);
  }, 1200);

  async function doPublish(data) {
    if (!ready || !artifactApi) return;
    const html = buildPublishHtml(data);
    try {
      await artifactApi.publish(html);
      // Em caso de sucesso esta própria aba também recarrega para a nova versão.
    } catch (e) {
      if (e && e.code === 'conflict') {
        // Rotina: alguém publicou primeiro; a própria visualização recarrega para a versão vencedora.
        return;
      }
      console.warn('[meu-casamento] Não foi possível sincronizar agora:', e);
    }
  }

  function buildPublishHtml(data) {
    const styleEl = document.getElementById('app-style');
    const bundleEl = document.getElementById('app-bundle');
    const cssText = styleEl ? styleEl.textContent : '';
    const bundleText = bundleEl ? bundleEl.textContent : '';
    const dataJson = JSON.stringify(data).replace(/</g, '\\u003c');

    return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>Rapha & Paulo</title>
<meta name="theme-color" content="#a9647e" />
<style id="app-style">${cssText}</style>
</head>
<body>
${SHELL_HTML}
<script type="application/json" id="app-data">${dataJson}<\/script>
<script id="app-bundle">${bundleText}<\/script>
</body>
</html>`;
  }

  async function saveDownload(filename, textContent) {
    if (downloadsApi) {
      try {
        await downloadsApi.save({ filename, data: textContent });
        return true;
      } catch (e) {
        console.warn('[meu-casamento] Download via capability falhou:', e);
        return false;
      }
    }
    return false;
  }

  return { init, saveDownload, get ready() { return ready; }, isHosted };
})();

window.MCSync = MCSync;
document.addEventListener('DOMContentLoaded', () => { MCSync.init(); });
