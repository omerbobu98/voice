import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { User, ThumbsUp, ThumbsDown, HelpCircle, AlertTriangle } from 'lucide-react';

const responseTypes = {
  positive: {
    icon: ThumbsUp,
    colors: 'from-emerald-900 to-green-800 border-emerald-500',
    iconColor: 'text-emerald-300',
    bgColor: 'bg-emerald-500/30',
  },
  negative: {
    icon: ThumbsDown,
    colors: 'from-red-900 to-rose-800 border-red-500',
    iconColor: 'text-red-300',
    bgColor: 'bg-red-500/30',
  },
  neutral: {
    icon: HelpCircle,
    colors: 'from-slate-800 to-gray-800 border-slate-500',
    iconColor: 'text-slate-300',
    bgColor: 'bg-slate-500/30',
  },
  objection: {
    icon: AlertTriangle,
    colors: 'from-orange-900 to-amber-800 border-orange-500',
    iconColor: 'text-orange-300',
    bgColor: 'bg-orange-500/30',
  },
};

const CustomerResponseNode = memo(({ data, selected }) => {
  const probability = data.successProbability || 0.5;
  const responseType = probability >= 0.6 ? 'positive' : probability >= 0.4 ? 'neutral' : probability >= 0.3 ? 'objection' : 'negative';
  
  const config = responseTypes[responseType];
  const Icon = config.icon;

  return (
    <div
      className={`
        px-4 py-3 rounded-lg border-2 shadow-lg
        bg-gradient-to-br ${config.colors}
        ${selected ? 'ring-2 ring-white/40 shadow-xl' : ''}
        min-w-[200px] max-w-[280px]
        transition-all duration-200 hover:shadow-xl
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-white/60 !w-2.5 !h-2.5 !border-2 !border-gray-800"
      />

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 ${config.bgColor} rounded`}>
            <User className={`w-3.5 h-3.5 ${config.iconColor}`} />
          </div>
          <span className={`text-xs font-semibold ${config.iconColor} uppercase tracking-wide`}>
            Customer
          </span>
        </div>
        <div className={`p-1 ${config.bgColor} rounded`}>
          <Icon className={`w-3 h-3 ${config.iconColor}`} />
        </div>
      </div>

      {data.branchLabel && (
        <div className="mb-2">
          <span className={`text-xs ${config.iconColor} font-medium italic`}>
            "{data.branchLabel}"
          </span>
        </div>
      )}

      <p className="text-sm text-white font-medium leading-tight">{data.title}</p>

      {data.shortContent && (
        <p className="text-xs text-white/70 mt-1.5 line-clamp-2">
          {data.shortContent}
        </p>
      )}

      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-16 h-1.5 bg-black/30 rounded-full overflow-hidden">
            <div
              className={`h-full ${probability >= 0.6 ? 'bg-emerald-400' : probability >= 0.4 ? 'bg-yellow-400' : 'bg-red-400'}`}
              style={{ width: `${probability * 100}%` }}
            />
          </div>
          <span className="text-xs text-white/60">{Math.round(probability * 100)}%</span>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-white/60 !w-2.5 !h-2.5 !border-2 !border-gray-800"
      />
    </div>
  );
});

CustomerResponseNode.displayName = 'CustomerResponseNode';

export default CustomerResponseNode;
