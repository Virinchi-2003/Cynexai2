import React, { useState, useEffect } from 'react';
import { client } from '../../../lib/turso';
import { Users, TrendingUp, Award, BookOpen, Clock } from 'lucide-react';

export default function StudentProgress() {
  const [progressData, setProgressData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
          u.name as student_name,
          u.email as student_email
        FROM student_progress sp
        JOIN erp_users u ON sp.student_id = u.id
        ORDER BY sp.course_progress_percentage DESC
      `);
      setProgressData(res.rows);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-3 text-purple-500 mb-2">
            <Users className="w-5 h-5" />
            <h3 className="font-bold text-zinc-800 dark:text-white">Total Students Tracked</h3>
          </div>
          <p className="text-3xl font-black text-zinc-800 dark:text-white">{progressData.length}</p>
        </div>
        
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-3 text-green-500 mb-2">
            <BookOpen className="w-5 h-5" />
            <h3 className="font-bold text-zinc-800 dark:text-white">Avg. Completion</h3>
          </div>
          <p className="text-3xl font-black text-zinc-800 dark:text-white">
            {progressData.length > 0 
              ? Math.round(progressData.reduce((acc, curr) => acc + (curr.course_progress_percentage || 0), 0) / progressData.length)
              : 0}%
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-3 text-yellow-500 mb-2">
            <Award className="w-5 h-5" />
            <h3 className="font-bold text-zinc-800 dark:text-white">Avg. Attendance</h3>
          </div>
          <p className="text-3xl font-black text-zinc-800 dark:text-white">
            {progressData.length > 0 
              ? Math.round(progressData.reduce((acc, curr) => acc + (curr.attendance_score || 0), 0) / progressData.length)
              : 0}%
          </p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-100 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700">
                <th className="p-4 font-bold text-zinc-700 dark:text-zinc-300">Student Name</th>
                <th className="p-4 font-bold text-zinc-700 dark:text-zinc-300">Course Progress</th>
                <th className="p-4 font-bold text-zinc-700 dark:text-zinc-300">Attendance</th>
                <th className="p-4 font-bold text-zinc-700 dark:text-zinc-300">Coins Spent</th>
                <th className="p-4 font-bold text-zinc-700 dark:text-zinc-300">Rank</th>
                <th className="p-4 font-bold text-zinc-700 dark:text-zinc-300">Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {progressData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-500">No progress data recorded yet.</td>
                </tr>
              ) : (
                progressData.map((row: any) => (
                  <tr key={row.id} className="border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                    <td className="p-4">
                      <div className="font-bold text-zinc-800 dark:text-white">{row.student_name}</div>
                      <div className="text-xs text-zinc-500">{row.student_email}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-purple-500 rounded-full" 
                            style={{ width: `${row.course_progress_percentage || 0}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold w-10 text-right">{row.course_progress_percentage || 0}%</span>
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-zinc-700 dark:text-zinc-300">{row.attendance_score || 0}%</td>
                    <td className="p-4 font-semibold text-yellow-500">{row.coins_spent || 0}</td>
                    <td className="p-4 font-semibold text-zinc-700 dark:text-zinc-300">#{row.leaderboard_rank || '-'}</td>
                    <td className="p-4 text-sm text-zinc-500">
                      {new Date(row.last_updated).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
