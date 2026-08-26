// dashboard.js — visão geral (melhoria pedida): contagem regressiva,
// resumo do orçamento e próximas tarefas.

const DashboardModule = (() => {
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

  function upcomingPayments(limit = 4) {
    const payments = Store.get('payments').filter(p => p.status !== 'pago' && p.dueDate);
    return payments
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, limit);
  }

  function upcomingChecklist(limit = 5) {
    const items = Store.get('checklist').filter(c => !c.done);
    return items
      .sort((a, b) => new Date(a.dueDate || '9999-12-31') - new Date(b.dueDate || '9999-12-31'))
      .slice(0, limit);
  }

  function render() {
    const settings = Store.get('settings');
    const guests = Store.get('guests');
    const vendors = Store.get('vendors');
    const budget = computeBudgetSummary();
    const days = settings.weddingDate ? Utils.daysUntil(settings.weddingDate) : null;
    const confirmed = guests.filter(g => g.rsvp === 'confirmado').length;

    const pctPaid = budget.cap > 0 ? Utils.clamp((budget.paid / budget.cap) * 100, 0, 100) : 0;

    return `
      <section class="view-header">
        <h1>Visão geral</h1>
        <p class="muted">${settings.weddingLocation || 'Local a definir'}</p>
      </section>

      <div class="card-grid">
        <div class="stat-card highlight">
          <div class="stat-value">${days !== null ? days : '—'}</div>
          <div class="stat-label">dias para o grande dia</div>
        </div>
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
    if (!items.length) return `<p class="muted">Nenhuma tarefa pendente. 🎉</p>`;
    return `<ul class="simple-list">
      ${items.map(c => `
        <li>
          <span>${Utils.escapeHtml(c.title)}</span>
          <span class="muted">${c.dueDate ? Utils.formatDate(c.dueDate) : 'sem prazo'}</span>
        </li>`).join('')}
    </ul>`;
  }

  function afterRender() {
    // sem interações adicionais por enquanto
  }

  return { render, afterRender };
})();

window.DashboardModule = DashboardModule;
