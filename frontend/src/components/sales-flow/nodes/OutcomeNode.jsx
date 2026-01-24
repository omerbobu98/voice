import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Trophy, XCircle, Calendar, ArrowRight } from 'lucide-react';

const outcomeTypes = {
  sale: {
    icon: Trophy,
    colors: 'from-yellow-800 to-amber-700 border-yellow-500',
    iconColor: 'text-yellow-300',
    bgColor: 'bg-yellow-500/30',
    label: 'Sale Closed!',
  },
  follow_up: {
    icon: Calendar,
    colors: 'from-sky-900 to-blue-800 border-sky-500',
    iconColor: 'text-sky-300',
    bgColor: 'bg-sky-500/30',
    label: 'Follow-Up Scheduled',
  },
  lost: {
    icon: XCircle,
    colors: 'from-gray-800 to-slate-800 border-gray-600',
    iconColor: 'text-gray-400',
    bgColor: 'bg-gray-500/30',
    label: 'Opportunity Lost',
  },
  next_step: {
    icon: ArrowRight,
    colors: 'from-teal-900 to-emerald-800 border-teal-500',
    iconColor: 'text-teal-300',
    bgColor: 'bg-teal-500/30',
    label: 'Next Step',
  },
};

const OutcomeNode = memo(({ data, selected }) => {
  const outcomeType = data.outcomeType || 'next_step';
  const config = outcomeTypes[outcomeType] || outcomeTypes.next_step;
  const Icon = config.icon;

  return (
    <div
      className={`
        px-4 py-3 rounded-xl border-2 shadow-lg
        bg-gradient-to-br ${config.colors}
        ${selected ? 'ring-2 ring-white/40 shadow-xl' : ''}
        min-w-[180px] max-w-[260px]
        transition-all duration-200 hover:shadow-xl
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-white/60 !w-2.5 !h-2.5 !border-2 !border-gray-800"
      />

      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 ${config.bgColor} rounded-lg`}>
          <Icon className={`w-4 h-4 ${config.iconColor}`} />
        </div>
        <span className={`text-xs font-bold ${config.iconColor} uppercase tracking-wide`}>
          {config.label}
        </span>
      </div>

      <p className="text-sm text-white font-medium leading-tight">{data.title}</p>

      {data.shortContent && (
        <p className="text-xs text-white/70 mt-1.5 line-clamp-2">
          {data.shortContent}
        </p>
      )}

      {outcomeType === 'sale' && (
        <div className="mt-2 flex items-center gap-1">
          <span className="text-lg">🎉</span>
          <span className="text-xs text-yellow-200 font-medium">Congratulations!</span>
        </div>
      )}
    </div>
  );
});

OutcomeNode.displayName = 'OutcomeNode';

export default OutcomeNode;
