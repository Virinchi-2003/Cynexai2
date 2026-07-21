import React, { useState, useEffect } from 'react';
import { client } from '../../../lib/turso';
import { Users, TrendingUp, Award, BookOpen, Edit2, Save, X } from 'lucide-react';

export default function StudentProgress() {
  const [progressData, setProgressData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (!client) return;
      const res = await client.execute(`
        SELECT 
          sp.*,
          COALESCE(s.name, (SELECT name FROM users u WHERE u.email = s.portal_login_email)) as student_name,
          s.portal_login_email as student_email
        FROM manager_student_progress sp
        JOIN students s ON sp.student_id = s.id
        ORDER BY sp.course_progress_percentage DESC
      `);
      setProgressData(res.rows);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (row: any) => {
    setEditingId(row.id);
    setEditForm({
      course_progress_percentage: row.course_progress_percentage || 0,
      attendance_score: row.attendance_score || 0,
      coins_spent: row.coins_spent || 0,
      leaderboard_rank: row.leaderboard_rank || 0,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSave = async (id: string) => {
    if (!client) return;
    setIsSaving(true);
    try {
      await client.execute({
        sql: `UPDATE manager_student_progress SET 
          course_progress_percentage = ?,
          attendance_score = ?,
          coins_spent = ?,
          leaderboard_rank = ?,
          last_updated = CURRENT_TIMESTAMP
          WHERE id = ?`,

        args: [
          Number(editForm.course_progress_percentage),
          Number(editForm.attendance_score),
          Number(editForm.coins_spent),
          Number(editForm.leaderboard_rank),
          id
        ]
      });
      await fetchData();
      setEditingId(null);
    } catch (err) {
      console.error(err);
      alert("Failed to update progress.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-zinc-500 font-medium">Loading progress data...</div>;
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center gap-3 mb-8">
        <TrendingUp className="w-8 h-8 text-purple-500" />
        <h1 className="text-3xl font-bold text-zinc-800 dark:text-white">Student Progress Tracking</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 text-purple-500 mb-2">
            <Users className="w-5 h-5" />
            <h3 className="font-bold text-zinc-600 dark:text-zinc-400">Total Students Tracked</h3>
          </div>
          <p className="text-3xl font-black text-zinc-800 dark:text-white">{progressData.length}</p>
        </div>
        
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 text-green-500 mb-2">
            <BookOpen className="w-5 h-5" />
            <h3 className="font-bold text-zinc-600 dark:text-zinc-400">Avg. Completion</h3>
          </div>
          <p className="text-3xl font-black text-zinc-800 dark:text-white">
            {progressData.length > 0 
              ? Math.round(progressData.reduce((acc, curr) => acc + (curr.course_progress_percentage || 0), 0) / progressData.length)
              : 0}%
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 text-yellow-500 mb-2">
            <Award className="w-5 h-5" />
            <h3 className="font-bold text-zinc-600 dark:text-zinc-400">Avg. Attendance</h3>
          </div>
          <p className="text-3xl font-black text-zinc-800 dark:text-white">
            {progressData.length > 0 
              ? Math.round(progressData.reduce((acc, curr) => acc + (curr.attendance_score || 0), 0) / progressData.length)
              : 0}%
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700">
                <th className="p-4 font-bold text-zinc-700 dark:text-zinc-300">Student Name</th>
                <th className="p-4 font-bold text-zinc-700 dark:text-zinc-300">Course Progress (%)</th>
                <th className="p-4 font-bold text-zinc-700 dark:text-zinc-300">Attendance (%)</th>
                <th className="p-4 font-bold text-zinc-700 dark:text-zinc-300">Coins Spent</th>
                <th className="p-4 font-bold text-zinc-700 dark:text-zinc-300">Rank</th>
                <th className="p-4 font-bold text-zinc-700 dark:text-zinc-300">Last Updated</th>
                <th className="p-4 font-bold text-zinc-700 dark:text-zinc-300 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {progressData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-500">No progress data recorded yet.</td>
                </tr>
              ) : (
                progressData.map((row: any) => {
                  const isEditing = editingId === row.id;
                  
                  return (
                    <tr key={row.id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                      <td className="p-4">
                        <div className="font-bold text-zinc-800 dark:text-white">{row.student_name}</div>
                        <div className="text-xs text-zinc-500">{row.student_email}</div>
                      </td>
                      
                      <td className="p-4">
                        {isEditing ? (
                          <input 
                            type="number" 
                            className="w-20 px-2 py-1 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded text-zinc-800 dark:text-white"
                            value={editForm.course_progress_percentage}
                            onChange={(e) => setEditForm({...editForm, course_progress_percentage: e.target.value})}
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden w-24">
                              <div 
                                className="h-full bg-purple-500 rounded-full" 
                                style={{ width: `${row.course_progress_percentage || 0}%` }}
                              />
                            </div>
                            <span className="text-sm font-bold w-10 text-right text-zinc-700 dark:text-zinc-300">{row.course_progress_percentage || 0}%</span>
                          </div>
                        )}
                      </td>
                      
                      <td className="p-4 font-semibold text-zinc-700 dark:text-zinc-300">
                        {isEditing ? (
                          <input 
                            type="number" 
                            className="w-20 px-2 py-1 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded text-zinc-800 dark:text-white"
                            value={editForm.attendance_score}
                            onChange={(e) => setEditForm({...editForm, attendance_score: e.target.value})}
                          />
                        ) : (
                          `${row.attendance_score || 0}%`
                        )}
                      </td>
                      
                      <td className="p-4 font-semibold text-yellow-600 dark:text-yellow-500">
                        {isEditing ? (
                          <input 
                            type="number" 
                            className="w-20 px-2 py-1 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded text-zinc-800 dark:text-white"
                            value={editForm.coins_spent}
                            onChange={(e) => setEditForm({...editForm, coins_spent: e.target.value})}
                          />
                        ) : (
                          row.coins_spent || 0
                        )}
                      </td>
                      
                      <td className="p-4 font-semibold text-zinc-700 dark:text-zinc-300">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            #<input 
                              type="number" 
                              className="w-16 px-2 py-1 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded text-zinc-800 dark:text-white"
                              value={editForm.leaderboard_rank}
                              onChange={(e) => setEditForm({...editForm, leaderboard_rank: e.target.value})}
                            />
                          </div>
                        ) : (
                          `#${row.leaderboard_rank || '-'}`
                        )}
                      </td>
                      
                      <td className="p-4 text-sm text-zinc-500">
                        {new Date(row.last_updated).toLocaleDateString()}
                      </td>
                      
                      <td className="p-4 text-right">
                        {isEditing ? (
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={handleCancelEdit}
                              className="p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-full transition-colors"
                              disabled={isSaving}
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleSave(row.id)}
                              className="p-2 text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/30 rounded-full transition-colors"
                              disabled={isSaving}
                            >
                              <Save className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleEditClick(row)}
                            className="p-2 text-zinc-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-full transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
