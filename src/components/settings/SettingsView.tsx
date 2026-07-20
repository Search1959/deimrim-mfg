import React, { useState } from "react";
import { Settings, Plus, X, Edit, Trash2 } from "lucide-react";
import type { User, UserRole } from "../../types";
import { toast } from "../../utils/toast";

interface Props { users: User[]; setUsers: React.Dispatch<React.SetStateAction<User[]>>; currentUser: User; }

const ROLES: UserRole[] = ["superadmin","manager","sales","operator","readonly"];
const ROLE_BADGE: Record<UserRole, string> = {
  superadmin:"bg-violet-500/20 text-violet-300 border-violet-500/30",
  manager:"bg-blue-500/20 text-blue-300 border-blue-500/30",
  sales:"bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  operator:"bg-amber-500/20 text-amber-300 border-amber-500/30",
  readonly:"bg-slate-500/20 text-slate-300 border-slate-500/30",
};

const BLANK = () => ({ name:"", email:"", password:"", role:"operator" as UserRole, department:"", active:true });

export default function SettingsView({ users, setUsers, currentUser }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState(BLANK());
  const f = (k: string, v: any) => setForm(p => ({...p,[k]:v}));

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { toast.error("Name, email and password required"); return; }
    if (editing) {
      setUsers(prev => prev.map(u => u.id === editing.id ? { ...editing, ...form } : u));
      toast.success("User Updated", form.name);
    } else {
      if (users.find(u => u.email === form.email)) { toast.error("Email already exists"); return; }
      setUsers(prev => [...prev, { id: `u-${Date.now()}`, ...form }]);
      toast.success("User Created", form.name);
    }
    setShowModal(false);
  };

  const del = (id: string) => {
    if (id === currentUser.id) { toast.error("Cannot delete your own account"); return; }
    if (confirm("Delete this user?")) { setUsers(prev => prev.filter(u => u.id !== id)); toast.warning("User Deleted"); }
  };

  const openEdit = (u: User) => { setEditing(u); setForm({ name:u.name, email:u.email, password:u.password, role:u.role, department:u.department||"", active:u.active }); setShowModal(true); };
  const openNew = () => { setEditing(null); setForm(BLANK()); setShowModal(true); };

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2"><Settings className="h-6 w-6 text-orange-400" /> Settings</h1>
          <p className="text-slate-400 text-sm mt-1">User management — roles and access control</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg px-3 py-2 text-xs font-bold cursor-pointer"><Plus className="h-3.5 w-3.5" /> Add User</button>
      </div>

      {/* Role Permissions Info */}
      <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4">
        <p className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-widest font-mono">Role Access Matrix</p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-[10px]">
            <thead className="text-slate-500 font-bold">
              <tr>
                <th className="text-left pr-4 pb-2">Role</th>
                {["Dashboard","Raw Mat","BOM","Production","QC","Finished","Sales","Finance","Settings"].map(m => <th key={m} className="text-center pb-2 px-2 whitespace-nowrap">{m}</th>)}
              </tr>
            </thead>
            <tbody className="space-y-1">
              {([
                ["superadmin","✅","✅","✅","✅","✅","✅","✅","✅","✅"],
                ["manager","✅","✅","✅","✅","✅","✅","✅","✅","—"],
                ["sales","✅","—","—","—","—","✅","✅","—","—"],
                ["operator","✅","✅","—","✅","✅","—","—","—","—"],
                ["readonly","✅","✅","✅","✅","✅","✅","✅","✅","—"],
              ] as [string, ...string[]][]).map(([role, ...perms]) => (
                <tr key={role} className="border-t border-slate-800/50">
                  <td className="pr-4 py-1.5">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border font-mono uppercase ${ROLE_BADGE[role as UserRole]}`}>{role}</span>
                  </td>
                  {perms.map((p, i) => <td key={i} className={`text-center py-1.5 px-2 ${p==="✅"?"text-emerald-400":"text-slate-700"}`}>{p}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Users List */}
      <div className="space-y-2">
        {users.map(u => (
          <div key={u.id} className="flex items-center justify-between p-3.5 bg-slate-950/40 border border-slate-800 rounded-xl hover:border-slate-700 transition-all">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-xs font-black text-white shrink-0">{u.name.charAt(0)}</div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-white">{u.name}</p>
                  {u.id === currentUser.id && <span className="text-[9px] font-bold text-orange-300 font-mono">(you)</span>}
                  {!u.active && <span className="text-[9px] text-red-400 font-bold">INACTIVE</span>}
                </div>
                <p className="text-[10px] text-slate-400">{u.email} · {u.department}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded border font-mono uppercase ${ROLE_BADGE[u.role]}`}>{u.role}</span>
              <div className="flex gap-1">
                <button onClick={() => openEdit(u)} className="p-1.5 text-slate-500 hover:text-blue-400 cursor-pointer"><Edit className="h-3.5 w-3.5" /></button>
                <button onClick={() => del(u.id)} className="p-1.5 text-slate-500 hover:text-red-400 cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm">{editing ? "Edit" : "Add"} User</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white cursor-pointer"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={save} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[{label:"Full Name *",key:"name"},{label:"Email *",key:"email"},{label:"Password *",key:"password"},{label:"Department",key:"department"}].map(({label,key}) => (
                  <div key={key} className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400">{label}</label>
                    <input value={(form as any)[key]} onChange={e => f(key, e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500" />
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400">Role</label>
                <select value={form.role} onChange={e => f("role", e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500">
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={e => f("active", e.target.checked)} />
                <span className="text-xs text-slate-300 font-semibold">Active User</span>
              </label>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 rounded-lg border border-slate-700 text-slate-400 py-2 text-xs font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 rounded-lg bg-orange-600 hover:bg-orange-500 text-white py-2 text-xs font-bold cursor-pointer">{editing ? "Update" : "Create"} User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
