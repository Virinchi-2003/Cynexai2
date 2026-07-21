import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

const client = createClient({
  url: process.env.VITE_TURSO_DATABASE_URL!,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN!,
});

async function main() {
  // Check what classes exist with youtube_video_id set
  console.log('=== Classes with youtube_video_id ===');
  const withVideo = await client.execute("SELECT id, title, youtube_video_id, type FROM classes WHERE youtube_video_id IS NOT NULL AND youtube_video_id != '' LIMIT 20");
  console.log(withVideo.rows);

  // Check Introduction class specifically
  console.log('\n=== Classes titled Introduction ===');
  const intro = await client.execute("SELECT id, title, youtube_video_id, type FROM classes WHERE title LIKE '%Introduction%'");
  console.log(intro.rows);

  // Check the exact class from the URL
  console.log('\n=== Exact class from URL ===');
  const exact = await client.execute("SELECT * FROM classes WHERE id = 'cls_1784375721305'");
  console.log(exact.rows);
}

main().catch(console.error);
