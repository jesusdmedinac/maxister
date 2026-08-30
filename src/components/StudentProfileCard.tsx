import React, { useState } from 'react';
import type { StudentProfile } from '../lib/memory';
import { User, CheckCircle2, AlertCircle, Plus, BookCheck, Sparkles, StickyNote } from 'lucide-react';

interface Props {
  student: StudentProfile | null;
  onSwitchStudent: (studentId: string) => void;
  onUpdateProgress: (update: any) => void;
}

export default function StudentProfileCard({ student, onSwitchStudent, onUpdateProgress }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newConcept, setNewConcept] = useState('');

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;
    const id = newStudentName.toLowerCase().replace(/\s+/g, '-');
    onSwitchStudent(id);
    setNewStudentName('');
    setIsEditing(false);
  };

  const handleAddConcept = (type: 'mastered' | 'struggling') => {
    if (!newConcept.trim()) return;
    if (type === 'mastered') {
      onUpdateProgress({ addMasteredConcepts: [newConcept.trim()] });
    } else {
      onUpdateProgress({ addStrugglingConcepts: [newConcept.trim()] });
    }
    setNewConcept('');
  };

  return (
    <aside className="w-80 border-l border-slate-200 bg-white flex flex-col h-full overflow-hidden shrink-0">
      {/* Student Selector / Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-paradiso text-white flex items-center justify-center font-bold text-xs">
              {student?.name?.charAt(0).toUpperCase() || 'E'}
            </div>
            <div>
              <div className="font-semibold text-slate-800 text-sm leading-tight">{student?.name || 'Estudiante'}</div>
              <div className="text-[11px] text-slate-500 capitalize">{student?.activeCourse || 'Sin curso'}</div>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-xs text-paradiso font-medium hover:underline flex items-center gap-0.5"
          >
            <User className="w-3.5 h-3.5" />
            <span>Cambiar</span>
          </button>
        </div>

        {isEditing && (
          <form onSubmit={handleCreateStudent} className="mt-3 pt-3 border-t border-slate-200 space-y-2">
            <input
              type="text"
              placeholder="Nombre del alumno..."
              value={newStudentName}
              onChange={(e) => setNewStudentName(e.target.value)}
              className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-paradiso"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-1.5 bg-paradiso text-white rounded-lg text-xs font-medium hover:bg-paradiso-600 transition"
              >
                Crear / Cambiar
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Progress Stats */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Current Lesson Badge */}
        <div className="p-3 bg-paradiso/5 rounded-xl border border-paradiso/20">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-paradiso uppercase tracking-wider">Lección Activa</span>
            <span className="text-xs font-bold text-slate-800">Lección {student?.currentLesson || 1}</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-paradiso h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, ((student?.currentLesson || 1) / 12) * 100)}%` }}
            ></div>
          </div>
          <div className="mt-2.5 flex justify-between gap-2">
            <button
              onClick={() => onUpdateProgress({ currentLesson: Math.max(1, (student?.currentLesson || 1) - 1) })}
              className="flex-1 text-[10px] py-1 px-2 border border-slate-200 rounded bg-white text-slate-600 hover:bg-slate-50"
            >
              ← Anterior
            </button>
            <button
              onClick={() => onUpdateProgress({ currentLesson: (student?.currentLesson || 1) + 1 })}
              className="flex-1 text-[10px] py-1 px-2 border border-paradiso/30 rounded bg-paradiso text-white font-medium hover:bg-paradiso-600"
            >
              Completar y Avanzar →
            </button>
          </div>
        </div>

        {/* Mastered Concepts */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 mb-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Conceptos Dominados ({student?.masteredConcepts?.length || 0})</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {student?.masteredConcepts && student.masteredConcepts.length > 0 ? (
              student.masteredConcepts.map((c, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-medium"
                >
                  ✓ {c}
                </span>
              ))
            ) : (
              <span className="text-[11px] text-slate-400 italic">Aún no se registran conceptos</span>
            )}
          </div>
        </div>

        {/* Struggling Concepts */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 mb-2">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            <span>Puntos a Reforzar ({student?.strugglingConcepts?.length || 0})</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {student?.strugglingConcepts && student.strugglingConcepts.length > 0 ? (
              student.strugglingConcepts.map((c, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-medium"
                >
                  ⚠️ {c}
                </span>
              ))
            ) : (
              <span className="text-[11px] text-slate-400 italic">Sin puntos débiles registrados</span>
            )}
          </div>
        </div>

        {/* Add Concept Quick Form */}
        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
          <div className="text-[11px] font-medium text-slate-700 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-paradiso" />
            <span>Registrar concepto en memoria</span>
          </div>
          <input
            type="text"
            placeholder="Ej: Null Safety, Val/Var, Funciones..."
            value={newConcept}
            onChange={(e) => setNewConcept(e.target.value)}
            className="w-full text-[11px] p-1.5 border border-slate-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-paradiso"
          />
          <div className="flex gap-2">
            <button
              onClick={() => handleAddConcept('mastered')}
              className="flex-1 py-1 bg-emerald-600 text-white rounded text-[10px] font-medium hover:bg-emerald-700"
            >
              + Dominado
            </button>
            <button
              onClick={() => handleAddConcept('struggling')}
              className="flex-1 py-1 bg-amber-500 text-white rounded text-[10px] font-medium hover:bg-amber-600"
            >
              + A Reforzar
            </button>
          </div>
        </div>

        {/* Tutor Notes */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 mb-2">
            <StickyNote className="w-3.5 h-3.5 text-slate-500" />
            <span>Notas Pedagógicas de Maxister</span>
          </div>
          <div className="space-y-1.5">
            {student?.notes && student.notes.length > 0 ? (
              student.notes.map((n, i) => (
                <div key={i} className="p-2 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-600">
                  {n}
                </div>
              ))
            ) : (
              <span className="text-[11px] text-slate-400 italic">Sin notas acumuladas</span>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
