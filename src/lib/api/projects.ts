import { client, isTursoConfigured, initTursoDB } from '../turso';
import { getCurrentUser } from '../auth';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  owner_id: string;
  status: string;
  created_at: string;
}

export const createProject = async (project: Omit<Project, 'id' | 'created_at'>): Promise<string | null> => {
  const id = 'proj_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  const created_at = new Date().toISOString();
  
  if (!isTursoConfigured || !client) return null;
  
  try {
    await initTursoDB();
    await client.execute({
      sql: `INSERT INTO projects (id, name, description, color, owner_id, status, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id, 
        project.name, 
        project.description || null, 
        project.color || null, 
        project.owner_id, 
        project.status || 'Active', 
        created_at
      ]
    });
    return id;
  } catch (e) {
    console.error("Failed to create project", e);
  }
  return null;
};

export const getProjects = async (): Promise<Project[]> => {
  if (!isTursoConfigured || !client) return [];
  
  try {
    const result = await client.execute("SELECT * FROM projects ORDER BY created_at DESC");
    return result.rows as unknown as Project[];
  } catch (e) {
    console.error("Failed to get projects", e);
  }
  return [];
};

export const updateProject = async (projectId: string, updates: Partial<Project>): Promise<boolean> => {
  if (!isTursoConfigured || !client) return false;
  
  try {
    const keys = Object.keys(updates).filter(k => k !== 'id' && k !== 'created_at');
    if (keys.length === 0) return true;
    
    const setClause = keys.map(k => `${k} = ?`).join(', ');
    const args = keys.map(k => (updates as any)[k]);
    args.push(projectId);
    
    await client.execute({
      sql: `UPDATE projects SET ${setClause} WHERE id = ?`,
      args
    });
    return true;
  } catch (e) {
    console.error("Failed to update project", e);
  }
  return false;
};

export const deleteProject = async (projectId: string): Promise<boolean> => {
  if (!isTursoConfigured || !client) return false;
  
  try {
    await client.execute({
      sql: "DELETE FROM projects WHERE id = ?",
      args: [projectId]
    });
    // Optional: could delete tasks or set project_id to null
    await client.execute({
      sql: "UPDATE tasks SET project_id = NULL WHERE project_id = ?",
      args: [projectId]
    });
    return true;
  } catch (e) {
    console.error("Failed to delete project", e);
  }
  return false;
};
