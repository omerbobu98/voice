import React from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  BookOpen,
  Play,
  Copy,
  Sparkles,
  Target,
} from 'lucide-react';

const StoryNode = ({ data, selected }) => {
  const color = data.categoryColor || '#10b981';
  
  return (
    <div
      className={`
        relative bg-gray-800 rounded-xl border shadow-lg
        min-w-[200px] max-w-[260px] cursor-pointer
        transition-all duration-200 ease-out
        ${selected ? 'ring-2 ring-emerald-400/50 scale-105' : 'hover:scale-102 hover:shadow-xl'}
      `}
      style={{ borderColor: `${color}60` }}
    >
      {/* Header */}
      <div
        className="px-3 py-2 rounded-t-xl border-b flex items-center gap-2"
        style={{ 
          backgroundColor: `${color}15`,
          borderColor: `${color}30`,
        }}
      >
        <BookOpen className="w-4 h-4" style={{ color }} />
        <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
          Story
        </span>
        {data.story_type && (
          <span 
            className="ml-auto text-xs px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${color}30`, color }}
          >
            {data.story_type.replace('_', ' ')}
          </span>
        )}
      </div>
      
      {/* Content */}
      <div className="p-3">
        <h4 className="font-semibold text-white text-sm mb-1 flex items-center gap-2">
          <span>{data.title}</span>
        </h4>
        
        {data.story_for_objection && (
          <div className="flex items-center gap-1 mb-2">
            <Target className="w-3 h-3 text-orange-400" />
            <span className="text-xs text-orange-400">
              For: {data.story_for_objection.replace('_', ' ')}
            </span>
          </div>
        )}
        
        {data.setup_line && (
          <p className="text-xs text-gray-500 italic mb-2">
            "{data.setup_line}"
          </p>
        )}
        
        <p className="text-xs text-gray-400 line-clamp-2">
          {data.short_content || data.content?.substring(0, 80) + '...'}
        </p>
      </div>
      
      {/* Actions */}
      <div 
        className="px-3 py-2 border-t flex items-center gap-2"
        style={{ borderColor: `${color}20` }}
      >
        <button 
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg transition-colors"
          style={{ backgroundColor: `${color}20` }}
          title="Play Story"
          onClick={(e) => e.stopPropagation()}
        >
          <Play className="w-3 h-3" style={{ color }} />
          <span className="text-xs font-medium" style={{ color }}>Play</span>
        </button>
        
        <button 
          className="p-1.5 rounded-lg bg-gray-700/50 hover:bg-gray-700 transition-colors"
          title="Copy"
          onClick={(e) => e.stopPropagation()}
        >
          <Copy className="w-3 h-3 text-gray-400" />
        </button>
        
        <button 
          className="ml-auto p-1.5 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-1"
          style={{ backgroundColor: `${color}20` }}
          title="Improve with AI"
          onClick={(e) => e.stopPropagation()}
        >
          <Sparkles className="w-3 h-3" style={{ color }} />
          <span className="text-xs" style={{ color }}>Improve</span>
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

export default StoryNode;
