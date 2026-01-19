import { useState } from 'react'
import { 
  BookOpen, Play, Star, Copy, Check, ChevronDown, ChevronUp, Sparkles, Volume2,
  User, Clock, Lightbulb, TrendingUp, Heart, Target, AlertCircle, Wand2
} from 'lucide-react'

// The 6 storytelling elements
const STORY_ELEMENTS = [
  { id: 'relatable_character', labelEn: 'Relatable Character', labelHe: 'דמות רלוונטית', icon: User, color: 'violet' },
  { id: 'same_hesitation', labelEn: 'Same Hesitation', labelHe: 'אותו היסוס', icon: AlertCircle, color: 'amber' },
  { id: 'decision_moment', labelEn: 'Decision Moment', labelHe: 'רגע ההחלטה', icon: Lightbulb, color: 'blue' },
  { id: 'cost_of_waiting', labelEn: 'Cost of Waiting', labelHe: 'מחיר ההמתנה', icon: Clock, color: 'red' },
  { id: 'specific_results', labelEn: 'Specific Results', labelHe: 'תוצאות ספציפיות', icon: TrendingUp, color: 'emerald' },
  { id: 'emotional_payoff', labelEn: 'Emotional Payoff', labelHe: 'תגמול רגשי', icon: Heart, color: 'pink' }
]

export default function StoryLibrary({ stories, onSeek, TTSButton, lang = 'en' }) {
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
    if (score >= 7) return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30'
    if (score >= 4) return 'text-amber-400 bg-amber-500/20 border-amber-500/30'
    return 'text-red-400 bg-red-500/20 border-red-500/30'
  }
  
  // Check which story elements are present
  const getStoryElements = (story) => {
    const elements = story.elements_present || []
    return STORY_ELEMENTS.map(el => ({
      ...el,
      present: elements.includes(el.id) || elements.includes(el.labelEn.toLowerCase().replace(/ /g, '_'))
    }))
  }
  
  const countPresentElements = (story) => {
    const elements = getStoryElements(story)
    return elements.filter(e => e.present).length
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
        {filteredStories.map((story, i) => {
          const storyElements = getStoryElements(story)
          const presentCount = storyElements.filter(e => e.present).length
          const missingElements = storyElements.filter(e => !e.present)
          
          return (
          <div key={i} className="p-4">
            {/* Story Header - Enhanced card style */}
            <button
              onClick={() => setExpandedStory(expandedStory === i ? null : i)}
              className="w-full text-left"
            >
              <div className="flex items-start gap-4">
                {/* Story icon with score ring */}
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 bg-gradient-to-br from-pink-500/20 to-rose-500/20 rounded-2xl flex items-center justify-center border border-pink-500/30">
                    <span className="text-2xl">{getStoryTypeIcon(story.story_type)}</span>
                  </div>
                  {/* Score badge */}
                  <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${getScoreColor(story.effectiveness_score)}`}>
                    {story.effectiveness_score}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  {/* Top row - badges */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs px-2 py-0.5 bg-slate-700/50 rounded-lg text-slate-300 border border-slate-600/50">
                      {formatStoryType(story.story_type)}
                    </span>
                    
                    {/* Elements count badge */}
                    <span className={`text-xs px-2 py-0.5 rounded-lg border ${
                      presentCount >= 4 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                      presentCount >= 2 ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                      'bg-red-500/20 text-red-400 border-red-500/30'
                    }`}>
                      {presentCount}/6 {lang === 'en' ? 'elements' : 'אלמנטים'}
                    </span>
                    
                    {story.timestamp && (
                      <button 
                        className="text-xs font-mono px-2 py-0.5 bg-pink-500/20 text-pink-400 rounded-lg hover:bg-pink-500/30 transition-colors flex items-center gap-1 border border-pink-500/30"
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
                  </div>
                  
                  {/* Story preview */}
                  <p className="text-sm text-slate-200 line-clamp-2 mb-2">
                    {story.intended_message || story.original_story?.substring(0, 100) + '...'}
                  </p>
                  
                  {/* Missing elements preview (collapsed) */}
                  {missingElements.length > 0 && expandedStory !== i && (
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-xs text-slate-500">{lang === 'en' ? 'Missing:' : 'חסר:'}</span>
                      {missingElements.slice(0, 3).map((el, j) => (
                        <span key={j} className={`text-xs px-1.5 py-0.5 rounded bg-${el.color}-500/10 text-${el.color}-400 border border-${el.color}-500/20`}>
                          {lang === 'en' ? el.labelEn : el.labelHe}
                        </span>
                      ))}
                      {missingElements.length > 3 && (
                        <span className="text-xs text-slate-500">+{missingElements.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
                
                <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform flex-shrink-0 ${expandedStory === i ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {/* Expanded Content */}
            {expandedStory === i && (
              <div className="mt-4 space-y-4">
                {/* Story Elements Checklist */}
                <div className="p-4 bg-slate-900/30 rounded-xl border border-slate-700/50">
                  <p className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4 text-violet-400" />
                    {lang === 'en' ? '6 Storytelling Elements' : '6 אלמנטים של סיפור'}
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {storyElements.map((el, j) => {
                      const ElIcon = el.icon
                      return (
                        <div 
                          key={j}
                          className={`flex items-center gap-2 p-2 rounded-lg transition-all ${
                            el.present 
                              ? 'bg-emerald-500/10 border border-emerald-500/30' 
                              : 'bg-slate-800/50 border border-slate-700/50 opacity-60'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            el.present ? 'bg-emerald-500/20' : 'bg-slate-700/50'
                          }`}>
                            {el.present ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <ElIcon className={`w-3 h-3 text-slate-500`} />
                            )}
                          </div>
                          <span className={`text-xs ${el.present ? 'text-emerald-300' : 'text-slate-500'}`}>
                            {lang === 'en' ? el.labelEn : el.labelHe}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
                
                {/* Original Story */}
                <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-slate-400" />
                      {lang === 'en' ? 'Your Story' : 'הסיפור שלך'}
                    </p>
                    {TTSButton && <TTSButton text={story.original_story} />}
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">{story.original_story}</p>
                  
                  {/* Detected message */}
                  {story.intended_message && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-amber-400 font-medium">{lang === 'en' ? 'Detected Message' : 'מסר שזוהה'}</p>
                        <p className="text-sm text-slate-300">{story.intended_message}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Issues */}
                {story.issues?.length > 0 && (
                  <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/20">
                    <p className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {lang === 'en' ? 'What to Improve' : 'מה לשפר'}
                    </p>
                    <ul className="space-y-2">
                      {story.issues.map((issue, j) => (
                        <li key={j} className="text-sm text-slate-300 flex items-start gap-2">
                          <span className="text-amber-400 mt-1">•</span> {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Improved Story */}
                <div className="p-4 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-xl border border-emerald-500/20">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                      <Wand2 className="w-4 h-4" />
                      {lang === 'en' ? 'The Improved Version' : 'הגרסה המשופרת'}
                    </p>
                    <div className="flex items-center gap-2">
                      {TTSButton && <TTSButton text={story.improved_story} />}
                      <button
                        onClick={() => copyToClipboard(story.improved_story, `story-${i}`)}
                        className="p-2 hover:bg-emerald-500/20 rounded-lg transition-colors"
                        title="Copy improved story"
                      >
                        {copied === `story-${i}` ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-emerald-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-emerald-100 leading-relaxed">{story.improved_story}</p>
                  {story.why_better && (
                    <div className="mt-3 pt-3 border-t border-emerald-500/20 flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-emerald-300 italic">{story.why_better}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )})}
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
