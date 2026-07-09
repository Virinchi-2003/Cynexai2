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

export interface StudentDashboardData {
  course: any;
  gamification: { streak: number; coins: number };
  modules: any[];
}

export async function getStudentDashboardData(studentId: string): Promise<StudentDashboardData> {
  try {
    let courseRes = await executeWithRetry(
      `SELECT c.* 
       FROM courses c
       JOIN sales s ON c.id = s.course_id
       JOIN onboardings o ON s.id = o.sale_id
       JOIN students st ON o.id = st.onboarding_id
       WHERE st.id = ? OR st.portal_login_email = (SELECT email FROM users WHERE id = ?)
       LIMIT 1`,
      [studentId, studentId]
    );

    if (courseRes.rows.length === 0) {
      courseRes = await executeWithRetry("SELECT * FROM courses ORDER BY created_at ASC LIMIT 1");
      if (courseRes.rows.length === 0) {
        return { course: null, gamification: { streak: 0, coins: 0 }, modules: [] };
      }
    }
    const activeCourse = courseRes.rows[0];

    const studentRes = await executeWithRetry(
      "SELECT streak, coins FROM students WHERE id = ?",
      [studentId]
    );
    const gamification = studentRes.rows.length > 0 
      ? { streak: Number(studentRes.rows[0].streak) || 0, coins: Number(studentRes.rows[0].coins) || 0 }
      : { streak: 0, coins: 0 };

    const modRes = await executeWithRetry(
      `SELECT m.*, cmm.order_index as map_order
       FROM modules m
       JOIN course_module_mapping cmm ON m.id = cmm.module_id
       WHERE cmm.course_id = ?
       ORDER BY cmm.order_index ASC`,
      [activeCourse.id]
    );

    const clsRes = await executeWithRetry(
      `SELECT id, module_id, status FROM classes WHERE module_id IN (SELECT module_id FROM course_module_mapping WHERE course_id = ?)`,
      [activeCourse.id]
    );

    const progRes = await executeWithRetry(
      "SELECT lesson_id FROM student_progress WHERE student_id = ? AND completed = 1",
      [studentId]
    );
    const completedSet = new Set(progRes.rows.map((r: any) => r.lesson_id));

    const modulesData = modRes.rows.map((m: any) => {
      const mClasses = clsRes.rows.filter((c: any) => c.module_id === m.id);
      const completed = mClasses.filter((c: any) => completedSet.has(c.id) || c.status === 'completed').length;
      return {
        ...m,
        totalClasses: mClasses.length,
        completedClasses: completed,
        progressPct: mClasses.length > 0 ? Math.round((completed / mClasses.length) * 100) : 0
      };
    });

    return {
      course: activeCourse,
      gamification,
      modules: modulesData
    };
  } catch (error) {
    console.error('Failed to load student dashboard data', error);
    throw error;
  }
}

export async function getClassFlowData(classId: string) {
  try {
    const clsRes = await executeWithRetry(
      `SELECT id, title, youtube_video_id, meet_link, type, status, ai_summary, description
       FROM classes WHERE id = ?`,
      [classId]
    );
    const questionsRes = await executeWithRetry(
      `SELECT * FROM class_questions WHERE class_id = ? ORDER BY created_at ASC`,
      [classId]
    );
    return {
      classData: clsRes.rows.length > 0 ? clsRes.rows[0] : null,
      questions: questionsRes.rows
    };
  } catch (e) {
    console.error(e);
    return { classData: null, questions: [] };
  }
}

export async function getModuleMapData(moduleId: string, studentId: string) {
  try {
    const modRes = await executeWithRetry("SELECT * FROM modules WHERE id = ?", [moduleId]);
    const clsRes = await executeWithRetry(
      "SELECT id, title, type, status, order_index FROM classes WHERE module_id = ? ORDER BY order_index ASC",
      [moduleId]
    );
    const progRes = await executeWithRetry(
      "SELECT lesson_id FROM student_progress WHERE student_id = ? AND completed = 1",
      [studentId]
    );
    
    return {
      moduleData: modRes.rows.length > 0 ? modRes.rows[0] : null,
      classes: clsRes.rows,
      completedLessonIds: new Set(progRes.rows.map((r: any) => r.lesson_id))
    };
  } catch (e) {
    console.error(e);
    return { moduleData: null, classes: [], completedLessonIds: new Set() };
  }
}

export async function getActiveLiveClassStudent() {
  try {
    const res = await executeWithRetry("SELECT id, title FROM classes WHERE type = 'live' AND status = 'in_progress' LIMIT 1");
    return res.rows.length > 0 ? res.rows[0] : null;
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function checkClassStatus(classId: string) {
  try {
    const res = await executeWithRetry("SELECT status FROM classes WHERE id = ?", [classId]);
    return res.rows.length > 0 ? res.rows[0].status : null;
  } catch (e) {
    console.error(e);
    return null;
  }
}
