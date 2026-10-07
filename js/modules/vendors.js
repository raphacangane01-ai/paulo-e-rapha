// vendors.js — Fornecedores + Contratos

const VendorsModule = (() => {
  const CATEGORIES = ['Cerimonial', 'Fotografia', 'Cabelo e Maquiagem', 'Trajes', 'Banda/DJ', 'Decoração', 'Buffet', 'Flores', 'Outro'];

  const STATUS_OPTIONS = [
    { value: 'pendente', label: 'Pendente' },
    { value: 'a_confirmar', label: 'A confirmar' },
    { value: 'contratado', label: 'Contratado' },
    { value: 'pagamento_no_evento', label: 'Pagamento no evento' },
    { value: 'pago', label: 'Pago' },
  ];

  function render() {
    const vendors = Store.get('vendors');
    return `
      <section class="view-header">
        <h1>Fornecedores e contratos</h1>
        <p class="muted">${vendors.length} cadastrados</p>
      </section>

      <form id="vendor-form" class="card form-card">
        <div class="form-row">
          <input type="text" id="v-name" placeholder="Nome do fornecedor" required />
          <select id="v-category">
            ${CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-row">
          <input type="text" id="v-contact" placeholder="Contato" />
          <select id="v-status">
            ${STATUS_OPTIONS.map(o => `<option value="${o.value}">${o.label}</option>`).join('')}
          </select>
        </div>
        <textarea id="v-contract" placeholder="Notas do contrato (datas, condições, cláusulas importantes...)"></textarea>
        <button type="submit" class="btn-primary">Adicionar fornecedor</button>
      </form>

      <div class="card">
        <div class="card-header">
          <h2>Fornecedores cadastrados</h2>
          <button type="button" class="btn-secondary" id="btn-export-vendors">⬇️ Exportar (CSV)</button>
        </div>
        <div id="vendor-list">${renderList(vendors)}</div>
      </div>
    `;
  }

  function renderList(vendors) {
    if (!vendors.length) return `<p class="muted">Nenhum fornecedor cadastrado ainda.</p>`;
    return `<ul class="data-list">
      ${vendors.map(v => `
        <li data-id="${v.id}">
          <div class="data-list-main">
            <strong>${Utils.escapeHtml(v.name)}</strong>
            <span class="tag">${Utils.escapeHtml(v.category)}</span>
            <span class="badge badge-${statusClass(v.status)}">${labelStatus(v.status)}</span>
          </div>
          <div class="data-list-sub muted">${Utils.escapeHtml(v.contact || '')}</div>
          ${v.contractNotes ? `<div class="data-list-sub">${Utils.escapeHtml(v.contractNotes)}</div>` : ''}
          <div class="data-list-actions">
            <select class="vendor-status" data-id="${v.id}">
              ${STATUS_OPTIONS.map(o => `<option value="${o.value}" ${v.status === o.value ? 'selected' : ''}>${o.label}</option>`).join('')}
            </select>
            <button class="btn-icon btn-delete" data-id="${v.id}">Remover</button>
          </div>
        </li>`).join('')}
    </ul>`;
  }

  function labelStatus(s) {
    const found = STATUS_OPTIONS.find(o => o.value === s);
    return found ? found.label : (s || 'Pendente');
  }
  function statusClass(s) {
    return {
      pendente: 'pendente',
      a_confirmar: 'pendente',
      contratado: 'confirmado',
      pagamento_no_evento: 'confirmado',
      pago: 'confirmado',
    }[s] || 'pendente';
  }

  function exportVendorsCsv(vendors) {
    const headers = ['Nome', 'Categoria', 'Contato', 'Status', 'Notas do contrato'];
    const rows = vendors.map((v) => [v.name, v.category, v.contact || '', labelStatus(v.status), v.contractNotes || '']);
    Utils.downloadCSV('fornecedores.csv', headers, rows);
    Utils.toast(`Exportando ${vendors.length} fornecedor(es)`);
  }

  function afterRender() {
    document.getElementById('vendor-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('v-name').value.trim();
      if (!name) return;
      Store.addItem('vendors', {
        name,
        category: document.getElementById('v-category').value,
        contact: document.getElementById('v-contact').value.trim(),
        status: document.getElementById('v-status').value,
        contractNotes: document.getElementById('v-contract').value.trim(),
      });
      Utils.toast('Fornecedor adicionado');
      App.rerender();
    });

    document.getElementById('vendor-list').addEventListener('change', (e) => {
      if (e.target.classList.contains('vendor-status')) {
        Store.updateItem('vendors', e.target.dataset.id, { status: e.target.value });
        App.rerender();
      }
    });

    document.getElementById('vendor-list').addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-delete')) {
        Store.removeItem('vendors', e.target.dataset.id);
        App.rerender();
      }
    });

    document.getElementById('btn-export-vendors').addEventListener('click', () => {
      exportVendorsCsv(Store.get('vendors'));
    });
  }

  return { render, afterRender };
})();

window.VendorsModule = VendorsModule;
