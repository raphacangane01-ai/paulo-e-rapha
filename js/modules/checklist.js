// checklist.js — lista de tarefas do planejamento

const ChecklistModule = (() => {
  function render() {
    const items = Store.get('checklist');
    const pending = items.filter(i => !i.done).length;

    return `
      <section class="view-header">
        <h1>Checklist</h1>
        <p class="muted">${pending} tarefa(s) pendente(s) de ${items.length}</p>
      </section>

      <form id="checklist-form" class="card form-card">
        <div class="form-row">
          <input type="text" id="c-title" placeholder="Tarefa (ex: Fechar contrato do buffet)" required />
          <input type="date" id="c-due" />
        </div>
        <button type="submit" class="btn-primary">Adicionar tarefa</button>
      </form>

      <div class="card">
        <div id="checklist-list">${renderList(items)}</div>
      </div>
    `;
  }

  function renderList(items) {
    if (!items.length) return `<p class="muted">Nenhuma tarefa ainda.</p>`;
    const sorted = [...items].sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return new Date(a.dueDate || '9999-12-31') - new Date(b.dueDate || '9999-12-31');
    });
    return `<ul class="data-list">
      ${sorted.map(c => `
        <li data-id="${c.id}" class="${c.done ? 'is-done' : ''}">
          <div class="data-list-main">
            <label class="checkbox-label">
              <input type="checkbox" class="c-done" data-id="${c.id}" ${c.done ? 'checked' : ''} />
              <span>${Utils.escapeHtml(c.title)}</span>
            </label>
          </div>
          <div class="data-list-sub muted">${c.dueDate ? Utils.formatDate(c.dueDate) : 'sem prazo'}</div>
          <div class="data-list-actions">
            <button class="btn-icon btn-delete" data-id="${c.id}">Remover</button>
          </div>
        </li>`).join('')}
    </ul>`;
  }

  function afterRender() {
    document.getElementById('checklist-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('c-title').value.trim();
      if (!title) return;
      Store.addItem('checklist', {
        title,
        dueDate: document.getElementById('c-due').value || null,
        done: false,
      });
      Utils.toast('Tarefa adicionada');
      App.rerender();
    });

    document.getElementById('checklist-list').addEventListener('change', (e) => {
      if (e.target.classList.contains('c-done')) {
        Store.updateItem('checklist', e.target.dataset.id, { done: e.target.checked });
        App.rerender();
      }
    });

    document.getElementById('checklist-list').addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-delete')) {
        Store.removeItem('checklist', e.target.dataset.id);
        App.rerender();
      }
    });
  }

  return { render, afterRender };
})();

window.ChecklistModule = ChecklistModule;
