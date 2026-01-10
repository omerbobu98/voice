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
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-pink-500/20 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-pink-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-200">Story Library</h3>
              <p className="text-xs text-slate-500">{stories.length} stories detected</p>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        {storyTypes.length > 1 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                filter === 'all' 
                  ? 'bg-indigo-500 text-white' 
                  : 'bg-slate-700/50 text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({stories.length})
            </button>
            {storyTypes.map(type => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                  filter === type 
                    ? 'bg-indigo-500 text-white' 
                    : 'bg-slate-700/50 text-slate-400 hover:text-slate-200'
                }`}
              >
                {getStoryTypeIcon(type)} {formatStoryType(type)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Stories List */}
      <div className="divide-y divide-slate-700/30">
        {filteredStories.map((story, i) => (
          <div key={i} className="p-4">
            {/* Story Header */}
            <button
              onClick={() => setExpandedStory(expandedStory === i ? null : i)}
              className="w-full text-left"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-xl">{getStoryTypeIcon(story.story_type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 bg-slate-700 rounded text-slate-300">
                        {formatStoryType(story.story_type)}
                      </span>
                      {story.timestamp && (
                        <button 
                          className="text-xs font-mono px-2 py-0.5 bg-pink-500/20 text-pink-400 rounded hover:bg-pink-500/30 transition-colors flex items-center gap-1"
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
                        <span className="text-xs px-2 py-0.5 bg-violet-500/20 text-violet-400 rounded hidden sm:inline">
                          {story.storytelling_technique}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-300 line-clamp-2">
                      {story.intended_message || story.original_story?.substring(0, 100) + '...'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`px-2 py-1 rounded text-sm font-bold ${getScoreColor(story.effectiveness_score)}`}>
                    {story.effectiveness_score}/10
                  </span>
                  {expandedStory === i ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>
            </button>

            {/* Expanded Content */}
            {expandedStory === i && (
              <div className="mt-4 space-y-3">
                {/* Original Story */}
                <div className="p-3 bg-slate-900/50 rounded-lg border-l-2 border-slate-500">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-slate-500 font-semibold">📖 Original Story</p>
                  </div>
                  <p className="text-sm text-slate-400">{story.original_story}</p>
                </div>

                {/* Issues */}
                {story.issues?.length > 0 && (
                  <div className="p-3 bg-amber-500/10 rounded-lg border-l-2 border-amber-500">
                    <p className="text-xs text-amber-400 font-semibold mb-2">⚠️ What to Improve</p>
                    <ul className="space-y-1">
                      {story.issues.map((issue, j) => (
                        <li key={j} className="text-sm text-slate-400 flex items-start gap-2">
                          <span className="text-amber-400">•</span> {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Improved Story */}
                <div className="p-3 bg-emerald-500/10 rounded-lg border-l-2 border-emerald-500">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Improved Version
                    </p>
                    <button
                      onClick={() => copyToClipboard(story.improved_story, `story-${i}`)}
                      className="p-1 hover:bg-emerald-500/20 rounded transition-colors"
                      title="Copy improved story"
                    >
                      {copied === `story-${i}` ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 text-emerald-400" />
                      )}
                    </button>
                  </div>
                  <p className="text-sm text-emerald-200 leading-relaxed">{story.improved_story}</p>
                  {story.why_better && (
                    <p className="text-xs text-slate-400 mt-2 pt-2 border-t border-emerald-500/20 italic">
                      💡 {story.why_better}
                    </p>
                  )}
                </div>

                {/* TTS Button */}
                {TTSButton && (
                  <div className="mt-2">
                    <TTSButton text={story.improved_story} label="Listen to Improved Story" />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Tips Section */}
      <div className="p-4 bg-slate-900/30 border-t border-slate-700/30">
        <div className="flex items-start gap-2">
          <Star className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-slate-400 font-medium mb-1">Storytelling Tips</p>
            <ul className="text-xs text-slate-500 space-y-0.5">
              <li>• Make stories visual - help them picture the scenario</li>
              <li>• Include specific numbers and results</li>
              <li>• Connect emotionally before presenting facts</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
