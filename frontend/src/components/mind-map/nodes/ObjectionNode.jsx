import React from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  AlertTriangle,
  Shield,
  Ban,
  BookOpen,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

const ObjectionNode = ({ data, selected }) => {
  const color = data.categoryColor || '#f59e0b';
  
  return (
    <div
      className={`
        relative bg-gray-800 rounded-xl border-2 shadow-lg
        min-w-[220px] max-w-[280px] cursor-pointer
        transition-all duration-200 ease-out
        ${selected ? 'ring-2 ring-orange-400/50 scale-105' : 'hover:scale-102 hover:shadow-xl'}
      `}
      style={{ borderColor: color }}
    >
      {/* Warning glow */}
      <div
        className="absolute inset-0 rounded-xl blur-lg opacity-20"
        style={{ backgroundColor: color }}
      />
      
      {/* Header */}
      <div
        className="relative px-3 py-2 rounded-t-xl flex items-center gap-2"
        style={{ backgroundColor: `${color}20` }}
      >
        <AlertTriangle className="w-4 h-4" style={{ color }} />
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color }}>
          Objection
        </span>
      </div>
      
      {/* Content */}
      <div className="relative p-3">
        <h4 className="font-semibold text-white text-sm mb-1">
          {data.title}
        </h4>
        <p className="text-xs text-gray-400 italic">
          "{data.content}"
        </p>
      </div>
      
      {/* Action Buttons */}
      <div className="relative px-3 py-2 border-t border-gray-700 grid grid-cols-3 gap-2">
        <button
          className="flex flex-col items-center gap-1 p-2 rounded-lg bg-emerald-900/30 hover:bg-emerald-900/50 transition-colors group"
          onClick={(e) => e.stopPropagation()}
          title="Handle this objection"
        >
          <Shield className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          <span className="text-xs text-emerald-400 font-medium">Handle</span>
        </button>
        
        <button
          className="flex flex-col items-center gap-1 p-2 rounded-lg bg-blue-900/30 hover:bg-blue-900/50 transition-colors group"
          onClick={(e) => e.stopPropagation()}
          title="Prevent this objection"
        >
          <Ban className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
          <span className="text-xs text-blue-400 font-medium">Prevent</span>
        </button>
        
        <button
          className="flex flex-col items-center gap-1 p-2 rounded-lg bg-purple-900/30 hover:bg-purple-900/50 transition-colors group"
          onClick={(e) => e.stopPropagation()}
          title="Story for this objection"
        >
          <BookOpen className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
          <span className="text-xs text-purple-400 font-medium">Story</span>
        </button>
      </div>
      
      {/* AI Button */}
      <div className="relative px-3 py-2 border-t border-gray-700">
        <button
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg transition-colors"
          style={{ backgroundColor: `${color}20` }}
          onClick={(e) => e.stopPropagation()}
        >
          <Sparkles className="w-4 h-4" style={{ color }} />
          <span className="text-sm font-medium" style={{ color }}>
            Generate AI Response
          </span>
          <ChevronRight className="w-4 h-4" style={{ color }} />
        </button>
      </div>
      
      {/* Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-transparent !border-0"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-transparent !border-0"
      />
    </div>
  );
};

export default ObjectionNode;
