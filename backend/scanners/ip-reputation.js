import https from 'node:https';
import { URL } from 'node:url';
import fetch from 'node-fetch';
import config from '../config.js';

export async function checkIpReputation(target) {
  const ip = target.replace(/^https?:\/\//, '').split('/')[0].split(':')[0];
  const isDomain = /[a-zA-Z]/.test(ip);

  const result = {
    target: ip,
    type: isDomain ? 'domain' : 'ip',
    timestamp: new Date().toISOString(),
    geo: null,
    asn: null,
    blacklists: [],
    reputation: null,
    abuseReports: null,
    riskLevel: 'unknown',
    sources: [],
  };

  await Promise.all([
    fetchGeoIp(ip, result),
    fetchAbuseIpdb(ip, result),
    checkCommonLists(ip, isDomain, result),
  ]);

  result.riskLevel = assessRisk(result);
  result.score = calculateScore(result);
  result.summary = generateSummary(result);

  return result;
}

async function fetchGeoIp(ip, result) {
  try {
    const resp = await fetch(`http://ip-api.com/json/${ip}`, { timeout: 5000 });
    if (resp.ok) {
      const data = await resp.json();
      if (data.status === 'success') {
        result.geo = {
          country: data.country,
          countryCode: data.countryCode,
          region: data.regionName,
          city: data.city,
          zip: data.zip,
          lat: data.lat,
          lon: data.lon,
          timezone: data.timezone,
        };
        result.asn = {
          asn: data.as,
          org: data.org,
          isp: data.isp,
        };
        result.sources.push({ name: 'ip-api.com', success: true });
      }
    }
  } catch {
    result.sources.push({ name: 'ip-api.com', success: false });
  }
}

async function fetchAbuseIpdb(ip, result) {
  const key = config.apis.abuseIpdb.key;
  if (!key) return;

  try {
    const resp = await fetch(
      `https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}&maxAgeInDays=90`,
      {
        headers: {
          'Key': key,
          'Accept': 'application/json',
        },
        timeout: 5000,
      }
    );
    if (resp.ok) {
      const data = await resp.json();
      const d = data.data;
      result.abuseReports = {
        total: d.totalReports || 0,
        lastReportedAt: d.lastReportedAt,
        confidence: d.abuseConfidenceScore || 0,
        isPublic: d.isPublic,
        domain: d.domain,
        usageType: d.usageType,
        isp: d.isp,
      };
      result.sources.push({ name: 'AbuseIPDB', success: true });
    }
  } catch {
    result.sources.push({ name: 'AbuseIPDB', success: false });
  }
}

async function checkCommonLists(ip, isDomain, result) {
  const checks = [
    { name: 'Tor Exit Node', url: `https://check.torproject.org/torbulkexitlist`, check: (body) => body.includes(ip) },
  ];

  for (const check of checks) {
    try {
      const resp = await fetch(check.url, { timeout: 5000 });
      if (resp.ok) {
        const body = await resp.text();
        if (check.check(body)) {
          result.blacklists.push(check.name);
        }
      }
    } catch {}
  }
}

function assessRisk(result) {
  let risk = 0;

  if (result.abuseReports) {
    risk += Math.min(result.abuseReports.confidence / 20, 5);
    if (result.abuseReports.total > 5) risk += 2;
    if (result.abuseReports.total > 20) risk += 2;
  }

  risk += result.blacklists.length * 3;

  if (risk <= 1) return 'safe';
  if (risk <= 3) return 'low';
  if (risk <= 6) return 'medium';
  return 'high';
}

function calculateScore(result) {
  const riskMap = { safe: 100, low: 80, medium: 50, high: 20, unknown: 50 };
  let score = riskMap[result.riskLevel] || 50;

  if (result.blacklists.length > 0) score -= result.blacklists.length * 10;
  if (result.abuseReports?.confidence > 50) score -= 20;

  return Math.max(0, Math.min(100, score));
}

function generateSummary(result) {
  const issues = [];
  if (result.riskLevel === 'high') issues.push('High risk — IP appears in abuse reports');
  if (result.riskLevel === 'medium') issues.push('Medium risk — some suspicious activity');
  if (result.blacklists.length > 0) issues.push(`Found on ${result.blacklists.length} blacklist(s)`);
  if (result.abuseReports?.confidence > 50) issues.push(`Abuse confidence: ${result.abuseReports.confidence}%`);
  if (result.asn?.org) issues.push(`ASN: ${result.asn.org}`);
  if (result.geo?.country) issues.push(`Location: ${result.geo.city || ''}, ${result.geo.country}`);

  return {
    level: result.riskLevel,
    text: result.riskLevel === 'safe' ? 'Clean reputation' : `${result.riskLevel.toUpperCase()} risk`,
    issues,
  };
}
