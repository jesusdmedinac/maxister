import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Plus,
  Compass,
  Lightbulb,
  Bug,
  HelpCircle,
  BookOpen,
  ArrowUp,
  Brain,
  RotateCcw,
  Bot,
  User,
  ExternalLink,
  LogIn,
  LogOut,
  Share2,
  GraduationCap,
  Menu,
  Shield,
} from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import AuthModal from './AuthModal';
import ShareTeacherModal from './ShareTeacherModal';
import ConversationSidebar from './ConversationSidebar';
import AiModeSelector from './AiModeSelector';
import type { ChatMessage } from '../lib/agent';
import type { UserAccount } from '../lib/auth';
import type { ConversationThread, AiParticipationMode } from '../lib/conversations';

export interface AppMessage {
  id?: string;
  role: 'user' | 'model';
  senderRole?: 'student' | 'teacher' | 'assistant';
  senderName?: string;
  text: string;
  feedbackDirective?: {
    id: string;
    title: string;
    directiveContent: string;
  };
  createdAt?: string;
}

const SUGGESTIONS = [
  {
    icon: Lightbulb,
    title: 'Explícame un concepto con una analogía cotidiana',
    prompt: '¿Podrías explicarme cómo funcionan las variables y la memoria usando una analogía del mundo real?',
  },
  {
    icon: Bug,
    title: 'Ayúdame a encontrar el error en mi código',
    prompt: 'Mi código arroja un error y no entiendo qué significa. ¿Me ayudas a interpretarlo paso a paso?',
  },
  {
    icon: HelpCircle,
    title: 'Dame una pista para resolver un reto sin darme la solución',
    prompt: 'Estoy trabado en un ejercicio de programación. ¿Puedes darme una pista socrática para avanzar?',
  },
  {
    icon: BookOpen,
    title: '¿Qué cursos y temarios hay disponibles en Desde0?',
    prompt: '¿Cuáles son las rutas de aprendizaje de la academia Desde0 y qué enseña cada una?',
  },
];

