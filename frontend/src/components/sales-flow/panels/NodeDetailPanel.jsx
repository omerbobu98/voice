import React from 'react';
import { X, MessageCircle, Lightbulb, User, Play, Volume2 } from 'lucide-react';

const NodeDetailPanel = ({ node, onClose, onAskAI, onPlayAudio }) => {
  if (!node) return null;

  const data = node.data || {};

  const getSpeakerLabel = () => {
    if (data.speaker === 'seller') return 'מוכר';
    if (data.speaker === 'customer') return 'לקוח';
    return 'מערכת';
  };

  const getSpeakerColor = () => {
    if (data.speaker === 'seller') return 'text-purple-400';
    if (data.speaker === 'customer') return 'text-emerald-400';
    return 'text-blue-400';
  };

  return (
    <div className="absolute right-4 top-4 bottom-4 w-96 bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-xl shadow-2xl overflow-hidden flex flex-col z-50">
      <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800/50">
        <div className="flex items-center gap-2">
          <User className={`w-4 h-4 ${getSpeakerColor()}`} />
          <span className={`text-sm font-medium ${getSpeakerColor()}`}>
            {getSpeakerLabel()}
          </span>
          {data.stage && (
            <span className="px-2 py-0.5 bg-gray-700 rounded text-xs text-gray-300">
              {data.stage}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-700 rounded transition-colors"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">{data.title}</h3>
          <p className="text-sm text-gray-300 leading-relaxed">{data.content || data.shortContent}</p>
        </div>

        {data.branchLabel && (
          <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
            <span className="text-xs text-gray-400 block mb-1">Branch Condition</span>
            <span className="text-sm text-white italic">"{data.branchLabel}"</span>
          </div>
        )}

        {data.successProbability !== undefined && (
          <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
            <span className="text-xs text-gray-400 block mb-2">Success Probability</span>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${data.successProbability >= 0.6 ? 'bg-emerald-500' : data.successProbability >= 0.4 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${data.successProbability * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-white">
                {Math.round(data.successProbability * 100)}%
              </span>
            </div>
          </div>
        )}

        {data.coachingTips && data.coachingTips.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-yellow-400">Coaching Tips</span>
            </div>
            <ul className="space-y-2">
              {data.coachingTips.map((tip, index) => (
                <li
                  key={index}
                  className="text-sm text-gray-300 pl-4 border-l-2 border-yellow-500/30"
                >
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-700 bg-gray-800/50 space-y-2">
        <button
          onClick={() => onAskAI && onAskAI(node)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Ask AI About This</span>
        </button>
        
        {data.content && (
          <button
            onClick={() => onPlayAudio && onPlayAudio(data.content)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <Volume2 className="w-4 h-4" />
            <span className="text-sm">Play Audio</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default NodeDetailPanel;
