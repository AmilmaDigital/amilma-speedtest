# ⚡ Amilma Network — Cybersecurity Audit & Speed Test Platform

> Profesionalna web platforma za mjerenje brzine interneta + napredni cybersecurity audit i forenzika.

---

## 📋 Pregled

Originalna aplikacija je bila single-page speed test (HTML/CSS/JS sa Cloudflare mjerenjem, IP detekcijom, gauge animacijom, i18n i localStorage historijom).

Transformisana je u **potpunu cybersecurity audit platformu** sa backendom, bazom podataka, osam sigurnosnih scanner modula i tabovanim frontendom.

---

## 🧱 Arhitektura

```
amilma-speedtest/
├── index.html              # Glavna stranica - 4 taba (Speed Test | Security | DNS Tools | Reports)
├── style.css               # Originalni stilovi
├── app.js                  # Originalna speed test logika (~2255 linija, nepromijenjena)
├── frontend/
│   ├── css/security.css    # Stilovi za dark mode, tabove, security kartice, DNS tabelu, report listu
│   └── modules/
│       ├── navigation.js   # Navigacija sa tabovima, lazy loading modula, dark mode toggle, hash routing
│       ├── security.js     # Security Dashboard - 8 vrsta skeniranja + deep scan UI
│       ├── dns-tools.js    # DNS lookup - prikaz zapisa + sigurnosni posture (SPF, DKIM, DMARC, DNSSEC)
│       └── reports.js      # Historija skenova i speed testova, pregled detalja
├── backend/
│   ├── server.js           # Fastify server - CORS, rate limit, statički fajlovi, rute
│   ├── config.js           # Konfiguracija porta, API ključeva, rate limita
│   ├── package.json        # Node.js zavisnosti (fastify, sql.js, node-fetch, pino-pretty)
│   ├── Dockerfile          # Docker image
│   ├── db/
│   │   ├── schema.sql      # SQLite šema (scan_results, speedtest_history, reports, api_keys)
│   │   ├── database.js     # sql.js wrapper (load, query, execute, close)
│   │   └── init.js         # Inicijalizacija baze
│   ├── scanners/
│   │   ├── url-scanner.js      # HTTP(S) security headers, redirect chain, cookies, CSP
│   │   ├── ip-reputation.js    # AbuseIPDB / IP geolokacija / DNSBL provjera
│   │   ├── dns-analyzer.js     # A, AAAA, MX, NS, CNAME, TXT, SOA + SPF/DKIM/DMARC/DNSSEC
│   │   ├── ssl-audit.js        # TLS protocol versions, ciphers, certificate info
│   │   ├── port-scanner.js     # TCP connect scan na 22 najčešća porta
│   │   ├── whois-lookup.js     # RAW WHOIS preko TCP socket (port 43)
│   │   └── file-hash.js        # VirusTotal lookup (ako je VT_API_KEY podešen)
│   └── routes/
│       ├── scan.js         # 8 POST endpointa za skeniranje + GET /api/scan/history + GET /api/scan/:id
│       ├── speedtest.js    # POST /api/speedtest/save + GET /api/speedtest/history + GET /api/speedtest/:id
│       └── reports.js      # CRUD za reports
├── docker-compose.yml      # Docker Compose sa perzistentnim volumenom za bazu
└── .gitignore              # Ignoriše node_modules, .db fajlove, .env, *.log
```

---

## ✨ Nove funkcionalnosti

### 🔐 Security Audit (8 vrsta skeniranja)

| Scanner | Opis |
|---------|------|
| **Deep Scan** | Pokreće URL + DNS + SSL + Port skeniranje istovremeno, prikazuje objedinjeni score |
| **URL Scanner** | Provjerava HTTP security headers (HSTS, CSP, X-Frame-Options, itd.), redirect chain, cookies |
| **IP Reputation** | Geolokacija, ASN, AbuseIPDB provjera, DNSBL (Spamhaus, Sorbs, Barracuda) |
| **DNS Analyzer** | Dohvata A, AAAA, MX, NS, CNAME, TXT, SOA zapise; provjerava SPF, DKIM, DMARC, DNSSEC |
| **SSL Audit** | Testira TLSv1.3, TLSv1.2, TLSv1.1, TLSv1.0; prikazuje cipher i cert info |
| **Port Scanner** | TCP connect na 22 porta (HTTP, HTTPS, SSH, FTP, SMTP, DNS, MySQL, itd.) |
| **WHOIS Lookup** | RAW WHOIS preko TCP socket-a (port 43), bez eksternog API-ja |
| **File Hash Checker** | VirusTotal lookup (SHA256) — zahtijeva `VT_API_KEY` env varijablu |

