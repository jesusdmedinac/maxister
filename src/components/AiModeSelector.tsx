import React from 'react';
import type { AiParticipationMode } from '../lib/conversations';
import { VolumeX, Zap, Bot, HelpCircle } from 'lucide-react';

interface Props {
  currentMode: AiParticipationMode;
  onSelectMode: (mode: AiParticipationMode) => void;
  disabled?: boolean;
}

const MODES: Array<{
  id: AiParticipationMode;
  label: string;
  shortLabel: string;
  icon: any;
  colorActive: string;
  hint: string;
}> = [
  {
    id: 'off',
    label: 'Solo Humanos',
    shortLabel: 'Humanos',
    icon: VolumeX,
    colorActive: 'bg-white/20 text-white border-white/30',
    hint: 'Diálogo exclusivo entre alumno y profesor. La IA no interviene pero escucha en segundo plano.',
  },
  {
    id: 'auto',
    label: 'Copiloto Socrático',
    shortLabel: 'Copiloto',
    icon: Zap,
    colorActive: 'bg-amber-500/20 text-amber-300 border-amber-500/30 shadow-sm shadow-amber-500/10',
    hint: 'Maxister responderá si detecta una duda técnica o si es invocado directamente (ej: "Maxister, ...").',
  },
  {
    id: 'on',
    label: 'Tutor Activo',
    shortLabel: 'Tutor Activo',
    icon: Bot,
    colorActive: 'bg-paradiso/20 text-paradiso-300 border-paradiso/30 shadow-sm shadow-paradiso/10',
    hint: 'Maxister participa activamente en cada mensaje ofreciendo orientación socrática continua.',
  },
];

export default function AiModeSelector({ currentMode, onSelectMode, disabled }: Props) {
  const activeObj = MODES.find((m) => m.id === currentMode) || MODES[1];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 py-1.5 bg-[#212121] border border-white/10 rounded-2xl text-xs">
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">
          Modo IA:
        </span>
        <div className="flex items-center gap-1 p-0.5 bg-[#181818] rounded-xl border border-white/5">
          {MODES.map((m) => {
            const Icon = m.icon;
            const isActive = m.id === currentMode;
            return (
              <button
                key={m.id}
                type="button"
                disabled={disabled}
                onClick={() => onSelectMode(m.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition ${
                  isActive
                    ? `${m.colorActive} border`
                    : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                } disabled:opacity-50`}
                title={m.hint}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{m.label}</span>
                <span className="md:hidden">{m.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-white/40 italic">
        <HelpCircle className="w-3 h-3 text-white/30 shrink-0" />
        <span className="truncate max-w-xs">{activeObj.hint}</span>
      </div>
    </div>
  );
}
