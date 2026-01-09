import { useState } from 'react'
import { BookOpen, Play, Star, Copy, Check, ChevronDown, ChevronUp, Sparkles, Volume2 } from 'lucide-react'

export default function StoryLibrary({ stories, onSeek, TTSButton }) {
  const [expandedStory, setExpandedStory] = useState(null)
  const [copied, setCopied] = useState(null)
  const [filter, setFilter] = useState('all')

  if (!stories || stories.length === 0) {
    return null
  }

  const storyTypes = [...new Set(stories.map(s => s.story_type))].filter(Boolean)

  const filteredStories = filter === 'all' 
    ? stories 
    : stories.filter(s => s.story_type === filter)

  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(id)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const formatStoryType = (type) => {
    if (!type) return 'Story'
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const getStoryTypeIcon = (type) => {
    switch (type) {
      case 'customer_success': return '🏆'
      case 'personal_experience': return '👤'
      case 'analogy': return '🔗'
      case 'case_study': return '📊'
      case 'pain_story': return '😰'
      default: return '📖'
    }
  }

  const getScoreColor = (score) => {
    if (score >= 7) return 'text-emerald-400 bg-emerald-500/20'
    if (score >= 4) return 'text-amber-400 bg-amber-500/20'
    return 'text-red-400 bg-red-500/20'
  }

  return (
    <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl border border-pink-500/20 overflow-hidden shadow-xl shadow-pink-500/5">
      {/* Header - Premium Design */}
      <div className="p-5 border-b border-slate-700/50 bg-gradient-to-r from-pink-500/10 via-rose-500/5 to-transparent">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/30">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Story Library</h3>
              <p className="text-sm text-slate-400">{stories.length} stories detected in this call</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-800/60 rounded-full">
            <Sparkles className="w-4 h-4 text-pink-400" />
            <span className="text-xs text-slate-400">AI Enhanced</span>
          </div>
        </div>

        {/* Filter Pills - Premium */}
        {storyTypes.length > 1 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filter === 'all' 
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/30' 
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-700/60'
              }`}
            >
              All ({stories.length})
            </button>
            {storyTypes.map(type => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  filter === type 
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/30' 
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-700/60'
                }`}
              >
                {getStoryTypeIcon(type)} {formatStoryType(type)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Stories List - Premium Cards */}
      <div className="divide-y divide-slate-700/30">
        {filteredStories.map((story, i) => (
          <div key={i} className="p-5 hover:bg-slate-800/30 transition-colors">
            {/* Story Header */}
            <button
              onClick={() => setExpandedStory(expandedStory === i ? null : i)}
              className="w-full text-left group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500/20 to-rose-500/20 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                    {getStoryTypeIcon(story.story_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-xs px-3 py-1.5 bg-slate-800/80 rounded-xl text-slate-300 font-bold">
                        {formatStoryType(story.story_type)}
                      </span>
                      {story.timestamp && (
                        <button 
                          className="text-xs font-mono px-3 py-1.5 bg-pink-500/20 text-pink-400 rounded-xl hover:bg-pink-500/30 transition-all flex items-center gap-1.5 hover:scale-105"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (onSeek && story.timestamp_ms) {
                              onSeek(story.timestamp_ms)
                            }
                          }}
                        >
                          <Play className="w-3 h-3" /> {story.timestamp}
                        </button>
                      )}
                      {story.storytelling_technique && (
                        <span className="text-xs px-3 py-1.5 bg-violet-500/20 text-violet-400 rounded-xl hidden sm:inline font-medium">
                          {story.storytelling_technique}
                        </span>
                      )}
                    </div>
                    <p className="text-base text-slate-200 line-clamp-2 leading-relaxed font-medium">
                      {story.intended_message || story.original_story?.substring(0, 100) + '...'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className={`px-4 py-2 rounded-xl text-base font-bold ${getScoreColor(story.effectiveness_score)}`}>
                    {story.effectiveness_score}/10
                  </div>
                  <div className={`w-8 h-8 rounded-full bg-slate-800/60 flex items-center justify-center transition-transform duration-300 ${expandedStory === i ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  </div>
                </div>
              </div>
            </button>

            {/* Expanded Content - Premium */}
            {expandedStory === i && (
              <div className="mt-5 space-y-4 animate-fadeIn">
                {/* Original Story */}
                <div className="p-5 bg-slate-900/60 rounded-2xl border-l-4 border-slate-500">
                  <p className="text-xs text-slate-500 font-bold mb-3 uppercase tracking-wide">📖 Original Story</p>
                  <p className="text-sm text-slate-300 leading-relaxed">{story.original_story}</p>
                </div>

                {/* Issues */}
                {story.issues?.length > 0 && (
                  <div className="p-4 bg-gradient-to-r from-amber-500/15 to-orange-500/10 rounded-2xl border border-amber-500/30">
                    <p className="text-xs text-amber-400 font-bold mb-3 uppercase tracking-wide">⚠️ What to Improve</p>
                    <ul className="space-y-2">
                      {story.issues.map((issue, j) => (
                        <li key={j} className="text-sm text-slate-300 flex items-start gap-2">
                          <span className="text-amber-400 mt-0.5">•</span> {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Improved Story */}
                <div className="p-5 bg-gradient-to-br from-emerald-500/15 to-green-500/10 rounded-2xl border-l-4 border-emerald-500 shadow-lg shadow-emerald-500/10">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-emerald-400 font-bold flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> Improved Version
                    </p>
                    <button
                      onClick={() => copyToClipboard(story.improved_story, `story-${i}`)}
                      className="p-2 hover:bg-emerald-500/20 rounded-xl transition-all hover:scale-110"
                      title="Copy improved story"
                    >
                      {copied === `story-${i}` ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-emerald-400" />
                      )}
                    </button>
                  </div>
                  <p className="text-base text-emerald-100 leading-relaxed font-medium">{story.improved_story}</p>
                  {story.why_better && (
                    <p className="text-sm text-slate-400 mt-4 pt-4 border-t border-emerald-500/20 italic">
                      💡 {story.why_better}
                    </p>
                  )}
                </div>

                {/* TTS Button */}
                {TTSButton && (
                  <div className="mt-3">
                    <TTSButton text={story.improved_story} label="🔊 Listen to Improved Story" />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Tips Section - Premium */}
      <div className="p-5 bg-gradient-to-r from-amber-500/10 to-orange-500/5 border-t border-amber-500/20">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/20">
            <Star className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm text-amber-400 font-bold mb-2">Pro Storytelling Tips</p>
            <ul className="text-sm text-slate-400 space-y-1.5">
              <li className="flex items-center gap-2"><span className="text-amber-400">→</span> Make stories visual - help them picture the scenario</li>
              <li className="flex items-center gap-2"><span className="text-amber-400">→</span> Include specific numbers and results</li>
              <li className="flex items-center gap-2"><span className="text-amber-400">→</span> Connect emotionally before presenting facts</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
