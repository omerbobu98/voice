import { useState } from 'react'
import { 
  Dumbbell, ChevronDown, ChevronUp, CheckCircle2, Circle,
  Volume2, Copy, Check, Lightbulb, Clock, Zap, Target,
  MessageSquare, Shield, TrendingUp, Flame, Star, Play, Trophy
} from 'lucide-react'
import { PRACTICE_TRANSLATIONS } from './PracticeTranslations'

// Exercise type icons and colors
const EXERCISE_TYPE_CONFIG = {
  script_practice: { icon: MessageSquare, color: 'violet', labelEn: 'Script', labelHe: 'סקריפט' },
  objection: { icon: Shield, color: 'orange', labelEn: 'Objection', labelHe: 'התנגדות' },
  discovery: { icon: Target, color: 'blue', labelEn: 'Discovery', labelHe: 'גילוי' },
  closing: { icon: Zap, color: 'emerald', labelEn: 'Closing', labelHe: 'סגירה' },
  storytelling: { icon: Star, color: 'pink', labelEn: 'Story', labelHe: 'סיפור' },
  default: { icon: Dumbbell, color: 'slate', labelEn: 'Exercise', labelHe: 'תרגיל' }
}

// Difficulty config
const DIFFICULTY_CONFIG = {
  easy: { labelEn: 'Easy', labelHe: 'קל', color: 'emerald', stars: 1 },
  medium: { labelEn: 'Medium', labelHe: 'בינוני', color: 'amber', stars: 2 },
  hard: { labelEn: 'Hard', labelHe: 'מאתגר', color: 'red', stars: 3 }
}

