import https from 'node:https';
import http from 'node:http';
import { URL } from 'node:url';

export async function scanUrl(target) {
  const url = target.startsWith('http') ? target : `https://${target}`;
  const parsed = new URL(url);
  const result = {
    target: url,
    domain: parsed.hostname,
    timestamp: new Date().toISOString(),
    redirectChain: [],
    headers: {},
    security: {
      hsts: false,
      xFrameOptions: null,
      xContentTypeOptions: null,
      csp: null,
      referrerPolicy: null,
      permissionsPolicy: null,
      server: null,
      poweredBy: null,
    },
    tls: null,
    statusCode: null,
    ip: null,
    finalUrl: url,
    errors: [],
  };

  await followRedirects(parsed, result, 5);
  result.score = calculateScore(result);
  result.summary = generateSummary(result);

  return result;
}

async function followRedirects(parsed, result, maxRedirects) {
  return new Promise((resolve) => {
    const opts = {
      hostname: parsed.hostname,
      port: parsed.protocol === 'https:' ? 443 : 80,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: {
        'User-Agent': 'AmilmaSecurityScanner/1.0',
        'Accept': 'text/html,application/json,*/*',
      },
      rejectUnauthorized: false,
      timeout: 10000,
    };

    const mod = parsed.protocol === 'https:' ? https : http;
    const req = mod.request(opts, (res) => {
      result.statusCode = res.statusCode;
      result.headers = flattenHeaders(res.headers);
      result.ip = res.socket?.remoteAddress || null;

      if (res.headers['location'] && maxRedirects > 0) {
        const redirectUrl = new URL(res.headers['location'], parsed.origin).href;
        result.redirectChain.push({
          from: parsed.href,
          to: redirectUrl,
          statusCode: res.statusCode,
        });
        const nextParsed = new URL(redirectUrl);
        followRedirects(nextParsed, result, maxRedirects - 1).then(resolve);
        return;
      }

      let body = '';
      res.on('data', (chunk) => { body += chunk.toString(); });
      res.on('end', () => {
        result.finalUrl = parsed.href;
        analyzeSecurityHeaders(res.headers, result);
        analyzeTls(res.socket, result);
        resolve();
      });
    });

    req.on('error', (err) => {
      result.errors.push(err.message);
      resolve();
    });

    req.on('timeout', () => {
      req.destroy();
      result.errors.push('Request timeout');
      resolve();
    });

    req.end();
  });
}

function flattenHeaders(headers) {
  const flat = {};
  for (const [key, value] of Object.entries(headers)) {
    flat[key] = Array.isArray(value) ? value.join(', ') : String(value);
  }
  return flat;
}

function analyzeSecurityHeaders(headers, result) {
  const sec = result.security;
  if (headers['strict-transport-security']) {
    sec.hsts = true;
    sec.hstsValue = headers['strict-transport-security'];
  }
  if (headers['x-frame-options']) {
    sec.xFrameOptions = headers['x-frame-options'];
  }
  if (headers['x-content-type-options']) {
    sec.xContentTypeOptions = headers['x-content-type-options'];
  }
  if (headers['content-security-policy']) {
    sec.csp = headers['content-security-policy'];
  }
  if (headers['referrer-policy']) {
    sec.referrerPolicy = headers['referrer-policy'];
  }
  if (headers['permissions-policy'] || headers['feature-policy']) {
    sec.permissionsPolicy = headers['permissions-policy'] || headers['feature-policy'];
  }
  if (headers['server']) {
    sec.server = headers['server'];
  }
  if (headers['x-powered-by']) {
    sec.poweredBy = headers['x-powered-by'];
  }
}

function analyzeTls(socket, result) {
  if (!socket) return;
  const tls = socket.getPeerCertificate ? {} : null;
  if (!tls) return;
  try {
    const cert = socket.getPeerCertificate();
    if (cert && Object.keys(cert).length > 0) {
      tls.subject = cert.subject;
      tls.issuer = cert.issuer;
      tls.validFrom = cert.valid_from;
      tls.validTo = cert.valid_to;
      tls.fingerprint = cert.fingerprint256 || cert.fingerprint;
      tls.subjectaltname = cert.subjectaltname;
      tls.serialNumber = cert.serialNumber;
      tls.protocol = socket.getProtocol ? socket.getProtocol() : null;
      tls.cipher = socket.getCipher ? socket.getCipher() : null;
      const now = new Date();
      const expiry = new Date(cert.valid_to);
      tls.daysRemaining = Math.floor((expiry - now) / (1000 * 60 * 60 * 24));
      tls.expired = tls.daysRemaining < 0;
      
      result.tls = tls;
    }
  } catch {}
}

function calculateScore(result) {
  let score = 100;
  const sec = result.security;

  if (result.errors.length > 0) score -= 15;
  if (!sec.hsts) score -= 10;
  if (!sec.xFrameOptions) score -= 8;
  if (!sec.xContentTypeOptions) score -= 5;
  if (!sec.csp) score -= 10;
  if (!sec.referrerPolicy) score -= 3;
  if (!sec.permissionsPolicy) score -= 3;
  if (sec.server && sec.server.toLowerCase().includes('apache/1')) score -= 5;
  if (sec.poweredBy) score -= 5;
  if (sec.server && (
    sec.server.toLowerCase().includes('iis/6') ||
    sec.server.toLowerCase().includes('iis/7')
  )) score -= 8;
  if (result.tls) {
    if (result.tls.expired) score -= 25;
    else if (result.tls.daysRemaining < 30) score -= 10;
    if (result.tls.protocol && !result.tls.protocol.includes('TLSv1.2') && !result.tls.protocol.includes('TLSv1.3')) score -= 15;
  }
  if (result.statusCode >= 400) score -= 10;
  if (result.redirectChain.length > 3) score -= 5;

  return Math.max(0, Math.min(100, score));
}

function generateSummary(result) {
  const issues = [];
  const sec = result.security;

  if (!sec.hsts) issues.push('Missing HSTS header');
  if (!sec.xFrameOptions) issues.push('Missing X-Frame-Options (clickjacking risk)');
  if (!sec.csp) issues.push('Missing Content-Security-Policy');
  if (!sec.xContentTypeOptions) issues.push('Missing X-Content-Type-Options');
  if (result.tls?.expired) issues.push('TLS certificate expired');
  else if (result.tls?.daysRemaining < 30) issues.push('TLS certificate expiring soon');
  if (sec.server) issues.push(`Server leaked: ${sec.server}`);
  if (sec.poweredBy) issues.push(`X-Powered-By leaked: ${sec.poweredBy}`);

  if (issues.length === 0) {
    return { level: 'good', text: 'Good security posture — all major headers present', issues };
  }
  return {
    level: issues.length > 3 ? 'bad' : issues.length > 1 ? 'warn' : 'good',
    text: `Found ${issues.length} security issue(s)`,
    issues,
  };
}
