import React from 'react';
import { Plus, MessageSquare, GraduationCap, Clock, CheckCircle2, ChevronRight, Share2 } from 'lucide-react';
import type { ConversationThread } from '../lib/conversations';
import type { UserAccount } from '../lib/auth';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: UserAccount | null;
  userThreads: ConversationThread[];
  sharedThreads: ConversationThread[];
  activeThreadId?: string;
  onSelectThread: (thread: ConversationThread) => void;
  onNewChat: () => void;
}

export default function ConversationSidebar({
  isOpen,
  onClose,
  user,
  userThreads,
  sharedThreads,
  activeThreadId,
  onSelectThread,
  onNewChat,
}: Props) {
  const isTeacher = user?.role === 'teacher' || user?.role === 'root_admin';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden animate-fade-in"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-72 bg-[#141414] border-r border-white/5 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* New Chat Button */}
        <div className="p-3 border-b border-white/5">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 1024) onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold border border-white/10 transition shadow-sm"
          >
            <Plus className="w-4 h-4 text-paradiso-300" />
            <span>Nueva Consulta</span>
          </button>
        </div>

        {/* Scrollable Lists */}
        <div className="flex-1 overflow-y-auto p-3 space-y-5">
          {/* User's Personal Chats */}
          <div>
            <span className="text-[11px] font-semibold text-white/40 uppercase tracking-wider px-2 block mb-2">
              Mis Conversaciones
            </span>

            {userThreads.length === 0 ? (
              <p className="text-xs text-white/30 italic px-2">No hay conversaciones previas</p>
            ) : (
              <div className="space-y-1">
                {userThreads.map((thread) => {
                  const isActive = thread.id === activeThreadId;
                  return (
                    <button
                      key={thread.id}
                      onClick={() => {
                        onSelectThread(thread);
                        if (window.innerWidth < 1024) onClose();
                      }}
                      className={`w-full text-left flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition group ${
                        isActive
                          ? 'bg-paradiso/15 text-white font-medium border border-paradiso/30'
                          : 'text-white/70 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <MessageSquare className="w-3.5 h-3.5 text-white/40 group-hover:text-paradiso-300 shrink-0" />
                        <span className="truncate">{thread.title}</span>
                      </div>
                      {thread.isShared && (
                        <Share2 className="w-3 h-3 text-paradiso-300 shrink-0 ml-1" title="Compartido" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Teacher Consultation Inquiries (Only for Teachers / Root) */}
          {isTeacher && (
            <div>
              <div className="flex items-center gap-1.5 px-2 mb-2">
                <GraduationCap className="w-3.5 h-3.5 text-paradiso-300" />
                <span className="text-[11px] font-semibold text-paradiso-300 uppercase tracking-wider">
                  Consultas de Alumnos
                </span>
              </div>

              {sharedThreads.length === 0 ? (
                <p className="text-xs text-white/30 italic px-2">No hay consultas de alumnos</p>
              ) : (
                <div className="space-y-1.5">
                  {sharedThreads.map((thread) => {
                    const isAttended = Boolean(thread.assignedTeacherId);
                    const isMine = thread.assignedTeacherId === user?.id;
                    const isActive = thread.id === activeThreadId;

                    return (
                      <button
                        key={thread.id}
                        onClick={() => {
                          onSelectThread(thread);
                          if (window.innerWidth < 1024) onClose();
                        }}
                        className={`w-full text-left p-2.5 rounded-xl border text-xs transition ${
                          isActive
                            ? 'bg-paradiso/20 border-paradiso text-white'
                            : isMine
                            ? 'bg-[#1e1e1e] border-paradiso/40 text-white hover:bg-white/5'
                            : 'bg-[#181818] border-white/5 text-white/80 hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">
                            {thread.courseId}
                          </span>
                          {isAttended ? (
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded font-medium flex items-center gap-1 ${
                                isMine
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-white/10 text-white/50'
                              }`}
                            >
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              <span>{isMine ? 'Tú atiendes' : 'Atendido'}</span>
                            </span>
                          ) : (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              <span>Por atender</span>
                            </span>
                          )}
                        </div>
                        <p className="font-medium text-white truncate">{thread.title}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Info */}
        {user && (
          <div className="p-3 border-t border-white/5 text-xs text-white/50 flex items-center justify-between">
            <span className="truncate">{user.name}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 uppercase">
              {user.role}
            </span>
          </div>
        )}
      </aside>
    </>
  );
}
