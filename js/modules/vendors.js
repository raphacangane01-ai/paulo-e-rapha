// vendors.js — Fornecedores + Contratos

const VendorsModule = (() => {
  const CATEGORIES = ['Cerimonial', 'Fotografia', 'Cabelo e Maquiagem', 'Trajes', 'Banda/DJ', 'Decoração', 'Buffet', 'Flores', 'Outro'];

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
            <option value="pesquisando">Pesquisando</option>
            <option value="orçamento">Orçamento recebido</option>
            <option value="contratado">Contratado</option>
          </select>
        </div>
        <textarea id="v-contract" placeholder="Notas do contrato (datas, condições, cláusulas importantes...)"></textarea>
        <button type="submit" class="btn-primary">Adicionar fornecedor</button>
      </form>

      <div class="card">
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
              <option value="pesquisando" ${v.status === 'pesquisando' ? 'selected' : ''}>Pesquisando</option>
              <option value="orçamento" ${v.status === 'orçamento' ? 'selected' : ''}>Orçamento recebido</option>
              <option value="contratado" ${v.status === 'contratado' ? 'selected' : ''}>Contratado</option>
            </select>
            <button class="btn-icon btn-delete" data-id="${v.id}">Remover</button>
          </div>
        </li>`).join('')}
    </ul>`;
  }

  function labelStatus(s) {
    return { pesquisando: 'Pesquisando', orçamento: 'Orçamento recebido', contratado: 'Contratado' }[s] || s;
  }
  function statusClass(s) {
    return { pesquisando: 'pendente', orçamento: 'pendente', contratado: 'confirmado' }[s] || 'pendente';
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
  }

  return { render, afterRender };
})();

window.VendorsModule = VendorsModule;
