/* ════════════════════════════════════════════════════════════════════════
   AMILMA REPORTS — Reports & History Module
   ════════════════════════════════════════════════════════════════════════ */
'use strict';

const API_BASE = window.API_BASE || 'http://localhost:3001';

export function initReports() {
  loadReports();
}
window.initReports = initReports;

async function loadReports() {
  const list = document.getElementById('report-list');
  if (!list) return;

  list.innerHTML = `<div class="sec-loading"><div class="sec-spinner"></div> Loading reports...</div>`;

  try {
    const [scanHistory, speedHistory, savedReports] = await Promise.all([
      fetch(API_BASE + '/api/scan/history?limit=10').then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(API_BASE + '/api/speedtest/history?limit=10').then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(API_BASE + '/api/reports').then(r => r.ok ? r.json() : []).catch(() => []),
    ]);

    const items = [];

    if (savedReports.length) {
      savedReports.forEach(r => {
        items.push({
          type: 'report',
          id: r.id,
          title: r.title || 'Untitled Report',
          subtype: r.report_type || 'scan',
          time: r.created_at,
        });
      });
    }

    if (scanHistory.length) {
      scanHistory.forEach(r => {
        items.push({
          type: 'scan',
          id: r.id,
          title: `${capitalize(r.scan_type)} Scan: ${r.target}`,
          subtype: r.scan_type,
          score: r.score,
          time: r.created_at,
        });
      });
    }

    if (speedHistory.length) {
      speedHistory.forEach(r => {
        items.push({
          type: 'speedtest',
          id: r.id,
          title: `Speed Test — ${r.dl || '?'} Mbps DL / ${r.ul || '?'} Mbps UL`,
          subtype: 'speedtest',
          score: r.network_score,
          time: r.created_at,
        });
      });
    }

    if (!items.length) {
      list.innerHTML = `<div class="sec-empty">
        <div class="sec-empty-icon">📋</div>
        <div class="sec-empty-text">No reports yet</div>
        <div class="sec-empty-sub">Run a speed test or security scan to see results here</div>
      </div>`;
      return;
    }

    list.innerHTML = `<div class="report-list">${items.map(item => {
      const icon = item.type === 'scan' ? '🔍' : item.type === 'speedtest' ? '⚡' : '📄';
      return `<div class="report-item" onclick="viewReport('${item.type}', ${item.id})">
        <div class="report-info">
          <span class="report-title">${icon} ${item.title}</span>
          <span class="report-meta">${item.type} · ${formatTime(item.time)}${item.score != null ? ` · Score: ${item.score}` : ''}</span>
        </div>
        <span style="color:var(--muted-soft);font-size:.62rem">${item.subtype}</span>
      </div>`;
    }).join('')}</div>`;
  } catch (err) {
    list.innerHTML = `<div class="sec-empty"><div class="sec-empty-icon">⚠</div>
      <div class="sec-empty-text">Could not load reports</div>
      <div class="sec-empty-sub">Make sure the backend is running</div>
      <button class="sec-btn" onclick="initReports()" style="margin-top:12px">Retry</button></div>`;
  }
}

window.viewReport = async function(type, id) {
  const list = document.getElementById('report-list');
  if (!list) return;

  try {
    let data;
    if (type === 'scan') {
      const resp = await fetch(API_BASE + `/api/scan/${id}`);
      data = await resp.json();
    } else if (type === 'speedtest') {
      const resp = await fetch(API_BASE + `/api/speedtest/${id}`);
      data = await resp.json();
    } else {
      const resp = await fetch(API_BASE + `/api/reports/${id}`);
      data = await resp.json();
    }

    if (!data) return;

    list.innerHTML = `<div class="sec-result-card">
      <div class="sec-result-header">
        <div class="sec-result-title">
          <span>${data.target || data.title || 'Report'}</span>
        </div>
        <div style="display:flex;gap:8px">
          <button class="sec-btn sec-btn-sm" onclick="initReports()">← Back</button>
        </div>
      </div>
      <pre style="padding:12px;background:var(--card-soft);border-radius:8px;font-size:.62rem;overflow-x:auto;white-space:pre-wrap;color:var(--muted);margin:0">${escapeHtml(JSON.stringify(data, null, 2))}</pre>
    </div>`;
  } catch {}
};

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
