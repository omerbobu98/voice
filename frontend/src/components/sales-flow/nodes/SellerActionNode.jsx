import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { MessageCircle, Mic, HelpCircle, Lightbulb } from 'lucide-react';

const stageIcons = {
  opening: MessageCircle,
  qualification: HelpCircle,
  discovery: HelpCircle,
  pain_amplification: Lightbulb,
  solution: Lightbulb,
  storytelling: MessageCircle,
  objection: MessageCircle,
  closing: Mic,
  next_steps: MessageCircle,
};

const stageColors = {
  opening: 'from-purple-900 to-purple-800 border-purple-500',
  qualification: 'from-purple-900 to-violet-800 border-violet-500',
  discovery: 'from-violet-900 to-purple-800 border-violet-500',
  pain_amplification: 'from-fuchsia-900 to-purple-800 border-fuchsia-500',
  solution: 'from-purple-900 to-indigo-800 border-purple-500',
  storytelling: 'from-violet-900 to-purple-800 border-violet-500',
  objection: 'from-purple-900 to-purple-800 border-purple-500',
  closing: 'from-indigo-900 to-purple-800 border-indigo-500',
  next_steps: 'from-purple-900 to-violet-800 border-purple-500',
};

const SellerActionNode = memo(({ data, selected }) => {
  const Icon = stageIcons[data.stage] || MessageCircle;
  const colorClass = stageColors[data.stage] || 'from-purple-900 to-purple-800 border-purple-500';

  return (
    <div
      className={`
        px-4 py-3 rounded-lg border-2 shadow-lg
        bg-gradient-to-br ${colorClass}
        ${selected ? 'ring-2 ring-purple-400 shadow-purple-500/30 shadow-xl' : ''}
        min-w-[200px] max-w-[280px]
        transition-all duration-200 hover:shadow-xl
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-purple-400 !w-2.5 !h-2.5 !border-2 !border-purple-900"
      />

      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 bg-purple-500/30 rounded">
          <Icon className="w-3.5 h-3.5 text-purple-300" />
        </div>
        <span className="text-xs font-semibold text-purple-300 uppercase tracking-wide">
          {data.stage?.replace('_', ' ') || 'Seller'}
        </span>
      </div>

      <p className="text-sm text-white font-medium leading-tight">{data.title}</p>

      {data.shortContent && (
        <p className="text-xs text-purple-200/80 mt-1.5 line-clamp-2">
          {data.shortContent}
        </p>
      )}

      {data.coachingTips && data.coachingTips.length > 0 && (
        <div className="mt-2 flex items-center gap-1">
          <Lightbulb className="w-3 h-3 text-yellow-400" />
          <span className="text-xs text-yellow-300">{data.coachingTips.length} tips</span>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-purple-400 !w-2.5 !h-2.5 !border-2 !border-purple-900"
      />
    </div>
  );
});

SellerActionNode.displayName = 'SellerActionNode';

export default SellerActionNode;
