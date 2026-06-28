export default {
  port: parseInt(process.env.PORT || '3001'),
  host: process.env.HOST || '0.0.0.0',
  dbPath: process.env.DB_PATH || './db/amilma.db',
  rateLimit: {
    max: 30,
    timeWindow: '1 minute',
  },
  apis: {
    virusTotal: {
      key: process.env.VT_API_KEY || '',
      url: 'https://www.virustotal.com/api/v3',
    },
    abuseIpdb: {
      key: process.env.ABUSEIPDB_API_KEY || '',
      url: 'https://api.abuseipdb.com/api/v2',
    },
    urlScanIo: {
      key: process.env.URLSCAN_API_KEY || '',
      url: 'https://urlscan.io/api/v1',
    },
    securityTrails: {
      key: process.env.SECURITYTRAILS_API_KEY || '',
      url: 'https://api.securitytrails.com/v1',
    },
  },
  scanTimeout: 15000,
  maxScanSize: 32 * 1024 * 1024,
};
