import { createClient } from '@libsql/client';

const url = "libsql://cynex-ai-cynexai.aws-ap-south-1.turso.io";
const authToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODA5MTk5MzYsImlkIjoiMDE5ZWE3MTktNzkwMS03Y2Y3LTgxNDItYmI3ZTdhY2RiZGUyIiwicmlkIjoiZDhlZjQ2NjQtNGZjNy00MTc0LWJlMTItOWIwNDczN2RjNGIyIn0.nzy6qJrwAHywKfZwRZ28eMJFbD20IFojBH-tYxX1xS8Ouaokn7SZcKT2FiG_M5umsbw9HN24TXc0vsKgOJlhDw";

const client = createClient({ url, authToken });

async function check() {
  try {
    const res = await client.execute("PRAGMA table_info(classes)");
    console.log("classes:", res.rows);
    const res2 = await client.execute("PRAGMA table_info(sales)");
    console.log("sales:", res2.rows);
  } catch(e) {
    console.error(e);
  }
}
check();
