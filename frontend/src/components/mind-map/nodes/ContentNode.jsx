import React from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  MessageCircle,
  HelpCircle,
  Lightbulb,
  Star,
  Volume2,
  Copy,
  Sparkles,
} from 'lucide-react';

const typeIcons = {
  question: HelpCircle,
  script: MessageCircle,
  tip: Lightbulb,
  benefit: Star,
};

const ContentNode = ({ data, selected }) => {
  const Icon = typeIcons[data.node_type] || MessageCircle;
  const color = data.categoryColor || '#6b7280';
  
  return (
    <div
      className={`
        relative bg-gray-800 rounded-xl border shadow-lg
        min-w-[200px] max-w-[260px] cursor-pointer
        transition-all duration-200 ease-out
        ${selected ? 'ring-2 ring-white/40 scale-105' : 'hover:scale-102 hover:shadow-xl'}
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
        <Icon className="w-4 h-4" style={{ color }} />
        <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
          {data.node_type}
        </span>
        {data.product_type && (
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-400">
            {data.product_type}
          </span>
        )}
      </div>
      
      {/* Content */}
      <div className="p-3">
        <h4 className="font-semibold text-white text-sm mb-1">
          {data.title}
        </h4>
        <p className="text-xs text-gray-400 line-clamp-3">
          {data.short_content || data.content?.substring(0, 100) + '...'}
        </p>
      </div>
      
      {/* Quick Actions */}
      <div 
        className="px-3 py-2 border-t flex items-center gap-2"
        style={{ borderColor: `${color}20` }}
      >
        <button 
          className="p-1.5 rounded-lg bg-gray-700/50 hover:bg-gray-700 transition-colors"
          title="Listen"
          onClick={(e) => e.stopPropagation()}
        >
          <Volume2 className="w-3 h-3 text-gray-400" />
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
          title="Ask AI"
          onClick={(e) => e.stopPropagation()}
        >
          <Sparkles className="w-3 h-3" style={{ color }} />
          <span className="text-xs" style={{ color }}>AI</span>
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

export default ContentNode;
