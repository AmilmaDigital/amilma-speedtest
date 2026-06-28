import net from 'node:net';

export async function whoisLookup(target) {
  const domain = target.replace(/^https?:\/\//, '').split('/')[0].split(':')[0];
  const result = {
    target: domain,
    timestamp: new Date().toISOString(),
    registrar: null,
    creationDate: null,
    expiryDate: null,
    updatedDate: null,
    nameServers: [],
    status: [],
    abuseContact: null,
    raw: null,
  };

  await fetchWhois(domain, result);

  result.summary = generateSummary(result);
  return result;
}

async function fetchWhois(domain, result) {
  const tld = domain.split('.').pop();
  const whoisServers = {
    com: 'whois.verisign-grs.com',
    net: 'whois.verisign-grs.com',
    org: 'whois.pir.org',
    io: 'whois.nic.io',
    co: 'whois.nic.co',
    me: 'whois.nic.me',
    ba: 'whois.ripe.net',
    hr: 'whois.dns.hr',
    rs: 'whois.rnids.rs',
  };

  const server = whoisServers[tld] || 'whois.iana.org';

  try {
    const response = await queryWhoisServer(server, domain);
    if (response) {
      result.raw = response.substring(0, 2000);
      parseWhoisResponse(response, result);
    }
  } catch {}
}

function queryWhoisServer(server, domain) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let response = '';

    socket.setTimeout(10000);

    socket.connect(43, server, () => {
      socket.write(`${domain}\r\n`);
    });

    socket.on('data', (data) => {
      response += data.toString();
    });

    socket.on('end', () => {
      resolve(response);
    });

    socket.on('error', (err) => {
      reject(err);
    });

    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error('timeout'));
    });
  });
}

function parseWhoisResponse(raw, result) {
  const lines = raw.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    if (/^\s*Registrar:\s*(.+)/i.test(trimmed)) {
      result.registrar = trimmed.replace(/^\s*Registrar:\s*/i, '').trim();
    }

    if (/^\s*Creation Date:\s*(.+)/i.test(trimmed) && !result.creationDate) {
      result.creationDate = trimmed.replace(/^\s*Creation Date:\s*/i, '').trim();
    }

    if (/^\s*Registry Expiry Date:\s*(.+)/i.test(trimmed) && !result.expiryDate) {
      result.expiryDate = trimmed.replace(/^\s*Registry Expiry Date:\s*/i, '').trim();
    }

    if (/^\s*Updated Date:\s*(.+)/i.test(trimmed) && !result.updatedDate) {
      result.updatedDate = trimmed.replace(/^\s*Updated Date:\s*/i, '').trim();
    }

    if (/^\s*Name Server:\s*(.+)/i.test(trimmed)) {
      const ns = trimmed.replace(/^\s*Name Server:\s*/i, '').trim().toLowerCase();
      if (ns && !result.nameServers.includes(ns)) {
        result.nameServers.push(ns);
      }
    }

    if (/^\s*Domain Status:\s*(.+)/i.test(trimmed)) {
      const status = trimmed.replace(/^\s*Domain Status:\s*/i, '').trim();
      if (status && !result.status.includes(status)) {
        result.status.push(status);
      }
    }
  }
}

function generateSummary(result) {
  const issues = [];

  if (result.registrar) issues.push(`Registrar: ${result.registrar}`);
  if (result.creationDate) issues.push(`Created: ${new Date(result.creationDate).toLocaleDateString()}`);
  if (result.expiryDate) {
    const days = Math.floor((new Date(result.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    issues.push(`Expires: ${new Date(result.expiryDate).toLocaleDateString()} (${days} days)`);
    if (days < 30) issues.push('⚠ Domain expiring soon');
  }
  if (result.nameServers.length > 0) issues.push(`NS: ${result.nameServers.slice(0, 3).join(', ')}`);

  return {
    level: result.creationDate ? 'good' : 'warn',
    text: result.registrar || 'WHOIS data unavailable',
    issues,
  };
}
