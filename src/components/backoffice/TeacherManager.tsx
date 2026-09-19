import React, { useState } from 'react';
import { UserPlus, Check, X, Shield, Lock, Mail, Loader2, AlertCircle } from 'lucide-react';
import type { UserAccount } from '../../lib/auth';

interface Props {
  initialTeachers: UserAccount[];
}

export default function TeacherManager({ initialTeachers }: Props) {
  const [teachers, setTeachers] = useState<UserAccount[]>(initialTeachers);
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [assignedCourses, setAssignedCourses] = useState('kotlin-beginners');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/backoffice/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          assignedCourses: [assignedCourses],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear profesor');

      setTeachers([...teachers, data.teacher]);
      setIsAdding(false);
      setName('');
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (teacherId: string, currentActive: boolean) => {
    try {
      const res = await fetch('/api/backoffice/teachers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId,
          isActive: !currentActive,
        }),
      });

      if (!res.ok) throw new Error('Error al actualizar estado');

      setTeachers(
        teachers.map((t) => (t.id === teacherId ? { ...t, isActive: !currentActive } : t))
      );
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Gestión de Profesores Verificados</h2>
          <p className="text-xs text-white/60">
            Administra el equipo docente autorizado para atender consultas y entrenar la memoria de Maxister.
          </p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-paradiso hover:bg-paradiso-600 text-white text-xs font-semibold shadow-md shadow-paradiso/20 transition"
        >
          <UserPlus className="w-4 h-4" />
          <span>{isAdding ? 'Cancelar' : 'Dar de Alta Profesor'}</span>
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {isAdding && (
        <form onSubmit={handleCreate} className="p-5 bg-[#181818] border border-white/10 rounded-2xl space-y-4">
          <h3 className="text-sm font-semibold text-white">Nuevo Docente</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-white/70 mb-1">Nombre Completo</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ej. Jesús Medina"
                className="w-full bg-[#212121] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-paradiso"
              />
            </div>
            <div>
              <label className="block text-xs text-white/70 mb-1">Correo Institucional</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="profesor@desde0.dev"
                className="w-full bg-[#212121] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-paradiso"
              />
            </div>
            <div>
              <label className="block text-xs text-white/70 mb-1">Contraseña Temporal</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full bg-[#212121] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-paradiso"
              />
            </div>
            <div>
              <label className="block text-xs text-white/70 mb-1">Curso Asignado</label>
              <select
                value={assignedCourses}
                onChange={(e) => setAssignedCourses(e.target.value)}
                className="w-full bg-[#212121] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-paradiso"
              >
                <option value="kotlin-beginners">Kotlin for Beginners</option>
                <option value="para-no-programadores">Para No Programadores</option>
                <option value="para-principiantes">Para Principiantes</option>
                <option value="stack-personalizado">Stack Personalizado</option>
                <option value="software-engineering">Ingeniería de Software</option>
                <option value="kotlin-multiplatform">Kotlin Multiplatform (KMP)</option>
                <option value="ia-para-desarrolladores">IA para Desarrolladores</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 rounded-xl text-xs text-white/60 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 rounded-xl bg-paradiso hover:bg-paradiso-600 text-white text-xs font-semibold flex items-center gap-1.5"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Guardar Docente</span>
            </button>
          </div>
        </form>
      )}

      {/* Teachers Table */}
      <div className="bg-[#181818] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#212121] border-b border-white/5 text-white/50 uppercase text-[10px] tracking-wider">
            <tr>
              <th className="px-4 py-3">Profesor</th>
              <th className="px-4 py-3">Correo</th>
              <th className="px-4 py-3">Cursos</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-white/80">
            {teachers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-white/40 italic">
                  No hay profesores dados de alta en el sistema.
                </td>
              </tr>
            ) : (
              teachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-white/5 transition">
                  <td className="px-4 py-3 font-medium text-white flex items-center gap-2">
                    <div className="size-6 rounded-md bg-paradiso/20 flex items-center justify-center text-paradiso-300 font-bold text-xs">
                      {teacher.name.charAt(0)}
                    </div>
                    <span>{teacher.name}</span>
                  </td>
                  <td className="px-4 py-3 text-white/60 font-mono text-[11px]">{teacher.email}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full bg-white/5 text-paradiso-300 border border-white/5 text-[10px]">
                      {teacher.activeCourse}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {teacher.isActive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-medium">
                        <Check className="w-3 h-3" /> Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-medium">
                        <X className="w-3 h-3" /> Inactivo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleToggleStatus(teacher.id, teacher.isActive)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                        teacher.isActive
                          ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                      }`}
                    >
                      {teacher.isActive ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
