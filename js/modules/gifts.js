// gifts.js — Lista de presentes

const GiftsModule = (() => {
  function render() {
    const gifts = Store.get('gifts');
    const given = gifts.filter(g => g.status === 'recebido').length;

    return `
      <section class="view-header">
        <h1>Presentes</h1>
        <p class="muted">${given}/${gifts.length} recebidos</p>
      </section>

      <form id="gift-form" class="card form-card">
        <div class="form-row">
          <input type="text" id="g-name" placeholder="Item (ex: Jogo de panelas)" required />
          <input type="text" inputmode="decimal" id="g-value" placeholder="Valor estimado (R$)" />
        </div>
        <input type="url" id="g-link" placeholder="Link (loja, lista de presentes...)" />
        <button type="submit" class="btn-primary">Adicionar presente</button>
      </form>

      <div class="card"><div id="gift-list">${renderList(gifts)}</div></div>
    `;
  }

  function renderList(gifts) {
    if (!gifts.length) return `<p class="muted">Nenhum presente cadastrado ainda.</p>`;
    return `<ul class="data-list">
      ${gifts.map(g => `
        <li data-id="${g.id}">
          <div class="data-list-main">
            <strong>${Utils.escapeHtml(g.name)}</strong>
            ${g.estimatedValue ? `<span class="muted">${Utils.formatCurrency(g.estimatedValue)}</span>` : ''}
            <span class="badge badge-${g.status === 'recebido' ? 'confirmado' : 'pendente'}">${g.status === 'recebido' ? 'Recebido' : 'Aguardando'}</span>
          </div>
          ${g.link ? `<div class="data-list-sub"><a href="${Utils.escapeHtml(g.link)}" target="_blank" rel="noopener">Ver link</a></div>` : ''}
          <div class="data-list-actions">
            <select class="gift-status" data-id="${g.id}">
              <option value="aguardando" ${g.status !== 'recebido' ? 'selected' : ''}>Aguardando</option>
              <option value="recebido" ${g.status === 'recebido' ? 'selected' : ''}>Recebido</option>
            </select>
            <button class="btn-icon btn-delete" data-id="${g.id}">Remover</button>
          </div>
        </li>`).join('')}
    </ul>`;
  }

  function afterRender() {
    document.getElementById('gift-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('g-name').value.trim();
      if (!name) return;
      Store.addItem('gifts', {
        name,
        estimatedValue: Utils.parseCurrencyInput(document.getElementById('g-value').value),
        link: document.getElementById('g-link').value.trim(),
        status: 'aguardando',
      });
      Utils.toast('Presente adicionado');
      App.rerender();
    });

    document.getElementById('gift-list').addEventListener('change', (e) => {
      if (e.target.classList.contains('gift-status')) {
        Store.updateItem('gifts', e.target.dataset.id, { status: e.target.value });
        App.rerender();
      }
    });

    document.getElementById('gift-list').addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-delete')) {
        Store.removeItem('gifts', e.target.dataset.id);
        App.rerender();
      }
    });
  }

  return { render, afterRender };
})();

window.GiftsModule = GiftsModule;
