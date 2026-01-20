import { useState, useEffect, useRef } from 'react'
import { 
  Target, Dumbbell, BookMarked, Users, CheckCircle2, Sparkles,
  Trophy, Flame, TrendingUp, Timer, ArrowRight, AlertTriangle,
  Zap, Award, Star, Crown, BookOpen, Plus, SpellCheck, Volume2,
  AlertCircle, Check, Loader2, Square
} from 'lucide-react'
import axios from 'axios'
import { API_URL } from '../../../lib/config'
import { PRACTICE_TRANSLATIONS, ACHIEVEMENT_BADGES } from './PracticeTranslations'
import { playTTS, stopTTS } from '../../../lib/audioUtils'
import { ProgressRing, LanguageToggle, StatCard, AchievementCard, StreakCounter, LevelBadge, QuickWinCard } from './PracticeHelpers'
import SkillPracticeCard from './SkillPracticeCard'
import RoleplayCard from './RoleplayCard'
import InteractiveRoleplay from './InteractiveRoleplay'
import ExerciseCard, { DailyDrillCard, ActionItemCard } from './ExerciseCard'
import StoryEnhancer from '../StoryEnhancer'

export default function PracticeOnTab({ analysisResult, result, TTSButton }) {
  const [practiceData, setPracticeData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [completedExercises, setCompletedExercises] = useState(new Set())
  const [completedActions, setCompletedActions] = useState(new Set())
  const [activeSection, setActiveSection] = useState('overview')
  const [lang, setLang] = useState('en')
  const [userStats, setUserStats] = useState({ level: 1, xp: 0, streak: 0 })
  
  // Grammar analysis state
  const [grammarAnalysis, setGrammarAnalysis] = useState(null)
  const [grammarLoading, setGrammarLoading] = useState(false)
  const [playingGrammarAudio, setPlayingGrammarAudio] = useState(null)
  const [grammarAudioProgress, setGrammarAudioProgress] = useState(0)
  const [grammarAudioDuration, setGrammarAudioDuration] = useState(0)
  const grammarFetchedRef = useRef(false)
  
  const pt = PRACTICE_TRANSLATIONS[lang]
  
  useEffect(() => {
    generatePracticeContent()
  }, [analysisResult])
  
  // Auto-run grammar analysis when Grammar tab is selected
  useEffect(() => {
    if (activeSection === 'grammar' && !grammarAnalysis && !grammarLoading && !grammarFetchedRef.current) {
      grammarFetchedRef.current = true
      analyzeGrammar()
    }
  }, [activeSection, grammarAnalysis, grammarLoading])
  
  const generatePracticeContent = async () => {
    if (!analysisResult) {
      setError(pt.noAnalysisData)
      setLoading(false)
      return
    }
    
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
      setPracticeData(generateFromAnalysis(analysisResult))
    } finally {
      setLoading(false)
    }
  }
  
  const generateFromAnalysis = (analysis) => {
    const objections = analysis?.analysis?.objections || []
    const methodologyScore = analysis?.analysis?.methodology_score || {}
    
    const practiceAreas = []
    
    if (methodologyScore.sales_tactics_score?.score < 70) {
      practiceAreas.push({
        skill_name: lang === 'en' ? 'Sales Techniques' : 'טכניקות מכירה',
        priority: methodologyScore.sales_tactics_score.score < 50 ? 'critical' : 'high',
        current_score: methodologyScore.sales_tactics_score?.score || 50,
        target_score: 85,
        weakness_summary: lang === 'en' ? 'Room for improvement in sales and closing techniques' : 'יש מקום לשיפור בטכניקות המכירה והסגירה',
        specific_issues: methodologyScore.sales_tactics_score?.gaps || [],
        guide_key: 'closing',
        practice_exercises: []
      })
    }
    
    objections.forEach((obj, i) => {
      if (obj.handling_score < 7) {
        const area = practiceAreas.find(a => a.skill_name === (lang === 'en' ? 'Objection Handling' : 'טיפול בהתנגדויות')) || {
          skill_name: lang === 'en' ? 'Objection Handling' : 'טיפול בהתנגדויות',
          priority: obj.handling_score < 4 ? 'critical' : 'high',
          current_score: obj.handling_score * 10,
          target_score: 80,
          weakness_summary: lang === 'en' ? 'Need to improve objection handling' : 'יש לשפר את הטיפול בהתנגדויות',
          specific_issues: [],
          guide_key: 'objection_handling',
          practice_exercises: []
        }
        
        if (!practiceAreas.find(a => a.skill_name === area.skill_name)) {
          practiceAreas.push(area)
        }
        
        area.practice_exercises.push({
          exercise_type: 'script_practice',
          title: `${lang === 'en' ? 'Objection practice:' : 'תרגול התנגדות:'} ${obj.type}`,
          description: obj.surface_objection,
          example_scenario: obj.buyer_statement,
          your_response: obj.seller_response,
          ideal_response: obj.better_response,
          technique: obj.technique_to_use,
          tips: [obj.how_to_prevent || (lang === 'en' ? 'Try to identify and prevent this objection early' : 'נסה לזהות ולמנוע התנגדות זו מראש')]
        })
      }
    })
    
    const roleplayScenarios = [
      {
        scenario_name: lang === 'en' ? 'Handling "I need to think about it"' : 'התמודדות עם "צריך לחשוב על זה"',
        context: lang === 'en' ? 'Customer shows interest but asks for time. This is an opportunity to isolate the real objection.' : 'הלקוח מראה עניין אבל מבקש זמן. זוהי הזדמנות לבודד את ההתנגדות האמיתית.',
        customer_opening: lang === 'en' ? 'I like what you showed me, but I need to think about it. Give me a few days.' : 'אני אוהב את מה שהראית לי, אבל אני צריך לחשוב על זה. תן לי כמה ימים.',
        goal: lang === 'en' ? 'Isolate the real objection and close today' : 'בודד את ההתנגדות האמיתית וסגור היום',
        techniques_to_use: [lang === 'en' ? 'Isolate objection' : 'בידוד התנגדות', lang === 'en' ? '4 Yes Questions' : '4 שאלות Yes'],
        sample_dialogue: [
          { speaker: lang === 'en' ? 'customer' : 'לקוח', text: lang === 'en' ? 'I need to think about it, give me a few days.' : 'אני צריך לחשוב על זה, תן לי כמה ימים.' },
          { speaker: lang === 'en' ? 'you' : 'אתה', text: lang === 'en' ? 'Sure, I understand. What exactly is going through your mind? What would you like to think about?' : 'בטח, אני מבין. מה בדיוק עובר לך בראש? על מה היית רוצה לחשוב?' },
          { speaker: lang === 'en' ? 'customer' : 'לקוח', text: lang === 'en' ? 'It\'s just a lot of money, I want to check.' : 'פשוט זה הרבה כסף, אני רוצה לבדוק.' },
          { speaker: lang === 'en' ? 'you' : 'אתה', text: lang === 'en' ? 'Got it. So let me ask - do you want to do this project?' : 'הבנתי. אז בוא נבדוק - אתה רוצה לעשות את הפרויקט?' }
        ]
      },
      {
        scenario_name: lang === 'en' ? 'Handling "Too expensive"' : 'התמודדות עם "יקר לי"',
        context: lang === 'en' ? 'Customer objects to price. Opportunity to show real value and cost of "cheap".' : 'הלקוח מתנגד למחיר. הזדמנות להראות ערך אמיתי ועלות של "זול".',
        customer_opening: lang === 'en' ? 'Wow, that\'s expensive. I need to check other quotes.' : 'וואו, זה יקר לי. אני חייב לבדוק עוד הצעות מחיר.',
        goal: lang === 'en' ? 'Show the true cost of "cheap" and emphasize full value' : 'הראה את העלות האמיתית של "הזול" והדגש את הערך המלא',
        techniques_to_use: [lang === 'en' ? 'Johnson Story' : 'סיפור הג\'ונסונים', lang === 'en' ? 'ROI Calculation' : 'חישוב ROI'],
        sample_dialogue: [
          { speaker: lang === 'en' ? 'customer' : 'לקוח', text: lang === 'en' ? 'It\'s too expensive, I need to check other quotes.' : 'זה יקר מדי, אני צריך לבדוק עוד הצעות.' },
          { speaker: lang === 'en' ? 'you' : 'אתה', text: lang === 'en' ? 'I hear you. Tell me - what are you looking for in other quotes? Same quality? Same warranty?' : 'אני שומע אותך. תגיד לי - מה אתה מחפש בהצעות האחרות? אותה איכות? אותה אחריות?' }
        ]
      }
    ]
    
    return {
      practice_areas: practiceAreas,
      daily_drills: [
        {
          drill_name: lang === 'en' ? 'Morning Practice - 5 minutes' : 'תרגול בוקר - 5 דקות',
          focus: lang === 'en' ? 'Warm-up before calls' : 'חימום לפני שיחות',
          exercises: [
            lang === 'en' ? 'Practice your 3 best opening statements' : 'תרגל את 3 המשפטים הפותחים הטובים ביותר שלך',
            lang === 'en' ? 'Review Feel-Felt-Found technique once' : 'חזור על טכניקת Feel-Felt-Found פעם אחת',
            lang === 'en' ? 'Practice one closing question' : 'תרגל שאלת סגירה אחת'
          ]
        },
        {
          drill_name: lang === 'en' ? '4 Yes Questions Practice' : 'תרגול 4 שאלות Yes',
          focus: lang === 'en' ? 'Isolating objections' : 'בידוד התנגדויות',
          exercises: [
            lang === 'en' ? 'Do you want to do this project?' : 'אתה רוצה לעשות את הפרויקט?',
            lang === 'en' ? 'Do you like what I showed you about the company?' : 'אתה אוהב את מה שהראיתי לך על החברה?',
            lang === 'en' ? 'Do you trust me to do good work for you?' : 'אתה סומך עליי שאעשה לך עבודה טובה?',
            lang === 'en' ? 'So the only thing bothering you is the price, right?' : 'אז הדבר היחיד שמפריע לך זה המחיר, נכון?'
          ]
        }
      ],
      action_items: [
        {
          priority: 1,
          action: lang === 'en' ? 'Practice the new scripts 3 times before your next call' : 'תרגל את הסקריפטים החדשים 3 פעמים לפני השיחה הבאה',
          why: lang === 'en' ? 'Repetition builds confidence and natural responses' : 'חזרה יוצרת ביטחון ותגובות טבעיות יותר',
          deadline: lang === 'en' ? 'Before next call' : 'לפני השיחה הבאה'
        },
        {
          priority: 2,
          action: lang === 'en' ? 'Memorize the David story and Johnson story' : 'שנן את סיפור דייוויד ואת סיפור הג\'ונסונים',
          why: lang === 'en' ? 'Stories sell more than facts - they create emotional connection' : 'סיפורים מוכרים יותר מעובדות - הם יוצרים חיבור רגשי',
          deadline: lang === 'en' ? 'This week' : 'השבוע'
        },
        {
          priority: 3,
          action: lang === 'en' ? 'Practice 4 Yes questions until natural' : 'תרגל את 4 שאלות ה-Yes עד שזה יהיה טבעי',
          why: lang === 'en' ? 'This is the most important technique for isolating objections' : 'זו הטכניקה הכי חשובה לבידוד התנגדויות',
          deadline: lang === 'en' ? 'Before next 3 calls' : 'לפני 3 השיחות הבאות'
        }
      ],
      roleplay_scenarios: roleplayScenarios,
      improvement_metrics: {
        weakest_area: practiceAreas[0]?.skill_name || (lang === 'en' ? 'No significant weaknesses detected' : 'לא זוהו חולשות משמעותיות'),
        quick_wins: [
          lang === 'en' ? 'Improve response times' : 'שיפור זמני תגובה',
          lang === 'en' ? 'Add discovery questions' : 'הוספת שאלות גילוי',
          lang === 'en' ? 'Use more stories' : 'שימוש בסיפורים'
        ],
        long_term_focus: [
          lang === 'en' ? 'Build story library' : 'בניית ספריית סיפורים',
          lang === 'en' ? 'Master all objection techniques' : 'שליטה בכל טכניקות ההתנגדויות',
          lang === 'en' ? 'Closing mastery' : 'מיומנות בסגירה'
        ]
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
  
  // Analyze grammar from transcript
  const analyzeGrammar = async () => {
    if (!analysisResult?.analysis?.transcript) {
      return
    }
    
    setGrammarLoading(true)
    try {
      // Extract seller messages from transcript
      const transcript = analysisResult.analysis.transcript
      const sellerMessages = []
      
      // Parse transcript to get seller turns
      const lines = transcript.split('\n')
      let currentSpeaker = null
      let currentText = ''
      
      lines.forEach(line => {
        const sellerMatch = line.match(/^(Seller|Sales Rep|Agent|איש מכירות|נציג):\s*(.+)/i)
        const customerMatch = line.match(/^(Customer|Client|Buyer|לקוח):\s*(.+)/i)
        
        if (sellerMatch) {
          if (currentSpeaker === 'seller' && currentText) {
            sellerMessages.push({ role: 'agent', text: currentText.trim() })
          }
          currentSpeaker = 'seller'
          currentText = sellerMatch[2]
        } else if (customerMatch) {
          if (currentSpeaker === 'seller' && currentText) {
            sellerMessages.push({ role: 'agent', text: currentText.trim() })
          }
          currentSpeaker = 'customer'
          currentText = ''
        } else if (currentSpeaker === 'seller') {
          currentText += ' ' + line.trim()
        }
      })
      
      // Add last seller message
      if (currentSpeaker === 'seller' && currentText) {
        sellerMessages.push({ role: 'agent', text: currentText.trim() })
      }
      
      if (sellerMessages.length === 0) {
        setGrammarAnalysis({ analysis: [], summary: { total_errors: 0, messages_with_errors: 0 } })
        return
      }
      
      const response = await axios.post(`${API_URL}/api/grammar/analyze-conversation`, {
        messages: sellerMessages,
        language: lang,
        call_id: result?.call_id  // For caching
      })
      
      setGrammarAnalysis(response.data)
    } catch (error) {
      console.error('Grammar analysis error:', error)
    } finally {
      setGrammarLoading(false)
    }
  }
  
  // Current audio ref for cleanup
  const grammarAudioRef = useRef(null)
  
  // Stop grammar audio
  const stopGrammarAudio = () => {
    if (grammarAudioRef.current) {
      grammarAudioRef.current.pause()
      grammarAudioRef.current.currentTime = 0
      grammarAudioRef.current = null
    }
    stopTTS()
    setPlayingGrammarAudio(null)
    setGrammarAudioProgress(0)
    setGrammarAudioDuration(0)
  }
  
  // Play grammar correction audio - Cross-device compatible with progress
  const playGrammarAudio = async (text, index) => {
    try {
      stopGrammarAudio()
      setPlayingGrammarAudio(index)
      setGrammarAudioProgress(0)
      
      // Use unified TTS with automatic fallback
      grammarAudioRef.current = await playTTS(text, {
        voice: 'nova',
        hd: true,
        speed: 0.9,
        onEnd: () => {
          setPlayingGrammarAudio(null)
          setGrammarAudioProgress(0)
          setGrammarAudioDuration(0)
          grammarAudioRef.current = null
        },
        onError: () => {
          setPlayingGrammarAudio(null)
          setGrammarAudioProgress(0)
          grammarAudioRef.current = null
        }
      })
      
      // Set up progress tracking
      if (grammarAudioRef.current) {
        grammarAudioRef.current.addEventListener('loadedmetadata', () => {
          setGrammarAudioDuration(grammarAudioRef.current?.duration || 0)
        })
        grammarAudioRef.current.addEventListener('timeupdate', () => {
          if (grammarAudioRef.current) {
            setGrammarAudioProgress(grammarAudioRef.current.currentTime)
          }
        })
      }
    } catch (error) {
      console.error('TTS error:', error)
      setPlayingGrammarAudio(null)
    }
  }
  
  const sections = [
    { id: 'overview', label: pt.overview, icon: Star },
    { id: 'stories', label: pt.stories || (lang === 'en' ? 'Stories' : 'סיפורים'), icon: BookOpen },
    { id: 'weaknesses', label: pt.weaknesses, icon: Target },
    { id: 'exercises', label: pt.exercises, icon: Dumbbell },
    { id: 'roleplay', label: pt.roleplay, icon: Users },
    { id: 'grammar', label: lang === 'en' ? 'Grammar' : 'דקדוק', icon: SpellCheck },
    { id: 'tasks', label: pt.tasks, icon: CheckCircle2 },
    { id: 'achievements', label: pt.achievements, icon: Trophy }
  ]
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 relative">
            <div className="absolute inset-0 rounded-full border-4 border-violet-500/20" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-violet-500 animate-spin" />
            <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-violet-400" />
          </div>
          <p className="text-slate-300 font-medium text-lg">{pt.generatingPlan}</p>
          <p className="text-slate-500 text-sm mt-2">{pt.analyzingPerformance}</p>
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
          className="mt-4 px-6 py-2.5 bg-violet-500 hover:bg-violet-600 text-white rounded-xl font-medium transition-colors"
        >
          {pt.retry}
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
    <div className="space-y-6" dir={lang === 'he' ? 'rtl' : 'ltr'}>
      {/* Hero Header - Enhanced with animated elements */}
      <div className="bg-gradient-to-br from-violet-600/20 via-fuchsia-600/20 to-pink-600/20 rounded-3xl border border-violet-500/30 p-6 relative overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        
        {/* Floating orbs */}
        <div className="absolute top-4 right-4 w-32 h-32 bg-violet-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-4 left-4 w-24 h-24 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        
        <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-start gap-5">
            {/* Progress Ring with glow */}
            <div className="relative">
              <div className="absolute inset-0 bg-violet-500/20 rounded-full blur-xl" />
              <ProgressRing progress={progressPercent} size={110} />
            </div>
            
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h2 className="text-2xl font-bold text-white">{pt.practiceTitle}</h2>
                <LanguageToggle lang={lang} setLang={setLang} />
              </div>
              <p className="text-slate-300 mb-4 max-w-md">{pt.practiceSubtitle}</p>
              
              {/* Gamification badges row */}
              <div className="flex items-center gap-3 flex-wrap">
                <LevelBadge level={userStats.level} />
                <StreakCounter days={userStats.streak} lang={lang} />
                
                {/* XP indicator */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 rounded-xl border border-amber-500/20">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-medium text-amber-400">{userStats.xp || 0} XP</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right side - Today's progress */}
          <div className="flex flex-col items-end gap-3 bg-slate-900/30 p-4 rounded-2xl border border-slate-700/50">
            <div className="text-right">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{pt.todayGoal}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white">{completedCount}</span>
                <span className="text-xl text-slate-500">/</span>
                <span className="text-xl text-slate-400">{totalExercises}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">{pt.completed}</p>
            </div>
            
            {/* Progress bar */}
            <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 rounded-full transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            
            {progressPercent === 100 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 rounded-xl border border-emerald-500/30 animate-pulse">
                <Trophy className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-400">{lang === 'en' ? 'All Complete!' : 'הכל הושלם!'}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Quick Stats */}
        {practiceData.improvement_metrics && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard 
              icon={Target} 
              label={pt.focusArea} 
              value={practiceData.improvement_metrics.weakest_area}
              color="violet"
            />
            <StatCard 
              icon={Zap} 
              label={pt.quickWins} 
              value={`${practiceData.improvement_metrics.quick_wins?.length || 0} ${pt.easyImprovements}`}
              color="emerald"
            />
            <StatCard 
              icon={TrendingUp} 
              label={pt.longTermGoals} 
              value={`${practiceData.improvement_metrics.long_term_focus?.length || 0} ${pt.goals}`}
              color="amber"
            />
          </div>
        )}
      </div>
      
      {/* Section Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {sections.map(section => {
          const Icon = section.icon
          const isActive = activeSection === section.id
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/20'
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
      
      {/* Overview */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          {/* Quick Wins */}
          {practiceData.improvement_metrics?.quick_wins?.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-emerald-400" />
                {pt.quickWins}
              </h3>
              <div className="grid md:grid-cols-3 gap-3">
                {practiceData.improvement_metrics.quick_wins.map((win, i) => (
                  <QuickWinCard key={i} win={win} index={i} lang={lang} />
                ))}
              </div>
            </div>
          )}
          
          {/* Top Weaknesses Preview */}
          {practiceData.practice_areas?.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                  <Target className="w-5 h-5 text-red-400" />
                  {pt.weaknesses}
                </h3>
                <button 
                  onClick={() => setActiveSection('weaknesses')}
                  className="text-sm text-violet-400 hover:text-violet-300 flex items-center gap-1"
                >
                  {lang === 'en' ? 'View all' : 'צפה בכל'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <div className="grid gap-4">
                {practiceData.practice_areas.slice(0, 2).map((area, i) => (
                  <SkillPracticeCard
                    key={i}
                    weakness={area}
                    exerciseContext={area.practice_exercises?.[0] ? {
                      scenario: area.practice_exercises[0].description,
                      customer_statement: area.practice_exercises[0].example_scenario,
                      ideal_response: area.practice_exercises[0].ideal_response,
                      technique: area.practice_exercises[0].technique
                    } : null}
                    lang={lang}
                    TTSButton={TTSButton}
                    onFeedbackReceived={(fb) => console.log('Feedback:', fb)}
                    onComplete={() => toggleExercise(`area-${i}`)}
                    callId={result?.call_id}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Stories Section */}
      {activeSection === 'stories' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-pink-400" />
              {lang === 'en' ? 'Stories from Call' : 'סיפורים מהשיחה'}
            </h3>
          </div>
          
          <p className="text-sm text-slate-400">
            {lang === 'en' 
              ? 'Analyze and improve the stories you told during the call using the 6 essential storytelling elements.'
              : 'נתח ושפר את הסיפורים שסיפרת בשיחה באמצעות 6 אלמנטים חיוניים של סיפור.'
            }
          </p>
          
          {/* Stories from Analysis */}
          {analysisResult?.analysis?.storytelling_analysis?.length > 0 ? (
            <div className="space-y-6">
              {analysisResult.analysis.storytelling_analysis.map((story, i) => (
                <StoryEnhancer
                  key={i}
                  story={story}
                  analysisResult={analysisResult}
                  onSaveToBank={() => {}}
                />
              ))}
            </div>
          ) : (
            <div className="p-8 bg-slate-800/30 rounded-2xl border border-slate-700/30 text-center">
              <div className="w-16 h-16 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-slate-500" />
              </div>
              <p className="text-slate-300 font-medium mb-2">
                {lang === 'en' ? 'No stories detected in this call' : 'לא זיהינו סיפורים בשיחה זו'}
              </p>
              <p className="text-sm text-slate-500">
                {lang === 'en' 
                  ? 'Stories are powerful sales tools. Try telling customer success stories in your next call!'
                  : 'סיפורים הם כלי מכירות עוצמתיים. נסה לספר סיפורי הצלחה של לקוחות בשיחה הבאה!'
                }
              </p>
            </div>
          )}
          
          {/* Prevention Stories */}
          {analysisResult?.analysis?.objection_prevention_stories?.length > 0 && (
            <div className="space-y-4 mt-8">
              <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-400" />
                {lang === 'en' ? 'Recommended Prevention Stories' : 'סיפורים מומלצים למניעת התנגדויות'}
              </h3>
              <p className="text-sm text-slate-400">
                {lang === 'en' 
                  ? 'Learn these stories to prevent objections before they happen.'
                  : 'למד את הסיפורים האלה למניעת התנגדויות לפני שהן קורות.'
                }
              </p>
              <div className="grid gap-4">
                {analysisResult.analysis.objection_prevention_stories.map((story, i) => (
                  <div key={i} className="bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 rounded-xl border border-violet-500/20 p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-slate-200">{story.story_title}</h4>
                        <p className="text-xs text-violet-400 mt-1">
                          {lang === 'en' ? 'Against' : 'נגד'}: {story.objection_to_prevent}
                        </p>
                      </div>
                      <span className="text-xs text-slate-500 bg-slate-800/50 px-2 py-1 rounded-lg">{story.when_to_tell}</span>
                    </div>
                    
                    {story.setup_line && (
                      <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                        <p className="text-xs text-amber-400 font-medium mb-1">🎯 {lang === 'en' ? 'Setup:' : 'פתיחה:'}</p>
                        <p className="text-sm text-slate-300">{story.setup_line}</p>
                      </div>
                    )}
                    
                    <div className="p-4 bg-slate-800/50 rounded-lg">
                      <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{story.the_story}</p>
                    </div>
                    
                    {story.closing_bridge && (
                      <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                        <p className="text-xs text-emerald-400 font-medium mb-1">🌉 {lang === 'en' ? 'Closing Bridge:' : 'גשר סגירה:'}</p>
                        <p className="text-sm text-slate-300">{story.closing_bridge}</p>
                      </div>
                    )}
                    
                    {story.why_this_prevents && (
                      <p className="text-xs text-slate-500 italic flex items-start gap-1">
                        <span>💡</span> {story.why_this_prevents}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Weaknesses */}
      {activeSection === 'weaknesses' && practiceData.practice_areas && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
            <Target className="w-5 h-5 text-red-400" />
            {pt.weaknesses}
            <span className="text-sm font-normal text-slate-500">({practiceData.practice_areas.length})</span>
          </h3>
          
          <div className="grid gap-6">
            {practiceData.practice_areas.map((area, i) => (
              <SkillPracticeCard
                key={i}
                weakness={area}
                exerciseContext={area.practice_exercises?.[0] ? {
                  scenario: area.practice_exercises[0].description,
                  customer_statement: area.practice_exercises[0].example_scenario,
                  ideal_response: area.practice_exercises[0].ideal_response,
                  technique: area.practice_exercises[0].technique
                } : null}
                lang={lang}
                TTSButton={TTSButton}
                onFeedbackReceived={(fb) => console.log('Feedback:', fb)}
                onComplete={() => toggleExercise(`area-${i}`)}
                callId={result?.call_id}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Exercises */}
      {activeSection === 'exercises' && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-violet-400" />
            {pt.allExercises}
            <span className="text-sm font-normal text-slate-500">({totalExercises})</span>
          </h3>
          
          <div className="space-y-3">
            {practiceData.practice_areas?.flatMap((area, areaIndex) => 
              area.practice_exercises?.map((ex, exIndex) => (
                <ExerciseCard 
                  key={`${areaIndex}-${exIndex}`}
                  exercise={ex}
                  index={exIndex}
                  lang={lang}
                  TTSButton={TTSButton}
                  isCompleted={completedExercises.has(`${areaIndex}-${exIndex}`)}
                  onComplete={() => toggleExercise(`${areaIndex}-${exIndex}`)}
                />
              ))
            )}
          </div>
          
          {/* Daily Drills */}
          {practiceData.daily_drills?.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2 mb-4">
                <Timer className="w-5 h-5 text-amber-400" />
                {pt.dailyDrills}
              </h3>
              <div className="space-y-3">
                {practiceData.daily_drills.map((drill, i) => (
                  <DailyDrillCard key={i} drill={drill} lang={lang} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Roleplay - Interactive AI Practice */}
      {activeSection === 'roleplay' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
              <Users className="w-5 h-5 text-pink-400" />
              {pt.roleplayScenarios}
            </h3>
            <span className="px-3 py-1 bg-pink-500/20 text-pink-400 text-xs rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {lang === 'en' ? 'AI Interactive' : 'אינטראקטיבי עם AI'}
            </span>
          </div>
          
          <p className="text-sm text-slate-400">
            {lang === 'en' 
              ? 'Practice real sales conversations with an AI customer. Get instant feedback on your responses.'
              : 'תרגל שיחות מכירה אמיתיות עם לקוח AI. קבל משוב מיידי על התשובות שלך.'
            }
          </p>
          
          {practiceData.roleplay_scenarios?.length > 0 ? (
            <div className="space-y-6">
              {practiceData.roleplay_scenarios.map((scenario, i) => (
                <InteractiveRoleplay 
                  key={i} 
                  scenario={scenario} 
                  lang={lang} 
                  TTSButton={TTSButton}
                  onComplete={(result) => {
                    console.log('Roleplay completed:', result)
                    toggleExercise(`roleplay-${i}`)
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-700/30">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">{pt.noScenarios}</p>
            </div>
          )}
        </div>
      )}
      
      {/* Grammar Analysis */}
      {activeSection === 'grammar' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
              <SpellCheck className="w-5 h-5 text-blue-400" />
              {lang === 'en' ? 'Grammar Analysis' : 'ניתוח דקדוק'}
            </h3>
            {grammarAnalysis && (
              <button
                onClick={() => {
                  grammarFetchedRef.current = false
                  setGrammarAnalysis(null)
                  analyzeGrammar()
                }}
                disabled={grammarLoading}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 text-slate-300 rounded-lg text-xs font-medium hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                <SpellCheck className="w-3 h-3" />
                {lang === 'en' ? 'Re-analyze' : 'נתח מחדש'}
              </button>
            )}
          </div>
          
          <p className="text-sm text-slate-400">
            {lang === 'en' 
              ? 'Your grammar is automatically analyzed. See corrections and hear the correct pronunciation.'
              : 'הדקדוק שלך מנותח אוטומטית. ראה תיקונים ושמע את ההגייה הנכונה.'
            }
          </p>
          
          {/* Loading State */}
          {grammarLoading && !grammarAnalysis && (
            <div className="text-center py-12">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-blue-500/20" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin" />
                <SpellCheck className="absolute inset-0 m-auto w-6 h-6 text-blue-400" />
              </div>
              <p className="text-slate-300">{lang === 'en' ? 'Analyzing your grammar...' : 'מנתח את הדקדוק שלך...'}</p>
              <p className="text-xs text-slate-500 mt-2">{lang === 'en' ? 'This may take a few seconds' : 'זה עשוי לקחת מספר שניות'}</p>
            </div>
          )}
          
          {grammarAnalysis ? (
            <div className="space-y-6">
              {/* Audio Player Bar - Shows when playing */}
              {playingGrammarAudio && (
                <div className="p-3 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl border border-blue-500/30">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={stopGrammarAudio}
                      className="w-10 h-10 bg-red-500/20 hover:bg-red-500/30 rounded-full flex items-center justify-center transition-colors"
                    >
                      <Square className="w-4 h-4 text-red-400" />
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-blue-300">{lang === 'en' ? 'Playing audio...' : 'מנגן אודיו...'}</span>
                        {grammarAudioDuration > 0 && (
                          <span className="text-xs text-slate-400">
                            {Math.floor(grammarAudioProgress)}s / {Math.floor(grammarAudioDuration)}s
                          </span>
                        )}
                      </div>
                      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-200"
                          style={{ width: grammarAudioDuration > 0 ? `${(grammarAudioProgress / grammarAudioDuration) * 100}%` : '0%' }}
                        />
                      </div>
                    </div>
                    <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <Volume2 className="w-4 h-4 text-blue-400 animate-pulse" />
                    </div>
                  </div>
                </div>
              )}

              {/* Summary Card */}
              <div className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl border border-blue-500/20">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-blue-300 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    {lang === 'en' ? 'Grammar Analysis Summary' : 'סיכום ניתוח דקדוק'}
                  </h4>
                  {grammarAnalysis.summary?.total_errors === 0 ? (
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      {lang === 'en' ? 'Perfect Grammar!' : 'דקדוק מושלם!'}
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                      {grammarAnalysis.summary?.total_errors || 0} {lang === 'en' ? 'corrections needed' : 'תיקונים נדרשים'}
                    </span>
                  )}
                </div>
                
                {grammarAnalysis.summary?.overall_feedback && (
                  <p className="text-slate-300 text-sm mb-3">{grammarAnalysis.summary.overall_feedback}</p>
                )}
                
                {grammarAnalysis.summary?.common_issues?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs text-slate-500">{lang === 'en' ? 'Common issues:' : 'בעיות נפוצות:'}</span>
                    {grammarAnalysis.summary.common_issues.map((issue, i) => (
                      <span key={i} className="px-2 py-0.5 bg-slate-700/50 text-slate-300 text-xs rounded-lg">
                        {issue}
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Listen to All Corrections Button */}
                {grammarAnalysis.analysis?.filter(a => a.has_errors).length > 0 && (
                  <button
                    onClick={() => {
                      if (playingGrammarAudio === 'all') {
                        stopGrammarAudio()
                      } else {
                        const allCorrections = grammarAnalysis.analysis
                          .filter(a => a.has_errors)
                          .map(a => a.corrected_text)
                          .join('. ')
                        playGrammarAudio(allCorrections, 'all')
                      }
                    }}
                    className={`mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      playingGrammarAudio === 'all'
                        ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                        : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                    }`}
                  >
                    {playingGrammarAudio === 'all' ? (
                      <><Square className="w-4 h-4" />{lang === 'en' ? 'Stop' : 'עצור'}</>
                    ) : (
                      <><Volume2 className="w-4 h-4" />{lang === 'en' ? 'Listen to All Corrections' : 'האזן לכל התיקונים'}</>
                    )}
                  </button>
                )}
              </div>
              
              {/* Individual Corrections */}
              {grammarAnalysis.analysis?.filter(a => a.has_errors).length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-slate-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400" />
                      {lang === 'en' ? 'Your Sentences with Corrections' : 'המשפטים שלך עם תיקונים'}
                    </h4>
                    <span className="text-xs text-slate-500">
                      {grammarAnalysis.analysis.filter(a => a.has_errors).length} {lang === 'en' ? 'sentences' : 'משפטים'}
                    </span>
                  </div>
                  
                  {grammarAnalysis.analysis.filter(a => a.has_errors).map((item, i) => (
                    <div key={i} className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 space-y-3">
                      {/* Original */}
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <p className="text-xs text-red-400 mb-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {lang === 'en' ? 'What you said:' : 'מה שאמרת:'}
                        </p>
                        <p className="text-slate-300 text-sm">{item.original_text}</p>
                      </div>
                      
                      {/* Corrected */}
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                        <p className="text-xs text-emerald-400 mb-1 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          {lang === 'en' ? 'Correct version:' : 'גרסה מתוקנת:'}
                        </p>
                        <p className="text-slate-200 text-sm font-medium">{item.corrected_text}</p>
                        
                        {/* Listen button */}
                        <button
                          onClick={() => playGrammarAudio(item.corrected_text, i)}
                          disabled={playingGrammarAudio !== null}
                          className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 text-emerald-300 rounded-lg text-xs font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                        >
                          {playingGrammarAudio === i ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5" />
                          )}
                          {lang === 'en' ? 'Listen' : 'האזן'}
                        </button>
                      </div>
                      
                      {/* Error details */}
                      {item.errors?.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-slate-700/50">
                          <p className="text-xs text-slate-500">{lang === 'en' ? 'Details:' : 'פרטים:'}</p>
                          {item.errors.map((err, j) => (
                            <div key={j} className="text-xs flex items-start gap-2">
                              <span className={`px-1.5 py-0.5 rounded ${
                                err.type === 'grammar' ? 'bg-red-500/20 text-red-400' :
                                err.type === 'word_choice' ? 'bg-amber-500/20 text-amber-400' :
                                'bg-blue-500/20 text-blue-400'
                              }`}>
                                {err.type}
                              </span>
                              <div>
                                <span className="text-red-400 line-through">{err.original}</span>
                                <span className="text-slate-500 mx-1">→</span>
                                <span className="text-emerald-400">{err.corrected}</span>
                                {err.rule && <p className="text-slate-500 mt-0.5 italic">{err.rule}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : grammarAnalysis.analysis?.length > 0 ? (
                <div className="text-center py-12 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                  <p className="text-emerald-300 font-medium">
                    {lang === 'en' ? 'Excellent! No grammar errors found.' : 'מצוין! לא נמצאו שגיאות דקדוק.'}
                  </p>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-700/30">
              <SpellCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 mb-4">
                {lang === 'en' 
                  ? 'Click "Analyze My Grammar" to review your speaking patterns from the call.'
                  : 'לחץ על "נתח את הדקדוק שלי" כדי לסקור את דפוסי הדיבור שלך מהשיחה.'
                }
              </p>
            </div>
          )}
        </div>
      )}
      
      {/* Tasks */}
      {activeSection === 'tasks' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            {pt.tasksToComplete}
          </h3>
          
          {practiceData.action_items?.length > 0 ? (
            <div className="space-y-3">
              {practiceData.action_items.map((item, i) => (
                <ActionItemCard 
                  key={i}
                  item={item}
                  index={i}
                  lang={lang}
                  isCompleted={completedActions.has(i)}
                  onComplete={() => toggleAction(i)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-700/30">
              <CheckCircle2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">{pt.noTasks}</p>
            </div>
          )}
          
          {/* Long Term Focus */}
          {practiceData.improvement_metrics?.long_term_focus?.length > 0 && (
            <div className="mt-6 p-4 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 rounded-xl border border-violet-500/20">
              <h4 className="text-sm font-semibold text-violet-400 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                {pt.longTermFocus}
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
      
      {/* Achievements - Enhanced with stats and categories */}
      {activeSection === 'achievements' && (
        <div className="space-y-6">
          {/* Achievement Stats Header */}
          <div className="bg-gradient-to-br from-amber-500/10 via-yellow-500/10 to-orange-500/10 rounded-2xl border border-amber-500/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                  <Trophy className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-100">{pt.achievementsTitle}</h3>
                  <p className="text-sm text-slate-400">
                    {lang === 'en' ? 'Your journey to sales mastery' : 'המסע שלך לשליטה במכירות'}
                  </p>
                </div>
              </div>
              
              {/* Total XP */}
              <div className="text-right">
                <div className="flex items-center gap-2 justify-end">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <span className="text-3xl font-bold text-amber-400">{userStats.xp || 150}</span>
                </div>
                <p className="text-xs text-slate-500">{lang === 'en' ? 'Total XP Earned' : 'סה"כ XP שנצבר'}</p>
              </div>
            </div>
            
            {/* Progress to next level */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Level {userStats.level || 1}</span>
                <span>Level {(userStats.level || 1) + 1}</span>
              </div>
              <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 rounded-full transition-all duration-500"
                  style={{ width: '45%' }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-2 text-center">
                {lang === 'en' ? '350 XP to next level' : '350 XP לרמה הבאה'}
              </p>
            </div>
          </div>
          
          {/* Achievement Categories */}
          <div className="space-y-6">
            {/* Unlocked Achievements */}
            <div>
              <h4 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                <Award className="w-4 h-4" />
                {lang === 'en' ? 'Unlocked' : 'פתוחים'} (2)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ACHIEVEMENT_BADGES.slice(0, 2).map((badge) => (
                  <AchievementCard 
                    key={badge.id} 
                    badge={badge} 
                    unlocked={true}
                    lang={lang}
                  />
                ))}
              </div>
            </div>
            
            {/* In Progress */}
            <div>
              <h4 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
                <Flame className="w-4 h-4" />
                {lang === 'en' ? 'In Progress' : 'בתהליך'} (2)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ACHIEVEMENT_BADGES.slice(2, 4).map((badge, i) => (
                  <AchievementCard 
                    key={badge.id} 
                    badge={badge} 
                    unlocked={false}
                    progress={[65, 40][i]}
                    lang={lang}
                  />
                ))}
              </div>
            </div>
            
            {/* Locked */}
            <div>
              <h4 className="text-sm font-semibold text-slate-500 mb-3 flex items-center gap-2">
                <Star className="w-4 h-4" />
                {lang === 'en' ? 'Locked' : 'נעולים'} ({ACHIEVEMENT_BADGES.length - 4})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {ACHIEVEMENT_BADGES.slice(4).map((badge) => (
                  <AchievementCard 
                    key={badge.id} 
                    badge={badge} 
                    unlocked={false}
                    progress={0}
                    lang={lang}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
