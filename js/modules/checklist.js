// checklist.js — lista de tarefas do planejamento, organizada em blocos.

const ChecklistModule = (() => {
  const NO_DATE_KEY = 'sem-prazo';

  function monthKey(dateStr) {
    if (!dateStr) return NO_DATE_KEY;
    return dateStr.slice(0, 7); // 'YYYY-MM'
  }

  function monthLabel(key) {
    if (key === NO_DATE_KEY) return 'Sem prazo definido';
    const [y, m] = key.split('-').map(Number);
    const label = new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

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

      <div id="checklist-list">${renderGroups(items)}</div>
    `;
  }

  function renderGroups(items) {
    if (!items.length) return `<p class="muted card">Nenhuma tarefa ainda.</p>`;

    const groupsByKey = new Map();
    items.forEach((item) => {
      const key = monthKey(item.dueDate);
      if (!groupsByKey.has(key)) groupsByKey.set(key, []);
      groupsByKey.get(key).push(item);
    });

    // Ordem cronológica dos meses; "sem prazo" sempre por último.
    const orderedKeys = [...groupsByKey.keys()].sort((a, b) => {
      if (a === NO_DATE_KEY) return 1;
      if (b === NO_DATE_KEY) return -1;
      return a < b ? -1 : (a > b ? 1 : 0);
    });

    return orderedKeys.map((key) => {
      const groupItems = groupsByKey.get(key);
      const doneCount = groupItems.filter(i => i.done).length;
      const sorted = [...groupItems].sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1;
        return new Date(a.dueDate || '9999-12-31') - new Date(b.dueDate || '9999-12-31');
      });
      return `
      <div class="card">
        <div class="card-header">
          <h2>${Utils.escapeHtml(monthLabel(key))}</h2>
          <span class="muted">${doneCount}/${groupItems.length}</span>
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
              <div class="data-list-sub muted">
                ${c.dueDate ? 'Prazo: ' + Utils.formatDate(c.dueDate) : 'sem prazo'}
                ${c.category ? ' · <span class="tag">' + Utils.escapeHtml(c.category) + '</span>' : ''}
              </div>
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
