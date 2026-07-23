require('dotenv').config({path: require('fs').existsSync('.env.prod') ? '.env.prod' : '.env'});
const { createClient } = require('@libsql/client');

const client = createClient({ 
  url: process.env.VITE_TURSO_DATABASE_URL, 
  authToken: process.env.VITE_TURSO_AUTH_TOKEN 
});

async function main() {
  try {
    console.log('Adding ai_study_guide column to classes table...');
    await client.execute("ALTER TABLE classes ADD COLUMN ai_study_guide TEXT;");
    console.log('Successfully added ai_study_guide column.');
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('Column ai_study_guide already exists.');
    } else {
      console.error('Error adding column:', error.message);
    }
  }
}

main();
