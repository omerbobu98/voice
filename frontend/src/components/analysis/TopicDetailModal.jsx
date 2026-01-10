import { useState } from 'react'
import { X, Play, AlertTriangle, Target, Zap, MessageSquare, TrendingUp, Clock, ChevronRight } from 'lucide-react'

const TOPIC_CONFIG = {
  'Objections': {
    icon: AlertTriangle,
    color: 'amber',
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    description: 'Customer concerns and pushback moments'
  },
  'Closing': {
    icon: Target,
    color: 'emerald',
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    description: 'Attempts to close the deal'
  },
  'Value Prop': {
    icon: Zap,
    color: 'emerald',
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    description: 'Value proposition statements'
  },
  'buying_signal': {
    icon: TrendingUp,
    color: 'cyan',
    bgColor: 'bg-cyan-500/10',
    textColor: 'text-cyan-400',
    borderColor: 'border-cyan-500/30',
    description: 'Positive buying indicators from customer'
  },
  'Pain Points': {
    icon: MessageSquare,
    color: 'orange',
    bgColor: 'bg-orange-500/10',
    textColor: 'text-orange-400',
    borderColor: 'border-orange-500/30',
    description: 'Customer pain points discovered'
  },
  'price_reveal': {
    icon: Clock,
    color: 'yellow',
    bgColor: 'bg-yellow-500/10',
    textColor: 'text-yellow-400',
    borderColor: 'border-yellow-500/30',
    description: 'Price discussion moments'
  },
  'Discovery': {
    icon: MessageSquare,
    color: 'cyan',
    bgColor: 'bg-cyan-500/10',
    textColor: 'text-cyan-400',
    borderColor: 'border-cyan-500/30',
    description: 'Discovery questions asked'
  }
}

