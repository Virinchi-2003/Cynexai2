const Database = require('better-sqlite3');
const fs = require('fs');

const db = new Database(':memory:');
const schema = fs.readFileSync('schema.sql', 'utf8');
db.exec(schema);

try {
  db.prepare(`INSERT INTO sales (id, lead_id, admission_id, course_id, total_fee, amount_paid, status, sales_exec_id, referred_by_student_id, payment_mode) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    '1', '1', '1', '1', 100, 100, 'Sale Completed', '1', '1', 'UPI'
  );
  console.log('SUCCESS');
} catch (e) {
  console.log('ERROR:', e.message);
}
