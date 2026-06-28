import crypto from 'node:crypto';
import fetch from 'node-fetch';
import config from '../config.js';

export async function checkFileHash(hash) {
  const cleanHash = hash.trim().toLowerCase();
  const result = {
    hash: cleanHash,
    type: detectHashType(cleanHash),
    timestamp: new Date().toISOString(),
    virusTotal: null,
    score: null,
    summary: null,
  };

  if (!result.type) {
    result.summary = { level: 'warn', text: 'Unrecognized hash format', issues: ['Supported: MD5, SHA1, SHA256'] };
    return result;
  }

  await checkVirusTotal(cleanHash, result);

  result.score = result.virusTotal?.malicious > 0
    ? Math.max(0, 100 - result.virusTotal.malicious * 15)
    : result.virusTotal ? 100 : null;

  result.summary = generateSummary(result);
  return result;
}

function detectHashType(hash) {
  if (/^[0-9a-f]{32}$/.test(hash)) return 'MD5';
  if (/^[0-9a-f]{40}$/.test(hash)) return 'SHA1';
  if (/^[0-9a-f]{64}$/.test(hash)) return 'SHA256';
  return null;
}

export function computeHash(buffer) {
  return {
    md5: crypto.createHash('md5').update(buffer).digest('hex'),
    sha1: crypto.createHash('sha1').update(buffer).digest('hex'),
    sha256: crypto.createHash('sha256').update(buffer).digest('hex'),
  };
}

async function checkVirusTotal(hash, result) {
  const key = config.apis.virusTotal.key;
  if (!key) {
    result.virusTotal = { error: 'VT_API_KEY not configured' };
    return;
  }

  try {
    const resp = await fetch(`https://www.virustotal.com/api/v3/files/${hash}`, {
      headers: { 'x-apikey': key },
      timeout: 10000,
    });

    if (resp.status === 404) {
      result.virusTotal = { notFound: true, message: 'Hash not found in VirusTotal database' };
      return;
    }

    if (!resp.ok) {
      result.virusTotal = { error: `VirusTotal returned ${resp.status}` };
      return;
    }

    const data = await resp.json();
    const attrs = data.data?.attributes || {};
    const stats = attrs.last_analysis_stats || {};
    const results = attrs.last_analysis_results || {};

    result.virusTotal = {
      notFound: false,
      meaningfulName: attrs.meaningful_name || null,
      typeDescription: attrs.type_description || null,
      size: attrs.size,
      firstSubmission: attrs.first_submission_date
        ? new Date(attrs.first_submission_date * 1000).toISOString() : null,
      lastAnalysis: attrs.last_analysis_date
        ? new Date(attrs.last_analysis_date * 1000).toISOString() : null,
      timesSubmitted: attrs.times_submitted,
      malicious: stats.malicious || 0,
      suspicious: stats.suspicious || 0,
      undetected: stats.undetected || 0,
      harmless: stats.harmless || 0,
      timeout: stats.timeout || 0,
      totalEngines: (stats.malicious || 0) + (stats.suspicious || 0) + (stats.undetected || 0) + (stats.harmless || 0),
      topVendors: getTopVendors(results),
    };

  } catch (err) {
    result.virusTotal = { error: err.message };
  }
}

function getTopVendors(results) {
  if (!results) return [];
  const flagged = [];
  for (const [vendor, res] of Object.entries(results)) {
    if (res.category === 'malicious' || res.category === 'suspicious') {
      flagged.push({ vendor, category: res.category, result: res.result });
    }
  }
  return flagged.sort((a, b) => a.vendor.localeCompare(b.vendor)).slice(0, 10);
}

function generateSummary(result) {
  if (!result.virusTotal) {
    return { level: 'warn', text: 'Unable to check hash', issues: ['No VT API key'] };
  }

  if (result.virusTotal.notFound) {
    return { level: 'good', text: 'No results — file unknown to VirusTotal', issues: ['Hash not found in VT database'] };
  }

  if (result.virusTotal.error) {
    return { level: 'warn', text: 'Check failed', issues: [result.virusTotal.error] };
  }

  const issues = [];
  const vt = result.virusTotal;
  const total = vt.totalEngines;

  if (vt.malicious > 0) {
    issues.push(`${vt.malicious}/${total} engines flagged as malicious`);
    result.score = Math.max(0, 100 - vt.malicious * 15);
  } else if (vt.suspicious > 0) {
    issues.push(`${vt.suspicious}/${total} engines suspicious`);
    result.score = 70;
  } else {
    issues.push(`Clean — 0/${total} malicious detections`);
    result.score = 100;
  }

  if (vt.meaningfulName) issues.push(`File: ${vt.meaningfulName}`);
  if (vt.timesSubmitted > 100) issues.push(`Submitted ${vt.timesSubmitted} times`);

  return {
    level: vt.malicious > 0 ? 'bad' : vt.suspicious > 0 ? 'warn' : 'good',
    text: vt.malicious > 0 ? `⚠ MALICIOUS (${vt.malicious}/${total})` : `Clean (0/${total})`,
    issues,
  };
}
