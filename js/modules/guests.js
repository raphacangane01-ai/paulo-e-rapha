// guests.js — módulo de Convidados

const GuestsModule = (() => {
  const SIDES = ['Família da noiva', 'Família do noivo', 'Amigos do noivo', 'Amigos da noiva', 'Padrinhos', 'Madrinhas'];

  let editingId = null; // controla qual convidado está em modo de edição na lista

  function isAdult(g) { return (g.guestType || 'adulto') !== 'crianca'; }

  // Vincula/desvincula cônjuge-acompanhante de forma mútua, limpando o vínculo antigo de ambos os lados.
  function setCompanionLink(list, aId, bId) {
    return list.map((g) => {
      if (g.id === aId) return { ...g, linkedGuestId: bId || null };
      if (bId && g.id === bId) return { ...g, linkedGuestId: aId };
      // Vínculos de responsável (crianças) não devem ser mexidos por esta função —
      // só limpamos vínculos antigos de cônjuge/acompanhante entre adultos.
      if (!isAdult(g)) return g;
      if (g.linkedGuestId === aId && g.id !== bId) return { ...g, linkedGuestId: null };
      if (bId && g.linkedGuestId === bId && g.id !== aId) return { ...g, linkedGuestId: null };
      return g;
    });
  }

  function render() {
    const guests = Store.get('guests');
    const confirmed = guests.filter(g => g.rsvp === 'confirmado').length;
    const declined = guests.filter(g => g.rsvp === 'recusado').length;
    const pending = guests.length - confirmed - declined;
    const adults = guests.filter(isAdult);

    return `
      <section class="view-header">
        <h1>Convidados</h1>
        <p class="muted">${guests.length} cadastrados · ${confirmed} confirmados · ${pending} pendentes · ${declined} recusados</p>
      </section>

      <form id="guest-form" class="card form-card">
        <div class="form-row">
          <input type="text" id="guest-name" placeholder="Nome do convidado" required />
          <select id="guest-side">
            ${SIDES.map(s => `<option value="${s}">${s}</option>`).join('')}
          </select>
        </div>
        <div class="form-row">
          <select id="guest-type">
            <option value="adulto">Adulto</option>
            <option value="crianca">Criança</option>
          </select>
          <input type="number" id="guest-age" placeholder="Idade" min="0" max="17" style="display:none;" />
        </div>
        <div class="form-row">
          <select id="guest-link">
            <option value="">Sem vínculo</option>
            ${adults.map(a => `<option value="${a.id}">${Utils.escapeHtml(a.name)}</option>`).join('')}
          </select>
          <input type="text" id="guest-contact" placeholder="Contato (telefone)" />
        </div>
        <select id="guest-rsvp">
          <option value="pendente">Pendente</option>
          <option value="confirmado">Confirmado</option>
          <option value="recusado">Recusado</option>
        </select>
        <button type="submit" class="btn-primary">Adicionar convidado</button>
      </form>

      <div class="card">
        <div id="guest-list">${renderList(guests)}</div>
      </div>
    `;
  }

  function linkLabel(g, guests) {
    if (!g.linkedGuestId) return '';
    const other = guests.find(x => x.id === g.linkedGuestId);
    if (!other) return '';
    return isAdult(g) ? `Cônjuge/acompanhante: ${Utils.escapeHtml(other.name)}` : `Responsável: ${Utils.escapeHtml(other.name)}`;
  }

  function renderList(guests) {
    if (!guests.length) return `<p class="muted">Nenhum convidado ainda. Adicione o primeiro acima.</p>`;
    const adults = guests.filter(isAdult);

    return `<ul class="data-list">
      ${guests.map(g => {
        if (editingId === g.id) return renderEditRow(g, adults);
        return `
        <li data-id="${g.id}">
          <div class="data-list-main">
            <strong>${Utils.escapeHtml(g.name)}</strong>
            <span class="tag">${Utils.escapeHtml(g.side || '')}</span>
            <span class="tag">${isAdult(g) ? 'Adulto' : `Criança${g.age !== null && g.age !== undefined && g.age !== '' ? ' · ' + g.age + ' anos' : ''}`}</span>
            <span class="badge badge-${g.rsvp}">${labelRsvp(g.rsvp)}</span>
          </div>
          <div class="data-list-sub muted">${Utils.escapeHtml(g.contact || '')}</div>
          ${linkLabel(g, guests) ? `<div class="data-list-sub">${linkLabel(g, guests)}</div>` : ''}
          <div class="data-list-actions">
            <select class="rsvp-select" data-id="${g.id}">
              <option value="pendente" ${g.rsvp === 'pendente' ? 'selected' : ''}>Pendente</option>
              <option value="confirmado" ${g.rsvp === 'confirmado' ? 'selected' : ''}>Confirmado</option>
              <option value="recusado" ${g.rsvp === 'recusado' ? 'selected' : ''}>Recusado</option>
            </select>
            <button class="btn-icon btn-edit" data-id="${g.id}">Editar</button>
            <button class="btn-icon btn-delete" data-id="${g.id}">Remover</button>
          </div>
        </li>`;
      }).join('')}
    </ul>`;
  }

  function renderEditRow(g, adults) {
    const otherAdults = adults.filter(a => a.id !== g.id);
    const childOfThis = !isAdult(g);
    return `
      <li data-id="${g.id}" class="editing">
        <div class="form-card">
          <div class="form-row">
            <input type="text" class="edit-name" value="${Utils.escapeHtml(g.name)}" />
            <select class="edit-side">
              ${SIDES.map(s => `<option value="${s}" ${g.side === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </div>
          <div class="form-row">
            <select class="edit-type">
              <option value="adulto" ${isAdult(g) ? 'selected' : ''}>Adulto</option>
              <option value="crianca" ${!isAdult(g) ? 'selected' : ''}>Criança</option>
            </select>
            <input type="number" class="edit-age" min="0" max="17" value="${g.age ?? ''}" placeholder="Idade" style="${childOfThis ? '' : 'display:none;'}" />
          </div>
          <div class="form-row">
            <select class="edit-link">
              <option value="">Sem vínculo</option>
              ${otherAdults.map(a => `<option value="${a.id}" ${g.linkedGuestId === a.id ? 'selected' : ''}>${Utils.escapeHtml(a.name)}</option>`).join('')}
            </select>
            <input type="text" class="edit-contact" value="${Utils.escapeHtml(g.contact || '')}" placeholder="Contato" />
          </div>
          <div class="form-row">
            <button type="button" class="btn-primary btn-save-edit" data-id="${g.id}">Salvar</button>
            <button type="button" class="btn-secondary btn-cancel-edit" data-id="${g.id}">Cancelar</button>
          </div>
        </div>
      </li>`;
  }

  function labelRsvp(rsvp) {
    return { pendente: 'Pendente', confirmado: 'Confirmado', recusado: 'Recusado' }[rsvp] || rsvp;
  }

  function afterRender() {
    const typeEl = document.getElementById('guest-type');
    const ageEl = document.getElementById('guest-age');
    const linkEl = document.getElementById('guest-link');

    function updateLinkOptionsLabel() {
      const isChild = typeEl.value === 'crianca';
      ageEl.style.display = isChild ? '' : 'none';
      // atualiza o texto da primeira opção do select de vínculo conforme o tipo
      linkEl.options[0].text = isChild ? 'Sem responsável vinculado' : 'Sem cônjuge/acompanhante';
    }
    updateLinkOptionsLabel();
    typeEl.addEventListener('change', updateLinkOptionsLabel);

    const form = document.getElementById('guest-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('guest-name').value.trim();
      if (!name) return;
      const guestType = typeEl.value;
      const linkId = linkEl.value || null;

      const newGuest = Store.addItem('guests', {
        name,
        side: document.getElementById('guest-side').value,
        guestType,
        age: guestType === 'crianca' ? (ageEl.value ? Number(ageEl.value) : null) : null,
        contact: document.getElementById('guest-contact').value.trim(),
        rsvp: document.getElementById('guest-rsvp').value,
        linkedGuestId: guestType === 'crianca' ? linkId : null,
      });

      if (guestType === 'adulto' && linkId) {
        Store.update('guests', (list) => setCompanionLink(list, newGuest.id, linkId));
      }

      Utils.toast('Convidado adicionado');
      App.rerender();
    });

    const listEl = document.getElementById('guest-list');

    listEl.addEventListener('change', (e) => {
      if (e.target.classList.contains('rsvp-select')) {
        Store.updateItem('guests', e.target.dataset.id, { rsvp: e.target.value });
        App.rerender();
      }
    });

    listEl.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-delete')) {
        Store.removeItem('guests', e.target.dataset.id);
        Utils.toast('Convidado removido');
        App.rerender();
      }
      if (e.target.classList.contains('btn-edit')) {
        editingId = e.target.dataset.id;
        App.rerender();
      }
      if (e.target.classList.contains('btn-cancel-edit')) {
        editingId = null;
        App.rerender();
      }
      if (e.target.classList.contains('btn-save-edit')) {
        const id = e.target.dataset.id;
        const li = e.target.closest('li');
        const name = li.querySelector('.edit-name').value.trim();
        const side = li.querySelector('.edit-side').value;
        const guestType = li.querySelector('.edit-type').value;
        const age = li.querySelector('.edit-age').value;
        const linkId = li.querySelector('.edit-link').value || null;
        const contact = li.querySelector('.edit-contact').value.trim();

        Store.updateItem('guests', id, {
          name: name || 'Sem nome',
          side,
          guestType,
          age: guestType === 'crianca' ? (age ? Number(age) : null) : null,
          contact,
          linkedGuestId: guestType === 'crianca' ? linkId : (undefined),
        });

        if (guestType === 'adulto') {
          Store.update('guests', (list) => setCompanionLink(list, id, linkId));
        }

        editingId = null;
        Utils.toast('Convidado atualizado');
        App.rerender();
      }
    });

    listEl.addEventListener('change', (e) => {
      if (e.target.classList.contains('edit-type')) {
        const li = e.target.closest('li');
        const isChild = e.target.value === 'crianca';
        li.querySelector('.edit-age').style.display = isChild ? '' : 'none';
      }
    });
  }

  return { render, afterRender };
})();

window.GuestsModule = GuestsModule;
