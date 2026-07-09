import { client, isTursoConfigured } from '../turso';

export const getUserByEmail = async (email: string) => {
  if (!isTursoConfigured || !client) {
    throw new Error("Turso database is not configured. Missing API keys.");
  }
  
  const result = await client.execute({
    sql: "SELECT id, name, email, role, password_encrypted, salary FROM users WHERE email = ?",
    args: [email]
  });
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return result.rows[0];
};
