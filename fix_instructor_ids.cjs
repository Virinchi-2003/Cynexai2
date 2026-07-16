const { createClient } = require('@libsql/client');
require('dotenv').config();

const client = createClient({
  url: process.env.VITE_TURSO_DATABASE_URL,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN
});

async function fix() {
  // Real Venkatesh is venkateswarreddykatreddy29@gmail.com, id = bb621c0a-5da8-44b8-a486-d0229d13dc90
  // Real Sam is leonardsam001@gmail.com, id = sam-1778944968214-968214
  // Default teacher@cynexai.com id = usr_teacher

  // 1. Update modules that have usr_venkatesh -> real Venkatesh ID
  const r1 = await client.execute({
    sql: "UPDATE modules SET instructor_id = ? WHERE instructor_id = 'usr_venkatesh'",
    args: ['bb621c0a-5da8-44b8-a486-d0229d13dc90']
  });
  console.log(`Updated usr_venkatesh -> real Venkatesh: ${r1.rowsAffected} modules`);

  // 2. Update modules that have usr_prudhvi -> usr_teacher (fallback for now since Prudhvi isn't in DB)
  const r2 = await client.execute({
    sql: "UPDATE modules SET instructor_id = ? WHERE instructor_id = 'usr_prudhvi'",
    args: ['usr_teacher']
  });
  console.log(`Updated usr_prudhvi -> usr_teacher: ${r2.rowsAffected} modules`);

  // 3. Also update mod_class_* modules (used by student portal) to have usr_teacher as instructor
  const r3 = await client.execute({
    sql: "UPDATE modules SET instructor_id = 'usr_teacher' WHERE id LIKE 'mod_class_%' AND (instructor_id IS NULL OR instructor_id = '')"
  });
  console.log(`Updated mod_class_* instructor: ${r3.rowsAffected} modules`);

  // Verify
  console.log('\n=== MODULES WITH instructor_id (after fix) ===');
  const mods = await client.execute("SELECT id, title, instructor_id FROM modules WHERE instructor_id IS NOT NULL");
  mods.rows.forEach(r => console.log(`  ${r.id} | instructor=${r.instructor_id}`));

  // Test the query that teacher portal runs
  console.log('\n=== TEST: getActiveLiveClass for real Venkatesh ===');
  const venkateshId = 'bb621c0a-5da8-44b8-a486-d0229d13dc90';
  const res = await client.execute({
    sql: `SELECT c.id, c.title, c.status FROM classes c
          JOIN modules m ON c.module_id = m.id
          WHERE m.instructor_id = ? AND c.status != 'completed'
          ORDER BY c.order_index ASC LIMIT 1`,
    args: [venkateshId]
  });
  console.log(res.rows.length > 0 ? `  ✓ Found: ${res.rows[0].id}` : '  ✗ No class found');

  console.log('\n=== TEST: getActiveLiveClass for usr_teacher ===');
  const res2 = await client.execute({
    sql: `SELECT c.id, c.title, c.status FROM classes c
          JOIN modules m ON c.module_id = m.id
          WHERE m.instructor_id = ? AND c.status != 'completed'
          ORDER BY c.order_index ASC LIMIT 1`,
    args: ['usr_teacher']
  });
  console.log(res2.rows.length > 0 ? `  ✓ Found: ${res2.rows[0].id}` : '  ✗ No class found');
}

fix().catch(console.error);
