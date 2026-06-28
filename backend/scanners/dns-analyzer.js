import dns from 'node:dns/promises';
import { URL } from 'node:url';

const DNS_TIMEOUT = 4000;

function withTimeout(promise, ms = DNS_TIMEOUT) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('DNS timeout')), ms)),
  ]);
}

export async function analyzeDns(target) {
  const domain = target.replace(/^https?:\/\//, '').split('/')[0].split(':')[0];
  const result = {
    target: domain,
    timestamp: new Date().toISOString(),
    records: {},
    security: {},
    performance: {},
  };

  await resolveRecords(domain, result);
  await checkSecurityRecords(domain, result);

  result.score = calculateScore(result);
  result.summary = generateSummary(result);

  return result;
}

async function resolveRecords(domain, result) {
  const recordTypes = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME', 'SOA'];

  for (const type of recordTypes) {
    try {
      const resolver = type === 'A' ? dns.resolve4 : 
        type === 'AAAA' ? dns.resolve6 :
        type === 'MX' ? dns.resolveMx :
        type === 'NS' ? dns.resolveNs :
        type === 'TXT' ? dns.resolveTxt :
        type === 'CNAME' ? dns.resolveCname :
        type === 'SOA' ? dns.resolveSoa : null;

      if (resolver) {
        const records = await withTimeout(resolver(domain), DNS_TIMEOUT);
        result.records[type] = Array.isArray(records) ? records : [records];
      }
    } catch (err) {
      if (err.code !== 'ENODATA' && err.code !== 'ENOTFOUND' && !err.message.includes('timeout')) {
        result.records[type] = { error: err.message };
      }
    }
  }
}

async function checkSecurityRecords(domain, result) {
  const sec = result.security;

  // Check DNSSEC
  try {
    await withTimeout(dns.resolveAny(domain), DNS_TIMEOUT);
    sec.dnssec = 'enabled';
  } catch {
    sec.dnssec = 'unknown';
  }

  // Check SPF and DMARC from TXT records
  if (result.records.TXT) {
    for (const txt of result.records.TXT) {
      const val = Array.isArray(txt) ? txt.join('') : txt;

      if (val.startsWith('v=spf1')) {
        sec.spf = val;
        sec.spfValid = true;
        if (val.includes('+all') || val.includes('?all')) {
          sec.spfWeak = true;
        }
      }

      if (val.startsWith('v=DMARC1')) {
        sec.dmarc = val;
        const policy = val.match(/p=(\w+)/);
        if (policy) {
          sec.dmarcPolicy = policy[1];
          sec.dmarcValid = true;
        }
      }

      if (val.startsWith('v=DKIM1') || val.includes('k=rsa')) {
        sec.dkim = val;
        sec.dkimValid = true;
      }
    }
  }

  // Check DMARC via specific _dmarc subdomain
  try {
    const dmarcRecords = await withTimeout(dns.resolveTxt(`_dmarc.${domain}`), DNS_TIMEOUT);
    if (dmarcRecords && dmarcRecords.length) {
      const val = dmarcRecords[0].join('');
      if (val.startsWith('v=DMARC1') && !sec.dmarc) {
        sec.dmarc = val;
        const policy = val.match(/p=(\w+)/);
        if (policy) {
          sec.dmarcPolicy = policy[1];
          sec.dmarcValid = true;
        }
      }
    }
  } catch {}

  // MX security
  if (result.records.MX && result.records.MX.length > 0) {
    sec.hasMx = true;
    sec.mxCount = result.records.MX.length;
    const hasDmarc = sec.dmarcValid;
    const hasSpf = sec.spfValid;
    
    if (!hasDmarc || !hasSpf) {
      sec.emailSecurity = 'incomplete';
    } else {
      sec.emailSecurity = 'good';
    }
  }
}

function calculateScore(result) {
  let score = 100;
  const sec = result.security;

  if (!sec.dnssec || sec.dnssec !== 'enabled') score -= 10;
  if (!sec.spfValid) score -= 15;
  if (!sec.dkimValid) score -= 10;
  if (!sec.dmarcValid) score -= 15;
  if (sec.spfWeak) score -= 10;
  if (sec.dmarcPolicy === 'none') score -= 5;
  if (!result.records.A && !result.records.AAAA) score -= 20;

  const ipCount = (result.records.A?.length || 0) + (result.records.AAAA?.length || 0);
  if (ipCount > 5) score -= 10;

  return Math.max(0, Math.min(100, score));
}

function generateSummary(result) {
  const issues = [];
  const sec = result.security;

  if (result.records.A) issues.push(`IPv4: ${result.records.A.slice(0, 3).join(', ')}${result.records.A.length > 3 ? '...' : ''}`);
  if (result.records.MX) issues.push(`MX: ${result.records.MX.length} record(s)`);
  if (!sec.spfValid) issues.push('Missing SPF record (email spoofing risk)');
  if (!sec.dkimValid) issues.push('Missing DKIM record');
  if (!sec.dmarcValid) issues.push('Missing DMARC policy');
  if (sec.spfWeak) issues.push('SPF policy too permissive (+all/?)');
  if (sec.dnssec === 'enabled') issues.push('DNSSEC enabled');

  if (issues.length === 0) issues.push('No DNS records found');

  return {
    level: !sec.spfValid || !sec.dmarcValid ? 'bad' : issues.length < 3 ? 'good' : 'warn',
    text: issues.slice(0, 3).join(' · '),
    issues,
  };
}
