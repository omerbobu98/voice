import { useState, useEffect, useRef } from 'react'
import { 
  Brain, Target, TrendingUp, Zap, User, MessageSquare,
  PlayCircle, Pause, Mic, Volume2, CheckCircle2, 
  RotateCcw, ArrowRight, Lightbulb, Award, Timer,
  BookOpen, Headphones, Eye, Heart, Star, Sparkles
} from 'lucide-react'

// AI-Driven Personalized Coaching System
export default function AICoachingSystem({ 
  userWeaknesses, 
  callHistory, 
  onExerciseComplete, 
  language = 'he' 
}) {
  const [activeSession, setActiveSession] = useState(null)
  const [currentExercise, setCurrentExercise] = useState(0)
  const [userResponse, setUserResponse] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [coachingMode, setCoachingMode] = useState('analysis') // analysis, practice, feedback
  const [aiCoachPersonality, setAiCoachPersonality] = useState('encouraging')
  
  const audioRef = useRef(null)
  const mediaRecorderRef = useRef(null)

  // AI Coaching Personalities
  const coachPersonalities = {
    encouraging: {
      nameHe: 'מעודד',
      nameEn: 'Encouraging',
      avatar: '🌟',
      tone: 'positive',
      style: 'supportive'
    },
    direct: {
      nameHe: 'ישיר',
      nameEn: 'Direct',
      avatar: '🎯',
      tone: 'assertive',
      style: 'no-nonsense'
    },
    mentor: {
      nameHe: 'מנטור',
      nameEn: 'Mentor',
      avatar: '🧑‍🎓',
      tone: 'wise',
      style: 'guiding'
    },
    competitive: {
      nameHe: 'תחרותי',
      nameEn: 'Competitive',
      avatar: '🏆',
      tone: 'challenging',
      style: 'motivational'
    }
  }

  // Dynamically generated coaching sessions based on user data
  const generateCoachingSessions = () => {
    // Analyze user weaknesses and create personalized sessions
    const sessions = []
    
    if (userWeaknesses?.includes('objection_handling')) {
      sessions.push({
        id: 'objection_mastery',
        titleHe: 'מסלול שליטה בהתנגדויות',
        titleEn: 'Objection Mastery Path',
        descriptionHe: 'למד להתמודד עם כל סוג של התנגדות בביטחון',
        descriptionEn: 'Learn to handle any objection with confidence',
        difficulty: 'medium',
        estimatedTime: 45,
        exercises: [
          {
            type: 'scenario_practice',
            titleHe: 'תרחיש: "זה יקר מדי"',
            titleEn: 'Scenario: "It\'s too expensive"',
            scenario: {
              contextHe: 'לקוח מתעניין ב-Cool Life Paint אבל מתלונן על המחיר',
              contextEn: 'Customer interested in Cool Life Paint but complaining about price',
              customerLineHe: 'זה נראה יקר מדי בשבילי. אני יכול לקבל צבע רגיל בחצי מחיר.',
              customerLineEn: 'This seems too expensive for me. I can get regular paint for half the price.',
              goalHe: 'הסבר את הערך והחסכון לטווח ארוך',
              goalEn: 'Explain value and long-term savings'
            }
          }
        ]
      })
    }
    
    if (userWeaknesses?.includes('discovery')) {
      sessions.push({
        id: 'discovery_master',
        titleHe: 'מאסטר גילוי לקוחות',
        titleEn: 'Discovery Master',
        descriptionHe: 'גלה את הכאב האמיתי של הלקוח ב-5 דקות',
        descriptionEn: 'Discover customer\'s real pain in 5 minutes',
        difficulty: 'hard',
        estimatedTime: 60,
        exercises: [
          {
            type: 'guided_questioning',
            titleHe: 'טכניקת השאילתה העמוקה',
            titleEn: 'Deep Questioning Technique',
            steps: [
              {
                stepHe: 'שאל שאלה פתוחה על המצב הנוכחי',
                stepEn: 'Ask open question about current situation',
                exampleHe: 'ספר לי על הבעיות שאתה מתמודד איתן כרגע עם...',
                exampleEn: 'Tell me about the challenges you\'re currently facing with...'
              }
            ]
          }
        ]
      })
    }

    return sessions
  }

  const [coachingSessions] = useState(generateCoachingSessions())

  // AI Coach Response Generator
  const generateAICoachResponse = async (userInput, context) => {
    // This would call your AI API
    const personality = coachPersonalities[aiCoachPersonality]
    
    // Simulated AI response based on personality
    const responses = {
      encouraging: {
        positive: [
          language === 'he' ? 'מעולה! אתה על הדרך הנכונה!' : 'Excellent! You\'re on the right track!',
          language === 'he' ? 'זה בדיוק מה שרציתי לשמוע!' : 'That\'s exactly what I wanted to hear!'
        ],
        improvement: [
          language === 'he' ? 'אתה כמעט שם! בואו ננסה גישה קצת שונה...' : 'You\'re almost there! Let\'s try a slightly different approach...',
          language === 'he' ? 'רעיון טוב! עכשיו בוא נעשה את זה עוד יותר חזק...' : 'Good idea! Now let\'s make it even stronger...'
        ]
      },
      direct: {
        positive: [
          language === 'he' ? 'בדיוק. זה איך עושים את זה.' : 'Exactly. That\'s how it\'s done.',
          language === 'he' ? 'נכון. המשך.' : 'Correct. Continue.'
        ],
        improvement: [
          language === 'he' ? 'לא. תנסה שוב. חסר לך...' : 'No. Try again. You\'re missing...',
          language === 'he' ? 'לא מספיק חזק. הלקוח לא שוכנע.' : 'Not strong enough. Customer isn\'t convinced.'
        ]
      }
    }

    return responses[aiCoachPersonality]?.[Math.random() > 0.6 ? 'positive' : 'improvement']?.[0] || 'Good effort!'
  }

  // Exercise Components
  const ScenarioPractice = ({ exercise }) => {
    const [step, setStep] = useState('setup') // setup, practice, feedback
    const [userAttempt, setUserAttempt] = useState('')
    const [aiResponse, setAiResponse] = useState('')
    
    return (
      <div className="space-y-6">
        {/* Scenario Setup */}
        <div className="p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <PlayCircle className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                {language === 'he' ? exercise.titleHe : exercise.titleEn}
              </h3>
              <p className="text-sm text-blue-300">
                {language === 'he' ? 'תרחיש אינטראקטיבי' : 'Interactive Scenario'}
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-2">
                {language === 'he' ? 'הקשר:' : 'Context:'}
              </h4>
              <p className="text-slate-300 text-sm">
                {language === 'he' ? exercise.scenario.contextHe : exercise.scenario.contextEn}
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-2">
                {language === 'he' ? 'המטרה שלך:' : 'Your Goal:'}
              </h4>
              <p className="text-slate-300 text-sm">
                {language === 'he' ? exercise.scenario.goalHe : exercise.scenario.goalEn}
              </p>
            </div>
          </div>
        </div>

        {/* Customer Statement */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">ל</span>
          </div>
          <div className="flex-1">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl rounded-tl-none">
              <p className="text-slate-200">
                "{language === 'he' ? exercise.scenario.customerLineHe : exercise.scenario.customerLineEn}"
              </p>
            </div>
            <button className="mt-2 flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-lg text-sm hover:bg-emerald-500/30 transition-colors">
              <Volume2 className="w-3 h-3" />
              {language === 'he' ? 'השמע שוב' : 'Play Again'}
            </button>
          </div>
        </div>

        {/* Response Input */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-violet-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">א</span>
            </div>
            <h4 className="text-lg font-semibold text-white">
              {language === 'he' ? 'איך תגיב?' : 'How would you respond?'}
            </h4>
          </div>
          
          <div className="relative">
            <textarea
              value={userAttempt}
              onChange={(e) => setUserAttempt(e.target.value)}
              placeholder={language === 'he' ? 'כתוב את התגובה שלך כאן...' : 'Write your response here...'}
              className="w-full p-4 bg-slate-800 border border-slate-600 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 min-h-[120px] resize-none"
              dir={language === 'he' ? 'rtl' : 'ltr'}
            />
            <div className="absolute bottom-3 right-3 flex gap-2">
              <button
                onClick={() => setIsRecording(!isRecording)}
                className={`p-2 rounded-lg transition-all ${
                  isRecording 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <Mic className="w-4 h-4" />
              </button>
              <button 
                onClick={() => {/* Submit response */}}
                disabled={!userAttempt.trim()}
                className="px-4 py-2 bg-violet-500 text-white rounded-lg text-sm font-medium hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {language === 'he' ? 'שלח' : 'Submit'}
              </button>
            </div>
          </div>
        </div>

        {/* AI Coach Feedback */}
        {aiResponse && (
          <div className="p-4 bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border border-yellow-500/20 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                <span className="text-yellow-400 text-lg">{coachPersonalities[aiCoachPersonality].avatar}</span>
              </div>
              <div>
                <h4 className="text-sm font-medium text-yellow-400 mb-2">
                  {language === 'he' ? 'המאמן שלך אומר:' : 'Your coach says:'}
                </h4>
                <p className="text-slate-300 text-sm">{aiResponse}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Session Selection View
  const SessionSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">
          {language === 'he' ? 'בחר מסלול אימון מותאם אישית' : 'Choose Your Personalized Training Path'}
        </h2>
        <p className="text-slate-400">
          {language === 'he' ? 'מסלולים שנבנו על בסיס הניתוחים של השיחות שלך' : 'Paths built from your call analysis'}
        </p>
      </div>

      {/* Coach Personality Selector */}
      <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
        <h3 className="text-lg font-semibold text-white mb-3">
          {language === 'he' ? 'בחר סגנון מאמן:' : 'Choose Coach Style:'}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(coachPersonalities).map(([key, personality]) => (
            <button
              key={key}
              onClick={() => setAiCoachPersonality(key)}
              className={`p-3 rounded-xl text-center transition-all ${
                aiCoachPersonality === key
                  ? 'bg-violet-500/20 border border-violet-500/30 text-violet-300'
                  : 'bg-slate-700/50 border border-slate-600/30 text-slate-400 hover:border-slate-500/50'
              }`}
            >
              <div className="text-2xl mb-2">{personality.avatar}</div>
              <p className="text-sm font-medium">
                {language === 'he' ? personality.nameHe : personality.nameEn}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Available Sessions */}
      <div className="space-y-4">
        {coachingSessions.map((session) => (
          <div
            key={session.id}
            onClick={() => setActiveSession(session)}
            className="p-6 bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl border border-slate-700/50 hover:border-violet-500/30 cursor-pointer transition-all group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-3 h-3 rounded-full ${
                    session.difficulty === 'easy' ? 'bg-green-400' :
                    session.difficulty === 'medium' ? 'bg-yellow-400' :
                    'bg-red-400'
                  }`} />
                  <span className="text-sm text-slate-400">
                    {language === 'he' ? 
                      (session.difficulty === 'easy' ? 'קל' : session.difficulty === 'medium' ? 'בינוני' : 'קשה') :
                      session.difficulty.charAt(0).toUpperCase() + session.difficulty.slice(1)
                    } • {session.estimatedTime} {language === 'he' ? 'דקות' : 'minutes'}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-violet-300 transition-colors">
                  {language === 'he' ? session.titleHe : session.titleEn}
                </h3>
                <p className="text-slate-400 mb-4">
                  {language === 'he' ? session.descriptionHe : session.descriptionEn}
                </p>
                
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    {session.exercises.length} {language === 'he' ? 'תרגילים' : 'exercises'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Award className="w-4 h-4" />
                    +{session.exercises.length * 100} XP
                  </span>
                </div>
              </div>
              
              <ArrowRight className="w-6 h-6 text-slate-500 group-hover:text-violet-400 transition-colors" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-700/50 overflow-hidden" dir={language === 'he' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="p-6 border-b border-slate-700/50 bg-gradient-to-r from-violet-500/10 to-blue-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-blue-500 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {language === 'he' ? 'מאמן AI מותאם אישית' : 'Personalized AI Coach'}
              </h2>
              <p className="text-sm text-slate-400">
                {language === 'he' ? 'אימון חכם המבוסס על הנתונים שלך' : 'Smart training based on your data'}
              </p>
            </div>
          </div>
          
          {activeSession && (
            <button
              onClick={() => setActiveSession(null)}
              className="px-4 py-2 bg-slate-700/50 text-slate-300 rounded-xl text-sm hover:bg-slate-600/50 transition-colors"
            >
              {language === 'he' ? 'חזור' : 'Back'}
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        {!activeSession ? (
          <SessionSelection />
        ) : (
          <div className="space-y-6">
            {/* Session Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {language === 'he' ? activeSession.titleHe : activeSession.titleEn}
                </h3>
                <p className="text-sm text-slate-400">
                  {language === 'he' ? `תרגיל ${currentExercise + 1} מתוך ${activeSession.exercises.length}` : `Exercise ${currentExercise + 1} of ${activeSession.exercises.length}`}
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span className="text-lg">{coachPersonalities[aiCoachPersonality].avatar}</span>
                <span>{language === 'he' ? coachPersonalities[aiCoachPersonality].nameHe : coachPersonalities[aiCoachPersonality].nameEn}</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-violet-500 to-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${((currentExercise + 1) / activeSession.exercises.length) * 100}%` }}
              />
            </div>

            {/* Current Exercise */}
            {activeSession.exercises[currentExercise] && (
              <ScenarioPractice exercise={activeSession.exercises[currentExercise]} />
            )}

            {/* Navigation */}
            <div className="flex justify-between">
              <button
                onClick={() => setCurrentExercise(Math.max(0, currentExercise - 1))}
                disabled={currentExercise === 0}
                className="px-4 py-2 bg-slate-700/50 text-slate-300 rounded-xl text-sm hover:bg-slate-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {language === 'he' ? 'תרגיל קודם' : 'Previous'}
              </button>
              
              <button
                onClick={() => {
                  if (currentExercise < activeSession.exercises.length - 1) {
                    setCurrentExercise(currentExercise + 1)
                  } else {
                    onExerciseComplete?.(activeSession)
                  }
                }}
                className="px-6 py-2 bg-gradient-to-r from-violet-500 to-blue-500 text-white rounded-xl text-sm font-medium hover:from-violet-600 hover:to-blue-600 transition-all"
              >
                {currentExercise < activeSession.exercises.length - 1 
                  ? (language === 'he' ? 'תרגיל הבא' : 'Next Exercise')
                  : (language === 'he' ? 'סיים אימון' : 'Complete Training')
                }
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}