/* ════════════════════════════════════════════════════════════════════════
   AMILMA NAV — Navigation, Tabs & Theme System
   ════════════════════════════════════════════════════════════════════════ */
'use strict';

export function initNavigation() {
  setupTabs();
  setupThemeToggle();
  setupHashRouting();
}

function setupTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      if (!target) return;

      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      contents.forEach(c => c.classList.remove('active'));
      const content = document.getElementById('tab-' + target);
      if (content) content.classList.add('active');

      window.location.hash = target;

      // Lazy init on first tab switch
      if (target === 'security') lazyInit('security');
      if (target === 'dns') lazyInit('dns');
      if (target === 'reports') lazyInit('reports');
    });
  });
}

const _inited = {};

function lazyInit(module) {
  if (_inited[module]) return;
  _inited[module] = true;

  switch (module) {
    case 'security':
      import('./security.js').then(m => m.initSecurity());
      break;
    case 'dns':
      import('./dns-tools.js').then(m => m.initDnsTools());
      break;
    case 'reports':
      import('./reports.js').then(m => m.initReports());
      break;
  }
}

function setupThemeToggle() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;

  const saved = localStorage.getItem('amilma_theme');
  if (saved === 'dark') {
    document.body.classList.add('dark');
    btn.textContent = '☀️';
  }

  btn.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark');
    btn.textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('amilma_theme', isDark ? 'dark' : 'light');
  });
}

function setupHashRouting() {
  const hash = window.location.hash.slice(1) || 'speedtest';
  const tab = document.querySelector(`.nav-tab[data-tab="${hash}"]`);
  if (tab) tab.click();
}
