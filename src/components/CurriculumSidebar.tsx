import React, { useState } from 'react';
import type { Course, LessonDetail } from '../lib/knowledge';
import { BookOpen, ChevronRight, CheckCircle2, Award, AlertTriangle, Lightbulb, Compass } from 'lucide-react';

interface Props {
  courses: Course[];
  activeCourseId: string;
  activeLessonNumber: number;
  activeLesson: LessonDetail | null;
  onSelectLesson: (courseId: string, lessonNumber: number) => void;
  onSelectCourse: (courseId: string) => void;
}

export default function CurriculumSidebar({
  courses,
  activeCourseId,
  activeLessonNumber,
  activeLesson,
  onSelectLesson,
  onSelectCourse,
}: Props) {
  const [activeTab, setActiveTab] = useState<'lessons' | 'phases'>('lessons');
  const activeCourse = courses.find((c) => c.id === activeCourseId) || courses[0];

  return (
    <aside className="w-80 border-r border-slate-200 bg-white flex flex-col h-full overflow-hidden shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-5 h-5 text-paradiso" />
          <h2 className="font-semibold text-slate-800 text-sm">Temario de la Academia</h2>
        </div>
        <select
          value={activeCourseId}
          onChange={(e) => onSelectCourse(e.target.value)}
          aria-label="Seleccionar Curso"
          className="w-full text-xs font-medium bg-white border border-slate-200 rounded-lg p-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-paradiso"
        >
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-medium">
        <button
          onClick={() => setActiveTab('lessons')}
          className={`flex-1 py-2 text-center border-b-2 transition-colors ${
            activeTab === 'lessons'
              ? 'border-paradiso text-paradiso font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Lecciones ({activeCourse?.lessons.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('phases')}
          className={`flex-1 py-2 text-center border-b-2 transition-colors ${
            activeTab === 'phases'
              ? 'border-paradiso text-paradiso font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Fases Lección {activeLessonNumber}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {activeTab === 'lessons' ? (
          activeCourse?.lessons.map((l) => {
            const isActive = l.lessonNumber === activeLessonNumber;
            return (
              <button
                key={l.lessonNumber}
                onClick={() => onSelectLesson(activeCourseId, l.lessonNumber)}
                className={`w-full text-left p-2.5 rounded-lg text-xs flex items-start gap-2.5 transition-all ${
                  isActive
                    ? 'bg-paradiso/10 text-paradiso-700 font-semibold border border-paradiso/30'
                    : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                }`}
              >
                <span
                  className={`size-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                    isActive ? 'bg-paradiso text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {l.lessonNumber}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="truncate font-medium">{l.title}</div>
                  {l.description && (
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">{l.description}</div>
                  )}
                </div>
                <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-40 mt-0.5" />
              </button>
            );
          })
        ) : (
          <div className="space-y-3 text-xs">
            {activeLesson ? (
              <>
                <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-100">
                  <div className="flex items-center gap-1.5 text-blue-800 font-semibold mb-1">
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>Fase 2: Teoría y Fundamentos</span>
                  </div>
                  <p className="text-slate-600 text-[11px] line-clamp-4">
                    {activeLesson.phases.phase2 || 'Teoría guiada paso a paso.'}
                  </p>
                </div>

                <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-100">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-semibold mb-1">
                    <Compass className="w-3.5 h-3.5" />
                    <span>Fase 3: Retos Prácticos</span>
                  </div>
                  <p className="text-slate-600 text-[11px] line-clamp-4">
                    {activeLesson.phases.phase3 || 'Ejercicios guiados en vivo.'}
                  </p>
                </div>

                <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-100">
                  <div className="flex items-center gap-1.5 text-amber-800 font-semibold mb-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Fase 4: Debugging y Errores</span>
                  </div>
                  <p className="text-slate-600 text-[11px] line-clamp-4">
                    {activeLesson.phases.phase4 || 'Trampas comunes y excepciones.'}
                  </p>
                </div>

                <div className="p-3 bg-purple-50/60 rounded-lg border border-purple-100">
                  <div className="flex items-center gap-1.5 text-purple-800 font-semibold mb-1">
                    <Award className="w-3.5 h-3.5" />
                    <span>Fase 5: Reto Semanal</span>
                  </div>
                  <p className="text-slate-600 text-[11px] line-clamp-4">
                    {activeLesson.phases.phase5 || 'Criterios de evaluación y entrega.'}
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center text-slate-400 py-6">Cargando detalles de la lección...</div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