Svaki scanner vraća: `score` (0-100), `summary` (level, text, issues), detaljne podatke.

### 🗂️ Tab Navigation

- 4 taba: **Speed Test** | **Security** | **DNS Tools** | **Reports**
- Lazy loading modula preko dynamic `import()` (ne učitava se sve dok ne klikneš tab)
- Hash routing (`#speedtest`, `#security`, `#dns`, `#reports`)
- Dark mode toggle sa `localStorage` perzistencijom

### 🌙 Dark Mode

- Manual toggle (mjesec/sunce dugme u navigaciji)
- Pamti izbor u `localStorage`
- Potpuni CSS prebojavanje postojećih elemenata (.gauge-shell, .phase-chip, .btn-start, itd.)

### 📋 Reports Tab

- Prikazuje historiju svih skenova i speed testova
- Klikom na item otvara detaljni prikaz (raw JSON)
- "Retry" dugme ako backend nije dostupan

---

## 🚀 Pokretanje

### Lokalno (Node.js)

```bash
cd backend
npm install
node server.js
```

Server je na `http://localhost:3001` — frontend i API su na istom portu.

### Preko Docker-a

```bash
docker compose up -d
```

API ključevi se prosljeđuju kroz `.env`:

```env
VT_API_KEY=your_key
ABUSEIPDB_API_KEY=your_key
```

---

## 🔧 API Endpointi

### Status / Health
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/status` | Status servera, verzija, uptime |
| GET | `/api/health` | Health check sa DB statistikom |

### Scan endpoints
| Metoda | Endpoint | Body |
|--------|----------|------|
| POST | `/api/scan/dns` | `{"target": "example.com"}` |
| POST | `/api/scan/url` | `{"target": "https://example.com"}` |
| POST | `/api/scan/ip` | `{"target": "1.1.1.1"}` |
| POST | `/api/scan/ssl` | `{"target": "example.com"}` |
| POST | `/api/scan/ports` | `{"target": "example.com"}` |
| POST | `/api/scan/whois` | `{"target": "example.com"}` |
| POST | `/api/scan/file-hash` | `{"hash": "sha256..."}` |
| POST | `/api/scan/deep` | `{"target": "example.com"}` |
| GET | `/api/scan/history?limit=10` | Historija skenova |
| GET | `/api/scan/:id` | Pojedinačni scan |

### Speed test endpoints
| Metoda | Endpoint | Opis |
|--------|----------|------|
| POST | `/api/speedtest/save` | Sačuvaj speed test rezultat |
| GET | `/api/speedtest/history?limit=20` | Historija speed testova |
| GET | `/api/speedtest/:id` | Pojedinačni speed test |
| DELETE | `/api/speedtest/history` | Obriši svu historiju |

### Reports endpoints
| Metoda | Endpoint | Opis |
|--------|----------|------|
| POST | `/api/reports` | Kreiraj report |
| GET | `/api/reports` | Lista reportova |
| GET | `/api/reports/:id` | Pojedinačni report |
| DELETE | `/api/reports/:id` | Obriši report |

---

## 🐛 Bugfixes (tokom razvoja)

| Problem | Uzrok | Rješenje |
|---------|-------|----------|
| DNS ruta vraćala `{}` | Fastify `response` schema `{ type: 'object' }` bez propertija | Uklonjen response schema iz `postSchema()` helpera |
| SSL scanner vraćao 500 | `TLSv1_3` umjesto `TLSv1.3` u `tls.connect()` `minVersion`/`maxVersion` | Zamijenjen underscore sa dot |
| Reports tab pokazivao "Could not load reports" | Fetch rejection nije handle-ovan | Dodan `.catch(() => [])` na Promise.all + Retry dugme |
| `viewReport` za speedtest fetches sve pa filtrira | Nije postojao `GET /api/speedtest/:id` endpoint | Dodan dedicated endpoint na backendu |
| `node_modules` u git commit-u | Nedostajao `.gitignore` | Dodan `.gitignore` i uklonjeni iz staginga |

---

## 🗺️ Ostatak (TODO)

- [ ] Integracija pravih API ključeva (VirusTotal, AbuseIPDB, urlscan.io)
- [ ] `API_BASE` konfiguracija za produkciju
- [ ] i18n za nove security/dns/reports tabove
- [ ] Stukturirani prikaz scan detalja umjesto raw JSON-a
