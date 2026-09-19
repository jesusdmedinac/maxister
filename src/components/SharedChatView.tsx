import React from 'react';
import { Bot, User, BookOpen, Calendar, Mail, ExternalLink, GraduationCap } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import type { SharedChatSnapshot } from '../lib/auth';

interface Props {
  snapshot: SharedChatSnapshot;
}

export default function SharedChatView({ snapshot }: Props) {
  const formattedDate = new Date(snapshot.createdAt).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="flex flex-col min-h-screen w-full bg-[#181818] text-[#ececec] font-sans antialiased">
      {/* Header */}
      <header className="h-14 px-4 sm:px-6 flex items-center justify-between border-b border-white/5 bg-[#181818] shrink-0 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-white/90 transition text-sm font-semibold"
          >
            <div className="size-6 rounded-md bg-paradiso flex items-center justify-center text-white">
              <Bot className="w-4 h-4" />
            </div>
            <span>Maxister</span>
          </a>
          <span className="text-white/30 text-sm hidden sm:inline">/</span>
          <span className="text-xs text-white/60 hidden sm:inline">Conversación Compartida</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-paradiso/20 border border-paradiso/30 text-xs font-medium text-paradiso-300">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Vista para el Profesor</span>
          </div>
          <a
            href="https://desde0.jesusdmedinac.com"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-1 text-xs text-white/60 hover:text-paradiso-300 transition ml-2"
          >
            <span>Desde0</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Student & Course Context Card */}
        <div className="bg-[#212121] border border-white/10 rounded-2xl p-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-paradiso-300">
                Consulta Pedagógica de Estudiante
              </span>
              <h1 className="text-xl font-bold text-white mt-1">
                {snapshot.studentName}
              </h1>
              <p className="text-xs text-white/60 mt-0.5 flex items-center gap-2">
                <span>{snapshot.studentEmail}</span>
              </p>
            </div>

            <a
              href={`mailto:${snapshot.studentEmail}?subject=Apoyo de tutoría Desde0 - ${encodeURIComponent(snapshot.courseId)}`}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-paradiso hover:bg-paradiso-600 text-white text-xs font-semibold shadow-lg shadow-paradiso/20 transition self-start sm:self-center"
            >
              <Mail className="w-4 h-4" />
              <span>Responder al Estudiante</span>
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 text-xs text-white/70">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-paradiso-300" />
              <span>Curso: <strong className="text-white">{snapshot.courseId}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-white/40" />
              <span>Fecha: {formattedDate}</span>
            </div>
          </div>
        </div>

        {/* Conversation Transcript */}
        <div className="space-y-6 pt-2">
          {snapshot.messages.map((msg, index) => {
            const isBot = msg.role === 'model';
            return (
              <div key={index} className="flex gap-4 items-start">
                <div
                  className={`size-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    isBot ? 'bg-paradiso text-white' : 'bg-white/20 text-white'
                  }`}
                >
                  {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="text-xs font-semibold text-white/50 mb-1.5 flex items-center gap-1.5">
                    <span>{isBot ? 'Maxister (Tutor)' : snapshot.studentName}</span>
                  </div>
                  {isBot ? (
                    <MarkdownRenderer content={msg.text} />
                  ) : (
                    <div className="text-sm leading-relaxed text-[#ececec] whitespace-pre-wrap font-sans bg-[#212121]/50 p-4 rounded-xl border border-white/5">
                      {msg.text}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
