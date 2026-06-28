import Fastify from 'fastify';
import cors from '@fastify/cors';
import staticFiles from '@fastify/static';
import rateLimit from '@fastify/rate-limit';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import config from './config.js';
import { loadDatabase, closeDatabase, execute, queryAll, queryOne } from './db/database.js';
import scanRoutes from './routes/scan.js';
import speedtestRoutes from './routes/speedtest.js';
import reportRoutes from './routes/reports.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function initSchema(db) {
  const schema = readFileSync(join(__dirname, 'db', 'schema.sql'), 'utf8');
  db.run(schema);
}

async function start() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport: {
        target: 'pino-pretty',
        options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
      },
    },
  });

  await app.register(cors, {
    origin: [
      'http://localhost:8080',
      'http://localhost:3000',
      'https://amilma.net',
      'https://amilma.ba',
      'http://127.0.0.1:8080',
      'http://127.0.0.1:3000',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.register(rateLimit, config.rateLimit);

  const rawDb = await loadDatabase();
  initSchema(rawDb);

  const db = {
    prepare: (sql) => {
      const stmt = rawDb.prepare(sql);
      return {
        run: (...params) => {
          stmt.bind(params);
          const result = stmt.step();
          stmt.free();
          const changes = rawDb.getRowsModified();
          return { changes, lastInsertRowid: changes > 0 ? queryOne("SELECT last_insert_rowid() as id")?.id : null };
        },
        get: (...params) => {
          stmt.bind(params);
          const row = stmt.step() ? stmt.getAsObject() : null;
          stmt.free();
          return row;
        },
        all: (...params) => {
          stmt.bind(params);
          const rows = [];
          while (stmt.step()) rows.push(stmt.getAsObject());
          stmt.free();
          return rows;
        },
      };
    },
    exec: (sql) => rawDb.exec(sql),
    run: (sql, params) => execute(sql, params),
    close: () => closeDatabase(),
  };

  app.addHook('onClose', (_, done) => { db.close(); done(); });

  app.get('/api/status', async () => ({
    status: 'online',
    version: '1.0.0',
    name: 'Amilma Network Security API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }));

  app.get('/api/health', async () => {
    const stats = queryOne('SELECT COUNT(*) as scans FROM scan_results');
    return { healthy: true, dbStats: stats };
  });

  app.setNotFoundHandler((req, reply) => {
    reply.code(404).send({ error: 'Route not found', path: req.url });
  });

  app.setErrorHandler((err, req, reply) => {
    app.log.error(err);
    reply.code(err.statusCode || 500).send({
      error: err.message || 'Internal Server Error',
      statusCode: err.statusCode || 500,
    });
  });

  await scanRoutes(app, db);
  await speedtestRoutes(app, db);
  await reportRoutes(app, db);

  await app.register(staticFiles, {
    root: join(__dirname, '..'),
    wildcard: true,
    index: ['index.html'],
  });

  try {
    await app.listen({ port: config.port, host: config.host });
    console.log(`╔══════════════════════════════════════════════╗`);
    console.log(`║  Amilma Network Security API                ║`);
    console.log(`║  Server: http://${config.host}:${config.port}              ║`);
    console.log(`╚══════════════════════════════════════════════╝`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
