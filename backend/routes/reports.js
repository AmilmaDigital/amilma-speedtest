export default async function reportRoutes(fastify, db) {
  fastify.post('/api/reports', {
    schema: {
      description: 'Generate and save a security report',
      body: {
        type: 'object',
        required: ['title', 'reportType', 'content'],
        properties: {
          title: { type: 'string' },
          reportType: { type: 'string', enum: ['scan', 'speedtest', 'combined'] },
          content: { type: 'object' },
          summary: { type: 'string' },
        },
      },
    },
  }, async (req, reply) => {
    const { title, reportType, content, summary } = req.body;
    const stmt = db.prepare(
      `INSERT INTO reports (title, report_type, content, summary) VALUES (?, ?, ?, ?)`
    );
    const result = stmt.run(title, reportType, JSON.stringify(content), summary || '');
    return { id: result.lastInsertRowid, success: true };
  });

  fastify.get('/api/reports', async (req, reply) => {
    const { limit = 10 } = req.query;
    const stmt = db.prepare('SELECT id, title, report_type, summary, created_at FROM reports ORDER BY created_at DESC LIMIT ?');
    return stmt.all(Number(limit));
  });

  fastify.get('/api/reports/:id', async (req, reply) => {
    const stmt = db.prepare('SELECT * FROM reports WHERE id = ?');
    const row = stmt.get(Number(req.params.id));
    if (!row) return reply.code(404).send({ error: 'Report not found' });
    row.content = JSON.parse(row.content || '{}');
    return row;
  });

  fastify.delete('/api/reports/:id', async (req, reply) => {
    const stmt = db.prepare('DELETE FROM reports WHERE id = ?');
    const result = stmt.run(Number(req.params.id));
    return { deleted: result.changes > 0 };
  });
}
