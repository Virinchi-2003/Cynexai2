import { client } from '../turso';

export interface Session {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  module: string;
  teacher: string;
  room: string;
}

export interface ClassRow {
  id: string;
  title: string;
  description: string;
  module_title?: string;
  type: string;
  status: string;
  ai_ppt_markdown: string | null;
  ai_script: string | null;
  ai_keypoints: string | null;
  youtube_video_id: string | null;
}

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

export async function getTimetables(): Promise<Session[]> {
  try {
    const res = await executeWithRetry("SELECT * FROM timetable_slots");
    return res.rows.map((r: any) => ({
      id: r.id as string,
      day: r.day_of_week as string,
      startTime: r.start_time as string,
      endTime: r.end_time as string,
      module: r.batch_id as string,
      teacher: r.teacher_id as string,
      room: r.timing as string
    }));
  } catch (e) {
    console.error("Failed to fetch timetables", e);
    return [];
  }
}

export async function saveTimetable(session: Partial<Session>): Promise<void> {
  try {
    const sessId = session.id || `tt_${Date.now()}`;
    if (session.id) {
      await executeWithRetry(
        "UPDATE timetable_slots SET batch_id=?, teacher_id=?, timing=?, day_of_week=?, start_time=?, end_time=? WHERE id=?",
        [session.module, session.teacher, session.room, session.day, session.startTime, session.endTime, sessId]
      );
    } else {
      await executeWithRetry(
        "INSERT INTO timetable_slots (id, batch_id, teacher_id, timing, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [sessId, session.module, session.teacher, session.room, session.day, session.startTime, session.endTime]
      );
    }
  } catch (e) {
    console.error("Failed to save timetable", e);
    throw e;
  }
}

export async function deleteTimetable(id: string): Promise<void> {
  try {
    await executeWithRetry("DELETE FROM timetable_slots WHERE id = ?", [id]);
  } catch (e) {
    console.error("Failed to delete timetable", e);
    throw e;
  }
}

export async function getActiveLiveClass(instructorId: string): Promise<any> {
  try {
    let res = await executeWithRetry(
      `SELECT DISTINCT c.id, c.title, c.description, c.module_id, m.title as module_title
       FROM classes c
       JOIN modules m ON c.module_id = m.id
       LEFT JOIN course_module_mapping cmm ON m.id = cmm.module_id
       LEFT JOIN courses crs ON cmm.course_id = crs.id
       WHERE (m.instructor_id = ? 
              OR m.title IN (SELECT json_each.value FROM timetable_slots s, json_each(s.course_name) WHERE s.teacher_id = ?)
              OR crs.title IN (SELECT json_each.value FROM timetable_slots s, json_each(s.course_name) WHERE s.teacher_id = ?)
             )
         AND c.status IN ('live', 'in_progress', 'upcoming')
       ORDER BY c.order_index ASC LIMIT 1`,
      [instructorId, instructorId, instructorId]
    );

    if (res.rows.length === 0) {
      res = await executeWithRetry(
        `SELECT DISTINCT c.id, c.title, c.description, c.module_id, m.title as module_title
         FROM classes c
         JOIN modules m ON c.module_id = m.id
         WHERE c.status IN ('live', 'in_progress', 'upcoming')
         ORDER BY c.order_index ASC LIMIT 1`
      );
    }

    if (res.rows.length === 0) {
      res = await executeWithRetry(
        `SELECT DISTINCT c.id, c.title, c.description, c.module_id, m.title as module_title
         FROM classes c
         JOIN modules m ON c.module_id = m.id
         WHERE c.status IS NULL OR c.status != 'completed'
         ORDER BY c.order_index ASC LIMIT 1`
      );
    }

    return res.rows.length > 0 ? res.rows[0] : null;
  } catch (e) {
    console.error("Failed to fetch active live class", e);
    return null;
  }
}

export async function getAllAvailableClasses(): Promise<any[]> {
  try {
    const res = await executeWithRetry(
      `SELECT DISTINCT c.id, c.title, c.description, c.module_id, m.title as module_title, c.status
       FROM classes c
       JOIN modules m ON c.module_id = m.id
       WHERE c.status IS NULL OR c.status != 'completed'
       ORDER BY c.order_index ASC LIMIT 50`
    );
    return res.rows;
  } catch (e) {
    console.error("Failed to fetch available classes", e);
    return [];
  }
}

export async function logAttendance(studentId: string, classId: string): Promise<void> {
  try {
    await executeWithRetry(
      "INSERT INTO attendance_logs (id, batch_id, student_id, join_time) VALUES (?, ?, ?, ?)",
      [`att_${Date.now()}`, classId, studentId, new Date().toISOString()]
    );
  } catch (e) {
    console.error("Failed to log attendance", e);
    throw e;
  }
}

