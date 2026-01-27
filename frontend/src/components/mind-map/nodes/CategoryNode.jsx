import React from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  HandMetal,
  Search,
  Sparkles,
  AlertTriangle,
  Trophy,
  ChevronRight,
} from 'lucide-react';

const iconMap = {
  HandWaving: HandMetal,
  Search: Search,
  Sparkles: Sparkles,
  AlertTriangle: AlertTriangle,
  Trophy: Trophy,
};

const CategoryNode = ({ data, selected }) => {
  const Icon = iconMap[data.icon] || Sparkles;
  const isCenter = data.isCenter || data.ring_level === 0;
  
  return (
    <div
      className={`
        relative rounded-2xl border-2 shadow-lg cursor-pointer
        transition-all duration-200 ease-out
        ${selected ? 'ring-4 ring-white/30 scale-105' : 'hover:scale-102'}
        ${isCenter ? 'min-w-[180px] min-h-[100px]' : 'min-w-[140px] min-h-[70px]'}
      `}
      style={{
        backgroundColor: `${data.color}20`,
        borderColor: data.color,
      }}
    >
      {/* Glow effect */}
      <div
        className="absolute inset-0 rounded-2xl blur-xl opacity-30"
        style={{ backgroundColor: data.color }}
      />
      
      <div className="relative z-10 p-3 flex flex-col items-center justify-center h-full">
        <div
          className={`
            flex items-center justify-center rounded-full mb-2
            ${isCenter ? 'w-12 h-12' : 'w-8 h-8'}
          `}
          style={{ backgroundColor: `${data.color}40` }}
        >
          <Icon
            className={isCenter ? 'w-6 h-6' : 'w-4 h-4'}
            style={{ color: data.color }}
          />
        </div>
        
        <h3
          className={`
            font-bold text-white text-center
            ${isCenter ? 'text-lg' : 'text-sm'}
          `}
        >
          {data.name}
        </h3>
        
        {data.nodeCount > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs text-gray-400">
              {data.nodeCount} items
            </span>
            <ChevronRight className="w-3 h-3 text-gray-500" />
          </div>
        )}
        
        {isCenter && data.description && (
          <p className="text-xs text-gray-400 mt-1 text-center max-w-[150px]">
            {data.description}
          </p>
        )}
      </div>
      
      {/* Handles for connections */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-transparent !border-0 !w-4 !h-4"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-transparent !border-0 !w-4 !h-4"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        className="!bg-transparent !border-0 !w-4 !h-4"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!bg-transparent !border-0 !w-4 !h-4"
      />
    </div>
  );
};

export default CategoryNode;
