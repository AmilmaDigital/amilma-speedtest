import { scanUrl } from '../scanners/url-scanner.js';
import { checkIpReputation } from '../scanners/ip-reputation.js';
import { analyzeDns } from '../scanners/dns-analyzer.js';
import { auditSsl } from '../scanners/ssl-audit.js';
import { scanPorts } from '../scanners/port-scanner.js';
import { whoisLookup } from '../scanners/whois-lookup.js';
import { checkFileHash } from '../scanners/file-hash.js';

function postSchema(description, bodyProps = {}) {
  return {
    schema: {
      description,
      body: {
        type: 'object',
        required: ['target'],
        properties: {
          target: { type: 'string', minLength: 1 },
          ...bodyProps,
        },
      },
    },
  };
}

export default async function scanRoutes(fastify, db) {
  fastify.post('/api/scan/url', postSchema('Scan a URL for security analysis'), async (req, reply) => {
    const { target } = req.body;
    if (!isValidUrl(target)) return reply.code(400).send({ error: 'Invalid URL' });
    const result = await scanUrl(target);
    saveScan(db, 'url', target, result);
    return result;
  });

  fastify.post('/api/scan/ip', postSchema('Check IP/domain reputation'), async (req, reply) => {
    const { target } = req.body;
    const result = await checkIpReputation(target);
    saveScan(db, 'ip', target, result);
    return result;
  });

  fastify.post('/api/scan/dns', postSchema('Analyze DNS records'), async (req, reply) => {
    const { target } = req.body;
    const result = await analyzeDns(target);
    saveScan(db, 'dns', target, result);
    return result;
  });

  fastify.post('/api/scan/ssl', postSchema('Audit SSL/TLS configuration'), async (req, reply) => {
    const { target } = req.body;
    const result = await auditSsl(target);
    saveScan(db, 'ssl', target, result);
    return result;
  });

  fastify.post('/api/scan/ports', postSchema('Scan common TCP ports'), async (req, reply) => {
    const { target } = req.body;
    const result = await scanPorts(target);
    saveScan(db, 'ports', target, result);
    return result;
  });

  fastify.post('/api/scan/whois', postSchema('WHOIS domain lookup'), async (req, reply) => {
    const { target } = req.body;
    const result = await whoisLookup(target);
    saveScan(db, 'whois', target, result);
    return result;
  });

  fastify.post('/api/scan/file-hash', {
    schema: {
      description: 'Check file hash against VirusTotal',
      body: {
        type: 'object',
        required: ['hash'],
        properties: {
          hash: { type: 'string', minLength: 32, maxLength: 64 },
        },
      },
    },
  }, async (req, reply) => {
    const { hash } = req.body;
    if (!/^[0-9a-fA-F]{32,64}$/.test(hash)) {
      return reply.code(400).send({ error: 'Invalid hash format' });
    }
    const result = await checkFileHash(hash);
    saveScan(db, 'file-hash', hash, result);
    return result;
  });

  fastify.post('/api/scan/deep', postSchema('Full deep scan (URL + DNS + SSL + Ports)'), async (req, reply) => {
    const { target } = req.body;
    if (!isValidUrl(target) && !isValidDomain(target)) {
      return reply.code(400).send({ error: 'Invalid target' });
    }

    const domain = target.replace(/^https?:\/\//, '').split('/')[0].split(':')[0];
    const startTime = Date.now();

    const [urlResult, dnsResult, sslResult, portsResult, ipResult, whoisResult] = await Promise.all([
      scanUrl(target).catch(e => ({ error: e.message })),
      analyzeDns(domain).catch(e => ({ error: e.message })),
      auditSsl(domain).catch(e => ({ error: e.message })),
      scanPorts(domain).catch(e => ({ error: e.message })),
      checkIpReputation(domain).catch(e => ({ error: e.message })),
      whoisLookup(domain).catch(e => ({ error: e.message })),
    ]);

    const elapsed = Date.now() - startTime;
    const scores = [urlResult.score, dnsResult.score, sslResult.score, portsResult.score, ipResult.score].filter(s => s != null);
    const overallScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

    const result = {
      target,
      domain,
      timestamp: new Date().toISOString(),
      elapsed,
      overallScore,
      modules: {
        url: urlResult,
        dns: dnsResult,
        ssl: sslResult,
        ports: portsResult,
        ip: ipResult,
        whois: whoisResult,
      },
      summary: generateDeepSummary(urlResult, dnsResult, sslResult, portsResult, ipResult),
    };

    saveScan(db, 'deep', target, result);
    return result;
  });

  fastify.get('/api/scan/history', async (req, reply) => {
    const { type, limit = 20 } = req.query;
    const stmt = type
      ? db.prepare('SELECT * FROM scan_results WHERE scan_type = ? ORDER BY created_at DESC LIMIT ?')
      : db.prepare('SELECT * FROM scan_results ORDER BY created_at DESC LIMIT ?');
    const rows = type ? stmt.all(type, Number(limit)) : stmt.all(Number(limit));
    return rows.map(r => ({ ...r, result: JSON.parse(r.result || '{}') }));
  });

  fastify.get('/api/scan/:id', async (req, reply) => {
    const stmt = db.prepare('SELECT * FROM scan_results WHERE id = ?');
    const row = stmt.get(Number(req.params.id));
    if (!row) return reply.code(404).send({ error: 'Scan not found' });
    row.result = JSON.parse(row.result || '{}');
    return row;
  });
}

function saveScan(db, type, target, result) {
  try {
    const stmt = db.prepare(
      'INSERT INTO scan_results (scan_type, target, status, result, summary, score) VALUES (?, ?, ?, ?, ?, ?)'
    );
    stmt.run(
      type,
      target.substring(0, 255),
      'completed',
      JSON.stringify(result),
      JSON.stringify(result.summary || {}),
      result.score ?? null
    );
  } catch (err) {
    console.error('Failed to save scan result:', err.message);
  }
}

function isValidUrl(str) {
  try {
    const url = new URL(str.startsWith('http') ? str : `https://${str}`);
    return url.hostname.includes('.');
  } catch {
    return false;
  }
}

function isValidDomain(str) {
  return /^([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(str);
}

function generateDeepSummary(url, dns, ssl, ports, ip) {
  const issues = [];
  const scores = [];

  if (url?.summary?.issues) { issues.push(...url.summary.issues); scores.push(url.score); }
  if (dns?.summary?.issues) { issues.push(...dns.summary.issues); scores.push(dns.score); }
  if (ssl?.summary?.issues) { issues.push(...ssl.summary.issues); scores.push(ssl.score); }
  if (ports?.summary?.issues) { issues.push(...ports.summary.issues); scores.push(ports.score); }
  if (ip?.summary?.issues) { issues.push(...ip.summary.issues); scores.push(ip.score); }

  const avg = scores.filter(s => s != null).length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.filter(s => s != null).length)
    : null;

  const highIssues = issues.filter(i => i.toLowerCase().includes('missing') || i.toLowerCase().includes('risk') || i.toLowerCase().includes('expired') || i.toLowerCase().includes('malicious'));

  return {
    totalIssues: issues.length,
    highPriorityIssues: highIssues.length,
    averageScore: avg,
    level: avg >= 80 ? 'good' : avg >= 50 ? 'warn' : 'bad',
    text: `Overall security score: ${avg ?? 'N/A'}/100 · ${highIssues.length} critical issue(s)`,
    issues: issues.slice(0, 10),
  };
}
