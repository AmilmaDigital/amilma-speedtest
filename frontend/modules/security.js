/* ════════════════════════════════════════════════════════════════════════
   AMILMA SECURITY — Security Audit Module
   ════════════════════════════════════════════════════════════════════════ */
'use strict';

const API_BASE = window.API_BASE || 'http://localhost:3001';

function $(id) { return document.getElementById(id); }

let currentScanType = 'deep';

const SCAN_TYPES = {
  url:   { label: 'URL Scan',     endpoint: '/api/scan/url',   placeholder: 'example.com or https://...' },
  ip:    { label: 'IP Reputation', endpoint: '/api/scan/ip',    placeholder: '8.8.8.8 or domain' },
  dns:   { label: 'DNS Analysis',  endpoint: '/api/scan/dns',   placeholder: 'example.com' },
  ssl:   { label: 'SSL Audit',     endpoint: '/api/scan/ssl',   placeholder: 'example.com' },
  ports: { label: 'Port Scan',     endpoint: '/api/scan/ports', placeholder: 'example.com' },
  whois: { label: 'WHOIS Lookup',  endpoint: '/api/scan/whois', placeholder: 'example.com' },
  file:  { label: 'File Hash',     endpoint: '/api/scan/file-hash', placeholder: 'SHA256 hash' },
  deep:  { label: 'Deep Scan',     endpoint: '/api/scan/deep',  placeholder: 'example.com or https://...' },
};

export function initSecurity() {
  attachEventListeners();
  renderEmptyState('sec-results', '🔍', 'Security Audit', 'Enter a target above to start scanning');
}

function attachEventListeners() {
  const scanBtn = $('sec-scan-btn');
  const input = $('sec-input');
  const typeChips = document.querySelectorAll('.sec-type-chip');

  scanBtn?.addEventListener('click', () => runScan(input?.value?.trim()));

  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') runScan(input.value.trim());
  });

  typeChips.forEach(chip => {
    chip.addEventListener('click', () => {
      typeChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentScanType = chip.dataset.type;
      const st = SCAN_TYPES[currentScanType];
      if (st && input) input.placeholder = st.placeholder;
    });
  });
}

export async function runScan(target) {
  const input = $('sec-input');
  const results = $('sec-results');

  if (!target) {
    input?.focus();
    input?.classList.add('input-error');
    setTimeout(() => input?.classList.remove('input-error'), 600);
    return;
  }

  const scanType = SCAN_TYPES[currentScanType];
  if (!scanType) return;

  results.innerHTML = `<div class="sec-loading"><div class="sec-spinner"></div> Scanning ${target}...</div>`;

  try {
    const resp = await fetch(API_BASE + scanType.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: resp.statusText }));
      results.innerHTML = `<div class="sec-empty"><div class="sec-empty-icon">⚠</div>
        <div class="sec-empty-text">Scan failed</div>
        <div class="sec-empty-sub">${err.error || 'Server error'}</div></div>`;
      return;
    }

    const data = await resp.json();

    if (currentScanType === 'deep') {
      renderDeepScan(data, results);
    } else {
      renderScanResult(data, results, scanType.label);
    }
  } catch (err) {
    results.innerHTML = `<div class="sec-empty"><div class="sec-empty-icon">⚠</div>
      <div class="sec-empty-text">Connection error</div>
      <div class="sec-empty-sub">Cannot reach the security API. Is the backend running?</div></div>`;
  }
}

