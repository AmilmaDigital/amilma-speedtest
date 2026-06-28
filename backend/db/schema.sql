CREATE TABLE IF NOT EXISTS scan_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scan_type TEXT NOT NULL,
  target TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  result JSON,
  summary TEXT,
  score INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_scan_type ON scan_results(scan_type);
CREATE INDEX IF NOT EXISTS idx_target ON scan_results(target);
CREATE INDEX IF NOT EXISTS idx_created ON scan_results(created_at DESC);

CREATE TABLE IF NOT EXISTS speedtest_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dl REAL,
  ul REAL,
  ping REAL,
  jitter REAL,
  loss_rate REAL,
  network_score INTEGER,
  grade TEXT,
  ip_address TEXT,
  isp TEXT,
  location TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  report_type TEXT,
  content JSON,
  summary TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS api_keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key_value TEXT UNIQUE NOT NULL,
  name TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);
