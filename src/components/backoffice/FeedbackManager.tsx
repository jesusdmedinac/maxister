import React, { useState } from 'react';
import { Star, ShieldAlert, CheckCircle, Plus, Filter, Tag, BookOpen, AlertCircle, Loader2 } from 'lucide-react';
import type { TeacherFeedbackEntry, DirectiveType, FeedbackStatus } from '../../lib/conversations';

interface Props {
  initialFeedback: TeacherFeedbackEntry[];
}

export default function FeedbackManager({ initialFeedback }: Props) {
  const [entries, setEntries] = useState<TeacherFeedbackEntry[]>(initialFeedback);
  const [filterCourse, setFilterCourse] = useState('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isAdding, setIsAdding] = useState(false);

  // New feedback form state
  const [title, setTitle] = useState('');
  const [directiveContent, setDirectiveContent] = useState('');
  const [courseId, setCourseId] = useState('kotlin-beginners');
  const [directiveType, setDirectiveType] = useState<DirectiveType>('pedagogical_tip');
  const [topicTags, setTopicTags] = useState('val, var, memoria');
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdate = async (
    id: string,
    update: { status?: FeedbackStatus; qualityScore?: number; adminReviewNotes?: string }
  ) => {
    try {
      const res = await fetch('/api/backoffice/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...update }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar');

      setEntries(entries.map((e) => (e.id === id ? data.entry : e)));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const tags = topicTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch('/api/backoffice/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          directiveContent,
          courseId,
          directiveType,
          topicTags: tags,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear directriz');

      setEntries([data.entry, ...entries]);
      setIsAdding(false);
      setTitle('');
      setDirectiveContent('');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = entries.filter((e) => {
    if (filterCourse !== 'all' && e.courseId !== filterCourse) return false;
    if (filterStatus !== 'all' && e.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Memoria Estratégica & Calificación de Feedback</h2>
          <p className="text-xs text-white/60">
            Modera, califica con estrellas y audita las pautas pedagógicas aprendidas por Maxister.
          </p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-paradiso hover:bg-paradiso-600 text-white text-xs font-semibold shadow-md shadow-paradiso/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{isAdding ? 'Cancelar' : 'Añadir Directriz Manual'}</span>
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleCreate} className="p-5 bg-[#181818] border border-white/10 rounded-2xl space-y-4">
          <h3 className="text-sm font-semibold text-white">Nueva Directriz Pedagógica Estratégica</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-white/70 mb-1">Título de la Pauta</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ej. Analogía de la caja fuerte para val"
                className="w-full bg-[#212121] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-paradiso"
              />
            </div>
            <div>
              <label className="block text-xs text-white/70 mb-1">Curso Asignado</label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full bg-[#212121] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-paradiso"
              >
                <option value="kotlin-beginners">Kotlin for Beginners</option>
                <option value="para-no-programadores">Para No Programadores</option>
                <option value="para-principiantes">Para Principiantes</option>
                <option value="stack-personalizado">Stack Personalizado</option>
                <option value="software-engineering">Ingeniería de Software</option>
                <option value="all">Todos los Cursos</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-white/70 mb-1">Tipo de Directriz</label>
              <select
                value={directiveType}
                onChange={(e) => setDirectiveType(e.target.value as any)}
                className="w-full bg-[#212121] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-paradiso"
              >
                <option value="pedagogical_tip">Pauta Pedagógica General</option>
                <option value="recommended_analogy">Analogía Recomendada</option>
                <option value="code_correction">Corrección de Código</option>
                <option value="forbidden_anti_pattern">Anti-patrón Prohibido</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-white/70 mb-1">Etiquetas (separadas por coma)</label>
              <input
                type="text"
                value={topicTags}
                onChange={(e) => setTopicTags(e.target.value)}
                placeholder="val, var, inmutabilidad"
                className="w-full bg-[#212121] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-paradiso"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-white/70 mb-1">Instrucción para Maxister</label>
            <textarea
              required
              rows={3}
              value={directiveContent}
              onChange={(e) => setDirectiveContent(e.target.value)}
              placeholder="Instruye a Maxister cómo debe explicar este concepto a los alumnos..."
              className="w-full bg-[#212121] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-paradiso resize-none"
            />
          </div>
          <div className="flex justify-end gap-2">
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
              <span>Guardar Directriz</span>
            </button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-[#181818] border border-white/5 rounded-2xl text-xs text-white/70">
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-paradiso-300" />
          <span>Filtros:</span>
        </div>
        <select
          value={filterCourse}
          onChange={(e) => setFilterCourse(e.target.value)}
          className="bg-[#212121] border border-white/10 rounded-xl px-2.5 py-1 text-white outline-none"
        >
          <option value="all">Todos los Cursos</option>
          <option value="kotlin-beginners">Kotlin for Beginners</option>
          <option value="para-no-programadores">Para No Programadores</option>
          <option value="para-principiantes">Para Principiantes</option>
          <option value="stack-personalizado">Stack Personalizado</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-[#212121] border border-white/10 rounded-xl px-2.5 py-1 text-white outline-none"
        >
          <option value="all">Todos los Estados</option>
          <option value="active">Activas (En Prompts)</option>
          <option value="blocked">Bloqueadas</option>
        </select>
      </div>

      {/* Feedback List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-white/40 text-xs italic bg-[#181818] rounded-2xl border border-white/5">
            No hay directrices registradas con estos filtros.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className={`p-5 rounded-2xl border transition ${
                item.status === 'blocked'
                  ? 'bg-red-950/10 border-red-500/20 text-white/60'
                  : 'bg-[#181818] border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-paradiso/10 text-paradiso-300 font-semibold uppercase tracking-wider">
                      {item.directiveType}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/60">
                      {item.courseId}
                    </span>
                    {item.status === 'blocked' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-semibold">
                        BLOQUEADA
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-white">{item.title}</h3>
                  <p className="text-[11px] text-white/50 mt-0.5">
                    Docente: <strong className="text-white/80">{item.teacherName}</strong> • Alumno:{' '}
                    {item.studentName}
                  </p>
                </div>

                {/* Star Quality Rating (1 to 5) */}
                <div className="flex items-center gap-1 self-start bg-[#212121] px-3 py-1.5 rounded-xl border border-white/5">
                  <span className="text-[11px] text-white/40 mr-1 font-medium">Calificación:</span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleUpdate(item.id, { qualityScore: star })}
                      className="p-0.5 hover:scale-110 transition"
                      title={`Calificar con ${star} estrellas`}
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          (item.qualityScore || 0) >= star
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-white/20'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Directive Content Box */}
              <div className="p-3 bg-[#212121] rounded-xl border border-white/5 text-xs text-white/90 leading-relaxed font-sans mb-3">
                "{item.directiveContent}"
              </div>

              {/* Tags & Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  {item.topicTags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-white/60 font-mono"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  {item.status === 'blocked' ? (
                    <button
                      onClick={() => handleUpdate(item.id, { status: 'active' })}
                      className="px-3 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-medium transition"
                    >
                      Aprobar (Activar)
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpdate(item.id, { status: 'blocked' })}
                      className="px-3 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-medium transition"
                    >
                      Bloquear Directriz
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
