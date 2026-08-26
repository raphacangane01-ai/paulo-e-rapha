// settings.js — Configurações gerais + backup manual (export/import JSON)
// enquanto o Supabase não está conectado.

const SettingsModule = (() => {
  function render() {
    const settings = Store.get('settings');
    return `
      <section class="view-header">
        <h1>Configurações</h1>
        <p class="muted">Dados do casamento e backup</p>
      </section>

      <form id="settings-form" class="card form-card">
        <label>Data e hora do casamento
          <input type="datetime-local" id="s-date" value="${toLocalInputValue(settings.weddingDate)}" />
        </label>
        <label>Local
          <input type="text" id="s-location" value="${Utils.escapeHtml(settings.weddingLocation || '')}" />
        </label>
        <label>Teto de orçamento (R$)
          <input type="text" inputmode="decimal" id="s-budget" value="${settings.budgetCap || 0}" />
        </label>
        <button type="submit" class="btn-primary">Salvar</button>
      </form>

      <div class="card">
        <div class="card-header"><h2>Backup dos dados</h2></div>
        <p class="muted">Enquanto a sincronização em nuvem (Supabase) não está configurada, seus dados ficam salvos apenas neste navegador. Exporte um backup regularmente.</p>
        <div class="form-row">
          <button id="btn-export" class="btn-secondary" type="button">Exportar backup (.json)</button>
          <label class="btn-secondary" style="text-align:center; cursor:pointer;">
            Importar backup
            <input type="file" id="import-file" accept="application/json" style="display:none;" />
          </label>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h2>Status da nuvem</h2></div>
        <p class="muted">${window.MEU_CASAMENTO_CONFIG.supabase.url ? 'Supabase configurado.' : 'Supabase ainda não configurado — funcionando 100% offline neste dispositivo.'}</p>
      </div>
    `;
  }

  function toLocalInputValue(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function afterRender() {
    document.getElementById('settings-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const dateVal = document.getElementById('s-date').value;
      Store.update('settings', (s) => ({
        ...s,
        weddingDate: dateVal ? new Date(dateVal).toISOString() : s.weddingDate,
        weddingLocation: document.getElementById('s-location').value.trim(),
        budgetCap: Utils.parseCurrencyInput(document.getElementById('s-budget').value),
      }));
      Utils.toast('Configurações salvas');
      App.rerender();
    });

    document.getElementById('btn-export').addEventListener('click', () => {
      Utils.downloadJSON(`meu-casamento-backup-${new Date().toISOString().slice(0,10)}.json`, Store.exportAll());
    });

    document.getElementById('import-file').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result);
          Store.importAll(parsed);
          Utils.toast('Backup importado com sucesso');
          App.rerender();
        } catch (err) {
          Utils.toast('Arquivo inválido', 'error');
        }
      };
      reader.readAsText(file);
    });
  }

  return { render, afterRender };
})();

window.SettingsModule = SettingsModule;
