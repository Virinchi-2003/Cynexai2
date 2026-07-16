require('dotenv').config();
import('@libsql/client').then(async m => {
  try {
    const client = m.createClient({
      url: process.env.VITE_TURSO_DATABASE_URL,
      authToken: process.env.VITE_TURSO_AUTH_TOKEN
    });
    
    const courses = await client.execute('SELECT * FROM courses');
    console.log('COURSES:', JSON.stringify(courses.rows, null, 2));
    
    const modules = await client.execute('SELECT * FROM course_modules');
    console.log('MODULES:', JSON.stringify(modules.rows, null, 2));
    
  } catch (err) {
    console.error(err);
  }
}).catch(console.error);