export default function TopicDetailModal({ 
  isOpen, 
  onClose, 
  topicName, 
  items, 
  analysisResult,
  onSeek,
  onNavigateToInsights 
}) {
  if (!isOpen) return null

  const config = TOPIC_CONFIG[topicName] || {
    icon: MessageSquare,
    color: 'slate',
    bgColor: 'bg-slate-500/10',
    textColor: 'text-slate-400',
    borderColor: 'border-slate-500/30',
    description: 'Related moments from the call'
  }

  const Icon = config.icon

  // Get relevant items based on topic
  const getTopicItems = () => {
    const analysis = analysisResult?.analysis || {}
    const timeline = analysis.timeline_events || []
    
    switch (topicName) {
      case 'Objections':
        return {
          type: 'objections',
          items: analysis.objections || [],
          hasDeepLink: true
        }
      
      case 'Closing':
        const closingAttempts = timeline.filter(e => 
          e.type === 'closing_attempt' || e.type === 'commitment'
        )
        const closingOpps = analysis.closing_opportunities || []
        return {
          type: 'closing',
          items: [...closingAttempts, ...closingOpps.map(o => ({
            ...o,
            type: 'opportunity',
            content: o.customer_signal,
            timestamp: o.timestamp
          }))],
          hasDeepLink: false
        }
      
      case 'Value Prop':
        return {
          type: 'timeline',
          items: timeline.filter(e => e.type === 'value_proposition'),
          hasDeepLink: false
        }
      
      case 'buying_signal':
        const signals = analysis.buying_signals_detected?.signals_found || []
        return {
          type: 'buying_signals',
          items: signals,
          hasDeepLink: false
        }
      
      case 'Pain Points':
        return {
          type: 'timeline',
          items: timeline.filter(e => e.type === 'pain_point' || e.type === 'diagnose'),
          hasDeepLink: false
        }
      
      case 'price_reveal':
        const priceEvents = timeline.filter(e => e.type === 'price_reveal')
        const priceAnalysis = analysis.price_timing_analysis
        return {
          type: 'price',
          items: priceEvents,
          priceAnalysis,
          hasDeepLink: false
        }
      
      case 'Discovery':
        return {
          type: 'timeline',
          items: timeline.filter(e => e.type === 'discovery_question'),
          hasDeepLink: false
        }
      
      default:
        return {
          type: 'timeline',
          items: timeline.filter(e => e.type?.toLowerCase().includes(topicName.toLowerCase())),
          hasDeepLink: false
        }
    }
  }

  const topicData = getTopicItems()

  const renderObjectionItem = (obj, index) => (
    <div 
      key={index}
      className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/30 hover:border-slate-600/50 transition-all"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-lg">
            {obj.type?.replace('_', ' ').toUpperCase() || 'OBJECTION'}
          </span>
          {obj.timestamp && (
            <button 
              onClick={() => onSeek && obj.timestamp_ms && onSeek(obj.timestamp_ms)}
              className="px-2 py-1 bg-indigo-500/20 text-indigo-400 text-xs font-mono rounded-lg hover:bg-indigo-500/30 flex items-center gap-1"
            >
              <Play className="w-3 h-3" /> {obj.timestamp}
            </button>
          )}
        </div>
        <span className={`text-lg font-bold ${
          obj.handling_score >= 7 ? 'text-emerald-400' :
          obj.handling_score >= 4 ? 'text-amber-400' : 'text-red-400'
        }`}>
          {obj.handling_score}/10
        </span>
      </div>
      
      <p className="text-slate-300 mb-2">"{obj.buyer_statement}"</p>
      <p className="text-sm text-slate-500">
        <span className="text-slate-400">Real concern:</span> {obj.real_concern}
      </p>
    </div>
  )

  const renderTimelineItem = (event, index) => (
    <div 
      key={index}
      onClick={() => onSeek && event.timestamp_ms && onSeek(event.timestamp_ms)}
      className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/30 hover:border-slate-600/50 transition-all cursor-pointer group"
    >
      <div className="flex items-center gap-2 mb-2">
        {event.timestamp && (
          <span className="px-2 py-1 bg-indigo-500/20 text-indigo-400 text-xs font-mono rounded-lg group-hover:bg-indigo-500/30 flex items-center gap-1">
            <Play className="w-3 h-3" /> {event.timestamp}
          </span>
        )}
        <span className={`text-xs px-2 py-1 rounded-lg ${
          event.speaker === 'Seller' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'
        }`}>
          {event.speaker}
        </span>
      </div>
      <p className="text-slate-300">"{event.content}"</p>
      {event.significance && (
        <p className="text-sm text-slate-500 mt-2">{event.significance}</p>
      )}
    </div>
  )

  const renderBuyingSignal = (signal, index) => (
    <div 
      key={index}
      className={`p-4 rounded-xl border transition-all ${
        signal.close_opportunity_missed 
          ? 'bg-amber-500/5 border-amber-500/20' 
          : 'bg-emerald-500/5 border-emerald-500/20'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        {signal.timestamp && (
          <button 
            onClick={() => onSeek && signal.timestamp_ms && onSeek(signal.timestamp_ms)}
            className="px-2 py-1 bg-indigo-500/20 text-indigo-400 text-xs font-mono rounded-lg hover:bg-indigo-500/30 flex items-center gap-1"
          >
            <Play className="w-3 h-3" /> {signal.timestamp}
          </button>
        )}
        <span className={`text-xs px-2 py-1 rounded-lg ${
          signal.close_opportunity_missed 
            ? 'bg-amber-500/20 text-amber-400' 
            : 'bg-emerald-500/20 text-emerald-400'
        }`}>
          {signal.close_opportunity_missed ? 'Missed' : 'Captured'}
        </span>
      </div>
      <p className="text-slate-300 mb-2">"{signal.signal}"</p>
      {signal.optimal_response && signal.close_opportunity_missed && (
        <div className="mt-2 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
          <p className="text-xs text-emerald-400 font-semibold mb-1">Should have said:</p>
          <p className="text-sm text-emerald-300">{signal.optimal_response}</p>
        </div>
      )}
    </div>
  )

  const renderClosingItem = (item, index) => (
    <div 
      key={index}
      onClick={() => onSeek && item.timestamp_ms && onSeek(item.timestamp_ms)}
      className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/30 hover:border-slate-600/50 transition-all cursor-pointer group"
    >
      <div className="flex items-center gap-2 mb-2">
        {item.timestamp && (
          <span className="px-2 py-1 bg-indigo-500/20 text-indigo-400 text-xs font-mono rounded-lg group-hover:bg-indigo-500/30 flex items-center gap-1">
            <Play className="w-3 h-3" /> {item.timestamp}
          </span>
        )}
        <span className={`text-xs px-2 py-1 rounded-lg ${
          item.type === 'opportunity' 
            ? 'bg-amber-500/20 text-amber-400' 
            : 'bg-emerald-500/20 text-emerald-400'
        }`}>
          {item.type === 'opportunity' ? 'Missed Opportunity' : item.close_type || 'Closing Attempt'}
        </span>
      </div>
      <p className="text-slate-300">"{item.content || item.customer_signal}"</p>
      {item.suggested_close && (
        <div className="mt-2 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
          <p className="text-xs text-emerald-400 font-semibold mb-1">Suggested close:</p>
          <p className="text-sm text-emerald-300">{item.suggested_close}</p>
        </div>
      )}
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[80vh] bg-slate-900 rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className={`p-5 border-b border-slate-700/50 ${config.bgColor}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${config.bgColor} border ${config.borderColor}`}>
                <Icon className={`w-6 h-6 ${config.textColor}`} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{topicName}</h2>
                <p className="text-sm text-slate-400">{config.description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          
          {/* Count badge */}
          <div className="mt-4 flex items-center gap-3">
            <span className={`px-3 py-1.5 rounded-lg text-sm font-bold ${config.bgColor} ${config.textColor} border ${config.borderColor}`}>
              {topicData.items.length} {topicData.items.length === 1 ? 'item' : 'items'} found
            </span>
            
            {topicData.hasDeepLink && topicData.items.length > 0 && (
              <button
                onClick={() => {
                  onClose()
                  onNavigateToInsights && onNavigateToInsights()
                }}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/30 flex items-center gap-1"
              >
                View in Deep Insights <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        
        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[calc(80vh-180px)] custom-scrollbar">
          {topicData.items.length === 0 ? (
            <div className="text-center py-12">
              <div className={`w-16 h-16 rounded-full ${config.bgColor} flex items-center justify-center mx-auto mb-4`}>
                <Icon className={`w-8 h-8 ${config.textColor}`} />
              </div>
              <h3 className="text-lg font-semibold text-slate-300 mb-2">No {topicName} Found</h3>
              <p className="text-slate-500">This topic wasn't detected in the call.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topicData.type === 'objections' && topicData.items.map(renderObjectionItem)}
              {topicData.type === 'timeline' && topicData.items.map(renderTimelineItem)}
              {topicData.type === 'buying_signals' && topicData.items.map(renderBuyingSignal)}
              {topicData.type === 'closing' && topicData.items.map(renderClosingItem)}
              {topicData.type === 'price' && (
                <>
                  {topicData.items.map(renderTimelineItem)}
                  {topicData.priceAnalysis && (
                    <div className="mt-4 p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                      <h4 className="text-sm font-semibold text-yellow-400 mb-2">Price Timing Analysis</h4>
                      <p className="text-sm text-slate-300 mb-2">
                        Price mentioned at: <span className="font-mono text-yellow-400">{topicData.priceAnalysis.price_mentioned_at || 'N/A'}</span>
                      </p>
                      {topicData.priceAnalysis.was_value_built_first !== undefined && (
                        <p className="text-sm text-slate-300 mb-2">
                          Value built first: {topicData.priceAnalysis.was_value_built_first ? 
                            <span className="text-emerald-400">Yes</span> : 
                            <span className="text-red-400">No</span>}
                        </p>
                      )}
                      {topicData.priceAnalysis.recommendation && (
                        <p className="text-sm text-slate-400 mt-2">{topicData.priceAnalysis.recommendation}</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
