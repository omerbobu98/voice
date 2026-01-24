import React from 'react';
import { Compass, GraduationCap, Mic } from 'lucide-react';

const modes = [
  {
    id: 'explore',
    label: 'Explore',
    labelHe: 'חקור',
    icon: Compass,
    description: 'Navigate the tree freely',
    color: 'from-blue-600 to-blue-700',
    activeColor: 'from-blue-500 to-blue-600',
  },
  {
    id: 'practice',
    label: 'Practice',
    labelHe: 'תרגול',
    icon: GraduationCap,
    description: 'Guided step-by-step learning',
    color: 'from-purple-600 to-purple-700',
    activeColor: 'from-purple-500 to-purple-600',
  },
  {
    id: 'simulation',
    label: 'Simulate',
    labelHe: 'סימולציה',
    icon: Mic,
    description: 'Full AI roleplay',
    color: 'from-emerald-600 to-emerald-700',
    activeColor: 'from-emerald-500 to-emerald-600',
  },
];

const ModeSelector = ({ currentMode, onModeChange, disabled = false }) => {
  return (
    <div className="flex items-center gap-1 p-1 bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-700">
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isActive = currentMode === mode.id;
        
        return (
          <button
            key={mode.id}
            onClick={() => !disabled && onModeChange(mode.id)}
            disabled={disabled}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200
              ${isActive
                ? `bg-gradient-to-r ${mode.activeColor} text-white shadow-lg`
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
            title={mode.description}
          >
            <Icon className="w-4 h-4" />
            <span className="text-sm font-medium">{mode.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ModeSelector;
