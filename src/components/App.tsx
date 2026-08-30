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
} from 'lucide-react';
import type { ChatMessage } from '../lib/agent';

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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const messageText = textToSend || input;
    if (!messageText.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', text: messageText.trim() };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText.trim(),
          history: messages,
        }),
      });

      if (!res.body) throw new Error('No stream available');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';

      setMessages([...newHistory, { role: 'model', text: '' }]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        assistantText += chunk;
        setMessages([...newHistory, { role: 'model', text: assistantText }]);
      }
    } catch (err: any) {
      setMessages([
        ...newHistory,
        { role: 'model', text: `⚠️ Error de conexión: ${err?.message || 'Error desconocido'}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput('');
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-screen w-screen bg-[#181818] text-[#ececec] font-sans antialiased selection:bg-paradiso selection:text-white">
      {/* Top Bar */}
      <header className="h-14 px-4 sm:px-6 flex items-center justify-between border-b border-white/5 bg-[#181818] shrink-0 z-10">
        <div className="flex items-center gap-3">
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
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#212121] border border-white/10 text-xs font-medium text-white/80">
          <span className="size-2 rounded-full bg-emerald-400"></span>
          <span>Tutor Socrático • Desde0</span>
        </div>

        {/* Right Links */}
        <div className="flex items-center gap-3">
          {hasMessages && (
            <button
              onClick={handleNewChat}
              className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nuevo Chat</span>
            </button>
          )}
          <a
            href="https://desde0.jesusdmedinac.com"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-xs text-white/60 hover:text-paradiso-300 transition"
          >
            <span>Academia</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-between overflow-hidden relative">
        {!hasMessages ? (
          /* Empty / Hero State (Inspired by ChatGPT) */
          <div className="flex-1 w-full max-w-2xl px-4 flex flex-col items-center justify-center -mt-10">
            {/* Center Greeting */}
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white mb-8 text-center">
              ¿Cuál es el programa de hoy?
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

                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white/50 mb-1">
                      {isBot ? 'Maxister' : 'Tú'}
                    </div>
                    <div className="text-sm leading-relaxed text-[#ececec] whitespace-pre-wrap font-sans">
                      {msg.text}
                    </div>
                  </div>
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
          <div className="w-full max-w-3xl px-4 pb-4 pt-2 bg-[#181818]/90 backdrop-blur-sm shrink-0">
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
                placeholder="Escribe tu mensaje a Maxister..."
                rows={1}
                disabled={isLoading}
                className="w-full bg-transparent text-sm text-white placeholder-white/40 px-3 py-1.5 outline-none resize-none min-h-[38px] max-h-32"
              />

              <div className="flex items-center justify-between pt-1 px-1.5">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-[11px] font-medium text-white/50">
                    <Brain className="w-3 h-3 text-paradiso-300" />
                    <span>Socrático</span>
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

            <p className="text-[10px] text-center text-white/40 mt-2">
              Maxister es un tutor pedagógico socrático. Te guía con preguntas y pistas para aprender a pensar como programador.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
