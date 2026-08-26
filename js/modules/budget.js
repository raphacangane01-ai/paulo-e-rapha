// budget.js — Orçamento + controle detalhado de Pagamentos (melhoria pedida:
// parcelas, vencimentos e alertas de pendências).

const BudgetModule = (() => {
  function totals() {
    const items = Store.get('budgetItems');
    const payments = Store.get('payments');
    const settings = Store.get('settings');
    const planned = items.reduce((s, b) => s + (Number(b.plannedValue) || 0), 0);
    const paid = payments.filter(p => p.status === 'pago').reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const pending = payments.filter(p => p.status !== 'pago').reduce((s, p) => s + (Number(p.amount) || 0), 0);
    return { planned, paid, pending, cap: Number(settings.budgetCap) || 0 };
  }

  function overduePayments() {
    const today = new Date().setHours(0,0,0,0);
    return Store.get('payments').filter(p => p.status !== 'pago' && p.dueDate && new Date(p.dueDate).setHours(0,0,0,0) < today);
  }

  function render() {
    const items = Store.get('budgetItems');
    const vendors = Store.get('vendors');
    const payments = Store.get('payments');
    const t = totals();
    const overdue = overduePayments();

    return `
      <section class="view-header">
        <h1>Orçamento e pagamentos</h1>
        <p class="muted">Teto: ${Utils.formatCurrency(t.cap)} · Planejado: ${Utils.formatCurrency(t.planned)}</p>
      </section>

      ${overdue.length ? `
        <div class="alert alert-danger">
          ⚠️ ${overdue.length} pagamento(s) atrasado(s): ${overdue.map(p => Utils.escapeHtml(p.description)).join(', ')}
        </div>` : ''}

      <div class="card-grid">
        <div class="stat-card"><div class="stat-value">${Utils.formatCurrency(t.paid)}</div><div class="stat-label">Pago</div></div>
        <div class="stat-card"><div class="stat-value">${Utils.formatCurrency(t.pending)}</div><div class="stat-label">Pendente</div></div>
        <div class="stat-card ${t.cap - t.paid < 0 ? 'stat-danger' : ''}"><div class="stat-value">${Utils.formatCurrency(t.cap - t.paid)}</div><div class="stat-label">Restante do teto</div></div>
      </div>

      <div class="card">
        <div class="card-header"><h2>Itens do orçamento</h2></div>
        <form id="budget-item-form" class="form-card">
          <div class="form-row">
            <input type="text" id="bi-category" placeholder="Categoria (ex: Buffet, Fotografia)" required />
            <select id="bi-vendor">
              <option value="">Sem fornecedor vinculado</option>
              ${vendors.map(v => `<option value="${v.id}">${Utils.escapeHtml(v.name)}</option>`).join('')}
            </select>
          </div>
          <div class="form-row">
            <input type="text" inputmode="decimal" id="bi-value" placeholder="Valor planejado (R$)" required />
            <input type="text" id="bi-notes" placeholder="Observações" />
          </div>
          <button type="submit" class="btn-primary">Adicionar item</button>
        </form>
        <div id="budget-items-list">${renderBudgetItems(items, vendors)}</div>
      </div>

      <div class="card">
        <div class="card-header"><h2>Pagamentos / parcelas</h2></div>
        <form id="payment-form" class="form-card">
          <div class="form-row">
            <input type="text" id="p-desc" placeholder="Descrição (ex: Sinal do buffet)" required />
            <select id="p-budget-item">
              <option value="">Sem item de orçamento vinculado</option>
              ${items.map(b => `<option value="${b.id}">${Utils.escapeHtml(b.category)}</option>`).join('')}
            </select>
          </div>
          <label class="checkbox-label">
            <input type="checkbox" id="p-installment-toggle" />
            <span>Parcelar este pagamento</span>
          </label>
          <div class="form-row">
            <input type="text" inputmode="decimal" id="p-amount" placeholder="Valor total (R$)" required />
            <input type="date" id="p-due" />
          </div>
          <div class="form-row" id="p-installment-fields" style="display:none;">
            <input type="number" min="1" id="p-installments-count" placeholder="Número de parcelas" />
            <input type="text" inputmode="decimal" id="p-down-payment" placeholder="Valor da entrada (R$, opcional)" />
          </div>
          <p class="muted" id="p-due-hint">Data de vencimento</p>
          <button type="submit" class="btn-primary">Adicionar pagamento</button>
        </form>
        <div id="payments-list">${renderPayments(payments)}</div>
      </div>
    `;
  }

  function renderBudgetItems(items, vendors) {
    if (!items.length) return `<p class="muted">Nenhum item cadastrado.</p>`;
    return `<ul class="data-list">
      ${items.map(b => {
        const vendor = vendors.find(v => v.id === b.vendorId);
        return `
        <li data-id="${b.id}">
          <div class="data-list-main">
            <strong>${Utils.escapeHtml(b.category)}</strong>
            <span class="muted">${Utils.formatCurrency(b.plannedValue)}</span>
          </div>
          <div class="data-list-sub muted">${vendor ? Utils.escapeHtml(vendor.name) : ''} ${b.notes ? '· ' + Utils.escapeHtml(b.notes) : ''}</div>
          <div class="data-list-actions">
            <button class="btn-icon btn-delete-budget" data-id="${b.id}">Remover</button>
          </div>
        </li>`;
      }).join('')}
    </ul>`;
  }

  function renderPayments(payments) {
    if (!payments.length) return `<p class="muted">Nenhum pagamento cadastrado.</p>`;
    const sorted = [...payments].sort((a, b) => new Date(a.dueDate || '9999-12-31') - new Date(b.dueDate || '9999-12-31'));
    const today = new Date().setHours(0,0,0,0);
    return `<ul class="data-list">
      ${sorted.map(p => {
        const isOverdue = p.status !== 'pago' && p.dueDate && new Date(p.dueDate).setHours(0,0,0,0) < today;
        return `
        <li data-id="${p.id}">
          <div class="data-list-main">
            <strong>${Utils.escapeHtml(p.description)}</strong>
            <span class="muted">${Utils.formatCurrency(p.amount)}</span>
            ${isOverdue ? '<span class="badge badge-recusado">Atrasado</span>' : ''}
          </div>
          <div class="data-list-sub muted">${p.dueDate ? 'Vencimento: ' + Utils.formatDate(p.dueDate) : 'Sem data'} ${p.paidDate ? '· Pago em ' + Utils.formatDate(p.paidDate) : ''}</div>
          <div class="data-list-actions">
            <select class="payment-status" data-id="${p.id}">
              <option value="pendente" ${p.status === 'pendente' ? 'selected' : ''}>Pendente</option>
              <option value="pago" ${p.status === 'pago' ? 'selected' : ''}>Pago</option>
            </select>
            <button class="btn-icon btn-delete-payment" data-id="${p.id}">Remover</button>
          </div>
        </li>`;
      }).join('')}
    </ul>`;
  }

  function afterRender() {
    document.getElementById('budget-item-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const category = document.getElementById('bi-category').value.trim();
      if (!category) return;
      Store.addItem('budgetItems', {
        category,
        vendorId: document.getElementById('bi-vendor').value || null,
        plannedValue: Utils.parseCurrencyInput(document.getElementById('bi-value').value),
        notes: document.getElementById('bi-notes').value.trim(),
      });
      Utils.toast('Item de orçamento adicionado');
      App.rerender();
    });

    const toggleEl = document.getElementById('p-installment-toggle');
    const fieldsEl = document.getElementById('p-installment-fields');
    const dueHintEl = document.getElementById('p-due-hint');
    const dueInput = document.getElementById('p-due');

    toggleEl.addEventListener('change', () => {
      const on = toggleEl.checked;
      fieldsEl.style.display = on ? '' : 'none';
      dueHintEl.textContent = on ? 'Data da entrada (ou da 1ª parcela, se não houver entrada)' : 'Data de vencimento';
    });

    document.getElementById('payment-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const desc = document.getElementById('p-desc').value.trim();
      if (!desc) return;
      const budgetItemId = document.getElementById('p-budget-item').value || null;
      const totalAmount = Utils.parseCurrencyInput(document.getElementById('p-amount').value);
      const baseDate = dueInput.value || new Date().toISOString().slice(0, 10);

      if (!toggleEl.checked) {
        Store.addItem('payments', {
          description: desc,
          budgetItemId,
          amount: totalAmount,
          dueDate: dueInput.value || null,
          status: 'pendente',
          paidDate: null,
        });
        Utils.toast('Pagamento adicionado');
        App.rerender();
        return;
      }

      // Parcelamento: gera entrada (opcional) + N parcelas automaticamente
      const numParcelas = Math.max(1, parseInt(document.getElementById('p-installments-count').value, 10) || 1);
      const downPayment = Utils.parseCurrencyInput(document.getElementById('p-down-payment').value);
      const remaining = Math.max(totalAmount - downPayment, 0);
      const parcelaBase = Math.round((remaining / numParcelas) * 100) / 100;
      const groupId = Utils.uid();
      const newPayments = [];

      if (downPayment > 0) {
        newPayments.push({
          description: `${desc} - Entrada`,
          budgetItemId, amount: downPayment, dueDate: baseDate,
          status: 'pendente', paidDate: null, groupId,
        });
      }

      let allocated = 0;
      for (let i = 1; i <= numParcelas; i++) {
        const isLast = i === numParcelas;
        const amount = isLast ? Math.round((remaining - allocated) * 100) / 100 : parcelaBase;
        allocated += amount;
        newPayments.push({
          description: `${desc} - Parcela ${i}/${numParcelas}`,
          budgetItemId, amount, dueDate: Utils.addMonths(baseDate, i),
          status: 'pendente', paidDate: null, groupId,
        });
      }

      Store.addItems('payments', newPayments);
      Utils.toast(`${newPayments.length} pagamento(s) gerado(s)`);
      App.rerender();
    });

    document.getElementById('budget-items-list').addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-delete-budget')) {
        Store.removeItem('budgetItems', e.target.dataset.id);
        App.rerender();
      }
    });

    document.getElementById('payments-list').addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-delete-payment')) {
        Store.removeItem('payments', e.target.dataset.id);
        App.rerender();
      }
    });

    document.getElementById('payments-list').addEventListener('change', (e) => {
      if (e.target.classList.contains('payment-status')) {
        const status = e.target.value;
        Store.updateItem('payments', e.target.dataset.id, {
          status,
          paidDate: status === 'pago' ? new Date().toISOString() : null,
        });
        App.rerender();
      }
    });
  }

  return { render, afterRender };
})();

window.BudgetModule = BudgetModule;
