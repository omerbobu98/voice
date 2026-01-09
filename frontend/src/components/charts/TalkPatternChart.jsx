import { useRef, useMemo } from 'react'

export default function TalkPatternChart({ utterances, speakerRoles, totalDuration, onSeek }) {
  const containerRef = useRef(null)

  // Process utterances into visualization segments
  const segments = useMemo(() => {
    if (!utterances || utterances.length === 0) return []
    
    return utterances.map(u => {
      const role = speakerRoles?.[u.speaker] || 'Unknown'
      const startPct = (u.start / (totalDuration * 1000)) * 100
      const widthPct = ((u.end - u.start) / (totalDuration * 1000)) * 100
      
      return {
        ...u,
        role,
        startPct: Math.max(0, Math.min(100, startPct)),
        widthPct: Math.max(0.5, Math.min(100 - startPct, widthPct)), // Min 0.5% for visibility
      }
    })
  }, [utterances, speakerRoles, totalDuration])

  // Calculate stats
  const stats = useMemo(() => {
    let sellerTime = 0
    let buyerTime = 0
    let sellerTurns = 0
    let buyerTurns = 0
    let longestSellerMonologue = 0
    let longestBuyerMonologue = 0

    segments.forEach(seg => {
      const duration = seg.end - seg.start
      if (seg.role === 'Seller') {
        sellerTime += duration
        sellerTurns++
        if (duration > longestSellerMonologue) longestSellerMonologue = duration
      } else if (seg.role === 'Buyer') {
        buyerTime += duration
        buyerTurns++
        if (duration > longestBuyerMonologue) longestBuyerMonologue = duration
      }
    })

    return {
      sellerTime,
      buyerTime,
      sellerTurns,
      buyerTurns,
      longestSellerMonologue,
      longestBuyerMonologue,
      avgSellerTurn: sellerTurns > 0 ? sellerTime / sellerTurns : 0,
      avgBuyerTurn: buyerTurns > 0 ? buyerTime / buyerTurns : 0,
    }
  }, [segments])

  const formatDuration = (ms) => {
    const secs = Math.round(ms / 1000)
    const mins = Math.floor(secs / 60)
    const remainingSecs = secs % 60
    if (mins > 0) return `${mins}m ${remainingSecs}s`
    return `${secs}s`
  }

  const handleClick = (e) => {
    if (!containerRef.current || !onSeek) return
    const rect = containerRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percent = clickX / rect.width
    const timeMs = percent * totalDuration * 1000
    onSeek(timeMs)
  }

  if (segments.length === 0) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
        <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2 mb-4">
          <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
          Conversation Flow
        </h3>
        <div className="text-center py-8 text-slate-500">
          No conversation data available
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
          <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
          Conversation Flow
        </h3>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-indigo-500" />
            <span className="text-slate-400">Seller</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-emerald-500" />
            <span className="text-slate-400">Buyer</span>
          </div>
        </div>
      </div>

      {/* Timeline Visualization */}
      <div 
        ref={containerRef}
        className="relative h-16 bg-slate-900/50 rounded-lg overflow-hidden cursor-pointer group"
        onClick={handleClick}
        title="Click to jump to that moment"
      >
        {/* Segments */}
        {segments.map((seg, i) => (
          <div
            key={i}
            className={`absolute h-full transition-opacity hover:opacity-90 ${
              seg.role === 'Seller' ? 'bg-indigo-500/80' : 
              seg.role === 'Buyer' ? 'bg-emerald-500/80' : 
              'bg-slate-600/80'
            }`}
            style={{
              left: `${seg.startPct}%`,
              width: `${seg.widthPct}%`,
            }}
            title={`${seg.role}: ${seg.text?.substring(0, 50)}...`}
          />
        ))}

        {/* Time markers */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 py-1 bg-gradient-to-t from-slate-900/80 to-transparent">
          <span className="text-[10px] text-slate-500">0:00</span>
          <span className="text-[10px] text-slate-500">{formatDuration(totalDuration * 500)}</span>
          <span className="text-[10px] text-slate-500">{formatDuration(totalDuration * 1000)}</span>
        </div>

        {/* Hover indicator */}
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="text-xs text-slate-400">Click to jump</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-700/50">
        <div className="text-center">
          <div className="text-lg font-bold text-indigo-400">{stats.sellerTurns}</div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wide">Seller Turns</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-emerald-400">{stats.buyerTurns}</div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wide">Buyer Turns</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-indigo-400">{formatDuration(stats.avgSellerTurn)}</div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wide">Avg Seller Turn</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-emerald-400">{formatDuration(stats.avgBuyerTurn)}</div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wide">Avg Buyer Turn</div>
        </div>
      </div>

      {/* Monologue Warning */}
      {(stats.longestSellerMonologue > 60000 || stats.longestBuyerMonologue > 60000) && (
        <div className="mt-3 p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
          <p className="text-xs text-amber-400 flex items-center gap-2">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Longest monologue: {formatDuration(Math.max(stats.longestSellerMonologue, stats.longestBuyerMonologue))} - Consider shorter turns for better engagement
          </p>
        </div>
      )}
    </div>
  )
}
