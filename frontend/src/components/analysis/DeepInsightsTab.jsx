import { useState } from 'react'
import { AlertTriangle, MessageSquare, Zap, ChevronDown, ChevronUp, Play, Volume2, Check, Copy, Target, TrendingUp } from 'lucide-react'

export default function DeepInsightsTab({ analysisResult, onSeek, TTSButton }) {
  const [expandedObjection, setExpandedObjection] = useState(null)
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

  const getObjectionTypeColor = (type) => {
    switch (type) {
      case 'price': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'timing': return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      case 'authority': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'need': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'trust': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'spouse_decision': return 'bg-pink-500/20 text-pink-400 border-pink-500/30'
      case 'need_to_think': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    }
  }

  const getScoreColor = (score) => {
    if (score >= 7) return 'text-emerald-400'
    if (score >= 4) return 'text-amber-400'
    return 'text-red-400'
  }

  const formatType = (type) => {
    if (!type) return 'Unknown'
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <div className="space-y-6">
      {/* Objections Section */}
      {objections.length > 0 && (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
          <div className="p-3 sm:p-4 border-b border-slate-700/50 bg-slate-800/80">
            <div className="flex items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-200">Objections Detected</h3>
                  <p className="text-xs sm:text-sm text-slate-500">{objections.length} found • Tap to expand</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xl sm:text-2xl font-bold text-slate-200">
                  {Math.round(objections.reduce((sum, o) => sum + (o.handling_score || 0), 0) / objections.length)}/10
                </div>
                <p className="text-[10px] sm:text-xs text-slate-500">Avg Handling</p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-700/30">
            {objections.map((objection, i) => (
              <div key={i} className="p-3 sm:p-4">
                {/* Objection Header */}
                <button
                  onClick={() => setExpandedObjection(expandedObjection === i ? null : i)}
                  className="w-full text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getObjectionTypeColor(objection.type)}`}>
                          {formatType(objection.type)}
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
                          <span className="text-xs px-2 py-1 bg-amber-500/20 text-amber-400 rounded-lg">
                            Preventable
                          </span>
                        )}
                      </div>
                      <p className="text-slate-300 font-medium">"{objection.buyer_statement}"</p>
                      <p className="text-sm text-slate-500 mt-1">
                        <span className="text-slate-400">Real concern:</span> {objection.real_concern}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                      <div className="text-right hidden xs:block">
                        <span className={`text-base sm:text-lg font-bold ${getScoreColor(objection.handling_score)}`}>
                          {objection.handling_score}/10
                        </span>
                        <p className="text-[10px] sm:text-xs text-slate-500">Handling</p>
                      </div>
                      {expandedObjection === i ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </div>
                </button>

                {/* Expanded Content */}
                {expandedObjection === i && (
                  <div className="mt-4 space-y-4">
                    {/* What Seller Said */}
                    <div className="p-4 bg-slate-900/50 rounded-xl border-l-4 border-slate-500">
                      <p className="text-xs text-slate-500 font-semibold mb-2 flex items-center gap-2">
                        <MessageSquare className="w-3 h-3" /> What You Said
                      </p>
                      <p className="text-slate-400">"{objection.seller_response}"</p>
                    </div>

                    {/* Better Response */}
                    <div className="p-4 bg-emerald-500/10 rounded-xl border-l-4 border-emerald-500">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-emerald-400 font-semibold flex items-center gap-2">
                          <Zap className="w-3 h-3" /> Better Response ({objection.technique_to_use})
                        </p>
                        <button
                          onClick={() => copyToClipboard(objection.better_response, `obj-${i}`)}
                          className="p-1.5 hover:bg-emerald-500/20 rounded-lg transition-colors"
                        >
                          {copiedId === `obj-${i}` ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4 text-emerald-400" />
                          )}
                        </button>
                      </div>
                      <p className="text-emerald-200 leading-relaxed">"{objection.better_response}"</p>
                      
                      {/* Follow-up Close */}
                      {objection.follow_up_close && (
                        <div className="mt-3 pt-3 border-t border-emerald-500/20">
                          <p className="text-xs text-emerald-400 mb-1">Then close with:</p>
                          <p className="text-emerald-300 italic">"{objection.follow_up_close}"</p>
                        </div>
                      )}

                      {/* TTS Button */}
                      {TTSButton && (
                        <div className="mt-3">
                          <TTSButton text={objection.better_response} />
                        </div>
                      )}
                    </div>

                    {/* Prevention Tip */}
                    {objection.how_to_prevent && (
                      <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                        <p className="text-xs text-amber-400 font-semibold mb-1">💡 How to Prevent Next Time</p>
                        <p className="text-sm text-slate-400">{objection.how_to_prevent}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
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
              <div key={i} className="p-3 sm:p-4">
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
                  <div className="mt-3 sm:mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    {/* Original */}
                    <div className="p-3 sm:p-4 bg-slate-900/50 rounded-xl border-l-4 border-red-500/50">
                      <p className="text-xs text-red-400 font-semibold mb-2">❌ What You Said</p>
                      <p className="text-slate-400">"{resp.original_response || resp.original_seller_statement}"</p>
                      {resp.problem_with_original && (
                        <p className="text-xs text-slate-500 mt-2 italic">Problem: {resp.problem_with_original}</p>
                      )}
                    </div>

                    {/* Improved */}
                    <div className="p-3 sm:p-4 bg-emerald-500/10 rounded-xl border-l-4 border-emerald-500">
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