export async function removeAttendance(studentId: string, classId: string): Promise<void> {
  try {
    await executeWithRetry(
      "DELETE FROM attendance_logs WHERE student_id = ? AND batch_id = ?",
      [studentId, classId]
    );
  } catch (e) {
    console.error("Failed to remove attendance", e);
    throw e;
  }
}

export async function getLiveAttendance(classId: string): Promise<any[]> {
  try {
    const res = await executeWithRetry(`
      SELECT a.student_id, u.name as student_name, u.email as student_email, b.name as batch_name, c.title as course_name, MAX(a.join_time) as join_time
      FROM attendance_logs a
      JOIN users u ON a.student_id = u.id
      LEFT JOIN students s ON u.id = s.id
      LEFT JOIN batches b ON s.batch_id = b.id
      LEFT JOIN courses c ON b.course_id = c.id
      WHERE a.batch_id = ?
      GROUP BY a.student_id
      ORDER BY MAX(a.join_time) DESC
    `, [classId]);
    return res.rows;
  } catch (e) {
    console.error("Failed to get live attendance", e);
    return [];
  }
}

export async function getInstructorClasses(instructorId: string, specificClassId?: string): Promise<ClassRow[]> {
  try {
    if (specificClassId && (specificClassId.startsWith('slot_') || specificClassId.startsWith('ts_') || specificClassId.startsWith('tt_'))) {
      const slotRes = await executeWithRetry('SELECT course_name FROM timetable_slots WHERE id = ?', [specificClassId]);
      if (slotRes.rows.length > 0) {
        const courseName = slotRes.rows[0].course_name as string;
        let parsedCourses: string[] = [];
        try { parsedCourses = JSON.parse(courseName); } catch (e) { parsedCourses = [courseName]; }
        const coursePlaceholders = parsedCourses.map(() => '?').join(',');

        const res = await executeWithRetry(
          `SELECT DISTINCT c.id, c.title, c.description, c.type, c.status, 
                  c.ai_ppt_markdown, c.ai_script, c.ai_keypoints, c.youtube_video_id,
                  m.title as module_title
           FROM classes c 
           JOIN modules m ON c.module_id = m.id 
           LEFT JOIN course_module_mapping cmm ON m.id = cmm.module_id
           LEFT JOIN courses crs ON cmm.course_id = crs.id
           WHERE (m.instructor_id = ? 
                  OR m.title IN (SELECT json_each.value FROM timetable_slots s, json_each(s.course_name) WHERE s.teacher_id = ?)
                  OR crs.title IN (SELECT json_each.value FROM timetable_slots s, json_each(s.course_name) WHERE s.teacher_id = ?)
                 )
             AND (crs.title IN (${coursePlaceholders}) OR m.title IN (${coursePlaceholders})) AND c.status != 'completed' 
           ORDER BY cmm.order_index ASC, c.order_index ASC LIMIT 1`,
          [instructorId, instructorId, instructorId, ...parsedCourses, ...parsedCourses]
        );
        if (res.rows.length > 0) return res.rows as unknown as ClassRow[];
      }
      // If no incomplete class found for this slot's module, fallback to fetching any incomplete class
      specificClassId = undefined;
    }

    if (specificClassId) {
      const res = await executeWithRetry(
        `SELECT DISTINCT c.id, c.title, c.description, c.type, c.status, 
                c.ai_ppt_markdown, c.ai_script, c.ai_keypoints, c.youtube_video_id,
                m.title as module_title
         FROM classes c 
         JOIN modules m ON c.module_id = m.id 
         LEFT JOIN course_module_mapping cmm ON m.id = cmm.module_id
         LEFT JOIN courses crs ON cmm.course_id = crs.id
         WHERE c.id = ? 
           AND (m.instructor_id = ? 
                OR m.title IN (SELECT json_each.value FROM timetable_slots s, json_each(s.course_name) WHERE s.teacher_id = ?)
                OR crs.title IN (SELECT json_each.value FROM timetable_slots s, json_each(s.course_name) WHERE s.teacher_id = ?)
               )`,
        [specificClassId, instructorId, instructorId, instructorId]
      );
      return res.rows as unknown as ClassRow[];
    } else {
      const res = await executeWithRetry(
        `SELECT DISTINCT c.id, c.title, c.description, c.type, c.status, 
                c.ai_ppt_markdown, c.ai_script, c.ai_keypoints, c.youtube_video_id,
                m.title as module_title
         FROM classes c 
         JOIN modules m ON c.module_id = m.id 
         LEFT JOIN course_module_mapping cmm ON m.id = cmm.module_id
         LEFT JOIN courses crs ON cmm.course_id = crs.id
         WHERE (m.instructor_id = ? 
                OR m.title IN (SELECT json_each.value FROM timetable_slots s, json_each(s.course_name) WHERE s.teacher_id = ?)
                OR crs.title IN (SELECT json_each.value FROM timetable_slots s, json_each(s.course_name) WHERE s.teacher_id = ?)
               ) 
           AND c.status != 'completed' 
         ORDER BY cmm.order_index ASC, c.order_index ASC LIMIT 1`,
        [instructorId, instructorId, instructorId]
      );
      return res.rows as unknown as ClassRow[];
    }
  } catch (e) {
    console.error("Failed to fetch instructor classes", e);
    return [];
  }
}

