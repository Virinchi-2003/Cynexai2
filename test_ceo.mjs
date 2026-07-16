import { createClient } from '@libsql/client';

const url = "libsql://cynex-ai-cynexai.aws-ap-south-1.turso.io";
const authToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODA5MTk5MzYsImlkIjoiMDE5ZWE3MTktNzkwMS03Y2Y3LTgxNDItYmI3ZTdhY2RiZGUyIiwicmlkIjoiZDhlZjQ2NjQtNGZjNy00MTc0LWJlMTItOWIwNDczN2RjNGIyIn0.nzy6qJrwAHywKfZwRZ28eMJFbD20IFojBH-tYxX1xS8Ouaokn7SZcKT2FiG_M5umsbw9HN24TXc0vsKgOJlhDw";

const client = createClient({ url, authToken });

async function test() {
  try {
      console.log("referrals query...");
      const res = await client.execute("SELECT id, referred_by_student_id, amount_paid FROM sales WHERE referred_by_student_id IS NOT NULL AND status != 'Pending'");
      console.log(res.rows);
  } catch(e) {
      console.error("FAIL 1:", e);
  }
  
  try {
      console.log("payroll query...");
      const res2 = await client.execute("SELECT SUM(salary) as total_salary FROM users WHERE salary IS NOT NULL");
      console.log(res2.rows);
  } catch(e) {
      console.error("FAIL 2:", e);
  }
}
test();