export default function ExerciseCard({ exercise, index, lang, TTSButton, isCompleted, onComplete }) {
  const pt = PRACTICE_TRANSLATIONS[lang]
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  
  const copyScript = () => {
    const text = exercise.practice_script || exercise.ideal_response || ''
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  // Determine exercise type and config
  const typeKey = exercise.exercise_type?.toLowerCase().includes('objection') ? 'objection' :
                  exercise.exercise_type?.toLowerCase().includes('script') ? 'script_practice' :
                  exercise.exercise_type?.toLowerCase().includes('closing') ? 'closing' :
                  exercise.exercise_type?.toLowerCase().includes('story') ? 'storytelling' :
                  exercise.exercise_type?.toLowerCase().includes('discovery') ? 'discovery' : 'default'
  
  const typeConfig = EXERCISE_TYPE_CONFIG[typeKey]
  const TypeIcon = typeConfig.icon
  
  // Estimate difficulty based on content
  const difficulty = exercise.difficulty || (exercise.tips?.length > 2 ? 'hard' : exercise.tips?.length > 0 ? 'medium' : 'easy')
  const diffConfig = DIFFICULTY_CONFIG[difficulty]
  
  // Estimate time (2-5 min based on content)
  const estimatedTime = exercise.estimated_time || (exercise.practice_script?.length > 200 ? 5 : 3)
  
  const colorClasses = {
    violet: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    orange: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    pink: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    red: 'bg-red-500/20 text-red-400 border-red-500/30',
    slate: 'bg-slate-500/20 text-slate-400 border-slate-500/30'
  }
  
  return (
    <div className={`rounded-2xl border transition-all overflow-hidden ${
      isCompleted 
        ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/30' 
        : 'bg-gradient-to-r from-slate-800/80 to-slate-900/80 border-slate-700/50 hover:border-violet-500/30'
    }`}>
      {/* Header */}
      <div 
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-4">
          {/* Completion Checkbox with Ring */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onComplete && onComplete()
            }}
            className="relative mt-1"
          >
            {isCompleted ? (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-700/50 border-2 border-slate-600 flex items-center justify-center hover:border-violet-500 hover:bg-violet-500/10 transition-all">
                <span className="text-sm font-bold text-slate-400">{index + 1}</span>
              </div>
            )}
          </button>
          
          <div className="flex-1 min-w-0">
            {/* Top row - Type badge, difficulty, time */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${colorClasses[typeConfig.color]}`}>
                <TypeIcon className="w-3 h-3" />
                {lang === 'en' ? typeConfig.labelEn : typeConfig.labelHe}
              </span>
              
              {/* Difficulty stars */}
              <div className={`flex items-center gap-0.5 px-2 py-1 rounded-lg text-xs ${colorClasses[diffConfig.color]}`}>
                {[...Array(3)].map((_, i) => (
                  <Star key={i} className={`w-3 h-3 ${i < diffConfig.stars ? 'fill-current' : 'opacity-30'}`} />
                ))}
              </div>
              
              {/* Estimated time */}
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Clock className="w-3 h-3" />
                {estimatedTime} {lang === 'en' ? 'min' : 'דק׳'}
              </span>
            </div>
            
            {/* Title */}
            <h4 className={`font-semibold text-base ${isCompleted ? 'text-emerald-300' : 'text-slate-100'}`}>
              {exercise.title}
            </h4>
            
            {/* Description preview */}
            {exercise.description && !expanded && (
              <p className="text-sm text-slate-400 mt-1.5 line-clamp-1">{exercise.description}</p>
            )}
            
            {/* Technique badge */}
            {exercise.technique && !expanded && (
              <div className="mt-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-500/10 text-violet-400 text-xs rounded-lg">
                  <Zap className="w-3 h-3" />
                  {exercise.technique}
                </span>
              </div>
            )}
          </div>
          
          {/* Expand/Start buttons */}
          <div className="flex items-center gap-2">
            {!isCompleted && !expanded && (
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  setExpanded(true)
                }}
                className="px-3 py-1.5 bg-violet-500 hover:bg-violet-600 text-white text-xs font-medium rounded-lg flex items-center gap-1 transition-all"
              >
                <Play className="w-3 h-3" />
                {lang === 'en' ? 'Start' : 'התחל'}
              </button>
            )}
            <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </div>
      
      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-slate-700/50 pt-4">
          {/* Scenario */}
          {exercise.example_scenario && (
            <div className="p-3 bg-slate-900/50 rounded-lg">
              <p className="text-xs text-slate-500 mb-1">{pt.practiceScenario}</p>
              <p className="text-slate-300 text-sm">"{exercise.example_scenario}"</p>
            </div>
          )}
          
          {/* What you said */}
          {exercise.your_response && (
            <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
              <p className="text-xs text-red-400 mb-1">{lang === 'en' ? 'What you said:' : 'מה אמרת:'}</p>
              <p className="text-slate-300 text-sm">"{exercise.your_response}"</p>
            </div>
          )}
          
          {/* Ideal response / Practice script */}
          {(exercise.ideal_response || exercise.practice_script) && (
            <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-emerald-400">{pt.whatToSay}</p>
                <div className="flex gap-2">
                  <button
                    onClick={copyScript}
                    className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  </button>
                  {TTSButton && <TTSButton text={exercise.ideal_response || exercise.practice_script} />}
                </div>
              </div>
              <p className="text-slate-200 text-sm leading-relaxed">"{exercise.ideal_response || exercise.practice_script}"</p>
            </div>
          )}
          
          {/* Technique */}
          {exercise.technique && (
            <div className="flex items-center gap-2 text-sm">
              <span className="px-2.5 py-1 bg-violet-500/20 text-violet-300 rounded-lg">
                {lang === 'en' ? 'Technique:' : 'טכניקה:'} {exercise.technique}
              </span>
            </div>
          )}
          
          {/* Tips */}
          {exercise.tips?.length > 0 && (
            <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <p className="text-xs text-amber-400 font-medium">{pt.tips}</p>
              </div>
              <ul className="space-y-1.5">
                {exercise.tips.map((tip, i) => (
                  <li key={i} className="text-sm text-amber-300 flex items-start gap-2">
                    <span className="text-amber-500">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Complete button */}
          {!isCompleted && (
            <button
              onClick={() => onComplete && onComplete()}
              className="w-full py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {lang === 'en' ? 'Mark as completed' : 'סמן כהושלם'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// Daily Drill Card - Enhanced with timer and progress
export function DailyDrillCard({ drill, lang }) {
  const pt = PRACTICE_TRANSLATIONS[lang]
  const [expanded, setExpanded] = useState(false)
  const [completedSteps, setCompletedSteps] = useState(new Set())
  const [isActive, setIsActive] = useState(false)
  
  const totalSteps = drill.exercises?.length || 0
  const completedCount = completedSteps.size
  const progress = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0
  
  const toggleStep = (index) => {
    setCompletedSteps(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }
  
  return (
    <div className={`rounded-2xl border overflow-hidden transition-all ${
      progress === 100 
        ? 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/30'
        : 'bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-red-500/5 border-amber-500/20'
    }`}>
      <div 
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          {/* Icon with progress ring */}
          <div className="relative">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
              progress === 100 
                ? 'bg-gradient-to-br from-emerald-500 to-teal-500'
                : 'bg-gradient-to-br from-amber-500 to-orange-500'
            }`}>
              {progress === 100 ? (
                <CheckCircle2 className="w-7 h-7 text-white" />
              ) : (
                <Flame className="w-7 h-7 text-white" />
              )}
            </div>
            {/* Mini progress indicator */}
            {progress > 0 && progress < 100 && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-slate-900 rounded-full flex items-center justify-center border-2 border-amber-500">
                <span className="text-[10px] font-bold text-amber-400">{completedCount}</span>
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-slate-100">{drill.drill_name}</h4>
              {progress === 100 && (
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full font-medium">
                  {lang === 'en' ? 'Done!' : 'הושלם!'}
                </span>
              )}
            </div>
            <p className="text-sm text-amber-400">{drill.focus}</p>
            
            {/* Progress bar */}
            <div className="mt-2 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  progress === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {completedCount}/{totalSteps} {lang === 'en' ? 'steps' : 'צעדים'}
            </p>
          </div>
          
          {/* Start/Expand button */}
          <div className="flex items-center gap-2">
            {!expanded && progress < 100 && (
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  setExpanded(true)
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-xl flex items-center gap-1.5 transition-all shadow-lg shadow-amber-500/20"
              >
                <Play className="w-4 h-4" />
                {lang === 'en' ? 'Start' : 'התחל'}
              </button>
            )}
            <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </div>
      
      {expanded && drill.exercises && (
        <div className="px-4 pb-4 space-y-2 border-t border-amber-500/10 pt-4">
          {drill.exercises.map((ex, i) => {
            const isCompleted = completedSteps.has(i)
            return (
              <div 
                key={i} 
                onClick={() => toggleStep(i)}
                className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                  isCompleted 
                    ? 'bg-emerald-500/10 border border-emerald-500/20' 
                    : 'bg-slate-800/50 hover:bg-slate-700/50'
                }`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                  isCompleted 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span className="text-xs font-bold">{i + 1}</span>
                  )}
                </div>
                <p className={`text-sm flex-1 ${isCompleted ? 'text-emerald-300 line-through opacity-70' : 'text-slate-200'}`}>
                  {ex}
                </p>
              </div>
            )
          })}
          
          {progress === 100 && (
            <div className="mt-4 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-center">
              <p className="text-emerald-400 font-medium flex items-center justify-center gap-2">
                <Trophy className="w-5 h-5" />
                {lang === 'en' ? 'Great job! Drill completed!' : 'כל הכבוד! התרגיל הושלם!'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Action Item Card
export function ActionItemCard({ item, index, lang, isCompleted, onComplete }) {
  const priorityColors = {
    1: 'border-red-500/30 bg-red-500/5',
    2: 'border-amber-500/30 bg-amber-500/5',
    3: 'border-blue-500/30 bg-blue-500/5'
  }
  
  return (
    <div className={`p-4 rounded-xl border ${priorityColors[item.priority] || priorityColors[3]} transition-all ${
      isCompleted ? 'opacity-60' : ''
    }`}>
      <div className="flex items-start gap-3">
        <button
          onClick={() => onComplete && onComplete()}
          className="mt-0.5"
        >
          {isCompleted ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <Circle className="w-5 h-5 text-slate-500 hover:text-slate-400" />
          )}
        </button>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-medium ${
              item.priority === 1 ? 'text-red-400' : 
              item.priority === 2 ? 'text-amber-400' : 'text-blue-400'
            }`}>
              {lang === 'en' ? `Priority ${item.priority}` : `עדיפות ${item.priority}`}
            </span>
            {item.deadline && (
              <span className="text-xs text-slate-500">• {item.deadline}</span>
            )}
          </div>
          <p className={`font-medium ${isCompleted ? 'line-through text-slate-500' : 'text-slate-200'}`}>
            {item.action}
          </p>
          {item.why && (
            <p className="text-sm text-slate-400 mt-1">{item.why}</p>
          )}
        </div>
      </div>
    </div>
  )
}
