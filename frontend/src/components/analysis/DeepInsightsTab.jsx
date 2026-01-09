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
    <div className="space-y-8">
      {/* Objections Section - Premium Design */}
      {objections.length > 0 && (
        <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl border border-red-500/20 overflow-hidden shadow-xl shadow-red-500/5">
          <div className="p-5 border-b border-slate-700/50 bg-gradient-to-r from-red-500/10 via-orange-500/5 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30">
                  <AlertTriangle className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Objections Detected</h3>
                  <p className="text-sm text-slate-400">{objections.length} objections found • Click to see better responses</p>
                </div>
              </div>
              <div className="text-center px-5 py-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
                <div className="text-3xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                  {Math.round(objections.reduce((sum, o) => sum + (o.handling_score || 0), 0) / objections.length)}/10
                </div>
                <p className="text-xs text-slate-500 font-medium">Avg Handling</p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-700/30">
            {objections.map((objection, i) => (
              <div key={i} className="p-5 hover:bg-slate-800/30 transition-colors">
                {/* Objection Header */}
                <button
                  onClick={() => setExpandedObjection(expandedObjection === i ? null : i)}
                  className="w-full text-left group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${getObjectionTypeColor(objection.type)}`}>
                          {formatType(objection.type)}
                        </span>
                        {objection.timestamp && (
                          <button 
                            className="text-xs font-mono px-3 py-1.5 bg-indigo-500/20 text-indigo-400 rounded-xl hover:bg-indigo-500/30 transition-all flex items-center gap-1.5 hover:scale-105"
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
                          <span className="text-xs px-3 py-1.5 bg-amber-500/20 text-amber-400 rounded-xl font-medium">
                            ⚠️ Preventable
                          </span>
                        )}
                      </div>
                      <p className="text-slate-200 font-semibold text-base leading-relaxed">"{objection.buyer_statement}"</p>
                      <p className="text-sm text-slate-400 mt-2">
                        <span className="text-slate-500">Real concern:</span> {objection.real_concern}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-center px-4 py-2 bg-slate-800/50 rounded-xl">
                        <span className={`text-xl font-bold ${getScoreColor(objection.handling_score)}`}>
                          {objection.handling_score}/10
                        </span>
                        <p className="text-xs text-slate-500 mt-0.5">Handling</p>
                      </div>
                      <div className={`w-8 h-8 rounded-full bg-slate-800/60 flex items-center justify-center transition-transform duration-300 ${expandedObjection === i ? 'rotate-180' : ''}`}>
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      </div>
                    </div>
                  </div>
                </button>

                {/* Expanded Content */}
                {expandedObjection === i && (
                  <div className="mt-5 space-y-4 animate-fadeIn">
                    {/* What Seller Said */}
                    <div className="p-5 bg-slate-900/60 rounded-2xl border-l-4 border-slate-500">
                      <p className="text-xs text-slate-500 font-bold mb-3 flex items-center gap-2 uppercase tracking-wide">
                        <MessageSquare className="w-4 h-4" /> What You Said
                      </p>
                      <p className="text-slate-300 leading-relaxed">"{objection.seller_response}"</p>
                    </div>

                    {/* Better Response */}
                    <div className="p-5 bg-gradient-to-br from-emerald-500/15 to-green-500/10 rounded-2xl border-l-4 border-emerald-500 shadow-lg shadow-emerald-500/10">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm text-emerald-400 font-bold flex items-center gap-2">
                          <Zap className="w-4 h-4" /> Better Response
                          {objection.technique_to_use && (
                            <span className="px-2 py-0.5 bg-emerald-500/20 rounded-lg text-xs">{objection.technique_to_use}</span>
                          )}
                        </p>
                        <button
                          onClick={() => copyToClipboard(objection.better_response, `obj-${i}`)}
                          className="p-2 hover:bg-emerald-500/20 rounded-xl transition-all hover:scale-110"
                        >
                          {copiedId === `obj-${i}` ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4 text-emerald-400" />
                          )}
                        </button>
                      </div>
                      <p className="text-emerald-100 leading-relaxed text-base font-medium">"{objection.better_response}"</p>
                      
                      {/* Follow-up Close */}
                      {objection.follow_up_close && (
                        <div className="mt-4 pt-4 border-t border-emerald-500/20">
                          <p className="text-xs text-emerald-400 mb-2 font-bold">🎯 Then close with:</p>
                          <p className="text-emerald-200 italic font-medium">"{objection.follow_up_close}"</p>
                        </div>
                      )}

                      {/* TTS Button */}
                      {TTSButton && (
                        <div className="mt-4">
                          <TTSButton text={objection.better_response} />
                        </div>
                      )}
                    </div>

                    {/* Prevention Tip */}
                    {objection.how_to_prevent && (
                      <div className="p-4 bg-gradient-to-r from-amber-500/15 to-orange-500/10 rounded-2xl border border-amber-500/30">
                        <p className="text-xs text-amber-400 font-bold mb-2 uppercase tracking-wide">💡 How to Prevent Next Time</p>
                        <p className="text-sm text-slate-300 leading-relaxed">{objection.how_to_prevent}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Better Responses Section - Premium Design */}
      {betterResponses.length > 0 && (
        <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl border border-emerald-500/20 overflow-hidden shadow-xl shadow-emerald-500/5">
          <div className="p-5 border-b border-slate-700/50 bg-gradient-to-r from-emerald-500/10 via-green-500/5 to-transparent">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Response Improvements</h3>
                <p className="text-sm text-slate-400">{betterResponses.length} moments where you could respond better</p>
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

      {/* Buying Signals - Premium Design */}
      {buyingSignals.length > 0 && (
        <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl border border-cyan-500/20 overflow-hidden shadow-xl shadow-cyan-500/5">
          <div className="p-5 border-b border-slate-700/50 bg-gradient-to-r from-cyan-500/10 via-blue-500/5 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
                  <Target className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Buying Signals</h3>
                  <p className="text-sm text-slate-400">Moments when customer showed interest</p>
                </div>
              </div>
              <div className="text-center px-5 py-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
                <div className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  {buyingSignals.filter(s => !s.close_opportunity_missed).length}/{buyingSignals.length}
                </div>
                <p className="text-xs text-slate-500 font-medium">Capitalized</p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {buyingSignals.map((signal, i) => (
              <div 
                key={i} 
                className={`p-4 rounded-2xl border transition-all hover:scale-[1.01] ${
                  signal.close_opportunity_missed 
                    ? 'bg-gradient-to-r from-amber-500/15 to-orange-500/10 border-amber-500/30' 
                    : 'bg-gradient-to-r from-emerald-500/15 to-green-500/10 border-emerald-500/30'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {signal.timestamp && (
                        <span className="text-xs font-mono px-2 py-1 bg-slate-800/60 rounded-lg text-slate-400">{signal.timestamp}</span>
                      )}
                      <span className={`text-xs px-3 py-1 rounded-lg font-bold ${
                        signal.close_opportunity_missed 
                          ? 'bg-amber-500/20 text-amber-400' 
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {signal.close_opportunity_missed ? '⚠️ Missed' : '✅ Captured'}
                      </span>
                    </div>
                    <p className="text-base text-slate-200 font-medium leading-relaxed">"{signal.signal}"</p>
                    {signal.optimal_response && signal.close_opportunity_missed && (
                      <div className="mt-3 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                        <p className="text-xs text-emerald-400 font-bold mb-1">✨ Should have said:</p>
                        <p className="text-sm text-emerald-200">{signal.optimal_response}</p>
                      </div>
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
