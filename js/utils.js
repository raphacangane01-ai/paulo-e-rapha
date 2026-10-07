// utils.js — funções auxiliares compartilhadas pelos módulos

const Utils = (() => {
  function uid() {
    return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
  }

  function formatCurrency(value) {
    const n = Number(value) || 0;
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function parseCurrencyInput(value) {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    const cleaned = String(value).replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3},)/g, '').replace(',', '.');
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  }

  function formatDate(isoOrDate, opts = {}) {
    if (!isoOrDate) return '';
    const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', ...opts });
  }

  function formatDateTime(isoOrDate) {
    if (!isoOrDate) return '';
    const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }

  function daysUntil(isoDate) {
    const target = new Date(isoDate);
    const now = new Date();
    const diffMs = target.setHours(0,0,0,0) - now.setHours(0,0,0,0);
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  function countdownParts(isoDateTime) {
    const target = new Date(isoDateTime).getTime();
    const now = Date.now();
    let diff = target - now;
    const past = diff < 0;
    diff = Math.abs(diff);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    return { days, hours, minutes, seconds, past };
  }

  function addMonths(isoDate, months) {
    const d = isoDate ? new Date(isoDate) : new Date();
    const day = d.getDate();
    d.setDate(1);
    d.setMonth(d.getMonth() + months);
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(day, lastDay));
    return d.toISOString().slice(0, 10);
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function debounce(fn, wait = 300) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  }

  function downloadCSV(filename, headers, rows) {
    const escapeCsv = (val) => {
      const s = val === null || val === undefined ? '' : String(val);
      if (/[",;\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
      return s;
    };
    const lines = [headers, ...rows].map((row) => row.map(escapeCsv).join(';'));
    const csv = '﻿' + lines.join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function downloadJSON(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function toast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.textContent = message;
    container.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 300);
    }, 2800);
  }

  return {
    uid, formatCurrency, parseCurrencyInput, formatDate, formatDateTime,
    daysUntil, countdownParts, addMonths, fileToDataUrl,
    escapeHtml, clamp, debounce, downloadCSV, downloadJSON, toast,
  };
})();

window.Utils = Utils;
