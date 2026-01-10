import { useState } from 'react'
import { AlertTriangle, MessageSquare, Zap, ChevronDown, ChevronUp, Play, Volume2, Check, Copy, Target, TrendingUp, User, UserCircle, Lightbulb, Shield } from 'lucide-react'

export default function DeepInsightsTab({ analysisResult, onSeek, TTSButton }) {
  const [expandedObjection, setExpandedObjection] = useState(0) // First one expanded by default
  const [expandedResponse, setExpandedResponse] = useState(null)
  const [copiedId, setCopiedId] = useState(null)

  const objections = analysisResult?.analysis?.objections || []
  const betterResponses = analysisResult?.analysis?.better_responses || []
  const buyingSignals = analysisResult?.analysis?.buying_signals_detected?.signals_found || []

  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Objection type definitions with emoji, color, and description
  const objectionTypes = {
    price: { 
      emoji: '💰', 
      label: 'Price Objection', 
      color: 'from-red-500/20 to-red-600/10 border-red-500/40',
      textColor: 'text-red-400',
      description: 'Customer concerned about cost or value for money'
    },
    timing: { 
      emoji: '⏰', 
      label: 'Timing Objection', 
      color: 'from-amber-500/20 to-amber-600/10 border-amber-500/40',
      textColor: 'text-amber-400',
      description: 'Customer says now is not the right time'
    },
    authority: { 
      emoji: '👔', 
      label: 'Authority Objection', 
      color: 'from-purple-500/20 to-purple-600/10 border-purple-500/40',
      textColor: 'text-purple-400',
      description: 'Customer needs approval from someone else'
    },
    need: { 
      emoji: '🤔', 
      label: 'Need Objection', 
      color: 'from-blue-500/20 to-blue-600/10 border-blue-500/40',
      textColor: 'text-blue-400',
      description: 'Customer questions if they really need this'
    },
    trust: { 
      emoji: '🛡️', 
      label: 'Trust Objection', 
      color: 'from-orange-500/20 to-orange-600/10 border-orange-500/40',
      textColor: 'text-orange-400',
      description: 'Customer has concerns about credibility or reliability'
    },
    spouse_decision: { 
      emoji: '👫', 
      label: 'Partner Decision', 
      color: 'from-pink-500/20 to-pink-600/10 border-pink-500/40',
      textColor: 'text-pink-400',
      description: 'Customer needs to consult with spouse/partner'
    },
    need_to_think: { 
      emoji: '💭', 
      label: 'Need to Think', 
      color: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/40',
      textColor: 'text-cyan-400',
      description: 'Customer wants time to consider - often a stall tactic'
    },
    competition: { 
      emoji: '🏃', 
      label: 'Competition', 
      color: 'from-indigo-500/20 to-indigo-600/10 border-indigo-500/40',
      textColor: 'text-indigo-400',
      description: 'Customer comparing with competitors'
    }
  }

  const getObjectionInfo = (type) => {
    return objectionTypes[type] || { 
      emoji: '❓', 
      label: type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown',
      color: 'from-slate-500/20 to-slate-600/10 border-slate-500/40',
      textColor: 'text-slate-400',
      description: 'Customer raised a concern'
    }
  }

  const getScoreColor = (score) => {
    if (score >= 7) return 'text-emerald-400 bg-emerald-500/20'
    if (score >= 4) return 'text-amber-400 bg-amber-500/20'
    return 'text-red-400 bg-red-500/20'
  }

  const getScoreBg = (score) => {
    if (score >= 7) return 'from-emerald-500/10 to-emerald-600/5'
    if (score >= 4) return 'from-amber-500/10 to-amber-600/5'
    return 'from-red-500/10 to-red-600/5'
  }

  return (
    <div className="space-y-6">
      {/* Objections Section - Professional Redesign */}
      {objections.length > 0 && (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500/30 to-orange-500/20 rounded-xl flex items-center justify-center border border-red-500/30">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-100">Objections Analysis</h2>
                <p className="text-sm text-slate-500">{objections.length} objections detected in this call</p>
              </div>
            </div>
            <div className="text-center px-4 py-2 bg-slate-800/80 rounded-xl border border-slate-700/50">
              <div className="text-2xl font-bold text-slate-200">
                {Math.round(objections.reduce((sum, o) => sum + (o.handling_score || 0), 0) / objections.length)}<span className="text-lg text-slate-500">/10</span>
              </div>
              <p className="text-xs text-slate-500">Average Handling Score</p>
            </div>
          </div>

          {/* Objection Cards */}
          <div className="space-y-4">
            {objections.map((objection, i) => {
              const typeInfo = getObjectionInfo(objection.type)
              const isExpanded = expandedObjection === i
              
              return (
                <div 
                  key={i} 
                  className={`rounded-2xl border overflow-hidden transition-all duration-300 ${
                    isExpanded 
                      ? 'bg-gradient-to-br ' + typeInfo.color + ' shadow-lg' 
                      : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600/50'
                  }`}
                >
                  {/* Card Header - Always Visible */}
                  <button
                    onClick={() => setExpandedObjection(isExpanded ? null : i)}
                    className="w-full p-4 text-left"
                  >
                    <div className="flex items-start gap-4">
                      {/* Type Icon */}
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
                        isExpanded ? 'bg-white/10' : 'bg-slate-700/50'
                      }`}>
                        {typeInfo.emoji}
                      </div>
                      
                      {/* Main Content */}
                      <div className="flex-1 min-w-0">
                        {/* Top Row: Type, Timestamp, Score */}
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={`font-semibold ${typeInfo.textColor}`}>
                            {typeInfo.label}
                          </span>
                          {objection.timestamp && (
                            <button 
                              className="text-xs font-mono px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30 transition-colors flex items-center gap-1"
                              onClick={(e) => {
                                e.stopPropagation()
                                if (onSeek && objection.timestamp_ms) {
                                  onSeek(objection.timestamp_ms)
                                }
                              }}
                            >
                              <Play className="w-3 h-3" /> {objection.timestamp}
                            </button>
                          )}
                          {objection.was_preventable && (
                            <span className="text-xs px-2 py-1 bg-amber-500/20 text-amber-400 rounded-lg flex items-center gap-1">
                              <Shield className="w-3 h-3" /> Preventable
                            </span>
                          )}
                          <span className={`ml-auto px-2 py-1 rounded-lg text-sm font-bold ${getScoreColor(objection.handling_score)}`}>
                            {objection.handling_score}/10
                          </span>
                        </div>
                        
                        {/* Type Description */}
                        <p className="text-xs text-slate-500 mb-3">{typeInfo.description}</p>
                        
                        {/* Customer Quote */}
                        <div className="p-3 bg-slate-900/40 rounded-xl border-l-4 border-red-500/50">
                          <div className="flex items-center gap-2 mb-1">
                            <User className="w-4 h-4 text-red-400" />
                            <span className="text-xs font-semibold text-red-400">Customer Said:</span>
                          </div>
                          <p className="text-slate-200 font-medium leading-relaxed">"{objection.buyer_statement}"</p>
                        </div>
                      </div>
                      
                      {/* Expand Icon */}
                      <div className={`p-2 rounded-lg transition-colors ${isExpanded ? 'bg-white/10' : 'bg-slate-700/30'}`}>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-4">
                      {/* Real Concern */}
                      {objection.real_concern && (
                        <div className="p-3 bg-slate-900/30 rounded-xl border border-slate-700/30">
                          <div className="flex items-center gap-2 mb-1">
                            <Lightbulb className="w-4 h-4 text-amber-400" />
                            <span className="text-xs font-semibold text-amber-400">The Real Concern:</span>
                          </div>
                          <p className="text-slate-300 text-sm">{objection.real_concern}</p>
                        </div>
                      )}
                      
                      {/* What Seller Said */}
                      <div className="p-4 bg-slate-900/40 rounded-xl border-l-4 border-slate-500">
                        <div className="flex items-center gap-2 mb-2">
                          <UserCircle className="w-4 h-4 text-slate-400" />
                          <span className="text-xs font-semibold text-slate-400">Your Response:</span>
                        </div>
                        <p className="text-slate-300 leading-relaxed">"{objection.seller_response}"</p>
                      </div>

                      {/* Better Response */}
                      <div className="p-4 bg-emerald-500/10 rounded-xl border-l-4 border-emerald-500">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-emerald-400" />
                            <span className="text-sm font-semibold text-emerald-400">Better Response</span>
                            {objection.technique_to_use && (
                              <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-lg">
                                {objection.technique_to_use}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => copyToClipboard(objection.better_response, `obj-${i}`)}
                            className="p-2 hover:bg-emerald-500/20 rounded-lg transition-colors"
                          >
                            {copiedId === `obj-${i}` ? (
                              <Check className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Copy className="w-4 h-4 text-emerald-400" />
                            )}
                          </button>
                        </div>
                        <p className="text-emerald-100 leading-relaxed text-lg font-medium">"{objection.better_response}"</p>
                        
                        {/* Follow-up Close */}
                        {objection.follow_up_close && (
                          <div className="mt-4 pt-3 border-t border-emerald-500/20">
                            <p className="text-xs text-emerald-400 mb-1 font-semibold">➜ Then close with:</p>
                            <p className="text-emerald-200 italic">"{objection.follow_up_close}"</p>
                          </div>
                        )}

                        {/* TTS Button */}
                        {TTSButton && (
                          <div className="mt-4">
                            <TTSButton text={objection.better_response} label="🔊 Listen to Better Response" />
                          </div>
                        )}
                      </div>

                      {/* Prevention Tip */}
                      {objection.how_to_prevent && (
                        <div className="p-4 bg-violet-500/10 rounded-xl border border-violet-500/20">
                          <div className="flex items-center gap-2 mb-2">
                            <Shield className="w-4 h-4 text-violet-400" />
                            <span className="text-sm font-semibold text-violet-400">How to Prevent This Next Time</span>
                          </div>
                          <p className="text-slate-300">{objection.how_to_prevent}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Better Responses Section */}
      {betterResponses.length > 0 && (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
          <div className="p-4 border-b border-slate-700/50 bg-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-200">Response Improvements</h3>
                <p className="text-sm text-slate-500">{betterResponses.length} moments where you could respond better</p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-700/30">
            {betterResponses.map((resp, i) => (
              <div key={i} className="p-4">
                <button
                  onClick={() => setExpandedResponse(expandedResponse === i ? null : i)}
                  className="w-full text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {resp.timestamp && (
                          <button 
                            className="text-xs font-mono px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30 transition-colors flex items-center gap-1"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (onSeek && resp.timestamp_ms) {
                                onSeek(resp.timestamp_ms)
                              }
                            }}
                          >
                            <Play className="w-3 h-3" /> {resp.timestamp}
                          </button>
                        )}
                        {resp.technique && (
                          <span className="text-xs px-2 py-1 bg-violet-500/20 text-violet-400 rounded-lg">
                            {resp.technique}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 text-sm">
                        <span className="text-slate-500">Context:</span> {resp.context || resp.buyer_context}
                      </p>
                    </div>
                    {expandedResponse === i ? (
                      <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    )}
                  </div>
                </button>

                {expandedResponse === i && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Original */}
                    <div className="p-4 bg-slate-900/50 rounded-xl border-l-4 border-red-500/50">
                      <p className="text-xs text-red-400 font-semibold mb-2">❌ What You Said</p>
                      <p className="text-slate-400">"{resp.original_response || resp.original_seller_statement}"</p>
                      {resp.problem_with_original && (
                        <p className="text-xs text-slate-500 mt-2 italic">Problem: {resp.problem_with_original}</p>
                      )}
                    </div>

                    {/* Improved */}
                    <div className="p-4 bg-emerald-500/10 rounded-xl border-l-4 border-emerald-500">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-emerald-400 font-semibold">✅ Say This Instead</p>
                        <button
                          onClick={() => copyToClipboard(resp.improved_response, `resp-${i}`)}
                          className="p-1.5 hover:bg-emerald-500/20 rounded-lg transition-colors"
                        >
                          {copiedId === `resp-${i}` ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4 text-emerald-400" />
                          )}
                        </button>
                      </div>
                      <p className="text-emerald-200 font-medium">"{resp.improved_response}"</p>
                      
                      {TTSButton && (
                        <div className="mt-3">
                          <TTSButton text={resp.improved_response} />
                        </div>
                      )}
                    </div>

                    {/* Impact */}
                    {(resp.why_this_closes || resp.expected_impact) && (
                      <div className="md:col-span-2 p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                        <p className="text-xs text-indigo-400 font-semibold mb-1">💡 Why This Works Better</p>
                        <p className="text-sm text-slate-400">{resp.why_this_closes || resp.expected_impact}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Buying Signals */}
      {buyingSignals.length > 0 && (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
          <div className="p-4 border-b border-slate-700/50 bg-slate-800/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-200">Buying Signals</h3>
                  <p className="text-sm text-slate-500">Moments when customer showed interest</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-emerald-400">
                  {buyingSignals.filter(s => !s.close_opportunity_missed).length}/{buyingSignals.length}
                </div>
                <p className="text-xs text-slate-500">Capitalized</p>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {buyingSignals.map((signal, i) => (
              <div 
                key={i} 
                className={`p-3 rounded-xl border ${
                  signal.close_opportunity_missed 
                    ? 'bg-amber-500/10 border-amber-500/20' 
                    : 'bg-emerald-500/10 border-emerald-500/20'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {signal.timestamp && (
                        <span className="text-xs font-mono text-slate-400">{signal.timestamp}</span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        signal.close_opportunity_missed 
                          ? 'bg-amber-500/20 text-amber-400' 
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {signal.close_opportunity_missed ? 'Missed' : 'Captured'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300">"{signal.signal}"</p>
                    {signal.optimal_response && signal.close_opportunity_missed && (
                      <p className="text-xs text-slate-500 mt-1">
                        <span className="text-emerald-400">Should have said:</span> {signal.optimal_response}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {objections.length === 0 && betterResponses.length === 0 && (
        <div className="bg-slate-800/50 rounded-xl p-12 border border-slate-700/50 text-center">
          <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-300 mb-2">No Deep Insights Available</h3>
          <p className="text-slate-500">This call didn't have significant objections or improvement opportunities detected.</p>
        </div>
      )}
    </div>
  )
}
