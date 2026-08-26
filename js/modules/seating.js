// seating.js — Mesas / organização de assentos

const SeatingModule = (() => {
  function render() {
    const tables = Store.get('tables');
    const guests = Store.get('guests');
    const seatedIds = new Set(tables.flatMap(t => t.guestIds || []));
    const unseated = guests.filter(g => !seatedIds.has(g.id));

    return `
      <section class="view-header">
        <h1>Mesas</h1>
        <p class="muted">${tables.length} mesa(s) · ${seatedIds.size}/${guests.length} convidados alocados</p>
      </section>

      <form id="table-form" class="card form-card">
        <div class="form-row">
          <input type="text" id="tb-name" placeholder="Nome da mesa (ex: Mesa 1 - Família)" required />
          <input type="number" id="tb-capacity" placeholder="Capacidade" min="1" value="8" />
        </div>
        <button type="submit" class="btn-primary">Adicionar mesa</button>
      </form>

      <div class="card">
        <div class="card-header"><h2>Convidados sem mesa</h2></div>
        <p class="muted">${unseated.length ? unseated.map(g => Utils.escapeHtml(g.name)).join(', ') : 'Todos os convidados já têm mesa.'}</p>
      </div>

      <div id="tables-list">${renderTables(tables, guests)}</div>
    `;
  }

  function renderTables(tables, guests) {
    if (!tables.length) return `<p class="muted card">Nenhuma mesa criada ainda.</p>`;
    return tables.map(t => {
      const seated = guests.filter(g => (t.guestIds || []).includes(g.id));
      const available = guests.filter(g => !(t.guestIds || []).includes(g.id));
      return `
      <div class="card" data-id="${t.id}">
        <div class="card-header">
          <h2>${Utils.escapeHtml(t.name)}</h2>
          <span class="muted">${seated.length}/${t.capacity}</span>
          <button class="btn-icon btn-delete-table" data-id="${t.id}">Remover mesa</button>
        </div>
        <ul class="simple-list">
          ${seated.map(g => `<li><span>${Utils.escapeHtml(g.name)}</span>
            <button class="btn-icon btn-unseat" data-table="${t.id}" data-guest="${g.id}">Remover</button></li>`).join('') || '<li class="muted">Sem convidados alocados</li>'}
        </ul>
        ${available.length ? `
        <div class="form-row">
          <select class="seat-guest-select" data-table="${t.id}">
            <option value="">Adicionar convidado...</option>
            ${available.map(g => `<option value="${g.id}">${Utils.escapeHtml(g.name)}</option>`).join('')}
          </select>
        </div>` : ''}
      </div>`;
    }).join('');
  }

  function afterRender() {
    document.getElementById('table-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('tb-name').value.trim();
      if (!name) return;
      Store.addItem('tables', {
        name,
        capacity: Number(document.getElementById('tb-capacity').value) || 8,
        guestIds: [],
      });
      Utils.toast('Mesa criada');
      App.rerender();
    });

    document.getElementById('tables-list').addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-delete-table')) {
        Store.removeItem('tables', e.target.dataset.id);
        App.rerender();
      }
      if (e.target.classList.contains('btn-unseat')) {
        const tableId = e.target.dataset.table;
        const guestId = e.target.dataset.guest;
        Store.update('tables', (list) => list.map(t => t.id === tableId
          ? { ...t, guestIds: (t.guestIds || []).filter(id => id !== guestId) }
          : t));
        App.rerender();
      }
    });

    document.getElementById('tables-list').addEventListener('change', (e) => {
      if (e.target.classList.contains('seat-guest-select')) {
        const tableId = e.target.dataset.table;
        const guestId = e.target.value;
        if (!guestId) return;
        Store.update('tables', (list) => list.map(t => t.id === tableId
          ? { ...t, guestIds: [...(t.guestIds || []), guestId] }
          : t));
        App.rerender();
      }
    });
  }

  return { render, afterRender };
})();

window.SeatingModule = SeatingModule;
