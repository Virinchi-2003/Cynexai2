import { client } from '../turso';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

async function executeWithRetry(query: string, args: any[] = [], retries = MAX_RETRIES): Promise<any> {
  try {
    if (!client) throw new Error('Database client not configured');
    return await client.execute({ sql: query, args });
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return executeWithRetry(query, args, retries - 1);
    }
    throw error;
  }
}

// ─── Portal Settings (key-value feature flags) ────────────────────────────────

export async function getPortalSettings(): Promise<Record<string, string>> {
  try {
    const res = await executeWithRetry('SELECT key, value FROM portal_settings');
    const settings: Record<string, string> = {};
    for (const row of res.rows) {
      settings[row.key as string] = row.value as string;
    }
    return settings;
  } catch (e) {
    console.error('Failed to get portal settings', e);
    return {};
  }
}

export async function updatePortalSetting(key: string, value: string): Promise<void> {
  await executeWithRetry(
    `INSERT OR REPLACE INTO portal_settings (key, value, updated_at) VALUES (?, ?, ?)`,
    [key, value, new Date().toISOString()]
  );
}

// ─── Announcements (Admin) ────────────────────────────────────────────────────

export async function getAnnouncementsAdmin(): Promise<any[]> {
  try {
    const res = await executeWithRetry(
      'SELECT * FROM announcements ORDER BY created_at DESC'
    );
    return res.rows;
  } catch (e) {
    console.error('Failed to get announcements (admin)', e);
    return [];
  }
}

export async function createAnnouncement(title: string, body: string): Promise<void> {
  const id = `ann_${Date.now()}`;
  await executeWithRetry(
    `INSERT INTO announcements (id, title, body, is_active, created_at) VALUES (?, ?, ?, 1, ?)`,
    [id, title, body, new Date().toISOString()]
  );
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await executeWithRetry(
    'UPDATE announcements SET is_active = 0 WHERE id = ?',
    [id]
  );
}

// ─── Job Listings (Admin) ─────────────────────────────────────────────────────

export async function getJobListingsAdmin(): Promise<any[]> {
  try {
    const res = await executeWithRetry(
      'SELECT * FROM job_listings ORDER BY scraped_at DESC'
    );
    return res.rows;
  } catch (e) {
    console.error('Failed to get job listings (admin)', e);
    return [];
  }
}

export async function createJobListing(data: {
  title: string;
  company: string;
  location: string;
  qualifications: string;
  source_url: string;
  expire_date: string;
}): Promise<void> {
  const id = `job_${Date.now()}`;
  await executeWithRetry(
    `INSERT INTO job_listings (id, title, company, location, qualifications, source_url, expire_date, is_active, scraped_at) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
    [id, data.title, data.company, data.location, data.qualifications, data.source_url, data.expire_date, new Date().toISOString()]
  );
}

export async function deleteJobListing(id: string): Promise<void> {
  await executeWithRetry(
    'UPDATE job_listings SET is_active = 0 WHERE id = ?',
    [id]
  );
}

// ─── Course Shared Materials ──────────────────────────────────────────────────

export async function getCourseMaterials(): Promise<any[]> {
  try {
    const res = await executeWithRetry(
      'SELECT * FROM course_shared_materials ORDER BY created_at DESC'
    );
    return res.rows;
  } catch (e) {
    console.error('Failed to get course materials', e);
    return [];
  }
}

export async function createCourseMaterial(data: {
  title: string;
  description: string;
  file_url: string;
  material_type: string;
  course_id?: string;
}): Promise<void> {
  const id = `mat_${Date.now()}`;
  await executeWithRetry(
    `INSERT INTO course_shared_materials (id, title, description, file_url, material_type, course_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, data.title, data.description, data.file_url, data.material_type, data.course_id ?? null, new Date().toISOString()]
  );
}

export async function deleteCourseMaterial(id: string): Promise<void> {
  await executeWithRetry(
    'DELETE FROM course_shared_materials WHERE id = ?',
    [id]
  );
}
