import React, { useState } from 'react';
import { X, Lock, Mail, User, BookOpen, AlertCircle, Loader2 } from 'lucide-react';
import type { UserAccount } from '../lib/auth';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserAccount) => void;
  initialMode?: 'login' | 'register';
}

const COURSES = [
  { id: 'para-no-programadores', label: 'Programación Desde 0 - Para No Programadores' },
  { id: 'para-principiantes', label: 'Para Principiantes (Juniors)' },
  { id: 'stack-personalizado', label: 'Elige tu Stack Personalizado' },
  { id: 'software-engineering', label: 'Ingeniería de Software' },
  { id: 'kotlin-multiplatform', label: 'Kotlin Multiplatform (KMP)' },
  { id: 'ia-para-desarrolladores', label: 'IA para Desarrolladores' },
  { id: 'kotlin-beginners', label: 'Kotlin for Beginners (AI Chat CLI)' },
];

export default function AuthModal({ isOpen, onClose, onSuccess, initialMode = 'login' }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeCourse, setActiveCourse] = useState('para-no-programadores');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload = mode === 'login'
      ? { email, password }
      : { name, email, password, activeCourse };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Ocurrió un error');
      }

      onSuccess(data.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al procesar la solicitud');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-[#212121] border border-white/10 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition"
          title="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tabs */}
        <div className="flex border-b border-white/10 mb-6">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 pb-3 text-sm font-semibold transition border-b-2 ${
              mode === 'login'
                ? 'border-paradiso text-white'
                : 'border-transparent text-white/50 hover:text-white/80'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(null); }}
            className={`flex-1 pb-3 text-sm font-semibold transition border-b-2 ${
              mode === 'register'
                ? 'border-paradiso text-white'
                : 'border-transparent text-white/50 hover:text-white/80'
            }`}
          >
            Crear Cuenta
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1.5">
                Tu Nombre
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ej. Mariana Gómez"
                  className="w-full bg-[#181818] border border-white/10 rounded-xl pl-10 pr-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-paradiso transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-white/70 mb-1.5">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="estudiante@desde0.dev"
                className="w-full bg-[#181818] border border-white/10 rounded-xl pl-10 pr-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-paradiso transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/70 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full bg-[#181818] border border-white/10 rounded-xl pl-10 pr-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-paradiso transition"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1.5">
                Ruta de Aprendizaje Activa
              </label>
              <div className="relative">
                <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                <select
                  value={activeCourse}
                  onChange={(e) => setActiveCourse(e.target.value)}
                  className="w-full bg-[#181818] border border-white/10 rounded-xl pl-10 pr-3 py-2 text-sm text-white focus:outline-none focus:border-paradiso transition appearance-none"
                >
                  {COURSES.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#212121] text-white">
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2.5 rounded-xl bg-paradiso hover:bg-paradiso-600 disabled:opacity-50 text-white text-sm font-semibold flex items-center justify-center gap-2 transition shadow-lg shadow-paradiso/20"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{mode === 'login' ? 'Entrar a Maxister' : 'Crear mi Cuenta'}</span>
          </button>
        </form>

        <p className="text-[11px] text-center text-white/40 mt-4">
          Al registrarte podrás mantener tu progreso pedagógico y compartir dudas complejas directamente con el profesor.
        </p>
      </div>
    </div>
  );
}
