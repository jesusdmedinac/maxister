import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  User,
  GraduationCap,
  Sparkles,
  ArrowUp,
  Brain,
  CheckCircle2,
  Clock,
  RotateCcw,
  ExternalLink,
  ChevronLeft,
  VolumeX,
  Zap,
  Eye,
  LogIn,
  ShieldAlert,
} from 'lucide-react';
import type { ConversationThread, RoomMessage, AiParticipationMode } from '../lib/conversations';
import type { UserAccount } from '../lib/auth';
import AiModeSelector from './AiModeSelector';
import MarkdownRenderer from './MarkdownRenderer';
import AuthModal from './AuthModal';

interface Props {
  initialThread: ConversationThread;
  initialMessages: RoomMessage[];
  user: UserAccount | null;
}

export default function TripartiteRoom({ initialThread, initialMessages, user }: Props) {
  const [thread, setThread] = useState<ConversationThread>(initialThread);
  const [messages, setMessages] = useState<RoomMessage[]>(initialMessages);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(user);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [revertedDirectiveIds, setRevertedDirectiveIds] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleRevertDirective = async (directiveId: string) => {
    try {
      const res = await fetch(`/api/backoffice/feedback?id=${encodeURIComponent(directiveId)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setRevertedDirectiveIds((prev) => new Set(prev).add(directiveId));
      } else {
        const data = await res.json();
        alert(data.error || 'No se pudo eliminar la directriz');
      }
    } catch (err: any) {
      alert(err.message || 'Error de conexión');
    }
  };

  const isTeacher = currentUser?.role === 'teacher' || currentUser?.role === 'root_admin';
  const isStudentOwner = currentUser?.role === 'student' && currentUser?.id === thread.userId;
  const isStudentVisitor = currentUser?.role === 'student' && currentUser?.id !== thread.userId;
  const isTeacherPresent = Boolean(thread.assignedTeacherId);
  const isAssignedToMe = thread.assignedTeacherId === currentUser?.id;
  const isOtherTeacherAssigned = Boolean(thread.assignedTeacherId && thread.assignedTeacherId !== currentUser?.id);
  const canClaim = isTeacher && !thread.assignedTeacherId;
  const canRelease = isTeacher && isAssignedToMe;
  const canWrite = isStudentOwner || isAssignedToMe;


  // Real-time synchronization polling every 2 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const lastMsg = messages[messages.length - 1];
        const sinceParam = lastMsg ? `?since=${encodeURIComponent(lastMsg.createdAt)}` : '';
        const res = await fetch(`/api/conversations/${thread.id}/sync${sinceParam}`);
        if (!res.ok) return;

        const data = await res.json();
        if (data.thread) {
          setThread(data.thread);
        }
        if (data.newMessages && data.newMessages.length > 0) {
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const fresh = data.newMessages.filter((m: RoomMessage) => !existingIds.has(m.id));
            return fresh.length > 0 ? [...prev, ...fresh] : prev;
          });
        }
      } catch {
        // Silently continue on network hiccups
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [thread.id, messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const textToSend = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch(`/api/conversations/${thread.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSend }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al enviar mensaje');

      setMessages((prev) => {
        const next = [...prev, data.message];
        if (data.aiMessage) next.push(data.aiMessage);
        return next;
      });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaim = async () => {
    try {
      const res = await fetch(`/api/conversations/${thread.id}/claim`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al reclamar sala');
      setThread(data.thread);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRelease = async () => {
    if (!confirm('¿Estás seguro de que deseas ceder esta consulta a otro profesor? Los mensajes permanecerán intactos.')) {
      return;
    }
    try {
      const res = await fetch(`/api/conversations/${thread.id}/release`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al liberar consulta');
      setThread(data.thread);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSelectMode = async (mode: AiParticipationMode) => {
    try {
      const res = await fetch(`/api/conversations/${thread.id}/mode`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      const data = await res.json();
      if (res.ok) setThread(data.thread);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#181818] text-[#ececec] font-sans antialiased selection:bg-paradiso selection:text-white">
      {/* Header */}
      <header className="h-16 px-4 sm:px-6 flex items-center justify-between border-b border-white/5 bg-[#181818] shrink-0 z-10">
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition"
            title="Volver"
          >
            <ChevronLeft className="w-5 h-5" />
          </a>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
                {thread.title}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-paradiso-300 border border-white/5 font-mono">
                {thread.courseId}
              </span>
            </div>
            <p className="text-[11px] text-white/50 mt-0.5">
              {isTeacherPresent ? (
                <span className="text-emerald-400 font-medium">
                  Atendiendo: {thread.assignedTeacherName}
                </span>
              ) : (
                <span className="text-amber-400 font-medium">
                  Esperando que un profesor atienda la consulta
                </span>
              )}
            </p>
          </div>
        </div>

        {/* User Identity / Actions */}
        <div className="flex items-center gap-2">
          {!currentUser ? (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-paradiso hover:bg-paradiso-600 text-white text-xs font-semibold shadow-md shadow-paradiso/20 transition"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Iniciar Sesión</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-white/80">
                {isTeacher ? (
                  <GraduationCap className="w-3.5 h-3.5 text-[#5865F2]" />
                ) : (
                  <User className="w-3.5 h-3.5 text-paradiso-400" />
                )}
                <span className="font-medium truncate max-w-[120px]">{currentUser.name}</span>
                <span className="text-[10px] text-white/40 uppercase font-mono">
                  {isTeacher ? 'Profesor' : 'Alumno'}
                </span>
              </div>

              {canRelease && (
                <button
                  onClick={handleRelease}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 text-xs font-semibold transition"
                  title="Ceder la sala a otro profesor para que continúe la atención"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Ceder Consulta</span>
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col items-center justify-between overflow-hidden relative">
        {/* Messages List */}
        <div className="flex-1 w-full max-w-3xl overflow-y-auto px-4 py-6 space-y-6">
          {messages.map((msg) => {
            const isBot = msg.senderRole === 'assistant';
            const isTeacherSender = msg.senderRole === 'teacher';

            return (
              <div key={msg.id} className="space-y-2">
                <div className="flex gap-3.5 items-start">
                  <div
                    className={`size-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs ${
                      isBot
                        ? 'bg-paradiso text-white'
                        : isTeacherSender
                        ? 'bg-[#5865F2] text-white'
                        : 'bg-white/20 text-white'
                    }`}
                  >
                    {isBot ? <Bot className="w-4 h-4" /> : isTeacherSender ? <GraduationCap className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="text-xs font-semibold text-white/50 mb-1.5 flex items-center gap-1.5">
                      <span>{msg.senderName}</span>
                      {isBot && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/5 text-paradiso-300 font-normal">
                          Tutor IA
                        </span>
                      )}
                      {isTeacherSender && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#5865F2]/20 text-[#5865F2] font-semibold">
                          Profesor
                        </span>
                      )}
                    </div>

                    {isBot ? (
                      <MarkdownRenderer content={msg.text} />
                    ) : (
                      <div
                        className={`text-sm leading-relaxed text-[#ececec] whitespace-pre-wrap font-sans p-3.5 rounded-2xl border ${
                          isTeacherSender
                            ? 'bg-[#1e1e2e] border-[#5865F2]/30 shadow-md'
                            : 'bg-[#212121] border-white/5'
                        }`}
                      >
                        {msg.text}
                      </div>
                    )}
                  </div>
                </div>

                {/* Explicit Teacher Feedback Directive Badge with revert button */}
                {msg.feedbackDirective && (
                  <div
                    className={`ml-10 p-2.5 rounded-xl border text-xs flex items-center justify-between gap-3 animate-fade-in ${
                      revertedDirectiveIds.has(msg.feedbackDirective.id)
                        ? 'bg-white/5 border-white/10 text-white/40'
                        : 'bg-paradiso/10 border-paradiso/30 text-paradiso-300'
                    }`}
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      <Brain
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          revertedDirectiveIds.has(msg.feedbackDirective.id)
                            ? 'text-white/40'
                            : 'text-paradiso-300'
                        }`}
                      />
                      <div>
                        <span className="font-bold block text-[11px] uppercase tracking-wider">
                          {revertedDirectiveIds.has(msg.feedbackDirective.id)
                            ? 'Directriz eliminada de la memoria estratégica'
                            : 'Maxister aprendió de esta directriz del profesor:'}
                        </span>
                        <span className="italic truncate block">
                          "{msg.feedbackDirective.directiveContent}"
                        </span>
                      </div>
                    </div>

                    {isTeacher && !revertedDirectiveIds.has(msg.feedbackDirective.id) && (
                      <button
                        onClick={() => handleRevertDirective(msg.feedbackDirective!.id)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-[11px] font-medium transition shrink-0 border border-red-500/30 shadow-sm"
                        title="Deshacer y eliminar de la memoria estratégica"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Deshacer</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-4 items-start animate-pulse">
              <div className="size-7 rounded-full bg-paradiso text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex-1 text-xs text-white/50 flex items-center gap-2 pt-1">
                <Brain className="w-3.5 h-3.5 animate-spin text-paradiso-300" />
                <span>Maxister está analizando la conversación...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Control & Input Bar */}
        <div className="w-full max-w-3xl px-4 pb-4 pt-2 bg-[#181818]/95 backdrop-blur-sm shrink-0 space-y-2.5">
          {/* 1. Unauthenticated Visitor Banner */}
          {!currentUser && (
            <div className="p-4 rounded-2xl bg-[#212121] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left shadow-lg">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-white/60">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Estás viendo esta consulta en modo solo lectura</p>
                  <p className="text-xs text-white/50">Inicia sesión como alumno o profesor para participar en la conversación.</p>
                </div>
              </div>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-paradiso hover:bg-paradiso-600 text-white text-xs font-semibold transition shrink-0"
              >
                <LogIn className="w-4 h-4" />
                <span>Iniciar Sesión</span>
              </button>
            </div>
          )}

          {/* 2. Authenticated Student Visitor (not room owner) */}
          {currentUser && isStudentVisitor && (
            <div className="p-4 rounded-2xl bg-[#212121] border border-white/10 flex items-center gap-3 shadow-lg">
              <div className="size-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-white/60">
                <Eye className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Estás viendo esta consulta en modo solo lectura</p>
                <p className="text-xs text-white/50">Esta consulta pertenece a otro estudiante. Solo el autor y el profesor asignado pueden enviar mensajes.</p>
              </div>
            </div>
          )}

          {/* 3. Authenticated Teacher, Room Open (canClaim) */}
          {currentUser && canClaim && (
            <div className="p-4 rounded-2xl bg-[#1e1e2e] border border-[#5865F2]/30 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-[#5865F2]/20 border border-[#5865F2]/40 flex items-center justify-center shrink-0 text-[#5865F2]">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Unirse al chat como profesor</p>
                  <p className="text-xs text-white/60">Esta consulta está abierta. Al unirte, responderás al estudiante y podrás orientar a Maxister.</p>
                </div>
              </div>
              <button
                onClick={handleClaim}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-semibold transition shrink-0 shadow-md shadow-[#5865F2]/20"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Unirse como profesor</span>
              </button>
            </div>
          )}

          {/* 4. Authenticated Teacher, Another Teacher Assigned */}
          {currentUser && isOtherTeacherAssigned && isTeacher && (
            <div className="p-4 rounded-2xl bg-[#212121] border border-white/10 flex items-center gap-3 shadow-lg">
              <div className="size-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 text-amber-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  {thread.assignedTeacherName || 'Otro profesor'} es el profesor asignado
                </p>
                <p className="text-xs text-white/50">
                  Esta consulta está siendo atendida activamente. Permanece en modo solo lectura para otros profesores.
                </p>
              </div>
            </div>
          )}

          {/* 5. Interactive Chat (canWrite) */}
          {canWrite && (
            <>
              {/* AI Mode Selector: ONLY VISIBLE WHEN TEACHER IS PRESENT */}
              {isTeacherPresent && (
                <AiModeSelector
                  currentMode={thread.aiMode}
                  onSelectMode={handleSelectMode}
                  disabled={isLoading}
                />
              )}

              {/* Omnibar Input */}
              <div className="bg-[#212121] border border-white/10 rounded-3xl p-2.5 shadow-2xl focus-within:border-white/20 transition-all">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={
                    isTeacher
                      ? 'Escribe tu respuesta al alumno o dale una directriz a Maxister...'
                      : 'Escribe tu mensaje en la sala compartida...'
                  }
                  rows={1}
                  disabled={isLoading}
                  className="w-full bg-transparent text-sm text-white placeholder-white/40 px-3 py-1.5 outline-none resize-none min-h-[38px] max-h-32"
                />

                <div className="flex items-center justify-between pt-1 px-1.5">
                  <div className="flex items-center gap-2 text-[11px] text-white/40">
                    {thread.aiMode === 'off' && isTeacherPresent && (
                      <span className="flex items-center gap-1 text-white/40">
                        <VolumeX className="w-3 h-3" />
                        <span>Solo humanos</span>
                      </span>
                    )}
                    {thread.aiMode === 'auto' && isTeacherPresent && (
                      <span className="flex items-center gap-1 text-amber-300/80">
                        <Zap className="w-3 h-3 text-amber-300" />
                        <span>Copiloto Socrático</span>
                      </span>
                    )}
                    {(!isTeacherPresent || thread.aiMode === 'on') && (
                      <span className="flex items-center gap-1 text-paradiso-300">
                        <Brain className="w-3 h-3 text-paradiso-300" />
                        <span>Tutor Activo</span>
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isLoading}
                    className="size-7 rounded-full bg-white text-black flex items-center justify-center hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    title="Enviar"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(u) => {
          setCurrentUser(u);
          setIsAuthModalOpen(false);
        }}
      />
    </div>
  );
}
