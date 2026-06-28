import tls from 'node:tls';
import { URL } from 'node:url';

export async function auditSsl(target) {
  const hostname = target.replace(/^https?:\/\//, '').split('/')[0].split(':')[0];
  const result = {
    target: hostname,
    timestamp: new Date().toISOString(),
    certificates: [],
    protocols: [],
    ciphers: [],
    vulnerabilities: [],
  };

  await Promise.all([
    checkTls(hostname, result, 443, 'TLSv1.3'),
    checkTls(hostname, result, 443, 'TLSv1.2'),
    checkTls(hostname, result, 443, 'TLSv1.1'),
    checkTls(hostname, result, 443, 'TLSv1'),
  ]);

  analyzeVulnerabilities(result);
  result.score = calculateScore(result);
  result.summary = generateSummary(result);

  return result;
}

function checkTls(hostname, result, port = 443, minVersion = 'TLSv1.2') {
  return new Promise((resolve) => {
    const versions = {
      TLSv1_3: 'TLSv1.3',
      TLSv1_2: 'TLSv1.2',
      TLSv1_1: 'TLSv1.1',
      TLSv1: 'TLSv1.0',
    };

    const socket = tls.connect({
      host: hostname,
      port,
      minVersion,
      maxVersion: 'TLSv1.3',
      rejectUnauthorized: false,
      servername: hostname,
      timeout: 5000,
    }, () => {
      const cert = socket.getPeerCertificate();
      const cipher = socket.getCipher();
      const protocol = socket.getProtocol();

      if (cert && Object.keys(cert).length > 0) {
        const existing = result.certificates.find(c => c.fingerprint === cert.fingerprint256);
        if (!existing) {
          result.certificates.push({
            subject: cert.subject,
            issuer: cert.issuer,
            validFrom: cert.valid_from,
            validTo: cert.valid_to,
            fingerprint: cert.fingerprint256,
            serialNumber: cert.serialNumber,
            subjectaltname: cert.subjectaltname,
            bits: cert.bits,
            pubkey: cert.pubkey?.type,
          });
        }
      }

      if (cipher) {
        const existing = result.ciphers.find(c => c.name === cipher.name);
        if (!existing) {
          result.ciphers.push({
            name: cipher.name,
            version: cipher.version,
            bits: cipher.bits,
            protocol: protocol,
          });
        }
      }

      if (protocol) {
        const existing = result.protocols.find(p => p === protocol);
        if (!existing) {
          result.protocols.push(protocol);
        }
      }

      socket.end();
      resolve();
    });

    socket.on('error', () => resolve());
    socket.on('timeout', () => { socket.destroy(); resolve(); });

    setTimeout(() => { socket.destroy(); resolve(); }, 5000);
  });
}

function analyzeVulnerabilities(result) {
  const vulns = result.vulnerabilities;

  if (result.protocols.includes('TLSv1.0')) vulns.push('TLS 1.0 deprecated');
  if (result.protocols.includes('TLSv1.1')) vulns.push('TLS 1.1 deprecated');

  for (const c of result.ciphers) {
    const name = c.name.toLowerCase();
    if (name.includes('rc4') || name.includes('des') || name.includes('md5')) {
      vulns.push(`Weak cipher: ${c.name}`);
    }
    if (name.includes('export')) vulns.push(`Export-grade cipher: ${c.name}`);
    if (name.includes('null') || name.includes('anon')) vulns.push(`Anonymous cipher: ${c.name}`);
  }

  if (result.certificates.length > 0) {
    const cert = result.certificates[0];
    const now = new Date();
    const expiry = new Date(cert.validTo);
    const days = Math.floor((expiry - now) / (1000 * 60 * 60 * 24));
    if (days < 0) vulns.push('Certificate expired');
    else if (days < 30) vulns.push(`Certificate expiring soon (${days} days)`);
    if (cert.bits && cert.bits < 2048) vulns.push(`Weak key size: ${cert.bits} bits`);
  }
}

function calculateScore(result) {
  let score = 100;

  if (result.protocols.includes('TLSv1.0')) score -= 20;
  if (result.protocols.includes('TLSv1.1')) score -= 10;
  if (!result.protocols.includes('TLSv1.3')) score -= 15;

  for (const v of result.vulnerabilities) {
    if (v.includes('Weak') || v.includes('Export') || v.includes('Anonymous')) score -= 15;
    if (v.includes('expired')) score -= 30;
    if (v.includes('expiring')) score -= 10;
    if (v.includes('deprecated')) score -= 10;
    if (v.includes('Weak key')) score -= 15;
  }

  if (result.certificates.length === 0) score = 0;

  return Math.max(0, Math.min(100, score));
}

function generateSummary(result) {
  const issues = [...result.vulnerabilities];

  if (result.protocols.length > 0) {
    issues.unshift(`Protocols: ${result.protocols.join(', ')}`);
  }
  if (result.ciphers.length > 0) {
    issues.unshift(`Best cipher: ${result.ciphers[0]?.name || 'N/A'}`);
  }

  if (issues.length === 0) issues.push('Unable to complete SSL audit');

  return {
    level: result.vulnerabilities.length === 0 ? 'good' : result.vulnerabilities.length > 2 ? 'bad' : 'warn',
    text: result.vulnerabilities.length === 0 ? 'Good TLS configuration' : `${result.vulnerabilities.length} issue(s) found`,
    issues,
  };
}