function renderScanResult(data, container, label) {
  const score = data.score ?? 50;
  const level = score >= 80 ? 'good' : score >= 50 ? 'warn' : 'bad';
  const summary = data.summary || {};

  let html = `<div class="sec-result-card">
    <div class="sec-result-header">
      <div class="sec-result-title">
        <span>${label}</span>
        <span style="color:var(--muted);font-weight:600;font-size:.78rem">${data.target || ''}</span>
      </div>
      <div class="sec-score-badge ${level}">${score}</div>
    </div>`;

  if (summary.text) {
    html += `<div class="sec-summary-line">
      <span class="sec-tag ${level}">${summary.text}</span>
    </div>`;
  }

  if (summary.issues?.length > 0) {
    html += `<ul class="sec-issues-list">`;
    summary.issues.forEach(issue => {
      const isGood = level === 'good' || issue.toLowerCase().includes('good') || issue.includes('enabled');
      const isBad = issue.toLowerCase().includes('missing') || issue.toLowerCase().includes('risk') || issue.toLowerCase().includes('weak') || issue.toLowerCase().includes('expired');
      const cls = isBad ? 'issue-bad' : isGood ? 'issue-good' : 'issue-warn';
      html += `<li class="${cls}">${issue}</li>`;
    });
    html += `</ul>`;
  }

  html += `<details style="margin-top:14px">
    <summary style="cursor:pointer;font-size:.68rem;color:var(--muted);font-weight:700">Raw JSON</summary>
    <pre style="margin-top:10px;padding:12px;background:var(--card-soft);border-radius:8px;font-size:.62rem;overflow-x:auto;white-space:pre-wrap;color:var(--muted)">${escapeHtml(JSON.stringify(data, null, 2))}</pre>
  </details>`;

  html += `</div>`;
  container.innerHTML = html;
}

function renderDeepScan(data, container) {
  const score = data.overallScore ?? 50;
  const level = score >= 80 ? 'good' : score >= 50 ? 'warn' : 'bad';

  let html = `<div class="sec-result-card">
    <div class="sec-result-header">
      <div class="sec-result-title">
        <span>Deep Scan</span>
        <span style="color:var(--muted);font-weight:600;font-size:.78rem">${data.target || ''}</span>
      </div>
      <div class="sec-score-badge ${level}">${score}</div>
    </div>`;

  if (data.summary) {
    html += `<div class="sec-summary-line">
      <span class="sec-tag ${level}">${data.summary.text}</span>
      <span class="sec-tag ${level}">${data.summary.totalIssues || 0} issues</span>
      <span class="sec-tag ${level}">${data.summary.highPriorityIssues || 0} critical</span>
      <span class="sec-tag neutral">${(data.elapsed / 1000).toFixed(1)}s</span>
    </div>`;
  }

  html += `<div class="sec-deep-grid">`;

  const modules = data.modules || {};
  const moduleNames = {
    url: 'URL Security', dns: 'DNS Health', ssl: 'SSL/TLS',
    ports: 'Port Security', ip: 'IP Reputation', whois: 'WHOIS',
  };

  for (const [key, mod] of Object.entries(moduleNames)) {
    const m = modules[key] || {};
    const ms = m.score ?? '—';
    const ml = ms >= 80 ? 'good' : ms >= 50 ? 'warn' : 'bad';
    const mStatus = m.summary?.text || 'Not scanned';

    html += `<div class="sec-module-card">
      <div class="sec-module-name">${mod}</div>
      <div class="sec-module-score" style="color:var(--${ml === 'bad' ? 'red' : ml === 'warn' ? 'amber' : 'green'})">${ms === '—' ? '—' : ms + '/100'}</div>
      <div class="sec-module-status" style="color:var(--muted);font-size:.64rem">${mStatus}</div>
    </div>`;
  }

  html += `</div>`;

  if (data.summary?.issues?.length > 0) {
    html += `<div style="margin-top:14px">
      <div style="font-size:.75rem;font-weight:750;color:var(--ink-strong);margin-bottom:8px">All Issues</div>
      <ul class="sec-issues-list">`;
    data.summary.issues.forEach(issue => {
      const isBad = issue.toLowerCase().includes('missing') || issue.toLowerCase().includes('expired') || issue.toLowerCase().includes('malicious') || issue.toLowerCase().includes('risk');
      html += `<li class="${isBad ? 'issue-bad' : 'issue-warn'}">${issue}</li>`;
    });
    html += `</ul></div>`;
  }

  html += `</div>`;
  container.innerHTML = html;
}

export function renderEmptyState(containerId, icon, title, sub) {
  const el = $(containerId);
  if (!el) return;
  el.innerHTML = `<div class="sec-empty">
    <div class="sec-empty-icon">${icon}</div>
    <div class="sec-empty-text">${title}</div>
    <div class="sec-empty-sub">${sub}</div>
  </div>`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Also handle the "Deep Scan" quick button if it exists
document.addEventListener('DOMContentLoaded', () => {
  // If security tab content exists, init
  if ($('tab-security')) initSecurity();
});
