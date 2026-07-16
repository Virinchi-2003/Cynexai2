import { createClient } from '@libsql/client';

async function run() {
    const db = createClient({ url: 'file:local.db' });
    const courses = await db.execute('SELECT id, title FROM courses');
    console.log("Courses:", courses.rows);
    const modules = await db.execute('SELECT id, title FROM course_modules');
    console.log("Modules:", modules.rows.length);
    const classes = await db.execute('SELECT id, title FROM course_classes');
    console.log("Classes:", classes.rows.length);
}
run().catch(console.error);
