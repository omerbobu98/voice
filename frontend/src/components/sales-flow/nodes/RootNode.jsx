import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { PlayCircle } from 'lucide-react';

const RootNode = memo(({ data, selected }) => {
  return (
    <div
      className={`
        px-6 py-4 rounded-xl border-2 shadow-xl
        bg-gradient-to-br from-indigo-900 to-purple-900 border-indigo-400
        ${selected ? 'ring-4 ring-indigo-400/50' : ''}
        min-w-[220px] max-w-[300px]
        transition-all duration-200
      `}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-indigo-500/30 rounded-lg">
          <PlayCircle className="w-5 h-5 text-indigo-300" />
        </div>
        <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
          Start
        </span>
      </div>
      
      <p className="text-base text-white font-semibold">{data.title}</p>
      
      {data.shortContent && (
        <p className="text-xs text-indigo-200 mt-2 line-clamp-2">
          {data.shortContent}
        </p>
      )}

      {data.stage && (
        <div className="mt-3 flex items-center gap-2">
          <span className="px-2 py-0.5 bg-indigo-500/30 rounded text-xs text-indigo-200">
            {data.stage}
          </span>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-indigo-400 !w-3 !h-3 !border-2 !border-indigo-900"
      />
    </div>
  );
});

RootNode.displayName = 'RootNode';

export default RootNode;
