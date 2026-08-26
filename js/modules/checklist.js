// checklist.js — lista de tarefas do planejamento, organizada em blocos.

const ChecklistModule = (() => {
  function render() {
    const items = Store.get('checklist');
    const pending = items.filter(i => !i.done).length;
    const categories = Store.CHECKLIST_CATEGORIES;

    return `
      <section class="view-header">
        <h1>Checklist</h1>
        <p class="muted">${pending} tarefa(s) pendente(s) de ${items.length}</p>
      </section>

      <form id="checklist-form" class="card form-card">
        <div class="form-row">
          <input type="text" id="c-title" placeholder="Tarefa (ex: Fechar contrato do buffet)" required />
          <select id="c-category">
            ${categories.map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-row">
          <input type="date" id="c-due" />
          <button type="submit" class="btn-primary">Adicionar tarefa</button>
        </div>
      </form>

      <div id="checklist-list">${renderGroups(items, categories)}</div>
    `;
  }

  function renderGroups(items, categories) {
    const withCategory = categories.map(cat => ({
      cat,
      items: items.filter(i => (i.category || 'Outros') === cat),
    })).filter(g => g.items.length);

    const uncategorized = items.filter(i => !categories.includes(i.category));
    if (uncategorized.length) withCategory.push({ cat: 'Outros', items: uncategorized });

    if (!withCategory.length) return `<p class="muted card">Nenhuma tarefa ainda.</p>`;

    return withCategory.map(g => {
      const doneCount = g.items.filter(i => i.done).length;
      const sorted = [...g.items].sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1;
        return new Date(a.dueDate || '9999-12-31') - new Date(b.dueDate || '9999-12-31');
      });
      return `
      <div class="card">
        <div class="card-header">
          <h2>${Utils.escapeHtml(g.cat)}</h2>
          <span class="muted">${doneCount}/${g.items.length}</span>
        </div>
        <ul class="data-list">
          ${sorted.map(c => `
            <li data-id="${c.id}" class="${c.done ? 'is-done' : ''}">
              <div class="data-list-main">
                <label class="checkbox-label">
                  <input type="checkbox" class="c-done" data-id="${c.id}" ${c.done ? 'checked' : ''} />
                  <span>${Utils.escapeHtml(c.title)}</span>
                </label>
              </div>
              <div class="data-list-sub muted">${c.dueDate ? 'Prazo: ' + Utils.formatDate(c.dueDate) : 'sem prazo'}</div>
              <div class="data-list-actions">
                <button class="btn-icon btn-delete" data-id="${c.id}">Remover</button>
              </div>
            </li>`).join('')}
        </ul>
      </div>`;
    }).join('');
  }

  function afterRender() {
    document.getElementById('checklist-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('c-title').value.trim();
      if (!title) return;
      Store.addItem('checklist', {
        title,
        category: document.getElementById('c-category').value,
        dueDate: document.getElementById('c-due').value || null,
        done: false,
      });
      Utils.toast('Tarefa adicionada');
      App.rerender();
    });

    const listEl = document.getElementById('checklist-list');

    listEl.addEventListener('change', (e) => {
      if (e.target.classList.contains('c-done')) {
        Store.updateItem('checklist', e.target.dataset.id, { done: e.target.checked });
        App.rerender();
      }
    });

    listEl.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-delete')) {
        Store.removeItem('checklist', e.target.dataset.id);
        App.rerender();
      }
    });
  }

  return { render, afterRender };
})();

window.ChecklistModule = ChecklistModule;
