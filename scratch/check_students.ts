import { createClient } from '@libsql/client';

async function run() {
  const client = createClient({
    url: 'libsql://cynex-ai-cynexai.aws-ap-south-1.turso.io',
    authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODA5MTk5MzYsImlkIjoiMDE5ZWE3MTktNzkwMS03Y2Y3LTgxNDItYmI3ZTdhY2RiZGUyIiwicmlkIjoiZDhlZjQ2NjQtNGZjNy00MTc0LWJlMTItOWIwNDczN2RjNGIyIn0.nzy6qJrwAHywKfZwRZ28eMJFbD20IFojBH-tYxX1xS8Ouaokn7SZcKT2FiG_M5umsbw9HN24TXc0vsKgOJlhDw'
  });

  const user = await client.execute("SELECT id FROM users WHERE email = 'Jyothikap0201@gmail.com'");
  console.log("User ID:", user.rows);

  const student = await client.execute("SELECT id, portal_login_email FROM students WHERE portal_login_email = 'Jyothikap0201@gmail.com'");
  console.log("Student ID:", student.rows);

  const courses = await client.execute("SELECT * FROM courses");
  console.log("Courses Table:", courses.rows);
}

run();
