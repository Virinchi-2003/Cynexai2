import dotenv from 'dotenv';
import { createClient } from '@libsql/client';

dotenv.config();

const client = createClient({
  url: process.env.VITE_TURSO_DATABASE_URL,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN,
});

async function main() {
  try {
    console.log('Adding meet_link...');
    await client.execute('ALTER TABLE course_classes ADD COLUMN meet_link TEXT;');
  } catch(e) { console.log('meet_link might exist'); }
  try {
    console.log('Adding ai_ppt_markdown...');
    await client.execute('ALTER TABLE course_classes ADD COLUMN ai_ppt_markdown TEXT;');
  } catch(e) {}
  try {
    console.log('Adding ai_script...');
    await client.execute('ALTER TABLE course_classes ADD COLUMN ai_script TEXT;');
  } catch(e) {}
  try {
    console.log('Adding ai_keypoints...');
    await client.execute('ALTER TABLE course_classes ADD COLUMN ai_keypoints TEXT;');
  } catch(e) {}
  try {
    console.log('Adding ai_summary...');
    await client.execute('ALTER TABLE course_classes ADD COLUMN ai_summary TEXT;');
  } catch(e) {}
  try {
    console.log('Adding status...');
    await client.execute('ALTER TABLE course_classes ADD COLUMN status TEXT DEFAULT "draft";');
  } catch(e) {}

  console.log('Migration complete.');
}

main();
