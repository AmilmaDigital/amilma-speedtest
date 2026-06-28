/* ════════════════════════════════════════════════════════════════════════
   AMILMA DNS — DNS Tools Module
   ════════════════════════════════════════════════════════════════════════ */
'use strict';

const API_BASE = window.API_BASE || 'http://localhost:3001';

export function initDnsTools() {
  const lookupBtn = document.getElementById('dns-lookup-btn');
  const input = document.getElementById('dns-input');
  const results = document.getElementById('dns-results');

  if (!results) return;

  results.innerHTML = `<div class="sec-empty">
    <div class="sec-empty-icon">🌐</div>
    <div class="sec-empty-text">DNS Lookup</div>
    <div class="sec-empty-sub">Enter a domain to query all DNS record types</div>
  </div>`;

  lookupBtn?.addEventListener('click', () => doDnsLookup(input?.value?.trim()));
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doDnsLookup(input.value.trim());
  });
}

async function doDnsLookup(domain) {
  const input = document.getElementById('dns-input');
  const results = document.getElementById('dns-results');
  if (!domain || !results) return;

  results.innerHTML = `<div class="sec-loading"><div class="sec-spinner"></div> Looking up ${domain}...</div>`;

  try {
    const resp = await fetch(API_BASE + '/api/scan/dns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: domain }),
    });

    if (!resp.ok) {
      results.innerHTML = `<div class="sec-empty"><div class="sec-empty-icon">⚠</div>
        <div class="sec-empty-text">Lookup failed</div></div>`;
      return;
    }

    const data = await resp.json();
    renderDnsResults(data, results);

    renderDnsSecurity(data, domain);

  } catch (err) {
    results.innerHTML = `<div class="sec-empty"><div class="sec-empty-icon">⚠</div>
      <div class="sec-empty-text">Connection error</div></div>`;
  }
}

function renderDnsResults(data, container) {
  const records = data.records || {};
  const hasRecords = Object.keys(records).length > 0;

  if (!hasRecords) {
    container.innerHTML = `<div class="sec-empty"><div class="sec-empty-icon">📭</div>
      <div class="sec-empty-text">No DNS records found</div></div>`;
    return;
  }

  const score = data.score ?? 50;
  const level = score >= 80 ? 'good' : score >= 50 ? 'warn' : 'bad';

  let html = `<div class="sec-result-card">
    <div class="sec-result-header">
      <div class="sec-result-title">
        <span>DNS Records</span>
        <span style="color:var(--muted);font-weight:600;font-size:.78rem">${data.target}</span>
      </div>
      <div class="sec-score-badge ${level}">${score}</div>
    </div>`;

  if (data.summary?.issues?.length) {
    html += `<ul class="sec-issues-list" style="margin-bottom:16px">`;
    data.summary.issues.forEach(issue => {
      const isBad = issue.toLowerCase().includes('missing') || issue.toLowerCase().includes('risk');
      html += `<li class="${isBad ? 'issue-bad' : 'issue-warn'}">${issue}</li>`;
    });
    html += `</ul>`;
  }

  html += `<table class="dns-record-table">
    <thead><tr><th>Type</th><th>Value</th></tr></thead><tbody>`;

  const typeOrder = ['A', 'AAAA', 'MX', 'NS', 'CNAME', 'TXT', 'SOA'];
  for (const type of typeOrder) {
    const recs = records[type];
    if (!recs || !recs.length) continue;

    recs.forEach(rec => {
      const val = typeof rec === 'object'
        ? (rec.exchange ? `${rec.exchange} (priority ${rec.priority})` :
           rec.nsTarget ? rec.nsTarget :
           rec.mname ? `${rec.mname} / ${rec.rname}` :
           Array.isArray(rec) ? rec.join(' ') :
           rec.toString())
        : rec.toString();
      html += `<tr><td style="font-weight:800;color:var(--blue);width:70px">${type}</td><td>${escapeHtml(val.substring(0, 200))}</td></tr>`;
    });
  }

  html += `</tbody></table></div>`;
  container.innerHTML = html;
}

function renderDnsSecurity(data, domain) {
  const secEl = document.getElementById('dns-security');
  if (!secEl) return;

  const sec = data.security || {};
  const issues = [];

  if (sec.spf) issues.push(sec.spfWeak ? `⚠ SPF: Too permissive` : `✓ SPF: configured`);
  else issues.push(`✗ SPF: Not configured`);
  if (sec.dkim) issues.push(`✓ DKIM: configured`);
  else issues.push(`✗ DKIM: Not configured`);
  if (sec.dmarc) issues.push(`✓ DMARC: ${sec.dmarcPolicy || 'configured'}`);
  else issues.push(`✗ DMARC: Not configured`);
  if (sec.dnssec === 'enabled') issues.push(`✓ DNSSEC: enabled`);
  else issues.push(`✗ DNSSEC status: unknown`);
  if (sec.mxCount) issues.push(`📧 MX records: ${sec.mxCount}`);

  secEl.innerHTML = `<div class="sec-result-card" style="margin-top:12px">
    <div class="sec-result-header">
      <div class="sec-result-title">Email & Security Posture</div>
    </div>
    <ul class="sec-issues-list">${issues.map(i => {
      const cls = i.startsWith('✓') ? 'issue-good' : i.startsWith('⚠') ? 'issue-warn' : 'issue-bad';
      return `<li class="${cls}">${i}</li>`;
    }).join('')}</ul>
  </div>`;
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
