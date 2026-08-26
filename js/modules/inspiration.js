// inspiration.js — Quadro de inspirações (moodboard de links/notas)

const InspirationModule = (() => {
  const CATEGORIES = ['Decoração', 'Vestido', 'Cabelo/Maquiagem', 'Flores', 'Convites', 'Bolo', 'Fotografia', 'Outro'];

  function render() {
    const items = Store.get('inspirations');
    return `
      <section class="view-header">
        <h1>Inspirações</h1>
        <p class="muted">${items.length} ideia(s) salvas</p>
      </section>

      <form id="insp-form" class="card form-card">
        <div class="form-row">
          <input type="text" id="i-title" placeholder="Título (ex: Decoração rústica)" required />
          <select id="i-category">
            ${CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>
        </div>
        <input type="url" id="i-url" placeholder="Link (Pinterest, Instagram, site...)" />
        <textarea id="i-notes" placeholder="Notas"></textarea>
        <button type="submit" class="btn-primary">Adicionar inspiração</button>
      </form>

      <div class="card-grid" id="insp-list">${renderList(items)}</div>
    `;
  }

  function renderList(items) {
    if (!items.length) return `<p class="muted">Nenhuma inspiração salva ainda.</p>`;
    return items.map(i => `
      <div class="inspiration-card" data-id="${i.id}">
        <div class="tag">${Utils.escapeHtml(i.category)}</div>
        <h3>${Utils.escapeHtml(i.title)}</h3>
        ${i.notes ? `<p class="muted">${Utils.escapeHtml(i.notes)}</p>` : ''}
        ${i.url ? `<a href="${Utils.escapeHtml(i.url)}" target="_blank" rel="noopener">Abrir link</a>` : ''}
        <button class="btn-icon btn-delete" data-id="${i.id}">Remover</button>
      </div>`).join('');
  }

  function afterRender() {
    document.getElementById('insp-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('i-title').value.trim();
      if (!title) return;
      Store.addItem('inspirations', {
        title,
        category: document.getElementById('i-category').value,
        url: document.getElementById('i-url').value.trim(),
        notes: document.getElementById('i-notes').value.trim(),
      });
      Utils.toast('Inspiração adicionada');
      App.rerender();
    });

    document.getElementById('insp-list').addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-delete')) {
        Store.removeItem('inspirations', e.target.dataset.id);
        App.rerender();
      }
    });
  }

  return { render, afterRender };
})();

window.InspirationModule = InspirationModule;
