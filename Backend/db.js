const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || undefined,
    user: process.env.PGUSER || "postgres",
    host: process.env.PGHOST || "localhost",
    database: process.env.PGDATABASE || "WiFiSentinel",
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT || 5432,
    ssl: process.env.DATABASE_URL
        ? { rejectUnauthorized: false }
        : false
});

module.exports = pool;