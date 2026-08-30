import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Lightbulb, AlertTriangle, HelpCircle, Loader2 } from 'lucide-react';
import type { ChatMessage } from '../lib/agent';
import type { StudentProfile } from '../lib/memory';
import type { LessonDetail } from '../lib/knowledge';

interface Props {
  student: StudentProfile | null;
  lesson: LessonDetail | null;
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
}

export default function ChatRoom({ student, lesson, messages, isLoading, onSendMessage }: Props) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleQuickPrompt = (prompt: string) => {
    if (isLoading) return;
    onSendMessage(prompt);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/50 overflow-hidden">
      {/* Active Lesson Context Header */}
      <div className="px-6 py-3 bg-white border-b border-slate-200 flex items-center justify-between shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-paradiso/10 text-paradiso">
              <Sparkles className="w-3 h-3" /> Tutor Socrático
            </span>
            <h1 className="font-semibold text-slate-800 text-sm">
              {lesson ? `${lesson.title}` : 'Sala de Tutoría'}
            </h1>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Acompañante 24/7 para {student?.name || 'Estudiante'} • {student?.activeCourse}
          </p>
        </div>

        {/* Quick Socratic Prompt Buttons */}
        <div className="hidden lg:flex items-center gap-1.5">
          <button
            onClick={() => handleQuickPrompt('¿Cuál es el objetivo principal de esta lección y cómo se aplica en la vida real?')}
            className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full flex items-center gap-1 transition"
          >
            <Lightbulb className="w-3 h-3 text-amber-500" />
            <span>Objetivo</span>
          </button>
          <button
            onClick={() => handleQuickPrompt('¿Cuáles son los errores o trampas más comunes de esta lección (Fase 4)?')}
            className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full flex items-center gap-1 transition"
          >
            <AlertTriangle className="w-3 h-3 text-rose-500" />
            <span>Errores Comunes</span>
          </button>
          <button
            onClick={() => handleQuickPrompt('Dame una pista para resolver el reto de esta lección sin darme la solución completa.')}
            className="text-[11px] px-2.5 py-1 bg-paradiso/10 hover:bg-paradiso/20 text-paradiso font-medium rounded-full flex items-center gap-1 transition"
          >
            <HelpCircle className="w-3 h-3" />
            <span>Pista del Reto</span>
          </button>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, index) => {
          const isBot = msg.role === 'model';
          return (
            <div key={index} className={`flex gap-3 max-w-3xl ${isBot ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}>
              <div
                className={`size-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                  isBot ? 'bg-paradiso text-white' : 'bg-slate-800 text-white'
                }`}
              >
                {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              <div
                className={`p-4 rounded-2xl text-xs leading-relaxed shadow-sm ${
                  isBot
                    ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'
                    : 'bg-paradiso text-white rounded-tr-sm'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans">{msg.text}</div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 max-w-3xl mr-auto">
            <div className="size-8 rounded-full bg-paradiso text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 text-slate-600 rounded-tl-sm flex items-center gap-2 text-xs">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-paradiso" />
              <span>Maxister está razonando tu respuesta socrática...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="p-4 bg-white border-t border-slate-200">
        <form onSubmit={handleSubmit} className="flex gap-2 max-w-4xl mx-auto items-center">
          <input
            type="text"
            placeholder={`Pregúntale a Maxister sobre la Lección ${lesson?.lessonNumber || 1}, pega tu código o consulta tus dudas...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            className="flex-1 p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-paradiso text-slate-800 placeholder-slate-400"
          />
          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="px-4 py-3 bg-paradiso text-white rounded-xl text-xs font-semibold hover:bg-paradiso-600 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-1.5 shadow-sm"
          >
            <span>Enviar</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