export async function updateClassMaterials(classId: string, ppt: string, script: string, keypoints: string): Promise<void> {
  try {
    await executeWithRetry(
      'UPDATE classes SET ai_ppt_markdown = ?, ai_script = ?, ai_keypoints = ? WHERE id = ?',
      [ppt, script, keypoints, classId]
    );
  } catch (e) {
    console.error("Failed to update materials", e);
    throw e;
  }
}

export async function createClass(moduleId: string, title: string, description: string): Promise<void> {
  try {
    const maxRes = await executeWithRetry("SELECT MAX(order_index) as max_idx FROM classes WHERE module_id = ?", [moduleId]);
    const maxIdx = maxRes.rows[0]?.max_idx || 0;
    const orderIndex = Number(maxIdx) + 1;
    
    await executeWithRetry(
      "INSERT INTO classes (id, module_id, title, description, type, status, order_index) VALUES (?, ?, ?, ?, 'live', 'upcoming', ?)",
      [`cls_${Date.now()}`, moduleId, title, description, orderIndex]
    );
  } catch (e) {
    console.error("Failed to create class", e);
    throw e;
  }
}

export async function updateClassDetails(classId: string, title: string, description: string): Promise<void> {
  try {
    await executeWithRetry(
      "UPDATE classes SET title = ?, description = ? WHERE id = ?",
      [title, description, classId]
    );
  } catch (e) {
    console.error("Failed to update class details", e);
    throw e;
  }
}

export async function updateClassStatus(classId: string, status: string, type: string, ytUrl: string = ''): Promise<void> {
  try {
    if (ytUrl) {
      await executeWithRetry(
        "UPDATE classes SET status = ?, type = ?, youtube_video_id = ? WHERE id = ?",
        [status, type, ytUrl, classId]
      );
    } else {
      await executeWithRetry(
        "UPDATE classes SET status = ?, type = ? WHERE id = ?",
        [status, type, classId]
      );
    }
  } catch (e) {
    console.error("Failed to update status", e);
    throw e;
  }
}

export async function completeClassWithSummary(classId: string, summary: string, ytUrl: string | null) {
  try {
    await executeWithRetry(
      "UPDATE classes SET status = 'completed', ai_summary = ?, youtube_video_id = ? WHERE id = ?",
      [summary, ytUrl, classId]
    );
  } catch (e) {
    console.error(e);
  }
}

