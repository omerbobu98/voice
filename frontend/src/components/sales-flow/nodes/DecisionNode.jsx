import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { GitBranch, ArrowRight } from 'lucide-react';

const DecisionNode = memo(({ data, selected }) => {
  return (
    <div
      className={`
        px-4 py-3 rounded-lg border-2 shadow-lg
        bg-gradient-to-br from-blue-900 to-cyan-900 border-blue-500
        ${selected ? 'ring-2 ring-blue-400 shadow-blue-500/30 shadow-xl' : ''}
        min-w-[200px] max-w-[280px]
        transition-all duration-200 hover:shadow-xl
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-blue-400 !w-2.5 !h-2.5 !border-2 !border-blue-900"
      />

      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 bg-blue-500/30 rounded">
          <GitBranch className="w-3.5 h-3.5 text-blue-300" />
        </div>
        <span className="text-xs font-semibold text-blue-300 uppercase tracking-wide">
          Decision Point
        </span>
      </div>

      <p className="text-sm text-white font-medium leading-tight">{data.title}</p>

      {data.shortContent && (
        <p className="text-xs text-blue-200/80 mt-1.5 line-clamp-2">
          {data.shortContent}
        </p>
      )}

      {data.branchCondition && (
        <div className="mt-2 flex items-center gap-1.5 text-blue-300">
          <ArrowRight className="w-3 h-3" />
          <span className="text-xs italic">{data.branchCondition}</span>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-blue-400 !w-2.5 !h-2.5 !border-2 !border-blue-900"
      />
    </div>
  );
});

DecisionNode.displayName = 'DecisionNode';

export default DecisionNode;
