const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.ffvobpviypvlohlfgdgg:leetsync-dev@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true' });
client.connect().then(() => client.query('SELECT date FROM "DailyProblem" ORDER BY date ASC'))
.then(res => { console.log('DailyProblems:', res.rows); return client.end(); });
