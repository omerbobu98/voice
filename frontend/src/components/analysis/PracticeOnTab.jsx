import { useState, useRef, useEffect } from 'react'
import { 
  Target, Dumbbell, Mic, Play, Pause, Volume2, ChevronDown, ChevronUp, 
  CheckCircle2, Circle, Flame, Zap, BookOpen, MessageSquare, Timer,
  Star, Trophy, ArrowRight, Lightbulb, AlertTriangle, Sparkles,
  RotateCcw, Copy, Check, Users, Brain, TrendingUp, Award
} from 'lucide-react'
import axios from 'axios'
import { API_URL } from '../../lib/config'

// Priority Badge Component
function PriorityBadge({ priority }) {
  const config = {
    critical: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', icon: AlertTriangle, label: 'קריטי' },
    high: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30', icon: Flame, label: 'גבוה' },
    medium: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30', icon: Target, label: 'בינוני' },
    low: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30', icon: TrendingUp, label: 'נמוך' }
  }
  
  const cfg = config[priority] || config.medium
  const Icon = cfg.icon
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  )
}

// Score Progress Ring
function ScoreRing({ current, target, size = 60 }) {
  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const currentOffset = circumference - (current / 100) * circumference
  const targetOffset = circumference - (target / 100) * circumference
  
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-400'
    if (score >= 60) return 'text-amber-400'
    return 'text-red-400'
  }
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          className="text-slate-700"
        />
        {/* Target circle (dashed) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeDasharray="4 4"
          strokeDashoffset={targetOffset}
          className="text-emerald-500/50"
        />
        {/* Current score circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={currentOffset}
          strokeLinecap="round"
          className={getScoreColor(current)}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-sm font-bold ${getScoreColor(current)}`}>{current}</span>
      </div>
    </div>
  )
}

// Practice Exercise Card
function ExerciseCard({ exercise, index, TTSButton, onComplete, isCompleted }) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  
  const exerciseIcons = {
    script_practice: { icon: Mic, color: 'text-violet-400', bg: 'bg-violet-500/20' },
    roleplay: { icon: Users, color: 'text-pink-400', bg: 'bg-pink-500/20' },
    listen_and_repeat: { icon: Volume2, color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
    quiz: { icon: Brain, color: 'text-amber-400', bg: 'bg-amber-500/20' },
    technique_drill: { icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-500/20' }
  }
  
  const cfg = exerciseIcons[exercise.exercise_type] || exerciseIcons.script_practice
  const Icon = cfg.icon
  
  const copyScript = async () => {
    try {
      await navigator.clipboard.writeText(exercise.practice_script || exercise.ideal_response)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }
  
  return (
    <div className={`rounded-xl border transition-all ${
      isCompleted 
        ? 'bg-emerald-500/5 border-emerald-500/20' 
        : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600/50'
    }`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-right p-4"
      >
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
            <Icon className={`w-5 h-5 ${cfg.color}`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-slate-500 font-medium">תרגיל {index + 1}</span>
              {exercise.technique && (
                <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-xs rounded-lg">
                  {exercise.technique}
                </span>
              )}
            </div>
            <h4 className="text-base font-semibold text-slate-200 text-right">{exercise.title}</h4>
            <p className="text-sm text-slate-400 mt-1 line-clamp-2 text-right">{exercise.description}</p>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onComplete && onComplete()
              }}
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                isCompleted 
                  ? 'bg-emerald-500 text-white' 
                  : 'border border-slate-600 text-slate-500 hover:border-emerald-500 hover:text-emerald-400'
              }`}
            >
              {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
            </button>
            
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </div>
      </button>
      
      {expanded && (
        <div className="px-4 pb-4 space-y-4" dir="rtl">
          {/* Scenario */}
          {exercise.example_scenario && (
            <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-700/30">
              <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                תרחיש לתרגול:
              </p>
              <p className="text-slate-300 text-sm">{exercise.example_scenario}</p>
            </div>
          )}
          
          {/* Your Response vs Ideal */}
          {exercise.your_response && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 bg-red-500/5 rounded-xl border border-red-500/20">
                <p className="text-xs text-red-400 mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  מה אמרת:
                </p>
                <p className="text-slate-300 text-sm">"{exercise.your_response}"</p>
              </div>
              
              <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/20">
                <p className="text-xs text-emerald-400 mb-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  מה צריך לומר:
                </p>
                <p className="text-slate-300 text-sm">"{exercise.ideal_response}"</p>
              </div>
            </div>
          )}
          
          {/* Practice Script */}
          {exercise.practice_script && (
            <div className="p-4 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 rounded-xl border border-violet-500/20">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-violet-400 font-semibold flex items-center gap-1">
                  <Mic className="w-3 h-3" />
                  תרגל את הסקריפט הזה:
                </p>
                <button
                  onClick={copyScript}
                  className="p-1.5 hover:bg-violet-500/20 rounded-lg transition-colors"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-violet-400" />
                  )}
                </button>
              </div>
              <p className="text-slate-200 leading-relaxed whitespace-pre-line">{exercise.practice_script}</p>
              
              {TTSButton && (
                <div className="mt-3">
                  <TTSButton 
                    text={exercise.practice_script} 
                    label="🔊 האזן ותרגל" 
                  />
                </div>
              )}
            </div>
          )}
          
          {/* Tips */}
          {exercise.tips && exercise.tips.length > 0 && (
            <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/20">
              <p className="text-xs text-amber-400 mb-2 flex items-center gap-1">
                <Lightbulb className="w-3 h-3" />
                טיפים:
              </p>
              <ul className="space-y-1">
                {exercise.tips.map((tip, i) => (
                  <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                    <span className="text-amber-400">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Roleplay Scenario Card
function RoleplayCard({ scenario, TTSButton }) {
  const [expanded, setExpanded] = useState(false)
  const [showDialogue, setShowDialogue] = useState(false)
  
  return (
    <div className="bg-gradient-to-br from-pink-500/5 to-violet-500/5 rounded-xl border border-pink-500/20 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-right p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-pink-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-slate-200">{scenario.scenario_name}</h4>
              <p className="text-sm text-slate-400 mt-1">{scenario.context}</p>
            </div>
          </div>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
          )}
        </div>
      </button>
      
      {expanded && (
        <div className="px-4 pb-4 space-y-4" dir="rtl">
          {/* Customer Opening */}
          <div className="p-3 bg-slate-900/50 rounded-xl">
            <p className="text-xs text-pink-400 mb-2">הלקוח אומר:</p>
            <p className="text-slate-200 font-medium">"{scenario.customer_opening}"</p>
          </div>
          
          {/* Goal */}
          <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <p className="text-xs text-emerald-400 mb-2 flex items-center gap-1">
              <Target className="w-3 h-3" />
              המטרה שלך:
            </p>
            <p className="text-slate-300 text-sm">{scenario.goal}</p>
          </div>
          
          {/* Techniques */}
          {scenario.techniques_to_use && scenario.techniques_to_use.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-slate-500">טכניקות לשימוש:</span>
              {scenario.techniques_to_use.map((tech, i) => (
                <span key={i} className="px-2 py-1 bg-indigo-500/20 text-indigo-400 text-xs rounded-lg">
                  {tech}
                </span>
              ))}
            </div>
          )}
          
          {/* Sample Dialogue Toggle */}
          <button
            onClick={() => setShowDialogue(!showDialogue)}
            className="w-full p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-violet-500/30 transition-all flex items-center justify-between"
          >
            <span className="text-sm text-slate-300">
              {showDialogue ? 'הסתר דוגמת דיאלוג' : 'הצג דוגמת דיאלוג'}
            </span>
            {showDialogue ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>
          
          {showDialogue && scenario.sample_dialogue && (
            <div className="space-y-2 p-4 bg-slate-900/50 rounded-xl">
              {scenario.sample_dialogue.map((line, i) => (
                <div 
                  key={i} 
                  className={`p-3 rounded-xl ${
                    line.speaker === 'Customer' || line.speaker === 'לקוח'
                      ? 'bg-slate-800/50 border-r-4 border-pink-500'
                      : 'bg-violet-500/10 border-r-4 border-violet-500'
                  }`}
                >
                  <p className={`text-xs mb-1 ${
                    line.speaker === 'Customer' || line.speaker === 'לקוח' 
                      ? 'text-pink-400' 
                      : 'text-violet-400'
                  }`}>
                    {line.speaker === 'Customer' || line.speaker === 'לקוח' ? 'לקוח:' : 'אתה:'}
                  </p>
                  <p className="text-slate-200 text-sm">{line.text}</p>
                </div>
              ))}
              
              {TTSButton && (
                <div className="mt-3">
                  <TTSButton 
                    text={scenario.sample_dialogue
                      .filter(l => l.speaker !== 'Customer' && l.speaker !== 'לקוח')
                      .map(l => l.text)
                      .join('. ')} 
                    label="🔊 האזן לתשובות שלך" 
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Action Item Card
function ActionItemCard({ item, index, isCompleted, onComplete }) {
  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl transition-all ${
      isCompleted 
        ? 'bg-emerald-500/10 border border-emerald-500/20' 
        : 'bg-slate-800/50 border border-slate-700/50'
    }`}>
      <button
        onClick={onComplete}
        className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
          isCompleted 
            ? 'bg-emerald-500 text-white' 
            : 'border-2 border-slate-600 hover:border-emerald-500'
        }`}
      >
        {isCompleted && <CheckCircle2 className="w-4 h-4" />}
      </button>
      
      <div className="flex-1" dir="rtl">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-slate-500">משימה {index + 1}</span>
          {item.deadline && (
            <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-lg">
              {item.deadline}
            </span>
          )}
        </div>
        <p className={`text-sm font-medium ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
          {item.action}
        </p>
        {item.why && (
          <p className="text-xs text-slate-500 mt-1">{item.why}</p>
        )}
      </div>
    </div>
  )
}

// Daily Drill Card
function DailyDrillCard({ drill }) {
  const [expanded, setExpanded] = useState(false)
  
  return (
    <div className="bg-gradient-to-br from-amber-500/5 to-orange-500/5 rounded-xl border border-amber-500/20 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-right p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
              <Timer className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-slate-200">{drill.drill_name}</h4>
              <p className="text-sm text-slate-400">{drill.focus}</p>
            </div>
          </div>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </button>
      
      {expanded && (
        <div className="px-4 pb-4" dir="rtl">
          <ul className="space-y-2">
            {drill.exercises.map((exercise, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-amber-400 font-bold">{i + 1}.</span>
                {exercise}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// Main Practice On Tab Component
export default function PracticeOnTab({ analysisResult, result, TTSButton }) {
  const [practiceData, setPracticeData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [completedExercises, setCompletedExercises] = useState(new Set())
  const [completedActions, setCompletedActions] = useState(new Set())
  const [activeSection, setActiveSection] = useState('weaknesses')
  
  useEffect(() => {
    generatePracticeContent()
  }, [analysisResult])
  
  const generatePracticeContent = async () => {
    if (!analysisResult) {
      setError('אין נתוני ניתוח זמינים')
      setLoading(false)
      return
    }
    
    // Check if practice data already exists in analysis
    if (analysisResult?.analysis?.practice_recommendations) {
      setPracticeData(analysisResult.analysis.practice_recommendations)
      setLoading(false)
      return
    }
    
    try {
      setLoading(true)
      const response = await axios.post(`${API_URL}/api/generate-practice`, {
        analysis: analysisResult
      })
      
      if (response.data.practice_recommendations) {
        setPracticeData(response.data.practice_recommendations)
      } else {
        throw new Error('No practice data received')
      }
    } catch (err) {
      console.error('Error generating practice content:', err)
      // Fallback to generating from existing analysis data
      setPracticeData(generateFromAnalysis(analysisResult))
    } finally {
      setLoading(false)
    }
  }
  
  // Fallback: Generate practice data from existing analysis
  const generateFromAnalysis = (analysis) => {
    const objections = analysis?.analysis?.objections || []
    const betterResponses = analysis?.analysis?.better_responses || []
    const methodologyScore = analysis?.analysis?.methodology_score || {}
    const sellerPerformance = analysis?.analysis?.seller_performance || {}
    
    const practiceAreas = []
    
    // Add practice area for each weakness
    if (methodologyScore.sales_tactics_score?.score < 70) {
      practiceAreas.push({
        skill_name: 'טכניקות מכירה',
        priority: methodologyScore.sales_tactics_score.score < 50 ? 'critical' : 'high',
        current_score: methodologyScore.sales_tactics_score?.score || 50,
        target_score: 85,
        weakness_summary: 'יש מקום לשיפור בטכניקות המכירה והסגירה',
        specific_issues: methodologyScore.sales_tactics_score?.gaps || [],
        practice_exercises: []
      })
    }
    
    // Add exercises from objections
    objections.forEach((obj, i) => {
      if (obj.handling_score < 7) {
        const area = practiceAreas.find(a => a.skill_name === 'טיפול בהתנגדויות') || {
          skill_name: 'טיפול בהתנגדויות',
          priority: obj.handling_score < 4 ? 'critical' : 'high',
          current_score: obj.handling_score * 10,
          target_score: 80,
          weakness_summary: 'יש לשפר את הטיפול בהתנגדויות',
          specific_issues: [],
          practice_exercises: []
        }
        
        if (!practiceAreas.find(a => a.skill_name === 'טיפול בהתנגדויות')) {
          practiceAreas.push(area)
        }
        
        area.practice_exercises.push({
          exercise_type: 'script_practice',
          title: `תרגול התנגדות: ${obj.type}`,
          description: `תרגל תגובה טובה יותר להתנגדות "${obj.surface_objection}"`,
          example_scenario: obj.buyer_statement,
          your_response: obj.seller_response,
          ideal_response: obj.better_response,
          technique: obj.technique_to_use,
          practice_script: obj.better_response,
          tips: [
            obj.how_to_prevent || 'נסה לזהות את ההתנגדות מראש ולמנוע אותה',
            `שימוש בטכניקת ${obj.technique_to_use} יעזור לך לטפל בהתנגדות זו`
          ]
        })
      }
    })
    
    return {
      practice_areas: practiceAreas,
      daily_drills: [
        {
          drill_name: 'תרגול בוקר - 5 דקות',
          focus: 'חימום לפני שיחות',
          exercises: [
            'תרגל את 3 המשפטים הפותחים הטובים ביותר שלך',
            'חזור על טכניקת Feel-Felt-Found פעם אחת',
            'תרגל שאלת סגירה אחת'
          ]
        }
      ],
      action_items: [
        {
          priority: 1,
          action: 'תרגל את הסקריפטים החדשים 3 פעמים לפני השיחה הבאה',
          why: 'חזרה יוצרת ביטחון ותגובות טבעיות יותר',
          deadline: 'לפני השיחה הבאה'
        }
      ],
      roleplay_scenarios: [],
      improvement_metrics: {
        weakest_area: practiceAreas[0]?.skill_name || 'לא זוהו חולשות משמעותיות',
        quick_wins: ['שיפור זמני תגובה', 'הוספת שאלות גילוי'],
        long_term_focus: ['בניית ספריית סיפורים', 'שליטה בכל טכניקות ההתנגדויות']
      }
    }
  }
  
  const toggleExercise = (exerciseId) => {
    setCompletedExercises(prev => {
      const newSet = new Set(prev)
      if (newSet.has(exerciseId)) {
        newSet.delete(exerciseId)
      } else {
        newSet.add(exerciseId)
      }
      return newSet
    })
  }
  
  const toggleAction = (actionIndex) => {
    setCompletedActions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(actionIndex)) {
        newSet.delete(actionIndex)
      } else {
        newSet.add(actionIndex)
      }
      return newSet
    })
  }
  
  const sections = [
    { id: 'weaknesses', label: 'חולשות לשיפור', icon: Target },
    { id: 'exercises', label: 'תרגילים', icon: Dumbbell },
    { id: 'roleplay', label: 'משחקי תפקידים', icon: Users },
    { id: 'actions', label: 'משימות', icon: CheckCircle2 }
  ]
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 relative">
            <div className="absolute inset-0 rounded-full border-4 border-violet-500/20" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-violet-500 animate-spin" />
            <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-violet-400" />
          </div>
          <p className="text-slate-300 font-medium">מייצר תוכנית אימון מותאמת אישית...</p>
          <p className="text-slate-500 text-sm mt-1">מנתח את הביצועים שלך ובונה תרגילים</p>
        </div>
      </div>
    )
  }
  
  if (error && !practiceData) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <p className="text-slate-300 font-medium">{error}</p>
        <button
          onClick={generatePracticeContent}
          className="mt-4 px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-lg transition-colors"
        >
          נסה שוב
        </button>
      </div>
    )
  }
  
  if (!practiceData) return null
  
  const totalExercises = practiceData.practice_areas?.reduce(
    (sum, area) => sum + (area.practice_exercises?.length || 0), 0
  ) || 0
  
  const completedCount = completedExercises.size
  const progressPercent = totalExercises > 0 ? Math.round((completedCount / totalExercises) * 100) : 0
  
  return (
    <div className="space-y-6" dir="rtl">
      {/* Header with Progress */}
      <div className="bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-pink-500/10 rounded-2xl border border-violet-500/20 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Dumbbell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">תרגול ושיפור</h2>
              <p className="text-sm text-slate-400">תוכנית אימון מותאמת אישית על בסיס השיחה</p>
            </div>
          </div>
          
          <div className="text-left">
            <div className="flex items-center gap-2">
              <Trophy className={`w-5 h-5 ${progressPercent === 100 ? 'text-amber-400' : 'text-slate-500'}`} />
              <span className="text-2xl font-bold text-slate-100">{progressPercent}%</span>
            </div>
            <p className="text-xs text-slate-500">{completedCount}/{totalExercises} תרגילים הושלמו</p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        
        {/* Quick Stats */}
        {practiceData.improvement_metrics && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-800/50 rounded-xl">
              <p className="text-xs text-slate-500 mb-1">נקודת המיקוד העיקרית</p>
              <p className="text-sm font-medium text-slate-200">{practiceData.improvement_metrics.weakest_area}</p>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-xl">
              <p className="text-xs text-slate-500 mb-1">ניצחונות מהירים</p>
              <p className="text-sm font-medium text-emerald-400">{practiceData.improvement_metrics.quick_wins?.length || 0} שיפורים קלים</p>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-xl">
              <p className="text-xs text-slate-500 mb-1">מיקוד לטווח ארוך</p>
              <p className="text-sm font-medium text-violet-400">{practiceData.improvement_metrics.long_term_focus?.length || 0} יעדים</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Section Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {sections.map(section => {
          const Icon = section.icon
          const isActive = activeSection === section.id
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20'
                  : 'bg-slate-800/50 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{section.label}</span>
            </button>
          )
        })}
      </div>
      
      {/* Content Sections */}
      {activeSection === 'weaknesses' && practiceData.practice_areas && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
            <Target className="w-5 h-5 text-red-400" />
            אזורים לשיפור
            <span className="text-sm font-normal text-slate-500">({practiceData.practice_areas.length})</span>
          </h3>
          
          <div className="grid gap-4">
            {practiceData.practice_areas.map((area, i) => (
              <div key={i} className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <PriorityBadge priority={area.priority} />
                        <h4 className="text-lg font-semibold text-slate-200">{area.skill_name}</h4>
                      </div>
                      <p className="text-sm text-slate-400">{area.weakness_summary}</p>
                      
                      {area.specific_issues && area.specific_issues.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {area.specific_issues.map((issue, j) => (
                            <span key={j} className="px-2 py-1 bg-slate-700/50 text-slate-300 text-xs rounded-lg">
                              {issue}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <ScoreRing current={area.current_score} target={area.target_score} />
                      <div className="text-right">
                        <p className="text-xs text-slate-500">יעד</p>
                        <p className="text-lg font-bold text-emerald-400">{area.target_score}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Exercises for this area */}
                {area.practice_exercises && area.practice_exercises.length > 0 && (
                  <div className="border-t border-slate-700/50 p-4 bg-slate-900/30">
                    <p className="text-sm text-slate-400 mb-3">
                      {area.practice_exercises.length} תרגילים לשיפור
                    </p>
                    <div className="space-y-2">
                      {area.practice_exercises.slice(0, 2).map((ex, j) => (
                        <ExerciseCard 
                          key={j}
                          exercise={ex}
                          index={j}
                          TTSButton={TTSButton}
                          isCompleted={completedExercises.has(`${i}-${j}`)}
                          onComplete={() => toggleExercise(`${i}-${j}`)}
                        />
                      ))}
                      {area.practice_exercises.length > 2 && (
                        <button
                          onClick={() => setActiveSection('exercises')}
                          className="w-full p-3 text-center text-sm text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 rounded-xl transition-colors"
                        >
                          הצג עוד {area.practice_exercises.length - 2} תרגילים →
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {activeSection === 'exercises' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-violet-400" />
            כל התרגילים
            <span className="text-sm font-normal text-slate-500">({totalExercises})</span>
          </h3>
          
          <div className="space-y-3">
            {practiceData.practice_areas?.flatMap((area, areaIndex) => 
              area.practice_exercises?.map((ex, exIndex) => (
                <ExerciseCard 
                  key={`${areaIndex}-${exIndex}`}
                  exercise={ex}
                  index={exIndex}
                  TTSButton={TTSButton}
                  isCompleted={completedExercises.has(`${areaIndex}-${exIndex}`)}
                  onComplete={() => toggleExercise(`${areaIndex}-${exIndex}`)}
                />
              ))
            )}
          </div>
          
          {/* Daily Drills */}
          {practiceData.daily_drills && practiceData.daily_drills.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2 mb-4">
                <Timer className="w-5 h-5 text-amber-400" />
                תרגילים יומיים
              </h3>
              <div className="space-y-3">
                {practiceData.daily_drills.map((drill, i) => (
                  <DailyDrillCard key={i} drill={drill} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {activeSection === 'roleplay' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
            <Users className="w-5 h-5 text-pink-400" />
            משחקי תפקידים
          </h3>
          
          {practiceData.roleplay_scenarios && practiceData.roleplay_scenarios.length > 0 ? (
            <div className="space-y-3">
              {practiceData.roleplay_scenarios.map((scenario, i) => (
                <RoleplayCard key={i} scenario={scenario} TTSButton={TTSButton} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-700/30">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">לא נמצאו תרחישים ספציפיים לתרגול</p>
              <p className="text-sm text-slate-500 mt-1">נסה לתרגל עם חבר או עמית באמצעות הסקריפטים שלמעלה</p>
            </div>
          )}
        </div>
      )}
      
      {activeSection === 'actions' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            משימות לביצוע
          </h3>
          
          {practiceData.action_items && practiceData.action_items.length > 0 ? (
            <div className="space-y-2">
              {practiceData.action_items.map((item, i) => (
                <ActionItemCard 
                  key={i}
                  item={item}
                  index={i}
                  isCompleted={completedActions.has(i)}
                  onComplete={() => toggleAction(i)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-700/30">
              <CheckCircle2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">אין משימות ספציפיות כרגע</p>
            </div>
          )}
          
          {/* Long Term Focus */}
          {practiceData.improvement_metrics?.long_term_focus && 
           practiceData.improvement_metrics.long_term_focus.length > 0 && (
            <div className="mt-6 p-4 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 rounded-xl border border-violet-500/20">
              <h4 className="text-sm font-semibold text-violet-400 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                מיקוד לטווח ארוך
              </h4>
              <ul className="space-y-2">
                {practiceData.improvement_metrics.long_term_focus.map((focus, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                    <ArrowRight className="w-4 h-4 text-violet-400" />
                    {focus}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