export async function getClassForPresentation(classId: string) {
  try {
    const res = await executeWithRetry(
      'SELECT title, description, ai_ppt_markdown FROM classes WHERE id = ?',
      [classId]
    );
    return res.rows.length > 0 ? res.rows[0] : null;
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function getTeacherCMSModules(isSuper: boolean, instructorId: string) {
  try {
    if (isSuper) {
      const res = await executeWithRetry("SELECT * FROM modules ORDER BY title ASC");
      return res.rows;
    } else {
      const res = await executeWithRetry(
        `SELECT DISTINCT m.* 
         FROM modules m 
         LEFT JOIN course_module_mapping cmm ON m.id = cmm.module_id
         LEFT JOIN courses crs ON cmm.course_id = crs.id
         WHERE m.instructor_id = ? 
            OR m.title IN (SELECT json_each.value FROM timetable_slots s, json_each(s.course_name) WHERE s.teacher_id = ?)
            OR crs.title IN (SELECT json_each.value FROM timetable_slots s, json_each(s.course_name) WHERE s.teacher_id = ?)
         ORDER BY m.title ASC`,
        [instructorId, instructorId, instructorId]
      );
      return res.rows;
    }
  } catch (e) {
    console.error(e);
    return [];
  }
}

export async function getClassesForModules(modIds: string) {
  try {
    const res = await executeWithRetry(`SELECT * FROM classes WHERE module_id IN (${modIds}) ORDER BY order_index ASC`);
    return res.rows;
  } catch (e) {
    console.error(e);
    return [];
  }
}

export async function getTeacherTimetables(teacherId: string) {
  try {
    // If teacherId is empty, fetch all slots so fallback/demo mode still shows data
    const res = teacherId
      ? await executeWithRetry("SELECT * FROM timetable_slots WHERE teacher_id = ?", [teacherId])
      : await executeWithRetry("SELECT * FROM timetable_slots LIMIT 50");
    return res.rows;
  } catch (e) {
    console.error(e);
    return [];
  }
}

export async function getTeacherFirstCourse(instructorId: string) {
  try {
    let res = await executeWithRetry(
      `SELECT DISTINCT c.* 
       FROM courses c
       JOIN course_module_mapping cmm ON c.id = cmm.course_id
       JOIN modules m ON cmm.module_id = m.id
       WHERE m.instructor_id = ?
       LIMIT 1`,
      [instructorId]
    );
    if (res.rows.length === 0) {
      res = await executeWithRetry("SELECT * FROM courses ORDER BY created_at ASC LIMIT 1");
    }
    return res.rows.length > 0 ? res.rows[0] : null;
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function getCourseModulesMap(courseId: string) {
  try {
    const res = await executeWithRetry(
      `SELECT m.* FROM modules m JOIN course_module_mapping cmm ON m.id = cmm.module_id WHERE cmm.course_id = ? ORDER BY cmm.order_index ASC`,
      [courseId]
    );
    return res.rows;
  } catch (e) {
    console.error(e);
    return [];
  }
}

export async function getCourseClassesMap(courseId: string) {
  try {
    const res = await executeWithRetry(
      `SELECT id, module_id, status FROM classes WHERE module_id IN (SELECT module_id FROM course_module_mapping WHERE course_id = ?)`,
      [courseId]
    );
    return res.rows;
  } catch (e) {
    console.error(e);
    return [];
  }
}

// ─── Class Reschedule / Postpone ────────────────────────────────────────────

export interface RescheduleInput {
  slotId: string;
  slotTitle: string;
  originalDate?: string;
  originalTime: string;
  newDate?: string;
  newTime: string;
  reason: string;
  createdBy: string;
  batchId?: string;  // batch to notify
  courseId?: string; // course to notify
}

export async function postponeClass(input: RescheduleInput): Promise<{ success: boolean; message: string }> {
  try {
    // Create the class_reschedules table if it doesn't exist
    await executeWithRetry(`
      CREATE TABLE IF NOT EXISTS class_reschedules (
        id TEXT PRIMARY KEY,
        slot_id TEXT,
        slot_title TEXT,
        original_time TEXT,
        new_time TEXT,
        new_date TEXT,
        reason TEXT,
        created_by TEXT,
        batch_id TEXT,
        course_id TEXT,
        created_at TEXT
      )
    `);

    const id = `rs_${Date.now()}`;
    await executeWithRetry(
      `INSERT INTO class_reschedules (id, slot_id, slot_title, original_time, new_time, new_date, reason, created_by, batch_id, course_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, input.slotId, input.slotTitle, input.originalTime, input.newTime, input.newDate || null, input.reason, input.createdBy, input.batchId || null, input.courseId || null, new Date().toISOString()]
    );

    // Also insert into announcements table so students see it as a popup
    const announcementId = `ann_rs_${Date.now()}`;
    const announcementBody = `📅 Class "${input.slotTitle}" has been rescheduled.\n\n🕐 Original Time: ${input.originalTime}\n🕐 New Time: ${input.newTime}${input.newDate ? `\n📆 New Date: ${input.newDate}` : ''}\n\n📝 Reason: ${input.reason}`;
    
    await executeWithRetry(
      `INSERT INTO announcements (id, title, body, is_active, created_at, batch_id) VALUES (?, ?, ?, 1, ?, ?)`,
      [announcementId, `⏰ Class Rescheduled: ${input.slotTitle}`, announcementBody, new Date().toISOString(), input.batchId || null]
    );

    // Update the timetable slot's time
    await executeWithRetry(
      `UPDATE timetable_slots SET start_time = ? WHERE id = ?`,
      [input.newTime, input.slotId]
    );

    return { success: true, message: 'Class rescheduled and students notified.' };
  } catch (e) {
    console.error('Failed to postpone class:', e);
    return { success: false, message: 'Failed to reschedule class.' };
  }
}

export async function getRescheduleHistory(slotId?: string): Promise<any[]> {
  try {
    await executeWithRetry(`
      CREATE TABLE IF NOT EXISTS class_reschedules (
        id TEXT PRIMARY KEY, slot_id TEXT, slot_title TEXT,
        original_time TEXT, new_time TEXT, new_date TEXT,
        reason TEXT, created_by TEXT, batch_id TEXT, course_id TEXT, created_at TEXT
      )
    `);
    const res = slotId
      ? await executeWithRetry(`SELECT * FROM class_reschedules WHERE slot_id = ? ORDER BY created_at DESC`, [slotId])
      : await executeWithRetry(`SELECT * FROM class_reschedules ORDER BY created_at DESC LIMIT 50`);
    return res.rows;
  } catch (e) {
    console.error(e);
    return [];
  }
}

