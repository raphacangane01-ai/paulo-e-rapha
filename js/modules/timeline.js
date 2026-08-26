// timeline.js — Cronograma: etapas de planejamento e cronograma do dia do evento

const TimelineModule = (() => {
  function render() {
    const all = Store.get('timeline');
    const planning = all.filter(t => t.day === 'planning').sort((a,b) => new Date(a.time||0) - new Date(b.time||0));
    const eventDay = all.filter(t => t.day === 'event').sort((a,b) => (a.time||'').localeCompare(b.time||''));

    return `
      <section class="view-header">
        <h1>Cronograma</h1>
        <p class="muted">Planejamento até o casamento e roteiro do grande dia</p>
      </section>

      <form id="timeline-form" class="card form-card">
        <div class="form-row">
          <input type="text" id="t-title" placeholder="Título (ex: Provar o bolo)" required />
          <select id="t-day">
            <option value="planning">Planejamento (antes do casamento)</option>
            <option value="event">Dia do evento</option>
          </select>
        </div>
        <div class="form-row">
          <input type="date" id="t-date-planning" placeholder="Data" />
          <input type="time" id="t-time-event" placeholder="Horário (dia do evento)" />
        </div>
        <textarea id="t-notes" placeholder="Notas"></textarea>
        <button type="submit" class="btn-primary">Adicionar</button>
      </form>

      <div class="two-col">
        <div class="card">
          <div class="card-header"><h2>Planejamento</h2></div>
          ${renderPlanning(planning)}
        </div>
        <div class="card">
          <div class="card-header"><h2>Dia do evento (17h às 0h/2h)</h2></div>
          ${renderEventDay(eventDay)}
        </div>
      </div>
    `;
  }

  function renderPlanning(items) {
    if (!items.length) return `<p class="muted">Nenhuma etapa cadastrada.</p>`;
    return `<ul class="data-list">
      ${items.map(t => `
        <li data-id="${t.id}">
          <div class="data-list-main"><strong>${Utils.escapeHtml(t.title)}</strong></div>
          <div class="data-list-sub muted">${t.time ? Utils.formatDate(t.time) : ''} ${t.notes ? '· ' + Utils.escapeHtml(t.notes) : ''}</div>
          <div class="data-list-actions"><button class="btn-icon btn-delete" data-id="${t.id}">Remover</button></div>
        </li>`).join('')}
    </ul>`;
  }

  function renderEventDay(items) {
    if (!items.length) return `<p class="muted">Nenhum item no roteiro do dia ainda.</p>`;
    return `<ul class="data-list">
      ${items.map(t => `
        <li data-id="${t.id}">
          <div class="data-list-main"><strong>${t.time ? Utils.escapeHtml(t.time) + ' — ' : ''}${Utils.escapeHtml(t.title)}</strong></div>
          ${t.notes ? `<div class="data-list-sub muted">${Utils.escapeHtml(t.notes)}</div>` : ''}
          <div class="data-list-actions"><button class="btn-icon btn-delete" data-id="${t.id}">Remover</button></div>
        </li>`).join('')}
    </ul>`;
  }

  function afterRender() {
    const dayEl = document.getElementById('t-day');
    const planningDateEl = document.getElementById('t-date-planning');
    const eventTimeEl = document.getElementById('t-time-event');

    function toggleFields() {
      const isPlanning = dayEl.value === 'planning';
      planningDateEl.style.display = isPlanning ? '' : 'none';
      eventTimeEl.style.display = isPlanning ? 'none' : '';
    }
    toggleFields();
    dayEl.addEventListener('change', toggleFields);

    document.getElementById('timeline-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('t-title').value.trim();
      if (!title) return;
      const day = dayEl.value;
      Store.addItem('timeline', {
        title,
        day,
        time: day === 'planning' ? (planningDateEl.value || null) : (eventTimeEl.value || null),
        notes: document.getElementById('t-notes').value.trim(),
      });
      Utils.toast('Item adicionado ao cronograma');
      App.rerender();
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        Store.removeItem('timeline', e.target.dataset.id);
        App.rerender();
      });
    });
  }

  return { render, afterRender };
})();

window.TimelineModule = TimelineModule;
