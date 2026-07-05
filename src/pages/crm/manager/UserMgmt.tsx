import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/erp/Card';
import { Button } from '../../../components/ui/erp/Button';
import { UserPlus, User, X, Check, Shield } from 'lucide-react';
import { client } from '../../../lib/turso';

export default function UserMgmt() {
  const [users, setUsers] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [form, setForm] = useState({ id: '', name: '', email: '', role: 'Teacher', password: '' });
  const [assignedModules, setAssignedModules] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    if (!client) return;
    try {
      const uRes = await client.execute("SELECT id, name, email, role FROM erp_users WHERE role != 'Student' ORDER BY created_at DESC");
      setUsers(uRes.rows);

      const mRes = await client.execute("SELECT id, title, instructor_id FROM modules ORDER BY title ASC");
      setModules(mRes.rows);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const openAdd = () => {
    setForm({ id: `usr_${Date.now()}`, name: '', email: '', role: 'Teacher', password: 'password123' });
    setAssignedModules([]);
    setIsEditing(false);
    setModalOpen(true);
  };

  const openEdit = (user: any) => {
    setForm({ id: user.id, name: user.name, email: user.email, role: user.role, password: '' });
    // Find modules assigned to this teacher
    const teacherMods = modules.filter(m => m.instructor_id === user.id).map(m => m.id as string);
    setAssignedModules(teacherMods);
    setIsEditing(true);
    setModalOpen(true);
  };

  const saveUser = async () => {
    if (!client) return;
    try {
      if (isEditing) {
        await client.execute({
          sql: "UPDATE erp_users SET name = ?, email = ?, role = ? WHERE id = ?",
          args: [form.name, form.email, form.role, form.id]
        });
      } else {
        await client.execute({
          sql: "INSERT INTO erp_users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)",
          args: [form.id, form.name, form.email, form.password, form.role]
        });
      }

      // If teacher, update module assignments
      if (form.role === 'Teacher') {
        // First clear all modules that were previously assigned to this teacher
        await client.execute({
          sql: "UPDATE modules SET instructor_id = NULL WHERE instructor_id = ?",
          args: [form.id]
        });
        
        // Now assign selected modules
        for (const mid of assignedModules) {
          await client.execute({
            sql: "UPDATE modules SET instructor_id = ? WHERE id = ?",
            args: [form.id, mid]
          });
        }
      }

      setModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Failed to save user', err);
      alert('Failed to save user. Make sure email is unique.');
    }
  };

  const toggleModule = (id: string) => {
    setAssignedModules(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  if (loading) return <div className="p-8 text-erp-text">Loading...</div>;

  return (
    <div className="flex h-full w-full overflow-hidden bg-erp-background">
      <div className="flex-1 flex flex-col p-4 md:p-8 min-w-0 overflow-y-auto pb-32">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-erp-text">User Mgmt</h1>
            <p className="text-erp-text/70 font-medium mt-1">Manage staff and teacher accounts</p>
          </div>
          <Button onClick={openAdd} className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" /> Add Staff
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {users.map(u => (
            <Card key={u.id as string} className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-xl ${u.role === 'Teacher' ? 'bg-purple-100 text-purple-700' : 'bg-erp-primary/10 text-erp-primary'}`}>
                  {u.role === 'Teacher' ? <User className="w-6 h-6" /> : <Shield className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-erp-text">{u.name}</h3>
                  <p className="text-sm font-bold text-erp-text/50">{u.role} &bull; {u.email}</p>
                </div>
              </div>
              <Button onClick={() => openEdit(u)} variant="ghost" className="border-2 border-erp-border">Edit</Button>
            </Card>
          ))}
        </div>
      </div>

      {/* ── Modal ─────────────────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-erp-card rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-erp-border bg-black/20">
              <h2 className="font-bold text-lg text-erp-text">{isEditing ? 'Edit Staff' : 'Add Staff'}</h2>
              <button onClick={() => setModalOpen(false)} className="text-erp-text/50 hover:text-erp-text"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-erp-text/50 uppercase mb-1 block">Name</label>
                <input 
                  type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full bg-erp-background border border-erp-border rounded-xl px-4 py-2.5 text-erp-text outline-none focus:border-erp-primary"
                />
              </div>
              
              <div>
                <label className="text-xs font-bold text-erp-text/50 uppercase mb-1 block">Email</label>
                <input 
                  type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                  className="w-full bg-erp-background border border-erp-border rounded-xl px-4 py-2.5 text-erp-text outline-none focus:border-erp-primary"
                />
              </div>

              {!isEditing && (
                <div>
                  <label className="text-xs font-bold text-erp-text/50 uppercase mb-1 block">Password</label>
                  <input 
                    type="text" value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                    className="w-full bg-erp-background border border-erp-border rounded-xl px-4 py-2.5 text-erp-text outline-none focus:border-erp-primary"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-erp-text/50 uppercase mb-1 block">Role</label>
                <select 
                  value={form.role} onChange={e => setForm({...form, role: e.target.value})}
                  className="w-full bg-erp-background border border-erp-border rounded-xl px-4 py-2.5 text-erp-text outline-none focus:border-erp-primary"
                >
                  <option>Teacher</option>
                  <option>Manager</option>
                  <option>Sales/HR</option>
                  <option>DM</option>
                  <option>Admin</option>
                </select>
              </div>

              {/* Module Assignments */}
              {form.role === 'Teacher' && (
                <div className="mt-2">
                  <label className="text-xs font-bold text-erp-text/50 uppercase mb-2 block">Assigned Modules</label>
                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {modules.map((m: any) => {
                      const isAssigned = assignedModules.includes(m.id);
                      return (
                        <div 
                          key={m.id}
                          onClick={() => toggleModule(m.id)}
                          className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border-2 transition-colors ${isAssigned ? 'border-erp-primary bg-erp-primary/10' : 'border-erp-border hover:border-erp-text/20'}`}
                        >
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${isAssigned ? 'bg-erp-primary text-white' : 'bg-erp-border'}`}>
                            {isAssigned && <Check className="w-3 h-3" />}
                          </div>
                          <span className="text-erp-text font-bold text-sm truncate">{m.title}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-erp-border bg-black/20 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button onClick={saveUser}>Save {form.role}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
