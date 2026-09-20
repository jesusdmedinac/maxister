import React, { useState, useEffect } from 'react';
import { X, Share2, Copy, Check, ExternalLink, Mail, MessageSquare, Loader2, Sparkles, MessageCircle } from 'lucide-react';
import type { UserAccount } from '../lib/auth';
import type { ChatMessage } from '../lib/agent';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: UserAccount | null;
  messages: ChatMessage[];
  activeCourse?: string;
  threadId?: string;
  onThreadCreated?: (threadId: string) => void;
}

export default function ShareTeacherModal({
  isOpen,
  onClose,
  user,
  messages,
  activeCourse,
  threadId,
  onThreadCreated,
}: Props) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && !shareUrl && user) {
      handleCreateShare();
    }
  }, [isOpen, user, threadId]);

  const handleCreateShare = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (threadId) {
        const res = await fetch(`/api/conversations/${threadId}/share`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages,
            courseId: activeCourse || user?.activeCourse,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al compartir sala');
        setShareUrl(data.roomUrl);
      } else {
        const res = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: messages[0]?.text?.substring(0, 35) + '...' || 'Consulta con el profesor',
            courseId: activeCourse || user?.activeCourse,
            messages,
            isShared: true,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al generar enlace');
        setShareUrl(data.roomUrl);
        if (data.thread?.id) {
          onThreadCreated?.(data.thread.id);
        }
      }
    } catch (err: any) {
      setError(err.message || 'No se pudo generar el enlace');
    } finally {
      setIsLoading(false);
    }
  };


  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  if (!isOpen) return null;

  const mailtoBody = encodeURIComponent(
    `Hola Jesús,\n\nSoy ${user?.name || 'un estudiante de Desde0'} y estoy trabajando en el curso "${activeCourse || user?.activeCourse}".\n\nTe comparto el enlace de mi conversación con Maxister para que puedas revisar mi código y darme una mano:\n${shareUrl || ''}\n\n¡Muchas gracias!`
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#212121] border border-white/10 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition"
          title="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="size-10 rounded-xl bg-paradiso/20 border border-paradiso/30 flex items-center justify-center text-paradiso-300">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Invitar al Profesor a este Chat</h2>
            <p className="text-xs text-white/60">
              Enlace exclusivo para que un profesor se una y te asista en tiempo real
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-white/60 text-xs">
            <Loader2 className="w-6 h-6 animate-spin text-paradiso" />
            <span>Generando enlace exclusivo para el profesor...</span>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-white/70 leading-relaxed">
              Comparte este enlace con tu profesor. <strong className="text-paradiso-300 font-medium">No necesitas salir de este chat</strong>: en cuanto tu profesor abra la consulta, esta misma pantalla se actualizará automáticamente en vivo.
            </p>

            {/* Share URL Box */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider block">
                Enlace para el profesor
              </span>
              <div className="flex items-center gap-2 bg-[#181818] border border-white/10 rounded-xl p-1.5 pl-3">
                <input
                  type="text"
                  readOnly
                  value={shareUrl || ''}
                  className="bg-transparent text-xs text-white/80 w-full outline-none select-all font-mono"
                />
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
            </div>


            {/* Teacher Contact Actions */}
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider block">
                Canales de notificación directa
              </span>

              <a
                href={`mailto:jesusdmedinac@gmail.com?subject=Consulta de tutoría Desde0 (${user?.name})&body=${mailtoBody}`}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-[#181818] hover:bg-white/5 border border-white/5 hover:border-white/10 transition text-xs text-white group"
              >
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-paradiso/20 flex items-center justify-center text-paradiso-300">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-white">Enviar Correo a Jesús Medina</p>
                    <p className="text-[11px] text-white/50">Incluye tu duda y el enlace de la sala</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-white/40 group-hover:text-white transition" />
              </a>

              <a
                href="https://discord.gg/9nK29W2qG5"
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-[#181818] hover:bg-white/5 border border-white/5 hover:border-white/10 transition text-xs text-white group"
              >
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-[#5865F2]/20 flex items-center justify-center text-[#5865F2]">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-white">Comunidad de Discord Desde0</p>
                    <p className="text-[11px] text-white/50">Pega tu enlace en el canal #dudas</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-white/40 group-hover:text-white transition" />
              </a>
            </div>
          </div>
        )}

        <div className="mt-5 pt-4 border-t border-white/5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs text-white/70 hover:text-white hover:bg-white/5 transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