export default function App() {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [userThreads, setUserThreads] = useState<ConversationThread[]>([]);
  const [sharedThreads, setSharedThreads] = useState<ConversationThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [activeThread, setActiveThread] = useState<ConversationThread | null>(null);

  const [messages, setMessages] = useState<AppMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Restore existing session on mount
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  // Load conversation threads
  const loadThreads = async () => {
    try {
      const res = await fetch('/api/conversations');
      const data = await res.json();
      if (res.ok) {
        setUserThreads(data.userThreads || []);
        setSharedThreads(data.sharedThreads || []);
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    loadThreads();
  }, [user]);

  // Real-time synchronization polling when thread is active
  useEffect(() => {
    if (!activeThreadId) return;

    const interval = setInterval(async () => {
      try {
        const lastMsg = messages[messages.length - 1];
        const sinceParam = lastMsg?.createdAt ? `?since=${encodeURIComponent(lastMsg.createdAt)}` : '';
        const res = await fetch(`/api/conversations/${activeThreadId}/sync${sinceParam}`);
        if (!res.ok) return;

        const data = await res.json();
        if (data.thread) {
          setActiveThread(data.thread);
        }

        if (data.newMessages && data.newMessages.length > 0) {
          setMessages((prev) => {
            const existingKeys = new Set(
              prev.map((m) => m.id || `${m.senderRole || m.role}:${m.text.trim()}`)
            );
            const fresh: AppMessage[] = [];

            for (const m of data.newMessages) {
              const key = m.id || `${m.senderRole}:${m.text.trim()}`;
              if (!existingKeys.has(key)) {
                existingKeys.add(key);
                fresh.push({
                  id: m.id,
                  role: m.senderRole === 'assistant' ? 'model' : 'user',
                  senderRole: m.senderRole,
                  senderName: m.senderName,
                  text: m.text,
                  feedbackDirective: m.feedbackDirective,
                  createdAt: m.createdAt,
                });
              }
            }

            return fresh.length > 0 ? [...prev, ...fresh] : prev;
          });
        }
      } catch {
        // Silently continue
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [activeThreadId, messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSelectThread = async (thread: ConversationThread) => {
    setActiveThreadId(thread.id);
    setActiveThread(thread);
    setIsLoading(true);
    try {
      const res = await fetch(`/api/conversations/${thread.id}`);
      const data = await res.json();
      if (res.ok) {
        if (data.thread) setActiveThread(data.thread);
        if (data.messages) {
          setMessages(
            data.messages.map((m: any) => ({
              id: m.id,
              role: m.senderRole === 'assistant' ? 'model' : 'user',
              senderRole: m.senderRole,
              senderName: m.senderName,
              text: m.text,
              feedbackDirective: m.feedbackDirective,
              createdAt: m.createdAt,
            }))
          );
        }
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAiMode = async (mode: AiParticipationMode) => {
    if (!activeThreadId) return;
    try {
      const res = await fetch(`/api/conversations/${activeThreadId}/mode`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      const data = await res.json();
      if (res.ok && data.thread) {
        setActiveThread(data.thread);
      }
    } catch {
      // Fallback
    }
  };

  const handleSend = async (textToSend?: string) => {
    const messageText = textToSend || input;
    if (!messageText.trim() || isLoading) return;

    // If conversation is already shared (tripartite consultation)
    if (activeThread?.isShared) {
      const userMsg: AppMessage = {
        role: 'user',
        senderRole: 'student',
        senderName: user?.name || 'Estudiante',
        text: messageText.trim(),
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setIsLoading(true);

      try {
        const res = await fetch(`/api/conversations/${activeThread.id}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: messageText.trim() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al enviar mensaje');

        setMessages((prev) => {
          const withoutOptimistic = prev.slice(0, prev.length - 1);
          const next: AppMessage[] = [
            ...withoutOptimistic,
            {
              id: data.message.id,
              role: 'user',
              senderRole: data.message.senderRole,
              senderName: data.message.senderName,
              text: data.message.text,
              createdAt: data.message.createdAt,
            },
          ];
          if (data.aiMessage) {
            next.push({
              id: data.aiMessage.id,
              role: 'model',
              senderRole: 'assistant',
              senderName: 'Maxister',
              text: data.aiMessage.text,
              createdAt: data.aiMessage.createdAt,
            });
          }
          return next;
        });
      } catch (err: any) {
        alert(err.message || 'Error al enviar mensaje en la consulta compartida');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Standard solo student chat with streaming
    const userMsg: AppMessage = { role: 'user', senderRole: 'student', text: messageText.trim() };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setIsLoading(true);

    // If no active thread exists, create one
    let currentThreadId = activeThreadId;
    if (!currentThreadId && user) {
      try {
        const createRes = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: messageText.trim().substring(0, 35) + '...',
            courseId: user.activeCourse,
          }),
        });
        const createData = await createRes.json();
        if (createRes.ok && createData.thread) {
          currentThreadId = createData.thread.id;
          setActiveThreadId(currentThreadId);
          setActiveThread(createData.thread);
          loadThreads();
        }
      } catch {
        // Fallback
      }
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText.trim(),
          history: messages,
          studentName: user?.name,
          activeCourse: user?.activeCourse,
        }),
      });

      if (!res.body) throw new Error('No stream available');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';

      setMessages([...newHistory, { role: 'model', senderRole: 'assistant', text: '' }]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        assistantText += chunk;
        setMessages([...newHistory, { role: 'model', senderRole: 'assistant', text: assistantText }]);
      }

      if (currentThreadId) {
        fetch(`/api/conversations/${currentThreadId}/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              ...newHistory,
              { role: 'model', text: assistantText },
            ],
          }),
        }).catch(() => {});
      }
    } catch (err: any) {
      setMessages([
        ...newHistory,
        { role: 'model', senderRole: 'assistant', text: `⚠️ Error de conexión: ${err?.message || 'Error desconocido'}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setActiveThreadId(null);
    setActiveThread(null);
    setMessages([]);
    setInput('');
  };


  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setUserThreads([]);
      setSharedThreads([]);
      handleNewChat();
    } catch {
      // Fallback
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex h-screen w-screen bg-[#181818] text-[#ececec] font-sans antialiased selection:bg-paradiso selection:text-white overflow-hidden">
      {/* Thread History Sidebar */}
      <ConversationSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        user={user}
        userThreads={userThreads}
        sharedThreads={sharedThreads}
        activeThreadId={activeThreadId || undefined}
        onSelectThread={handleSelectThread}
        onNewChat={handleNewChat}
      />

      {/* Main Studio Column */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 px-4 sm:px-6 flex items-center justify-between border-b border-white/5 bg-[#181818] shrink-0 z-10">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition lg:hidden"
              title="Historial de conversaciones"
            >
              <Menu className="w-5 h-5" />
            </button>

            <button
              onClick={handleNewChat}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-white/90 transition text-sm font-semibold"
              title="Nueva conversación"
            >
              <div className="size-6 rounded-md bg-paradiso flex items-center justify-center text-white">
                <Bot className="w-4 h-4" />
              </div>
              <span>Maxister</span>
            </button>
          </div>

          {/* Center Pill Mode */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#212121] border border-white/10 text-xs font-medium text-white/80">
            <span className="size-2 rounded-full bg-emerald-400"></span>
            <span>Tutor Socrático • Desde0</span>
          </div>

          {/* Right Links & Auth State */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Share with Teacher Button */}
            {hasMessages && (
              <button
                onClick={() => {
                  if (!user) {
                    setIsAuthModalOpen(true);
                  } else {
                    setIsShareModalOpen(true);
                  }
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-paradiso/10 hover:bg-paradiso/20 text-paradiso-300 text-xs font-semibold border border-paradiso/20 transition"
                title="Compartir consulta con el profesor"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Compartir con el profesor</span>
              </button>
            )}

            {/* Root Admin Backoffice Quick Link */}
            {user?.role === 'root_admin' && (
              <a
                href="/backoffice"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/20 transition"
              >
                <Shield className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Backoffice</span>
              </a>
            )}

            {/* User Authentication Control */}
            {user ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#212121] border border-white/10 text-xs">
                  <div className="size-4 rounded-full bg-paradiso flex items-center justify-center text-[10px] font-bold text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-white/90 font-medium max-w-[90px] truncate">
                    {user.name.split(' ')[0]}
                  </span>
                  <span className="hidden xl:inline text-[10px] text-paradiso-300 bg-paradiso/10 px-1.5 py-0.5 rounded">
                    {user.activeCourse}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition"
                  title="Cerrar Sesión"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-paradiso hover:bg-paradiso-600 text-white text-xs font-semibold shadow-md shadow-paradiso/20 transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Iniciar Sesión</span>
              </button>
            )}

            <a
              href="https://desde0.jesusdmedinac.com"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1 text-xs text-white/60 hover:text-paradiso-300 transition pl-1"
            >
              <span>Academia</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col items-center justify-between overflow-hidden relative">
          {/* Active Teacher Presence Live Banner */}
          {hasMessages && activeThread?.assignedTeacherId && (
            <div className="w-full max-w-3xl px-4 pt-3 shrink-0 z-10 animate-fade-in">
              <div className="p-3 rounded-2xl bg-gradient-to-r from-[#5865F2]/20 via-[#5865F2]/10 to-transparent border border-[#5865F2]/30 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-xl bg-[#5865F2] flex items-center justify-center text-white shrink-0 shadow-md">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white flex items-center gap-2">
                      <span>Profesor en sala: {activeThread.assignedTeacherName}</span>
                      <span className="size-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    </p>
                    <p className="text-[11px] text-white/60">
                      Tu profesor se ha unido a esta consulta y te está guiando en vivo.
                    </p>
                  </div>
                </div>
                <div className="text-[10px] px-2.5 py-1 rounded-full bg-white/10 text-white/90 font-mono font-medium hidden sm:block">
                  1 a 1 En Vivo
                </div>
              </div>
            </div>
          )}

          {!hasMessages ? (
            /* Empty / Hero State */
            <div className="flex-1 w-full max-w-2xl px-4 flex flex-col items-center justify-center -mt-10">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white mb-8 text-center">
                {user ? `¿Qué vamos a aprender hoy, ${user.name.split(' ')[0]}?` : '¿Cuál es el programa de hoy?'}
              </h1>

              {/* Omnibar Input */}
              <div className="w-full bg-[#212121] border border-white/10 rounded-3xl p-2.5 shadow-2xl focus-within:border-white/20 transition-all">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Pregunta lo que quieras sobre tu código o lección..."
                  rows={1}
                  className="w-full bg-transparent text-sm text-white placeholder-white/40 px-3 py-2 outline-none resize-none min-h-[44px] max-h-40"
                />

                <div className="flex items-center justify-between pt-1 px-1.5">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-[11px] font-medium text-white/60 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                      <Brain className="w-3 h-3 text-paradiso-300" />
                      <span>Pensar socrático</span>
                    </span>
                  </div>

                  <button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isLoading}
                    className="size-8 rounded-full bg-white text-black flex items-center justify-center hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    title="Enviar"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Quick Action Suggestions */}
              <div className="w-full mt-6 space-y-2">
                {SUGGESTIONS.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSend(item.prompt)}
                      className="w-full text-left flex items-center gap-3.5 px-4 py-3 rounded-2xl bg-[#212121]/50 hover:bg-[#212121] border border-white/5 hover:border-white/10 transition group text-xs text-white/80"
                    >
                      <Icon className="w-4 h-4 text-white/50 group-hover:text-paradiso-300 transition shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Active Chat State */
            <div className="flex-1 w-full max-w-3xl overflow-y-auto px-4 py-6 space-y-6">
              {messages.map((msg, index) => {
                const isBot = msg.senderRole === 'assistant' || msg.role === 'model';
                const isTeacher = msg.senderRole === 'teacher';

                return (
                  <div key={msg.id || index} className="space-y-2">
                    <div className="flex gap-4 items-start">
                      <div
                        className={`size-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs ${
                          isBot
                            ? 'bg-paradiso text-white'
                            : isTeacher
                            ? 'bg-[#5865F2] text-white'
                            : 'bg-white/20 text-white'
                        }`}
                      >
                        {isBot ? (
                          <Bot className="w-4 h-4" />
                        ) : isTeacher ? (
                          <GraduationCap className="w-4 h-4" />
                        ) : (
                          <User className="w-4 h-4" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="text-xs font-semibold text-white/50 mb-1.5 flex items-center gap-1.5">
                          <span>
                            {isBot
                              ? 'Maxister'
                              : isTeacher
                              ? msg.senderName || 'Profesor'
                              : user?.name
                              ? user.name.split(' ')[0]
                              : 'Tú'}
                          </span>
                          {isBot && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/5 text-paradiso-300 font-normal">
                              Tutor IA
                            </span>
                          )}
                          {isTeacher && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#5865F2]/20 text-[#5865F2] font-semibold">
                              Profesor
                            </span>
                          )}
                        </div>

                        {isBot ? (
                          <MarkdownRenderer content={msg.text} />
                        ) : (
                          <div
                            className={`text-sm leading-relaxed text-[#ececec] whitespace-pre-wrap font-sans ${
                              isTeacher
                                ? 'p-3.5 rounded-2xl bg-[#1e1e2e] border border-[#5865F2]/30 shadow-md'
                                : ''
                            }`}
                          >
                            {msg.text}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Teacher feedback directive badge */}
                    {msg.feedbackDirective && (
                      <div className="ml-11 p-2.5 rounded-xl bg-paradiso/10 border border-paradiso/30 text-paradiso-300 text-xs flex items-start gap-2 animate-fade-in">
                        <Brain className="w-4 h-4 shrink-0 mt-0.5 text-paradiso-300" />
                        <div>
                          <span className="font-bold block text-[11px] uppercase tracking-wider text-paradiso-200">
                            Maxister aprendió de esta directriz del profesor:
                          </span>
                          <span className="italic text-white/90">"{msg.feedbackDirective.directiveContent}"</span>
                        </div>
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
                    <span>Maxister está razonando tu respuesta socrática...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Bottom Input (Only when chatting) */}
          {hasMessages && (
            <div className="w-full max-w-3xl px-4 pb-4 pt-2 bg-[#181818]/90 backdrop-blur-sm shrink-0 space-y-2.5">
              {/* Dynamic AI Mode Selector when Teacher is in room */}
              {activeThread?.assignedTeacherId && (
                <AiModeSelector
                  currentMode={activeThread.aiMode}
                  onSelectMode={handleSelectAiMode}
                  disabled={isLoading}
                />
              )}

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
                    activeThread?.assignedTeacherId
                      ? 'Escribe tu mensaje en la consulta compartida...'
                      : 'Escribe tu mensaje a Maxister...'
                  }
                  rows={1}
                  disabled={isLoading}
                  className="w-full bg-transparent text-sm text-white placeholder-white/40 px-3 py-1.5 outline-none resize-none min-h-[38px] max-h-32"
                />

                <div className="flex items-center justify-between pt-1 px-1.5">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-[11px] font-medium text-white/50">
                      <Brain className="w-3 h-3 text-paradiso-300" />
                      <span>{activeThread?.assignedTeacherId ? 'Tripartito' : 'Socrático'}</span>
                    </span>
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

              {!activeThread?.assignedTeacherId && (
                <p className="text-[10px] text-center text-white/40 mt-2">
                  Maxister es un tutor pedagógico socrático. ¿Duda compleja? Usa el botón{' '}
                  <strong className="text-paradiso-300 font-medium">Compartir con el profesor</strong> para invitar a un humano a esta misma pantalla.
                </p>
              )}
            </div>
          )}
        </main>

      </div>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(newUser) => setUser(newUser)}
      />

      <ShareTeacherModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        user={user}
        messages={messages}
        activeCourse={user?.activeCourse}
        threadId={activeThreadId || undefined}
        onThreadCreated={(newId) => {
          setActiveThreadId(newId);
          fetch(`/api/conversations/${newId}`)
            .then((res) => res.json())
            .then((data) => {
              if (data.thread) setActiveThread(data.thread);
            })
            .catch(() => {});
          loadThreads();
        }}
      />
    </div>
  );
}
