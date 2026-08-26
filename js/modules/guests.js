// guests.js — módulo de Convidados

const GuestsModule = (() => {
  function render() {
    const guests = Store.get('guests');
    const confirmed = guests.filter(g => g.rsvp === 'confirmado').length;
    const declined = guests.filter(g => g.rsvp === 'recusado').length;
    const pending = guests.length - confirmed - declined;

    return `
      <section class="view-header">
        <h1>Convidados</h1>
        <p class="muted">${guests.length} cadastrados · ${confirmed} confirmados · ${pending} pendentes · ${declined} recusados</p>
      </section>

      <form id="guest-form" class="card form-card">
        <div class="form-row">
          <input type="text" id="guest-name" placeholder="Nome do convidado" required />
          <select id="guest-category">
            <option value="família">Família</option>
            <option value="amigos">Amigos</option>
            <option value="padrinhos">Padrinhos</option>
            <option value="trabalho">Trabalho</option>
            <option value="outros">Outros</option>
          </select>
        </div>
        <div class="form-row">
          <input type="text" id="guest-contact" placeholder="Contato (telefone/e-mail)" />
          <select id="guest-rsvp">
            <option value="pendente">Pendente</option>
            <option value="confirmado">Confirmado</option>
            <option value="recusado">Recusado</option>
          </select>
        </div>
        <button type="submit" class="btn-primary">Adicionar convidado</button>
      </form>

      <div class="card">
        <div id="guest-list">${renderList(guests)}</div>
      </div>
    `;
  }

  function renderList(guests) {
    if (!guests.length) return `<p class="muted">Nenhum convidado ainda. Adicione o primeiro acima.</p>`;
    return `<ul class="data-list">
      ${guests.map(g => `
        <li data-id="${g.id}">
          <div class="data-list-main">
            <strong>${Utils.escapeHtml(g.name)}</strong>
            <span class="tag tag-${g.category}">${Utils.escapeHtml(g.category)}</span>
            <span class="badge badge-${g.rsvp}">${labelRsvp(g.rsvp)}</span>
          </div>
          <div class="data-list-sub muted">${Utils.escapeHtml(g.contact || '')}</div>
          <div class="data-list-actions">
            <select class="rsvp-select" data-id="${g.id}">
              <option value="pendente" ${g.rsvp === 'pendente' ? 'selected' : ''}>Pendente</option>
              <option value="confirmado" ${g.rsvp === 'confirmado' ? 'selected' : ''}>Confirmado</option>
              <option value="recusado" ${g.rsvp === 'recusado' ? 'selected' : ''}>Recusado</option>
            </select>
            <button class="btn-icon btn-delete" data-id="${g.id}" title="Remover">Remover</button>
          </div>
        </li>`).join('')}
    </ul>`;
  }

  function labelRsvp(rsvp) {
    return { pendente: 'Pendente', confirmado: 'Confirmado', recusado: 'Recusado' }[rsvp] || rsvp;
  }

  function afterRender() {
    const form = document.getElementById('guest-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('guest-name').value.trim();
      if (!name) return;
      Store.addItem('guests', {
        name,
        category: document.getElementById('guest-category').value,
        contact: document.getElementById('guest-contact').value.trim(),
        rsvp: document.getElementById('guest-rsvp').value,
      });
      Utils.toast('Convidado adicionado');
      App.rerender();
    });

    document.getElementById('guest-list').addEventListener('change', (e) => {
      if (e.target.classList.contains('rsvp-select')) {
        Store.updateItem('guests', e.target.dataset.id, { rsvp: e.target.value });
        App.rerender();
      }
    });

    document.getElementById('guest-list').addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-delete')) {
        Store.removeItem('guests', e.target.dataset.id);
        Utils.toast('Convidado removido');
        App.rerender();
      }
    });
  }

  return { render, afterRender };
})();

window.GuestsModule = GuestsModule;
