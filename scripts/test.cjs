const { createClient } = require('@libsql/client');
require('dotenv').config();
const client = createClient({ url: process.env.VITE_TURSO_DATABASE_URL, authToken: process.env.VITE_TURSO_AUTH_TOKEN });
client.execute("SELECT email, name FROM users WHERE role = 'Student'").then(r => console.log(r.rows));
