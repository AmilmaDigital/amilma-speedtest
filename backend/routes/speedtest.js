export default async function speedtestRoutes(fastify, db) {
  fastify.post('/api/speedtest/save', async (req, reply) => {
    const { dl, ul, ping, jitter, lossRate, networkScore, grade, ipAddress, isp, location } = req.body;

    if (dl == null) return reply.code(400).send({ error: 'Missing speed test data' });

    const stmt = db.prepare(
      `INSERT INTO speedtest_history (dl, ul, ping, jitter, loss_rate, network_score, grade, ip_address, isp, location)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    const result = stmt.run(
      Number(dl) || 0,
      Number(ul) || 0,
      Number(ping) || 0,
      Number(jitter) || 0,
      Number(lossRate) || 0,
      Number(networkScore) || null,
      String(grade || ''),
      String(ipAddress || ''),
      String(isp || ''),
      String(location || '')
    );

    return { id: result.lastInsertRowid, success: true };
  });

  fastify.get('/api/speedtest/history', async (req, reply) => {
    const { limit = 20 } = req.query;
    const stmt = db.prepare('SELECT * FROM speedtest_history ORDER BY created_at DESC LIMIT ?');
    return stmt.all(Number(limit));
  });

  fastify.get('/api/speedtest/:id', async (req, reply) => {
    const stmt = db.prepare('SELECT * FROM speedtest_history WHERE id = ?');
    const row = stmt.get(Number(req.params.id));
    if (!row) return reply.code(404).send({ error: 'Speed test not found' });
    return row;
  });

  fastify.delete('/api/speedtest/history', async (req, reply) => {
    db.prepare('DELETE FROM speedtest_history').run();
    return { success: true };
  });
}
