// dashboard.js — visão geral: contagem regressiva viva, resumo do
// orçamento e todas as tarefas pendentes com prazo.

const DashboardModule = (() => {
  let tickHandle = null;

  function computeBudgetSummary() {
    const settings = Store.get('settings');
    const budgetItems = Store.get('budgetItems');
    const payments = Store.get('payments');

    const planned = budgetItems.reduce((sum, b) => sum + (Number(b.plannedValue) || 0), 0);
    const paid = payments.filter(p => p.status === 'pago').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const pending = payments.filter(p => p.status !== 'pago').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const cap = Number(settings.budgetCap) || 0;

    return { planned, paid, pending, cap, remaining: cap - paid };
  }

  function upcomingPayments() {
    const payments = Store.get('payments').filter(p => p.status !== 'pago' && p.dueDate);
    return payments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }

  function upcomingChecklist() {
    const items = Store.get('checklist').filter(c => !c.done && c.dueDate);
    return items.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }

  function render() {
    const settings = Store.get('settings');
    const guests = Store.get('guests');
    const vendors = Store.get('vendors');
    const budget = computeBudgetSummary();
    const confirmed = guests.filter(g => g.rsvp === 'confirmado').length;
    const pctPaid = budget.cap > 0 ? Utils.clamp((budget.paid / budget.cap) * 100, 0, 100) : 0;
    const dateLabel = settings.weddingDate ? Utils.formatDateTime(settings.weddingDate) : 'data a definir';

    return `
      <section class="view-header">
        <h1>${Utils.escapeHtml(settings.coupleNames || 'Nosso casamento')}</h1>
        <p class="muted">${dateLabel}${settings.weddingLocation ? ' · ' + Utils.escapeHtml(settings.weddingLocation) : ''}</p>
      </section>

      <div class="card countdown-card" id="countdown-card">
        ${renderCountdown(settings.weddingDate)}
      </div>

      <div class="card-grid">
        <div class="stat-card">
          <div class="stat-value">${confirmed}/${guests.length}</div>
          <div class="stat-label">convidados confirmados</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${vendors.length}</div>
          <div class="stat-label">fornecedores cadastrados</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h2>Orçamento</h2>
          <span class="muted">Teto: ${Utils.formatCurrency(budget.cap)}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width:${pctPaid}%"></div>
        </div>
        <div class="budget-mini-grid">
          <div><span class="muted">Pago</span><br><strong>${Utils.formatCurrency(budget.paid)}</strong></div>
          <div><span class="muted">Pendente</span><br><strong>${Utils.formatCurrency(budget.pending)}</strong></div>
          <div><span class="muted">Restante do teto</span><br><strong class="${budget.remaining < 0 ? 'text-danger' : ''}">${Utils.formatCurrency(budget.remaining)}</strong></div>
        </div>
      </div>

      <div class="two-col">
        <div class="card">
          <div class="card-header"><h2>Próximos pagamentos</h2></div>
          ${renderUpcomingPayments()}
        </div>
        <div class="card">
          <div class="card-header"><h2>Próximas tarefas</h2></div>
          ${renderUpcomingChecklist()}
        </div>
      </div>
    `;
  }

  function renderCountdown(weddingDate) {
    if (!weddingDate) return `<p class="muted">Defina a data do casamento em Configurações para ver a contagem regressiva.</p>`;
    const p = Utils.countdownParts(weddingDate);
    return `
      <div class="countdown-label">${p.past ? 'desde o grande dia' : 'para o grande dia'}</div>
      <div class="countdown-grid">
        <div class="countdown-unit"><span class="countdown-number" id="cd-days">${p.days}</span><span class="countdown-caption">dias</span></div>
        <div class="countdown-unit"><span class="countdown-number" id="cd-hours">${pad2(p.hours)}</span><span class="countdown-caption">horas</span></div>
        <div class="countdown-unit"><span class="countdown-number" id="cd-min">${pad2(p.minutes)}</span><span class="countdown-caption">min</span></div>
        <div class="countdown-unit"><span class="countdown-number" id="cd-sec">${pad2(p.seconds)}</span><span class="countdown-caption">seg</span></div>
      </div>
    `;
  }

  function pad2(n) { return String(n).padStart(2, '0'); }

  function renderUpcomingPayments() {
    const items = upcomingPayments();
    if (!items.length) return `<p class="muted">Nenhum pagamento pendente com data definida.</p>`;
    return `<ul class="simple-list">
      ${items.map(p => `
        <li>
          <span>${Utils.escapeHtml(p.description || 'Pagamento')}</span>
          <span class="muted">${Utils.formatDate(p.dueDate)} · ${Utils.formatCurrency(p.amount)}</span>
        </li>`).join('')}
    </ul>`;
  }

  function renderUpcomingChecklist() {
    const items = upcomingChecklist();
    if (!items.length) return `<p class="muted">Nenhuma tarefa pendente com prazo definido ainda. Defina prazos no Checklist.</p>`;
    return `<ul class="simple-list">
      ${items.map(c => `
        <li>
          <span>${Utils.escapeHtml(c.title)} <span class="tag">${Utils.escapeHtml(c.category || '')}</span></span>
          <span class="muted">até ${Utils.formatDate(c.dueDate)}</span>
        </li>`).join('')}
    </ul>`;
  }

  function afterRender() {
    stopTicking();
    const weddingDate = Store.get('settings').weddingDate;
    if (!weddingDate) return;
    tickHandle = setInterval(() => {
      const el = document.getElementById('countdown-card');
      if (!el) { stopTicking(); return; }
      el.innerHTML = renderCountdown(weddingDate);
    }, 1000);
  }

  function stopTicking() {
    if (tickHandle) {
      clearInterval(tickHandle);
      tickHandle = null;
    }
  }

  function cleanup() {
    stopTicking();
  }

  return { render, afterRender, cleanup };
})();

window.DashboardModule = DashboardModule;
