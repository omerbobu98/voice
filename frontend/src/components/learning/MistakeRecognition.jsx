import { useState, useEffect } from 'react'
import { 
  AlertTriangle, CheckCircle2, X, Lightbulb, ArrowRight,
  Volume2, Play, Pause, RotateCcw, Zap, Target, Eye,
  Clock, MessageCircle, TrendingUp, Award, Sparkles
} from 'lucide-react'

// Visual Mistake Recognition Component
export default function MistakeRecognition({ mistakes, onMistakeClick, language = 'he' }) {
  const [selectedMistake, setSelectedMistake] = useState(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  // Mistake severity mapping
  const severityConfig = {
    critical: { 
      color: 'red', 
      labelHe: 'קריטי', 
      labelEn: 'Critical',
      impact: { he: 'עלול לגרום לאובדן העסקה', en: 'Could cause deal loss' }
    },
    high: { 
      color: 'orange', 
      labelHe: 'גבוה', 
      labelEn: 'High',
      impact: { he: 'פוגע באמינות', en: 'Damages credibility' }
    },
    medium: { 
      color: 'amber', 
      labelHe: 'בינוני', 
      labelEn: 'Medium',
      impact: { he: 'מחמיץ הזדמנויות', en: 'Misses opportunities' }
    },
    low: { 
      color: 'yellow', 
      labelHe: 'נמוך', 
      labelEn: 'Low',
      impact: { he: 'שיפור נחמד', en: 'Nice improvement' }
    }
  }

  // Example mistakes data structure
  const exampleMistakes = [
    {
      id: 1,
      type: 'premature_pricing',
      severity: 'critical',
      timestamp: '02:34',
      transcriptSegment: 'אז המחיר הוא 25,000 שקל...',
      titleHe: 'חשיפת מחיר מוקדמת',
      titleEn: 'Premature Price Reveal',
      descriptionHe: 'חשפת את המחיר לפני שהלקוח הבין את הערך',
      descriptionEn: 'You revealed price before customer understood value',
      impact: 'גרם לשוק מחירים והתנגדות מיידית',
      betterApproach: {
        he: 'קודם בנה ערך, אחר כך מחיר',
        en: 'Build value first, then reveal price'
      },
      steps: [
        { 
          he: 'זהה את נקודת הכאב של הלקוח',
          en: 'Identify customer pain point'
        },
        { 
          he: 'כמת את הכאב (כמה זה עולה להם)',
          en: 'Quantify the pain (what it costs them)'
        },
        { 
          he: 'הצג את הפתרון ותועלותיו',
          en: 'Present solution and benefits'
        },
        { 
          he: 'רק אז חשוף השקעה',
          en: 'Only then reveal investment'
        }
      ],
      audioSegment: '/audio/mistake_1.mp3',
      correctedAudio: '/audio/corrected_1.mp3'
    }
  ]

  const processedMistakes = mistakes?.length ? mistakes : exampleMistakes

  // Visual mistake timeline
  const MistakeTimeline = () => (
    <div className="relative">
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-700"></div>
      {processedMistakes.map((mistake, index) => {
        const config = severityConfig[mistake.severity]
        const isSelected = selectedMistake?.id === mistake.id
        
        return (
          <div key={mistake.id} className="relative flex items-center gap-4 mb-6">
            {/* Timeline dot */}
            <div className={`w-16 h-16 rounded-xl bg-gradient-to-br from-${config.color}-500/20 to-${config.color}-600/20 border-2 border-${config.color}-500/30 flex items-center justify-center flex-shrink-0 cursor-pointer transition-all ${isSelected ? `ring-2 ring-${config.color}-400 shadow-lg shadow-${config.color}-500/30` : 'hover:shadow-md'}`}
              onClick={() => setSelectedMistake(mistake)}
            >
              <AlertTriangle className={`w-6 h-6 text-${config.color}-400`} />
            </div>

            {/* Mistake card */}
            <div 
              className={`flex-1 p-4 rounded-xl border transition-all cursor-pointer ${
                isSelected 
                  ? `bg-${config.color}-500/10 border-${config.color}-500/30` 
                  : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600/50'
              }`}
              onClick={() => setSelectedMistake(mistake)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium bg-${config.color}-500/20 text-${config.color}-400`}>
                      {language === 'he' ? config.labelHe : config.labelEn}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      {mistake.timestamp}
                    </span>
                  </div>
                  <h3 className="font-semibold text-white mb-1">
                    {language === 'he' ? mistake.titleHe : mistake.titleEn}
                  </h3>
                  <p className="text-sm text-slate-400 mb-2">
                    {language === 'he' ? mistake.descriptionHe : mistake.descriptionEn}
                  </p>
                  <p className="text-xs text-slate-500 bg-slate-900/50 rounded-lg p-2 font-mono">
                    "{mistake.transcriptSegment}"
                  </p>
                </div>
                <ArrowRight className={`w-5 h-5 text-slate-400 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )

  // Detailed mistake analysis
  const MistakeAnalysis = ({ mistake }) => {
    const config = severityConfig[mistake.severity]
    
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-${config.color}-500/20 to-${config.color}-600/20 border border-${config.color}-500/30 flex items-center justify-center`}>
              <AlertTriangle className={`w-6 h-6 text-${config.color}-400`} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {language === 'he' ? mistake.titleHe : mistake.titleEn}
              </h3>
              <p className="text-sm text-slate-400">
                {language === 'he' ? config.impact.he : config.impact.en}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedMistake(null)}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Audio comparison */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* What you said */}
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <Volume2 className="w-4 h-4 text-red-400" />
              <span className="text-sm font-medium text-red-400">
                {language === 'he' ? 'מה שאמרת:' : 'What you said:'}
              </span>
            </div>
            <p className="text-slate-300 text-sm mb-3 font-mono bg-slate-900/50 rounded-lg p-2">
              "{mistake.transcriptSegment}"
            </p>
            <button className="flex items-center gap-2 px-3 py-2 bg-red-500/20 text-red-300 rounded-lg text-sm hover:bg-red-500/30 transition-colors">
              <Play className="w-4 h-4" />
              {language === 'he' ? 'השמע מקור' : 'Play Original'}
            </button>
          </div>

          {/* Better approach */}
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">
                {language === 'he' ? 'גישה טובה יותר:' : 'Better approach:'}
              </span>
            </div>
            <p className="text-slate-300 text-sm mb-3">
              {language === 'he' ? mistake.betterApproach.he : mistake.betterApproach.en}
            </p>
            <button className="flex items-center gap-2 px-3 py-2 bg-emerald-500/20 text-emerald-300 rounded-lg text-sm hover:bg-emerald-500/30 transition-colors">
              <Play className="w-4 h-4" />
              {language === 'he' ? 'השמע תיקון' : 'Play Correction'}
            </button>
          </div>
        </div>

        {/* Step-by-step improvement */}
        <div className="p-4 bg-violet-500/10 border border-violet-500/20 rounded-xl">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-violet-400" />
            <h4 className="font-semibold text-violet-400">
              {language === 'he' ? 'איך לתקן בפעם הבאה:' : 'How to fix next time:'}
            </h4>
          </div>
          
          <div className="space-y-3">
            {mistake.steps.map((step, index) => (
              <div 
                key={index}
                className={`flex items-start gap-3 p-3 rounded-lg transition-all cursor-pointer ${
                  currentStep === index 
                    ? 'bg-violet-500/20 border border-violet-500/30' 
                    : 'bg-slate-800/30 hover:bg-slate-700/30'
                }`}
                onClick={() => setCurrentStep(index)}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  currentStep >= index 
                    ? 'bg-violet-500 text-white' 
                    : 'bg-slate-600 text-slate-400'
                }`}>
                  {index + 1}
                </div>
                <p className={`text-sm ${currentStep >= index ? 'text-white' : 'text-slate-400'}`}>
                  {language === 'he' ? step.he : step.en}
                </p>
              </div>
            ))}
          </div>

          <button 
            onClick={() => setCurrentStep(0)}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-violet-500/20 text-violet-300 rounded-lg text-sm hover:bg-violet-500/30 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            {language === 'he' ? 'התחל מהתחלה' : 'Start Over'}
          </button>
        </div>

        {/* Practice this improvement */}
        <div className="p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-amber-400" />
              <h4 className="font-semibold text-amber-400">
                {language === 'he' ? 'תרגל את השיפור' : 'Practice This Improvement'}
              </h4>
            </div>
            <div className="flex items-center gap-1 text-xs text-amber-400">
              <Award className="w-3 h-3" />
              <span>+50 XP</span>
            </div>
          </div>
          <p className="text-sm text-slate-300 mb-4">
            {language === 'he' 
              ? 'תרגל את הטכניקה המתוקנת במשחק תפקידים אינטראקטיבי'
              : 'Practice the corrected technique in an interactive roleplay'
            }
          </p>
          <button 
            onClick={() => onMistakeClick?.(mistake)}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:from-amber-600 hover:to-orange-600 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            {language === 'he' ? 'תרגל עכשיו' : 'Practice Now'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-700/50 overflow-hidden" dir={language === 'he' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="p-6 border-b border-slate-700/50 bg-gradient-to-r from-red-500/10 to-orange-500/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
            <Eye className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              {language === 'he' ? 'זיהוי ותיקון שגיאות ויזואלי' : 'Visual Mistake Recognition'}
            </h2>
            <p className="text-sm text-slate-400">
              {language === 'he' ? 'ראה בדיוק היכן השגיאות ואיך לתקן אותן' : 'See exactly where mistakes happened and how to fix them'}
            </p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-800/50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-red-400">{processedMistakes.filter(m => m.severity === 'critical').length}</p>
            <p className="text-xs text-slate-400">{language === 'he' ? 'קריטיים' : 'Critical'}</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-amber-400">{processedMistakes.filter(m => m.severity === 'high').length}</p>
            <p className="text-xs text-slate-400">{language === 'he' ? 'גבוהים' : 'High'}</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-emerald-400">{processedMistakes.length}</p>
            <p className="text-xs text-slate-400">{language === 'he' ? 'סה"כ' : 'Total'}</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {selectedMistake ? (
          <MistakeAnalysis mistake={selectedMistake} />
        ) : (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">
              {language === 'he' ? 'ציר זמן של שגיאות' : 'Mistake Timeline'}
            </h3>
            <MistakeTimeline />
          </div>
        )}
      </div>
    </div>
  )
}