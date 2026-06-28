import net from 'node:net';

const COMMON_PORTS = [
  { port: 21,  service: 'FTP' },
  { port: 22,  service: 'SSH' },
  { port: 23,  service: 'Telnet' },
  { port: 25,  service: 'SMTP' },
  { port: 53,  service: 'DNS' },
  { port: 80,  service: 'HTTP' },
  { port: 110, service: 'POP3' },
  { port: 143, service: 'IMAP' },
  { port: 443, service: 'HTTPS' },
  { port: 465, service: 'SMTPS' },
  { port: 587, service: 'SMTP Submission' },
  { port: 993, service: 'IMAPS' },
  { port: 995, service: 'POP3S' },
  { port: 1433, service: 'MSSQL' },
  { port: 1521, service: 'Oracle DB' },
  { port: 2049, service: 'NFS' },
  { port: 2222, service: 'Alternate SSH' },
  { port: 2375, service: 'Docker API (unencrypted)' },
  { port: 2376, service: 'Docker API (TLS)' },
  { port: 3306, service: 'MySQL' },
  { port: 3389, service: 'RDP' },
  { port: 5432, service: 'PostgreSQL' },
  { port: 5900, service: 'VNC' },
  { port: 5901, service: 'VNC-1' },
  { port: 6379, service: 'Redis' },
  { port: 6443, service: 'Kubernetes API' },
  { port: 8080, service: 'HTTP-Alt' },
  { port: 8443, service: 'HTTPS-Alt' },
  { port: 9000, service: 'PHP-FPM / SonarQube' },
  { port: 9090, service: 'Prometheus / Cockpit' },
  { port: 27017, service: 'MongoDB' },
];

export async function scanPorts(target) {
  const host = target.replace(/^https?:\/\//, '').split('/')[0].split(':')[0];
  const result = {
    target: host,
    timestamp: new Date().toISOString(),
    openPorts: [],
    closedPorts: [],
    errors: [],
  };

  const scanPromises = COMMON_PORTS.map(p => checkPort(host, p.port, p.service, result));
  
  // Scan in batches to avoid overwhelming the target
  const batchSize = 8;
  for (let i = 0; i < scanPromises.length; i += batchSize) {
    await Promise.all(scanPromises.slice(i, i + batchSize));
  }

  result.score = calculateScore(result);
  result.summary = generateSummary(result);

  return result;
}

function checkPort(host, port, service, result) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(3000);

    socket.on('connect', () => {
      result.openPorts.push({ port, service, risk: assessPortRisk(port, service) });
      socket.destroy();
      resolve();
    });

    socket.on('timeout', () => {
      result.closedPorts.push({ port, service });
      socket.destroy();
      resolve();
    });

    socket.on('error', () => {
      result.closedPorts.push({ port, service });
      resolve();
    });

    socket.connect(port, host);
  });
}

function assessPortRisk(port, service) {
  const risky = [21, 23, 25, 110, 143, 465, 587, 993, 995, 1433, 1521, 2049, 2375, 3306, 3389, 5432, 5900, 5901, 6379, 27017];
  const moderate = [22, 53, 8080, 9090, 2222];

  if (risky.includes(port)) return 'high';
  if (moderate.includes(port)) return 'medium';
  return 'low';
}

function calculateScore(result) {
  if (result.openPorts.length === 0) return 100;

  let score = 100;
  for (const p of result.openPorts) {
    if (p.risk === 'high') score -= 20;
    else if (p.risk === 'medium') score -= 8;
    else score -= 3;
  }

  return Math.max(0, Math.min(100, score));
}

function generateSummary(result) {
  const issues = [];
  const open = result.openPorts;

  if (open.length === 0) {
    issues.push('No common ports open');
  } else {
    issues.push(`${open.length} open port(s) detected`);
    const high = open.filter(p => p.risk === 'high');
    if (high.length > 0) {
      issues.push(`High risk: ${high.map(p => `${p.service}(${p.port})`).join(', ')}`);
    }
  }

  return {
    level: open.length === 0 ? 'good' : open.filter(p => p.risk === 'high').length > 0 ? 'bad' : 'warn',
    text: open.length === 0 ? 'No open ports (good)' : `${open.length} open port(s) found`,
    issues,
  };
}
