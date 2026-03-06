// prints non-secret user rows (id, email, role, createdat)
const { Client } = require('pg');

(async () => {
  const conn = process.env.DATABASE_URL;
  if (!conn) {
    console.error('DATABASE_URL not set');
    process.exit(2);
  }
  const client = new Client({ connectionString: conn, connectionTimeoutMillis: 10000 });
  try {
    await client.connect();
    const res = await client.query('SELECT id, email, role, createdat FROM public."User" ORDER BY createdat DESC LIMIT 200;');
    console.log(JSON.stringify(res.rows, null, 2));
    await client.end();
  } catch (err) {
    console.error('ERROR:', err.message || err);
    process.exit(1);
  }
})();
