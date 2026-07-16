require('dotenv').config();
import('./src/lib/api/users.js').then(async (m) => {
  try {
    await m.saveUser({
      name: 'Test Sales',
      email: 'testsales@example.com',
      password: 'password123',
      role: 'Sales/HR',
      salary: 20000
    });
    console.log("Success");
  } catch (e) {
    console.error("Failed:", e);
  }
}).catch(console.error);
