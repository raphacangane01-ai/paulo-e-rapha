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

    return { planned, paid, pending, cap, remaining: cap - planned };
  }

  function upcomingPayments() {
    const payments = Store.get('payments').filter(p => p.status !== 'pago' && p.dueDate);
    return payments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }

  function upcomingChecklist() {
    const items = Store.get('checklist').filter(c => !c.done && c.dueDate);
    return items.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }

  // "O que falta" — junta pagamentos pendentes, tarefas do checklist e
  // fornecedores ainda não contratados/confirmados numa única lista,
  // organizada em 5 níveis de prioridade com base no prazo (não em algo
  // marcado manualmente, pra não depender de dado que não temos).
  const PRIORITY_LABELS = ['Atrasado', 'Esta semana', 'Este mês', 'Até o casamento', 'Sem prazo definido'];

  function priorityTier(dueDate) {
    if (!dueDate) return 4; // sem prazo definido
    const days = Utils.daysUntil(dueDate);
    if (days < 0) return 0; // atrasado
    if (days <= 7) return 1; // esta semana
    if (days <= 30) return 2; // este mês
    return 3; // até o casamento
  }

  function computeWhatsMissing() {
    const payments = Store.get('payments').filter(p => p.status !== 'pago');
    const checklist = Store.get('checklist').filter(c => !c.done);
    const vendors = Store.get('vendors').filter(v => v.status === 'pendente' || v.status === 'a_confirmar');

    const rows = [];
    payments.forEach(p => rows.push({ tier: priorityTier(p.dueDate), label: p.description, type: 'Pagamento', dueDate: p.dueDate }));
    checklist.forEach(c => rows.push({ tier: priorityTier(c.dueDate), label: c.title, type: 'Tarefa', dueDate: c.dueDate }));
    vendors.forEach(v => rows.push({ tier: 4, label: `${v.name} (${v.category})`, type: 'Fornecedor', dueDate: null }));

    const byTier = [[], [], [], [], []];
    rows.forEach(r => byTier[r.tier].push(r));
    byTier.forEach(list => list.sort((a, b) => new Date(a.dueDate || '9999-12-31') - new Date(b.dueDate || '9999-12-31')));
    return byTier;
  }

  function renderWhatsMissing() {
    const byTier = computeWhatsMissing();
    const total = byTier.reduce((s, l) => s + l.length, 0);
    if (!total) return `<p class="muted">Nada pendente no momento 🎉</p>`;
    return byTier.map((list, tier) => {
      if (!list.length) return '';
      return `
        <div style="margin-bottom:10px;">
          <div class="muted" style="font-weight:600; margin-bottom:4px;">${PRIORITY_LABELS[tier]} (${list.length})</div>
          <ul class="simple-list">
            ${list.map(r => `
              <li>
                <span>${Utils.escapeHtml(r.label)} <span class="tag">${r.type}</span></span>
                <span class="muted">${r.dueDate ? Utils.formatDate(r.dueDate) : ''}</span>
              </li>`).join('')}
          </ul>
        </div>`;
    }).join('');
  }

  function render() {
    const settings = Store.get('settings');
    const vendors = Store.get('vendors');
    const checklist = Store.get('checklist');
    const pendingTasks = checklist.filter(c => !c.done).length;
    const budget = computeBudgetSummary();
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
          <div class="stat-value">${vendors.length}</div>
          <div class="stat-label">fornecedores cadastrados</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${pendingTasks}</div>
          <div class="stat-label">tarefas pendentes</div>
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
          <div><span class="muted">Orçamento disponível</span><br><strong class="${budget.remaining < 0 ? 'text-danger' : ''}">${Utils.formatCurrency(budget.remaining)}</strong></div>
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

      <div class="card">
        <div class="card-header"><h2>O que falta</h2></div>
        ${renderWhatsMissing()}
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
