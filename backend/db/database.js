import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import config from '../config.js';

let dbInstance = null;
let dbPath = config.dbPath;

function ensureDir() {
  const dir = dirname(dbPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

async function loadDatabase() {
  ensureDir();
  const SQL = await initSqlJs();

  if (existsSync(dbPath)) {
    const buffer = readFileSync(dbPath);
    dbInstance = new SQL.Database(buffer);
  } else {
    dbInstance = new SQL.Database();
  }

  dbInstance.run('PRAGMA journal_mode=WAL');
  dbInstance.run('PRAGMA foreign_keys=ON');

  return dbInstance;
}

export function getDb() {
  if (!dbInstance) throw new Error('Database not initialized');
  return dbInstance;
}

export function saveDatabase() {
  if (!dbInstance) return;
  ensureDir();
  const data = dbInstance.export();
  const buffer = Buffer.from(data);
  writeFileSync(dbPath, buffer);
}

export function closeDatabase() {
  if (dbInstance) {
    saveDatabase();
    dbInstance.close();
    dbInstance = null;
  }
}

/**
 * Run a query that returns rows (SELECT).
 * Returns array of objects.
 */
export function queryAll(sql, params = []) {
  const db = getDb();
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

/**
 * Run a single-row query, returns first object or null.
 */
export function queryOne(sql, params = []) {
  const rows = queryAll(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Run an INSERT/UPDATE/DELETE, returns { changes, lastInsertRowid }.
 */
export function execute(sql, params = []) {
  const db = getDb();
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const result = stmt.step();
  stmt.free();
  const changes = db.getRowsModified();
  return { changes, lastInsertRowid: result ? db.exec("SELECT last_insert_rowid() as id")?.[0]?.values?.[0]?.[0] ?? null : null };
}

/**
 * Run raw SQL (for schema).
 */
export function runRaw(sql) {
  getDb().run(sql);
}

export { loadDatabase };
