import { useState, useRef, useEffect, useCallback } from 'react'
import { 
  Target, Dumbbell, Mic, Play, Pause, Volume2, ChevronDown, ChevronUp, 
  CheckCircle2, Circle, Flame, Zap, BookOpen, MessageSquare, Timer,
  Star, Trophy, ArrowRight, Lightbulb, AlertTriangle, Sparkles,
  RotateCcw, Copy, Check, Users, Brain, TrendingUp, Award, Send,
  Square, Loader2, ThumbsUp, ThumbsDown, HelpCircle, GraduationCap,
  FileText, Headphones, PenTool, RefreshCw, BookMarked, Heart, Trash2,
  Plus, Wand2, Save, X, Hash
} from 'lucide-react'
import axios from 'axios'
import { API_URL } from '../../lib/config'

// ============ SALES METHODOLOGY GUIDES ============
const SALES_METHODOLOGY_GUIDES = {
  discovery: {
    title: 'גילוי כאב (Discovery)',
    why: 'גילוי כאב הוא הבסיס לכל מכירה. בלי להבין את הכאב האמיתי של הלקוח, אתה מוכר מוצר במקום פתרון.',
    principle: 'מכירה לתת-מודע של הלקוח. הפוך למומחה בפסיכולוגיה של מכירות.',
    steps: [
      { step: 'שאל שאלות פתוחות', desc: 'התחל עם "מתי", "איך", "מה" - לא שאלות סגורות' },
      { step: 'חפור לעומק', desc: 'על כל תשובה, שאל "ולמה זה מפריע לך?" או "איך זה משפיע?"' },
      { step: 'כמת את הכאב', desc: 'תרגם לכסף: "כמה זה עולה לך בשנה?"' },
      { step: 'צור דחיפות', desc: 'הראה את העלות של לא לפעול עכשיו' }
    ],
    examples: {
      'cool_life': [
        'מתי בפעם האחרונה צבעת את החוץ של הבית?',
        'אתה רואה התקלפות או דהייה בצד של השמש?',
        'יש לך מגבלות HOA על צבעים?',
        'אתה יודע כמה עולה לצבוע בית היום? (10-12K כל 7-8 שנים = 35K+ ב-25 שנה!)'
      ],
      'turf': [
        'כמה אתה משלם על מים בקיץ?',
        'יש לך גנן? כמה הוא עולה?',
        'יש לך כתמים צהובים בדשא שלא נעלמים?',
        'חישוב: מים + גנן = 400$/חודש = 110,000$+ ב-20 שנה!'
      ],
      'pavers': [
        'מה מצב הבטון הנוכחי? סדוק? מוכתם?',
        'איך אתה מרגיש כשאורחים מגיעים ורואים את הכניסה?',
        'חשבת כמה זה מוסיף לערך הנכס?'
      ]
    },
    common_mistakes: [
      'לקפוץ למחיר לפני שגילית את הכאב',
      'לשאול שאלות סגורות (כן/לא)',
      'לא לכמת את הכאב בכסף',
      'לדבר על המוצר לפני שהלקוח הבין את הבעיה'
    ]
  },
  objection_handling: {
    title: 'טיפול בהתנגדויות',
    why: 'התנגדות היא לא סירוב - זו בקשה למידע נוסף. כל התנגדות היא הזדמנות לחזק את הקשר.',
    principle: 'בודד את ההתנגדות האמיתית. ברוב המקרים, ההתנגדות על פני השטח מסתירה חשש אחר.',
    steps: [
      { step: 'הקשב ואל תתגונן', desc: 'תן ללקוח לסיים. אמור "אני מבין"' },
      { step: 'בודד את ההתנגדות', desc: 'השתמש ב-4 שאלות Yes לגלות את הבעיה האמיתית' },
      { step: 'השתמש בסיפור', desc: 'ספר על לקוח דומה שהיה לו אותו חשש' },
      { step: 'סגור שוב', desc: 'חזור להצעה עם פתרון לחשש' }
    ],
    techniques: {
      'four_yes': {
        name: '4 שאלות Yes',
        description: 'טכניקה לבידוד ההתנגדות האמיתית',
        script: [
          'אתה רוצה לעשות את הפרויקט? (כן)',
          'אתה אוהב את מה שהראיתי לך על החברה? (כן)',
          'אתה סומך עליי שאעשה לך עבודה טובה? (כן)',
          'אז הדבר היחיד שמפריע לך זה המחיר, נכון?'
        ]
      },
      'feel_felt_found': {
        name: 'Feel-Felt-Found',
        description: 'טכניקה ליצירת הזדהות',
        script: [
          'אני מבין איך אתה מרגיש...',
          'לקוחות אחרים הרגישו בדיוק אותו דבר...',
          'מה שהם גילו זה ש...'
        ]
      }
    },
    stories: {
      'need_to_think': {
        name: 'סיפור דייוויד',
        story: 'דייוויד, בעל עסק אינסטלציה, אמר לי בדיוק את אותו דבר - "צריך לחשוב". המתנתי 3 חודשים. המתחרה שלו חתם, עלה ראשון בגוגל, ודייוויד הפסיד 3 עסקאות של 180,000$. כשהתקשר אליי, אמר "הלוואי שלא חיכיתי".'
      },
      'too_expensive': {
        name: 'סיפור הג\'ונסונים',
        story: 'משפחת ג\'ונסון אמרה "יקר". הלכו לקבלן שהציע 8,000$ פחות. 8 חודשים אחר כך התקשרו - הצבע מתקלף, הקבלן נעלם, האחריות חסרת ערך. שילמו לי כפול לתקן. מר ג\'ונסון אמר: "המחיר הזול הפך להחלטה הכי יקרה שעשיתי."'
      },
      'spouse_decision': {
        name: 'סיפור מריה',
        story: 'מריה רצתה לדבר עם הבעל. שבוע אחר כך הבעל כבר שכר את החבר שלו "בזול". 6 חודשים - העבודה מתפוררת, הבן אדם נעלם, היא בוכה בטלפון. עכשיו היא מפנה אליי את כל השכנים ואומרת "אל תעשו את הטעות שלי".'
      }
    }
  },
  closing: {
    title: 'סגירה',
    why: 'הסגירה היא לא "לחץ" - היא עזרה ללקוח לקבל את ההחלטה הנכונה. אם המוצר טוב לו, חובתך לעזור לו להחליט.',
    principle: 'לעולם אל תחשוף מחיר לפני 75 דקות. מחיר לפני ערך = התנגדויות.',
    steps: [
      { step: 'ודא 3 Yes', desc: 'מוצר ✓ חברה ✓ אמון ✓' },
      { step: 'בקש הסכמה', desc: '"אם אתן לך מחיר טוב, תסכים שזו עסקה טובה?"' },
      { step: 'הצג את ההשקעה', desc: 'השתמש ב"השקעה" לא "מחיר"' },
      { step: 'שתוק', desc: 'אחרי שאמרת את המחיר - שתוק. מי שמדבר ראשון מפסיד.' }
    ],
    urgency_techniques: [
      'הנחות מפעל שפוקעות בקרוב',
      'חומרים מפרויקט מסחרי סמוך במחיר מיוחד',
      'לו"ז צפוף - אם לא סוגרים היום, לא יכול להבטיח מתי נתחיל',
      'Model Project - צילום לפני/אחרי + סרטון עדות = הנחה משמעותית'
    ]
  },
  storytelling: {
    title: 'סיפורים שמוכרים',
    why: 'עובדות מספרות, סיפורים מוכרים. המוח האנושי מתוכנן לזכור סיפורים, לא נתונים.',
    principle: '6 אלמנטים של סיפור מכירות מנצח',
    elements: [
      { name: 'דמות שניתן להזדהות איתה', desc: 'שם, מיקום, מצב דומה ללקוח' },
      { name: 'אותה היסוס', desc: 'בדיוק אותה התנגדות שיש ללקוח עכשיו' },
      { name: 'רגע ההחלטה', desc: 'מה גרם להם להחליט?' },
      { name: 'מחיר ההמתנה', desc: 'מה הפסידו/כמעט הפסידו בגלל שחיכו?' },
      { name: 'השינוי', desc: 'תוצאות ספציפיות עם מספרים' },
      { name: 'התחושה', desc: 'איך הם מרגישים עכשיו?' }
    ],
    structure: '"תן לי לספר לך על [שם]... הם גרים ב[אזור], מצב דומה לשלך... כשפגשתי אותם, הם אמרו בדיוק מה שאתה אומר - \'[אותה התנגדות]\'... [מה קרה]... [מה הם עשו]... [תוצאות ספציפיות]... עכשיו הם אומרים לכולם - \'[ציטוט רגשי]\'"'
  }
}

// ============ INTERACTIVE PRACTICE CARD ============
function InteractivePracticeCard({ 
  weakness, 
  exerciseContext, 
  onFeedbackReceived,
  TTSButton 
}) {
  const [mode, setMode] = useState('guide') // 'guide' | 'write' | 'record' | 'feedback'
  const [userInput, setUserInput] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [showGuide, setShowGuide] = useState(false)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const timerRef = useRef(null)
  
  const guide = SALES_METHODOLOGY_GUIDES[weakness.guide_key] || SALES_METHODOLOGY_GUIDES.objection_handling
  
  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data)
      }
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        await transcribeAndGetFeedback(audioBlob)
      }
      
      mediaRecorderRef.current.start()
      setIsRecording(true)
      setRecordingTime(0)
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (err) {
      console.error('Failed to start recording:', err)
      alert('לא ניתן לגשת למיקרופון. אנא אפשר גישה בהגדרות הדפדפן.')
    }
  }
  
  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      setIsRecording(false)
      clearInterval(timerRef.current)
    }
  }
  
  // Transcribe audio and get feedback
  const transcribeAndGetFeedback = async (audioBlob) => {
    setIsProcessing(true)
    setMode('feedback')
    
    try {
      // First transcribe
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')
      
      const transcribeRes = await axios.post(`${API_URL}/api/transcribe-practice`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      if (transcribeRes.data.text) {
        setUserInput(transcribeRes.data.text)
        await getFeedback(transcribeRes.data.text)
      }
    } catch (err) {
      console.error('Transcription error:', err)
      setFeedback({ error: 'שגיאה בתמלול. נסה שוב.' })
    } finally {
      setIsProcessing(false)
    }
  }
  
  // Get AI feedback on text
  const getFeedback = async (text) => {
    setIsProcessing(true)
    
    try {
      const res = await axios.post(`${API_URL}/api/practice-feedback`, {
        user_response: text || userInput,
        exercise_context: {
          scenario: exerciseContext?.scenario || weakness.weakness_summary,
          customer_statement: exerciseContext?.customer_statement || '',
          ideal_response: exerciseContext?.ideal_response || '',
          technique: exerciseContext?.technique || ''
        },
        exercise_type: weakness.skill_name || 'general'
      })
      
      if (res.data.feedback) {
        setFeedback(res.data.feedback)
        setMode('feedback')
        onFeedbackReceived && onFeedbackReceived(res.data.feedback)
      }
    } catch (err) {
      console.error('Feedback error:', err)
      setFeedback({ error: 'שגיאה בקבלת פידבק. נסה שוב.' })
    } finally {
      setIsProcessing(false)
    }
  }
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  const resetPractice = () => {
    setMode('guide')
    setUserInput('')
    setFeedback(null)
    setRecordingTime(0)
  }

  return (
    <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <PriorityBadge priority={weakness.priority} />
              <h3 className="text-lg font-bold text-slate-100">{weakness.skill_name}</h3>
            </div>
            <p className="text-sm text-slate-400">{weakness.weakness_summary}</p>
          </div>
          <div className="flex items-center gap-2">
            <ScoreRing current={weakness.current_score} target={weakness.target_score} size={50} />
          </div>
        </div>
        
        {/* Specific Issues Tags */}
        {weakness.specific_issues?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {weakness.specific_issues.slice(0, 3).map((issue, i) => (
              <span key={i} className="px-2 py-1 bg-red-500/10 text-red-400 text-xs rounded-lg border border-red-500/20">
                {issue}
              </span>
            ))}
          </div>
        )}
      </div>
      
      {/* Mode Tabs */}
      <div className="flex border-b border-slate-700/50">
        {[
          { id: 'guide', icon: BookOpen, label: 'מדריך' },
          { id: 'write', icon: PenTool, label: 'כתוב' },
          { id: 'record', icon: Mic, label: 'הקלט' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setMode(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all ${
              mode === tab.id 
                ? 'bg-violet-500/20 text-violet-400 border-b-2 border-violet-500' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
        {feedback && (
          <button
            onClick={() => setMode('feedback')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all ${
              mode === 'feedback' 
                ? 'bg-emerald-500/20 text-emerald-400 border-b-2 border-emerald-500' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Star className="w-4 h-4" />
            פידבק
          </button>
        )}
      </div>
      
      {/* Content Area */}
      <div className="p-4" dir="rtl">
        {/* Guide Mode */}
        {mode === 'guide' && (
          <div className="space-y-4">
            {/* Why This Matters */}
            <div className="p-4 bg-violet-500/10 rounded-xl border border-violet-500/20">
              <div className="flex items-center gap-2 mb-2">
                <HelpCircle className="w-4 h-4 text-violet-400" />
                <h4 className="font-semibold text-violet-400">למה זה חשוב?</h4>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{guide.why}</p>
            </div>
            
            {/* Principle */}
            <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <h4 className="font-semibold text-amber-400">העיקרון המנחה</h4>
              </div>
              <p className="text-sm text-slate-300 font-medium">{guide.principle}</p>
            </div>
            
            {/* Steps */}
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-200 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-emerald-400" />
                הצעדים לביצוע
              </h4>
              {guide.steps?.map((step, i) => (
                <div key={i} className="flex gap-3 p-3 bg-slate-800/50 rounded-xl">
                  <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-emerald-400 font-bold text-sm">{i + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-200">{step.step}</p>
                    <p className="text-sm text-slate-400">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Toggle for more details */}
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="w-full p-3 bg-slate-800/50 rounded-xl text-sm text-slate-300 hover:bg-slate-700/50 transition-colors flex items-center justify-center gap-2"
            >
              {showGuide ? 'הסתר פרטים נוספים' : 'הצג דוגמאות וטיפים נוספים'}
              {showGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {showGuide && (
              <div className="space-y-4 mt-4">
                {/* Stories */}
                {guide.stories && (
                  <div>
                    <h4 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-pink-400" />
                      סיפורים לשימוש
                    </h4>
                    {Object.values(guide.stories).map((story, i) => (
                      <div key={i} className="p-4 bg-pink-500/5 rounded-xl border border-pink-500/20 mb-3">
                        <p className="font-medium text-pink-400 mb-2">{story.name}</p>
                        <p className="text-sm text-slate-300 leading-relaxed">{story.story}</p>
                        {TTSButton && (
                          <div className="mt-2">
                            <TTSButton text={story.story} label="🔊 האזן לסיפור" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Common Mistakes */}
                {guide.common_mistakes && (
                  <div>
                    <h4 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      טעויות נפוצות להימנע מהן
                    </h4>
                    <ul className="space-y-2">
                      {guide.common_mistakes.map((mistake, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                          <span className="text-red-400">✗</span>
                          {mistake}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            {/* CTA to practice */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setMode('write')}
                className="flex-1 py-3 bg-violet-500 hover:bg-violet-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <PenTool className="w-4 h-4" />
                תרגל בכתיבה
              </button>
              <button
                onClick={() => setMode('record')}
                className="flex-1 py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Mic className="w-4 h-4" />
                תרגל בהקלטה
              </button>
            </div>
          </div>
        )}
        
        {/* Write Mode */}
        {mode === 'write' && (
          <div className="space-y-4">
            {/* Scenario */}
            <div className="p-4 bg-slate-800/70 rounded-xl">
              <p className="text-xs text-slate-500 mb-1">התרחיש:</p>
              <p className="text-slate-200 font-medium">
                {exerciseContext?.customer_statement || `הלקוח מציג התנגדות בנושא ${weakness.skill_name}`}
              </p>
            </div>
            
            {/* Text Input */}
            <div>
              <label className="text-sm text-slate-400 mb-2 block">התשובה שלך:</label>
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="כתוב כאן את התשובה שלך..."
                className="w-full h-32 p-4 bg-slate-900/50 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                dir="rtl"
              />
              <p className="text-xs text-slate-500 mt-1">{userInput.length} תווים</p>
            </div>
            
            {/* Hint */}
            {exerciseContext?.technique && (
              <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-300">
                  טיפ: נסה להשתמש בטכניקת <strong>{exerciseContext.technique}</strong>
                </p>
              </div>
            )}
            
            {/* Submit */}
            <button
              onClick={() => getFeedback()}
              disabled={!userInput.trim() || isProcessing}
              className="w-full py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  מעבד...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  שלח לפידבק AI
                </>
              )}
            </button>
          </div>
        )}
        
        {/* Record Mode */}
        {mode === 'record' && (
          <div className="space-y-4">
            {/* Scenario */}
            <div className="p-4 bg-slate-800/70 rounded-xl">
              <p className="text-xs text-slate-500 mb-1">התרחיש:</p>
              <p className="text-slate-200 font-medium">
                {exerciseContext?.customer_statement || `הלקוח מציג התנגדות בנושא ${weakness.skill_name}`}
              </p>
            </div>
            
            {/* Recording UI */}
            <div className="text-center py-8">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="w-24 h-24 bg-gradient-to-br from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-pink-500/30 transition-all hover:scale-105"
                >
                  <Mic className="w-10 h-10 text-white" />
                </button>
              ) : (
                <div className="space-y-4">
                  <button
                    onClick={stopRecording}
                    className="w-24 h-24 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-red-500/30 animate-pulse"
                  >
                    <Square className="w-10 h-10 text-white" />
                  </button>
                  <div className="text-2xl font-mono text-red-400">{formatTime(recordingTime)}</div>
                </div>
              )}
              
              <p className="text-slate-400 mt-4">
                {isRecording ? 'לחץ לעצירה כשתסיים' : 'לחץ להתחלת הקלטה'}
              </p>
            </div>
            
            {/* Hint */}
            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 flex items-start gap-2">
              <Headphones className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-300">
                דבר בקול רם וברור. ה-AI יתמלל את ההקלטה ויתן לך פידבק מפורט.
              </p>
            </div>
          </div>
        )}
        
        {/* Feedback Mode */}
        {mode === 'feedback' && (
          <div className="space-y-4">
            {isProcessing ? (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 text-violet-400 animate-spin mx-auto mb-4" />
                <p className="text-slate-300">מנתח את התשובה שלך...</p>
              </div>
            ) : feedback?.error ? (
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <p className="text-red-400">{feedback.error}</p>
                <button
                  onClick={resetPractice}
                  className="mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg"
                >
                  נסה שוב
                </button>
              </div>
            ) : feedback && (
              <>
                {/* Score */}
                <div className="text-center py-4">
                  <div className="inline-flex items-center gap-4 p-4 bg-slate-800/70 rounded-2xl">
                    <div className={`text-5xl font-bold ${
                      feedback.overall_score >= 8 ? 'text-emerald-400' :
                      feedback.overall_score >= 6 ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {feedback.overall_score}/10
                    </div>
                    <div className="text-right">
                      <p className="text-slate-400 text-sm">ציון כללי</p>
                      <p className="text-slate-200 font-medium">
                        {feedback.overall_score >= 8 ? 'מצוין!' :
                         feedback.overall_score >= 6 ? 'טוב, יש מקום לשיפור' : 'צריך עוד תרגול'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* User's Response */}
                <div className="p-4 bg-slate-800/50 rounded-xl">
                  <p className="text-xs text-slate-500 mb-1">מה אמרת:</p>
                  <p className="text-slate-300">"{userInput}"</p>
                </div>
                
                {/* Strengths */}
                {feedback.strengths?.length > 0 && (
                  <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <ThumbsUp className="w-4 h-4 text-emerald-400" />
                      <h4 className="font-semibold text-emerald-400">מה היה טוב</h4>
                    </div>
                    <ul className="space-y-1">
                      {feedback.strengths.map((s, i) => (
                        <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                          <span className="text-emerald-400">✓</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Improvements */}
                {feedback.improvements?.length > 0 && (
                  <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-amber-400" />
                      <h4 className="font-semibold text-amber-400">מה לשפר</h4>
                    </div>
                    <ul className="space-y-1">
                      {feedback.improvements.map((s, i) => (
                        <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                          <span className="text-amber-400">→</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Specific Feedback */}
                {feedback.specific_feedback && (
                  <div className="p-4 bg-slate-800/50 rounded-xl">
                    <p className="text-sm text-slate-300 leading-relaxed">{feedback.specific_feedback}</p>
                  </div>
                )}
                
                {/* Suggested Revision */}
                {feedback.suggested_revision && (
                  <div className="p-4 bg-violet-500/10 rounded-xl border border-violet-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-violet-400" />
                      <h4 className="font-semibold text-violet-400">הצעה לתשובה משופרת</h4>
                    </div>
                    <p className="text-sm text-slate-200 leading-relaxed">{feedback.suggested_revision}</p>
                    {TTSButton && (
                      <div className="mt-2">
                        <TTSButton text={feedback.suggested_revision} label="🔊 האזן" />
                      </div>
                    )}
                  </div>
                )}
                
                {/* Coaching Tip */}
                {feedback.coaching_tip && (
                  <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-4 h-4 text-blue-400" />
                      <h4 className="font-semibold text-blue-400">טיפ לפעם הבאה</h4>
                    </div>
                    <p className="text-sm text-slate-300">{feedback.coaching_tip}</p>
                  </div>
                )}
                
                {/* Encouragement */}
                {feedback.encouragement && (
                  <div className="text-center p-4 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 rounded-xl border border-violet-500/20">
                    <p className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
                      {feedback.encouragement}
                    </p>
                  </div>
                )}
                
                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={resetPractice}
                    className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    תרגל שוב
                  </button>
                  <button
                    onClick={() => setMode('guide')}
                    className="flex-1 py-3 bg-violet-500 hover:bg-violet-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <BookOpen className="w-4 h-4" />
                    חזור למדריך
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

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

// ============ STORIES SECTION COMPONENT ============
const EMOTION_OPTIONS = [
  { value: 'trust', label: 'אמון', color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30' },
  { value: 'urgency', label: 'דחיפות', color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' },
  { value: 'value', label: 'ערך', color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' },
  { value: 'fear_of_loss', label: 'פחד מהפסד', color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30' },
  { value: 'peace_of_mind', label: 'שקט נפשי', color: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500/30' },
  { value: 'pride', label: 'גאווה', color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/30' },
  { value: 'professionalism', label: 'מקצועיות', color: 'text-indigo-400', bg: 'bg-indigo-500/20', border: 'border-indigo-500/30' },
  { value: 'integrity', label: 'יושרה', color: 'text-teal-400', bg: 'bg-teal-500/20', border: 'border-teal-500/30' },
  { value: 'success', label: 'הצלחה', color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' },
  { value: 'social_proof', label: 'הוכחה חברתית', color: 'text-violet-400', bg: 'bg-violet-500/20', border: 'border-violet-500/30' }
]

const OBJECTION_OPTIONS = [
  { value: '', label: 'ללא התנגדות ספציפית' },
  { value: 'need_to_think', label: 'צריך לחשוב על זה' },
  { value: 'too_expensive', label: 'יקר לי' },
  { value: 'spouse_decision', label: 'צריך לדבר עם בן/בת זוג' },
  { value: 'getting_quotes', label: 'בודק עוד הצעות' },
  { value: 'bad_timing', label: 'לא עכשיו' },
  { value: 'check_finances', label: 'צריך לבדוק פיננסים' }
]

const PRODUCT_OPTIONS = [
  { value: '', label: 'כללי' },
  { value: 'cool_life', label: 'Cool Life Paint' },
  { value: 'turf', label: 'דשא סינטטי' },
  { value: 'pavers', label: 'ריצוף' },
  { value: 'concrete', label: 'בטון' },
  { value: 'fence', label: 'גדר' }
]

// Detect the message/intent from a story
const detectStoryMessage = (story) => {
  const text = (story.original_story || '').toLowerCase()
  
  if (text.includes('יקר') || text.includes('מחיר') || text.includes('זול') || text.includes('expensive') || text.includes('cheap') || text.includes('price')) {
    return { message: 'להראות שהזול יוצא יקר בסוף', emotion: 'value' }
  }
  if (text.includes('לחשוב') || text.includes('think') || text.includes('החלטה')) {
    return { message: 'לעזור ללקוח להחליט עכשיו', emotion: 'urgency' }
  }
  if (text.includes('אשתי') || text.includes('בעלי') || text.includes('spouse') || text.includes('wife') || text.includes('husband')) {
    return { message: 'להפוך את הלקוח לשגריר', emotion: 'trust' }
  }
  if (text.includes('הצעות') || text.includes('quotes') || text.includes('בודק')) {
    return { message: 'להראות למה אי אפשר להשוות', emotion: 'professionalism' }
  }
  if (text.includes('איכות') || text.includes('quality') || text.includes('תוצאה') || text.includes('result')) {
    return { message: 'להדגיש את האיכות והתוצאות', emotion: 'value' }
  }
  if (text.includes('אמון') || text.includes('trust') || text.includes('סומך')) {
    return { message: 'לבנות אמון עם הלקוח', emotion: 'trust' }
  }
  
  return { message: 'לשכנע את הלקוח', emotion: 'trust' }
}

// ============ STORY IMPROVEMENT CARD - CLEAN PROFESSIONAL DESIGN ============
function StoryImprovementCard({ story, analysisResult, onSaveToBank }) {
  const [improving, setImproving] = useState(false)
  const [improvedStory, setImprovedStory] = useState(null)
  const [selectedEmotions, setSelectedEmotions] = useState([])
  const [selectedObjection, setSelectedObjection] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(analysisResult?.analysis?.product_detected?.product_type || '')
  const [targetMessage, setTargetMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  
  // Auto-detect message from story
  const detectedMessage = detectStoryMessage(story)
  
  // Initialize with detected emotion
  useEffect(() => {
    if (detectedMessage.emotion && selectedEmotions.length === 0) {
      setSelectedEmotions([detectedMessage.emotion])
    }
    if (!targetMessage) {
      setTargetMessage(detectedMessage.message)
    }
  }, [])

  const toggleEmotion = (value) => {
    setSelectedEmotions(prev => 
      prev.includes(value) ? prev.filter(e => e !== value) : [...prev, value]
    )
  }

  const improveStory = async () => {
    if (selectedEmotions.length === 0) {
      alert('בחר לפחות רגש אחד')
      return
    }
    
    setImproving(true)
    try {
      const response = await axios.post(`${API_URL}/api/story-bank/generate`, {
        mode: 'improve',
        raw_story: story.original_story,
        target_emotions: selectedEmotions,
        target_message: targetMessage || detectedMessage.message,
        objection_type: selectedObjection,
        product: selectedProduct
      })
      
      if (response.data.story) {
        setImprovedStory(response.data.story)
      }
    } catch (err) {
      console.error('Error improving story:', err)
      alert('שגיאה בשיפור הסיפור')
    }
    setImproving(false)
  }

  const saveToBank = async () => {
    if (!improvedStory) return
    setSaving(true)
    try {
      await axios.post(`${API_URL}/api/story-bank`, {
        title: improvedStory.title || 'סיפור משופר',
        content: improvedStory.story_content,
        setup_line: improvedStory.setup_line,
        closing_bridge: improvedStory.closing_bridge,
        target_emotions: selectedEmotions,
        objection_type: selectedObjection,
        product: selectedProduct,
        structure: improvedStory.structure,
        explanation: improvedStory.explanation,
        original_story: story.original_story
      })
      setSaved(true)
      onSaveToBank && onSaveToBank()
    } catch (err) {
      console.error('Error saving story:', err)
      alert('שגיאה בשמירת הסיפור')
    }
    setSaving(false)
  }

  // Determine what's missing in the 6 elements
  const sixElements = story.six_elements_check || {}
  const presentCount = Object.values(sixElements).filter(v => v).length

  return (
    <div className="bg-slate-900/60 rounded-xl border border-slate-700/50 overflow-hidden" dir="rtl">
      {/* Full Story Display */}
      <div className="p-5 border-b border-slate-700/50">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <span className={`text-xs px-2 py-1 rounded ${
              story.effectiveness_score >= 7 ? 'bg-emerald-500/20 text-emerald-400' : 
              story.effectiveness_score >= 5 ? 'bg-amber-500/20 text-amber-400' : 
              'bg-red-500/20 text-red-400'
            }`}>
              {story.effectiveness_score}/10
            </span>
            <span className="text-xs text-slate-500">{presentCount}/6 אלמנטים</span>
            {saved && (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> נשמר
              </span>
            )}
          </div>
          {story.timestamp && <span className="text-xs text-slate-600">{story.timestamp}</span>}
        </div>
        
        {/* The Full Story */}
        <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{story.original_story}</p>
        </div>
        
        {/* Detected Message */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">מסר שזוהה:</span>
          <span className="text-violet-400 font-medium">{detectedMessage.message}</span>
        </div>
      </div>

      {/* What's Missing - Compact */}
      {presentCount < 6 && (
        <div className="px-5 py-3 bg-slate-800/30 border-b border-slate-700/50">
          <p className="text-xs text-slate-500 mb-2">אלמנטים חסרים:</p>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'has_relatable_character', label: 'דמות להזדהות' },
              { key: 'has_same_hesitation', label: 'אותו היסוס' },
              { key: 'has_decision_moment', label: 'רגע החלטה' },
              { key: 'has_cost_of_waiting', label: 'מחיר המתנה' },
              { key: 'has_specific_results', label: 'תוצאות ספציפיות' },
              { key: 'has_emotional_payoff', label: 'רגש בסוף' }
            ].filter(({ key }) => !sixElements[key]).map(({ key, label }) => (
              <span key={key} className="text-xs px-2 py-1 bg-red-500/10 text-red-400 rounded">
                {label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Improvement Section */}
      {!improvedStory ? (
        <div className="p-5 space-y-4">
          <p className="text-sm font-medium text-slate-300">שפר את הסיפור</p>
          
          {/* Target Message - Editable */}
          <div>
            <label className="text-xs text-slate-500 block mb-1">מסר להעביר</label>
            <input
              type="text"
              value={targetMessage}
              onChange={(e) => setTargetMessage(e.target.value)}
              className="w-full p-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500"
            />
          </div>
          
          {/* Emotion Selection - Clean Pills */}
          <div>
            <label className="text-xs text-slate-500 block mb-2">רגש לשדר</label>
            <div className="flex flex-wrap gap-2">
              {EMOTION_OPTIONS.map(emotion => (
                <button
                  key={emotion.value}
                  onClick={() => toggleEmotion(emotion.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    selectedEmotions.includes(emotion.value)
                      ? `${emotion.bg} ${emotion.color} ${emotion.border}`
                      : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {emotion.label}
                </button>
              ))}
            </div>
          </div>

          {/* Objection - Simple Dropdown */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">נגד התנגדות</label>
              <select
                value={selectedObjection}
                onChange={(e) => setSelectedObjection(e.target.value)}
                className="w-full p-2 bg-slate-800/50 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-violet-500"
              >
                {OBJECTION_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">מוצר</label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full p-2 bg-slate-800/50 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-violet-500"
              >
                {PRODUCT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Improve Button */}
          <button
            onClick={improveStory}
            disabled={improving || selectedEmotions.length === 0}
            className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
          >
            {improving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> משפר...</>
            ) : (
              <><Wand2 className="w-4 h-4" /> שפר את הסיפור</>
            )}
          </button>
        </div>
      ) : (
        /* Improved Result */
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-emerald-400">הסיפור המשופר</p>
            <button onClick={() => setImprovedStory(null)} className="text-xs text-slate-500 hover:text-slate-300">
              נסה שוב
            </button>
          </div>
          
          {/* Improved Story */}
          <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-4">
            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{improvedStory.story_content}</p>
          </div>

          {/* Setup + Closing */}
          {(improvedStory.setup_line || improvedStory.closing_bridge) && (
            <div className="grid grid-cols-2 gap-3">
              {improvedStory.setup_line && (
                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <p className="text-xs text-amber-400 mb-1">פתיחה</p>
                  <p className="text-xs text-slate-300">{improvedStory.setup_line}</p>
                </div>
              )}
              {improvedStory.closing_bridge && (
                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <p className="text-xs text-emerald-400 mb-1">גשר סגירה</p>
                  <p className="text-xs text-slate-300">{improvedStory.closing_bridge}</p>
                </div>
              )}
            </div>
          )}

          {/* Explanation */}
          {improvedStory.explanation && (
            <p className="text-xs text-slate-500 italic">{improvedStory.explanation}</p>
          )}

          {/* Save Button */}
          <button
            onClick={saveToBank}
            disabled={saving || saved}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saved ? (
              <><CheckCircle2 className="w-4 h-4" /> נשמר!</>
            ) : (
              <><Save className="w-4 h-4" /> שמור ל-Story Bank</>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

// ============ NEW STORY CREATOR ============
function NewStoryCreator({ analysisResult, onSaveToBank }) {
  const [rawStory, setRawStory] = useState('')
  const [selectedEmotions, setSelectedEmotions] = useState([])
  const [selectedObjection, setSelectedObjection] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(analysisResult?.analysis?.product_detected?.product_type || '')
  const [targetMessage, setTargetMessage] = useState('')
  const [improving, setImproving] = useState(false)
  const [improvedStory, setImprovedStory] = useState(null)
  const [saving, setSaving] = useState(false)

  const toggleEmotion = (value) => {
    setSelectedEmotions(prev => 
      prev.includes(value) ? prev.filter(e => e !== value) : [...prev, value]
    )
  }

  const improveStory = async () => {
    if (!rawStory.trim()) {
      alert('כתוב את הסיפור שלך')
      return
    }
    if (selectedEmotions.length === 0) {
      alert('בחר לפחות רגש אחד')
      return
    }
    
    setImproving(true)
    try {
      const response = await axios.post(`${API_URL}/api/story-bank/generate`, {
        mode: 'improve',
        raw_story: rawStory,
        target_emotions: selectedEmotions,
        target_message: targetMessage || 'לשפר את הסיפור',
        objection_type: selectedObjection,
        product: selectedProduct
      })
      
      if (response.data.story) {
        setImprovedStory(response.data.story)
      }
    } catch (err) {
      console.error('Error:', err)
      alert('שגיאה בשיפור הסיפור')
    }
    setImproving(false)
  }

  const saveToBank = async () => {
    if (!improvedStory) return
    setSaving(true)
    try {
      await axios.post(`${API_URL}/api/story-bank`, {
        title: improvedStory.title || 'סיפור חדש',
        content: improvedStory.story_content,
        setup_line: improvedStory.setup_line,
        closing_bridge: improvedStory.closing_bridge,
        target_emotions: selectedEmotions,
        objection_type: selectedObjection,
        product: selectedProduct,
        structure: improvedStory.structure,
        explanation: improvedStory.explanation,
        original_story: rawStory
      })
      // Reset form
      setRawStory('')
      setSelectedEmotions([])
      setSelectedObjection('')
      setTargetMessage('')
      setImprovedStory(null)
      onSaveToBank && onSaveToBank()
      alert('הסיפור נשמר בהצלחה!')
    } catch (err) {
      console.error('Error:', err)
      alert('שגיאה בשמירה')
    }
    setSaving(false)
  }

  return (
    <div className="bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 rounded-2xl border border-violet-500/20 p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center">
          <Plus className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-200">צור סיפור חדש</h3>
          <p className="text-xs text-slate-400">כתוב סיפור שאתה מספר ללקוחות ונשפר אותו</p>
        </div>
      </div>

      {!improvedStory ? (
        <>
          {/* Raw Story Input */}
          <textarea
            value={rawStory}
            onChange={(e) => setRawStory(e.target.value)}
            placeholder="כתוב כאן את הסיפור שלך כמו שאתה מספר אותו היום...

לדוגמה: 'היה לי לקוח שגם הוא אמר שזה יקר לו, אבל אחרי שהוא ראה את התוצאות הוא אמר לי שזו ההשקעה הכי טובה שהוא עשה...'"
            rows={4}
            className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500 resize-none"
            dir="rtl"
          />

          {/* Emotions */}
          <div>
            <p className="text-xs text-slate-400 mb-2">איזה רגש להעביר?</p>
            <div className="flex flex-wrap gap-2">
              {EMOTION_OPTIONS.map(emotion => (
                <button
                  key={emotion.value}
                  onClick={() => toggleEmotion(emotion.value)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                    selectedEmotions.includes(emotion.value)
                      ? `${emotion.bg} ${emotion.color}`
                      : 'bg-slate-700/50 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{emotion.icon}</span>
                  {emotion.label}
                </button>
              ))}
            </div>
          </div>

          {/* Objection + Product Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-slate-400 mb-1">נגד התנגדות</p>
              <select
                value={selectedObjection}
                onChange={(e) => setSelectedObjection(e.target.value)}
                className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-violet-500"
              >
                {OBJECTION_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">מוצר</p>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-violet-500"
              >
                {PRODUCT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Improve Button */}
          <button
            onClick={improveStory}
            disabled={improving || !rawStory.trim() || selectedEmotions.length === 0}
            className="w-full py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
          >
            {improving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> משפר...</>
            ) : (
              <><Wand2 className="w-4 h-4" /> שפר עם AI</>
            )}
          </button>
        </>
      ) : (
        <div className="space-y-4">
          {/* Result */}
          <div className="grid md:grid-cols-2 gap-3">
            <div className="p-3 bg-slate-800/50 rounded-xl">
              <p className="text-xs text-slate-500 mb-1">מקורי</p>
              <p className="text-sm text-slate-400">{rawStory}</p>
            </div>
            <div className="p-3 bg-violet-500/10 rounded-xl border border-violet-500/30">
              <p className="text-xs text-violet-400 mb-1">משופר</p>
              <p className="text-sm text-slate-200">{improvedStory.story_content}</p>
            </div>
          </div>

          {/* Setup + Closing */}
          <div className="grid grid-cols-2 gap-3">
            {improvedStory.setup_line && (
              <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <p className="text-xs text-amber-400">🎯 פתיחה</p>
                <p className="text-xs text-slate-200 mt-1">{improvedStory.setup_line}</p>
              </div>
            )}
            {improvedStory.closing_bridge && (
              <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <p className="text-xs text-emerald-400">🌉 סגירה</p>
                <p className="text-xs text-slate-200 mt-1">{improvedStory.closing_bridge}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => setImprovedStory(null)}
              className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> נסה שוב
            </button>
            <button
              onClick={saveToBank}
              disabled={saving}
              className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> שמור לבנק</>}
            </button>
          </div>
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
    
    // Generate roleplay scenarios based on objections and product
    const roleplayScenarios = []
    const productDetected = analysis?.analysis?.product_detected?.product_type || 'general'
    
    // Add objection-based roleplay scenarios
    const objectionScenarios = {
      'need_to_think': {
        scenario_name: 'התמודדות עם "צריך לחשוב על זה"',
        context: 'הלקוח מראה עניין אבל מבקש זמן לחשוב. זוהי הזדמנות לבודד את ההתנגדות האמיתית.',
        customer_opening: 'תשמע, אני אוהב את מה שהראית לי, אבל אני צריך לחשוב על זה קצת. תן לי כמה ימים.',
        goal: 'בודד את ההתנגדות האמיתית (בדרך כלל מחיר) וסגור את העסקה היום',
        techniques_to_use: ['בידוד התנגדות', '4 שאלות Yes', 'סיפור דייוויד'],
        sample_dialogue: [
          { speaker: 'לקוח', text: 'אני צריך לחשוב על זה, תן לי כמה ימים.' },
          { speaker: 'מוכר', text: 'בטח, אני מבין. מה בדיוק עובר לך בראש? על מה היית רוצה לחשוב?' },
          { speaker: 'לקוח', text: 'פשוט זה הרבה כסף, אני רוצה לבדוק.' },
          { speaker: 'מוכר', text: 'הבנתי. אז בוא נבדוק - אתה רוצה לעשות את הפרויקט?' },
          { speaker: 'לקוח', text: 'כן, בהחלט.' },
          { speaker: 'מוכר', text: 'מצוין. ומה שהראיתי לך על החברה - אתה אוהב?' },
          { speaker: 'לקוח', text: 'כן, נראה לי רציני.' },
          { speaker: 'מוכר', text: 'ואתה סומך עליי שאעשה לך עבודה טובה?' },
          { speaker: 'לקוח', text: 'כן, נראה לי שאתה בן אדם אמין.' },
          { speaker: 'מוכר', text: 'אז הדבר היחיד שמפריע לך זה המחיר, נכון? תן לי לראות מה אני יכול לעשות בשבילך...' }
        ]
      },
      'spouse_decision': {
        scenario_name: 'התמודדות עם "צריך לדבר עם בן/בת זוג"',
        context: 'הלקוח מעוניין אבל רוצה התייעצות. זו הזדמנות להפוך אותו לשגריר שלך.',
        customer_opening: 'הכל נשמע טוב, אבל אני חייב לדבר עם אשתי לפני שאני מחליט משהו כזה גדול.',
        goal: 'הפוך את הלקוח לשגריר שלך או קבע פגישה עם שניהם',
        techniques_to_use: ['שאלות Yes', 'סיפור מריה', 'הצעה להתקשר עכשיו'],
        sample_dialogue: [
          { speaker: 'לקוח', text: 'אני צריך לדבר עם אשתי קודם.' },
          { speaker: 'מוכר', text: 'אני לגמרי מבין, זו החלטה משותפת. תגיד לי - אתה חושב שזה הפרויקט הנכון לבית שלכם?' },
          { speaker: 'לקוח', text: 'כן, אני חושב שכן.' },
          { speaker: 'מוכר', text: 'ומה שהראיתי לך על החברה - אתה מרגיש בנוח?' },
          { speaker: 'לקוח', text: 'כן, נראה לי טוב.' },
          { speaker: 'מוכר', text: 'אז בעצם אתה רק רוצה לוודא שהיא מרגישה אותו דבר, נכון?' },
          { speaker: 'לקוח', text: 'בדיוק.' },
          { speaker: 'מוכר', text: 'תשמע, יש לי רעיון - בוא נתקשר אליה עכשיו, אני אסביר לה בדיוק מה דיברנו. מה אתה אומר?' }
        ]
      },
      'too_expensive': {
        scenario_name: 'התמודדות עם "יקר לי"',
        context: 'הלקוח מתנגד למחיר. זו הזדמנות להראות ערך ולספר על לקוחות שהלכו לזול יותר.',
        customer_opening: 'וואו, זה יקר לי. אני חייב לבדוק עוד הצעות מחיר.',
        goal: 'הראה את העלות האמיתית של "הזול" והדגש את הערך המלא',
        techniques_to_use: ['סיפור הג\'ונסונים', 'חישוב ROI', 'השוואת איכות'],
        sample_dialogue: [
          { speaker: 'לקוח', text: 'זה יקר מדי בשבילי, אני צריך לבדוק עוד הצעות.' },
          { speaker: 'מוכר', text: 'אני שומע אותך. תגיד לי - מה אתה מחפש בהצעות האחרות? אותה איכות? אותה אחריות?' },
          { speaker: 'לקוח', text: 'כן, פחות או יותר.' },
          { speaker: 'מוכר', text: 'תן לי לספר לך על משפחת ג\'ונסון. הם אמרו לי בדיוק אותו דבר - "יקר". הלכו לקבלן שהציע 8,000 דולר פחות. שמונה חודשים אחר כך הם התקשרו אליי - הצבע כבר מתקלף, הקבלן נעלם, והאחריות לא שווה את הנייר שהיא כתובה עליו. בסוף הם שילמו לי לעשות את הכל מחדש. עלות סופית? כמעט כפול ממה שהיו משלמים בהתחלה. מר ג\'ונסון אמר לי: "המחיר הזול הפך להחלטה הכי יקרה שעשיתי."' }
        ]
      },
      'getting_quotes': {
        scenario_name: 'התמודדות עם "אני בודק עוד הצעות"',
        context: 'הלקוח רוצה להשוות. הראה למה אי אפשר להשוות תפוזים לתפוחים.',
        customer_opening: 'אני רוצה לבדוק עוד 2-3 הצעות מחיר לפני שאני מחליט.',
        goal: 'הראה שהצעות אחרות לא כוללות אותו ערך ואיכות',
        techniques_to_use: ['השוואת תכולה', 'שאלות על מה הם משווים', 'יצירת דחיפות'],
        sample_dialogue: [
          { speaker: 'לקוח', text: 'אני רוצה לבדוק עוד כמה הצעות.' },
          { speaker: 'מוכר', text: 'זה הגיוני לגמרי. תגיד לי - אם תמצא אותה איכות, אותה אחריות, ואותו אמון במחיר יותר נמוך - תלך על זה?' },
          { speaker: 'לקוח', text: 'כן, ברור.' },
          { speaker: 'מוכר', text: 'בסדר גמור. רק תשים לב למשהו - כשאתה מקבל הצעות, תשאל: האם הם משתמשים בחומרים תוצרת ארה"ב? האם יש אחריות לכל החיים עם תעודה? האם הם משלימים את כל הפרויקט לפני שאתה משלם שקל? כי אם לא - אתה לא משווה את אותו דבר. אתה משווה תפוחים לתפוזים.' }
        ]
      },
      'bad_timing': {
        scenario_name: 'התמודדות עם "לא עכשיו, אולי בעוד כמה חודשים"',
        context: 'הלקוח דוחה את ההחלטה. הראה את העלות של לחכות.',
        customer_opening: 'התזמון לא מתאים לי עכשיו. אולי נדבר בעוד חצי שנה.',
        goal: 'הראה שדחייה עולה יותר כסף ותפספס הזדמנויות',
        techniques_to_use: ['עלות הדחייה', 'מחירי חומרים עולים', 'יצירת דחיפות'],
        sample_dialogue: [
          { speaker: 'לקוח', text: 'לא עכשיו, אולי בעוד כמה חודשים.' },
          { speaker: 'מוכר', text: 'אני מבין. תגיד לי - מה ישתנה בעוד כמה חודשים?' },
          { speaker: 'לקוח', text: 'לא יודע, פשוט לא מרגיש מוכן עכשיו.' },
          { speaker: 'מוכר', text: 'תשמע, אני רוצה לחלוק איתך משהו. מחירי החומרים עלו 15% בשנה האחרונה. ההצעה שנתתי לך היום - אני לא יכול להבטיח אותה בעוד 6 חודשים. בנוסף, אתה עוד חצי שנה עם הבעיה הזו בבית. שווה לך להמשיך לסבול?' }
        ]
      }
    }
    
    // Add scenarios based on detected objections
    objections.forEach(obj => {
      const objType = obj.type?.toLowerCase().replace(/\s+/g, '_') || ''
      if (objectionScenarios[objType]) {
        roleplayScenarios.push(objectionScenarios[objType])
      }
    })
    
    // Add product-specific scenarios
    const productScenarios = {
      'cool_life': {
        scenario_name: 'תרגול מכירת Cool Life Paint',
        context: 'לקוח מתעניין בצביעת הבית. השתמש בסיפור הטנק הצבאי ותרגל שאלות גילוי כאב.',
        customer_opening: 'אני מחפש לצבוע את הבית, מתי צבעתם בפעם האחרונה?',
        goal: 'גלה את הכאב (עלות צביעה חוזרת), הצג את הפתרון (אחריות לכל החיים), וסגור',
        techniques_to_use: ['סיפור הטנק הצבאי', 'חישוב עלות 25 שנה', 'שאלות גילוי כאב'],
        sample_dialogue: [
          { speaker: 'מוכר', text: 'מתי בפעם האחרונה צבעת את החוץ של הבית?' },
          { speaker: 'לקוח', text: 'לפני בערך 7-8 שנים.' },
          { speaker: 'מוכר', text: 'ואתה רואה שהצבע כבר מתחיל להתקלף או לדהות בצד של השמש?' },
          { speaker: 'לקוח', text: 'כן, בדיוק. הצד הדרומי נראה גרוע.' },
          { speaker: 'מוכר', text: 'אתה יודע כמה עולה לצבוע בית היום? בערך 10-12 אלף דולר. ואם אתה צובע כל 7-8 שנים, ב-25 שנה זה כ-35 אלף דולר רק על צבע! מה אם הייתי אומר לך שיש פתרון שאתה צובע פעם אחת ולעולם לא שוב - עם אחריות לכל החיים?' }
        ]
      },
      'turf': {
        scenario_name: 'תרגול מכירת דשא סינטטי',
        context: 'לקוח עם דשא טבעי שסובל מחשבונות מים גבוהים. הראה חיסכון של 20 שנה.',
        customer_opening: 'הדשא שלי נראה נורא בקיץ, לא משנה כמה אני משקה.',
        goal: 'חשב את החיסכון הכולל (מים + גנן + תחזוקה) והראה ROI',
        techniques_to_use: ['חישוב חיסכון 20 שנה', 'השוואת עלויות', 'Zero Maintenance'],
        sample_dialogue: [
          { speaker: 'מוכר', text: 'כמה אתה משלם על מים בקיץ?' },
          { speaker: 'לקוח', text: 'וואלה, בערך 200-300 דולר בחודש.' },
          { speaker: 'מוכר', text: 'ויש לך גנן?' },
          { speaker: 'לקוח', text: 'כן, 150 דולר בחודש.' },
          { speaker: 'מוכר', text: 'אז תשמע - רק מים וגנן זה בערך 400-450 דולר בחודש, נכון? ב-20 שנה, עם אינפלציה, אתה מסתכל על יותר מ-110,000 דולר! מה אם היית יכול לחסוך 50-70% מזה ולקבל דשא שנראה מושלם כל השנה, בלי השקיה, בלי כיסוח, בלי גנן?' }
        ]
      },
      'pavers': {
        scenario_name: 'תרגול מכירת ריצוף',
        context: 'לקוח עם בטון סדוק או חצר לא מטופחת. הדגש שיפור ערך הנכס.',
        customer_opening: 'הבטון בחצר שלי סדוק ומכוער. אני מתבייש כשבאים אורחים.',
        goal: 'חבר לרגש (גאווה בבית), הראה שיפור ערך נכס, וסגור',
        techniques_to_use: ['חיבור רגשי', 'Curb Appeal', 'ערך נכס'],
        sample_dialogue: [
          { speaker: 'מוכר', text: 'איך אתה מרגיש כשאורחים מגיעים ורואים את החצר?' },
          { speaker: 'לקוח', text: 'להיות כנה - קצת מתבייש. זה נראה מוזנח.' },
          { speaker: 'מוכר', text: 'אני מבין לגמרי. ואיך היית רוצה להרגיש?' },
          { speaker: 'לקוח', text: 'גאה בבית שלי, שיהיה יפה.' },
          { speaker: 'מוכר', text: 'תדמיין רגע - אתה נכנס עם האוטו הביתה, ויש לך כניסה יפהפייה עם ריצוף מודרני, האורחים מתפעלים... וזה לא רק המראה - ריצוף איכותי יכול להעלות את ערך הבית שלך באלפי דולרים. זו השקעה שמחזירה את עצמה.' }
        ]
      }
    }
    
    // Add product-specific scenario if detected
    const productKey = productDetected.toLowerCase().replace(/\s+/g, '_')
    if (productScenarios[productKey]) {
      roleplayScenarios.push(productScenarios[productKey])
    }
    
    // If no scenarios were added, add general sales scenarios
    if (roleplayScenarios.length === 0) {
      roleplayScenarios.push(
        objectionScenarios['need_to_think'],
        objectionScenarios['too_expensive'],
        {
          scenario_name: 'תרגול יצירת דחיפות',
          context: 'הלקוח מתעניין אבל לא מרגיש דחיפות. צור סיבה אמיתית להחליט היום.',
          customer_opening: 'הכל נשמע טוב, אבל אין לי ממש לחץ לעשות את זה עכשיו.',
          goal: 'צור דחיפות אמיתית עם הנחות, זמינות או מחירים עולים',
          techniques_to_use: ['הנחת Model Project', 'מחירי חומרים עולים', 'לו"ז עמוס'],
          sample_dialogue: [
            { speaker: 'לקוח', text: 'אין לי לחץ, אולי בעוד כמה חודשים.' },
            { speaker: 'מוכר', text: 'אני מבין. תשמע, אני רוצה להציע לך משהו. יש לנו עכשיו פרויקט מיוחד - אם תסכים שנצלם תמונות לפני/אחרי, נעשה סרטון עדות קצר, ונשים שלט קטן בזמן העבודה - אני יכול לתת לך הנחה משמעותית. זה רק אם סוגרים היום, כי אני צריך לדווח על זה למנהל שלי.' }
          ]
        }
      )
    }
    
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
        },
        {
          drill_name: 'תרגול 4 שאלות Yes',
          focus: 'בידוד התנגדויות',
          exercises: [
            'אתה רוצה לעשות את הפרויקט?',
            'אתה אוהב את מה שהראיתי לך על החברה?',
            'אתה סומך עליי שאעשה לך עבודה טובה?',
            'אז הדבר היחיד שמפריע לך זה המחיר, נכון?'
          ]
        }
      ],
      action_items: [
        {
          priority: 1,
          action: 'תרגל את הסקריפטים החדשים 3 פעמים לפני השיחה הבאה',
          why: 'חזרה יוצרת ביטחון ותגובות טבעיות יותר',
          deadline: 'לפני השיחה הבאה'
        },
        {
          priority: 2,
          action: 'שנן את סיפור דייוויד ואת סיפור הג\'ונסונים',
          why: 'סיפורים מוכרים יותר מעובדות - הם יוצרים חיבור רגשי',
          deadline: 'השבוע'
        },
        {
          priority: 3,
          action: 'תרגל את 4 שאלות ה-Yes עד שזה יהיה טבעי',
          why: 'זו הטכניקה הכי חשובה לבידוד התנגדויות',
          deadline: 'לפני 3 השיחות הבאות'
        }
      ],
      roleplay_scenarios: roleplayScenarios,
      improvement_metrics: {
        weakest_area: practiceAreas[0]?.skill_name || 'לא זוהו חולשות משמעותיות',
        quick_wins: ['שיפור זמני תגובה', 'הוספת שאלות גילוי', 'שימוש בסיפורים'],
        long_term_focus: ['בניית ספריית סיפורים', 'שליטה בכל טכניקות ההתנגדויות', 'מיומנות בסגירה']
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
    { id: 'stories', label: 'סיפורים', icon: BookMarked },
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
      {/* Stories Section */}
      {activeSection === 'stories' && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-pink-400" />
            סיפורים מהשיחה
          </h3>
          
          {/* Detected Stories from Analysis */}
          {analysisResult?.analysis?.storytelling_analysis && 
           analysisResult.analysis.storytelling_analysis.length > 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-400">
                זיהינו {analysisResult.analysis.storytelling_analysis.length} סיפורים שסיפרת בשיחה. 
                בחר סיפור, הוסף את הרגש שתרצה להעביר, ושפר אותו עם AI.
              </p>
              {analysisResult.analysis.storytelling_analysis.map((story, i) => (
                <StoryImprovementCard 
                  key={i} 
                  story={story} 
                  analysisResult={analysisResult}
                  onSaveToBank={() => {}}
                />
              ))}
            </div>
          ) : (
            <div className="p-6 bg-slate-800/30 rounded-xl border border-slate-700/30 text-center">
              <BookMarked className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 mb-2">לא זיהינו סיפורים בשיחה הזו</p>
              <p className="text-sm text-slate-500">אתה יכול ליצור סיפור חדש למטה</p>
            </div>
          )}

          {/* Prevention Stories from Analysis */}
          {analysisResult?.analysis?.objection_prevention_stories && 
           analysisResult.analysis.objection_prevention_stories.length > 0 && (
            <div className="space-y-4 mt-8">
              <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-400" />
                סיפורים מומלצים למניעת התנגדויות
              </h3>
              <p className="text-sm text-slate-400">
                סיפורים שכדאי ללמוד ולהשתמש בהם למניעת התנגדויות בשיחות הבאות
              </p>
              {analysisResult.analysis.objection_prevention_stories.map((story, i) => (
                <div key={i} className="bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 rounded-xl border border-violet-500/20 p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-200">{story.story_title}</h4>
                      <p className="text-xs text-violet-400 mt-1">נגד: {story.objection_to_prevent}</p>
                    </div>
                    <span className="text-xs text-slate-500">{story.when_to_tell}</span>
                  </div>
                  
                  {story.setup_line && (
                    <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                      <p className="text-xs text-amber-400">🎯 פתיחה:</p>
                      <p className="text-sm text-slate-300">{story.setup_line}</p>
                    </div>
                  )}
                  
                  <div className="p-3 bg-slate-800/50 rounded-lg">
                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{story.the_story}</p>
                  </div>
                  
                  {story.closing_bridge && (
                    <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                      <p className="text-xs text-emerald-400">🌉 גשר סגירה:</p>
                      <p className="text-sm text-slate-300">{story.closing_bridge}</p>
                    </div>
                  )}
                  
                  {story.why_this_prevents && (
                    <p className="text-xs text-slate-500 italic">💡 {story.why_this_prevents}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Create New Story */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2 mb-4">
              <Plus className="w-5 h-5 text-emerald-400" />
              צור סיפור חדש
            </h3>
            <NewStoryCreator 
              analysisResult={analysisResult}
              onSaveToBank={() => {}}
            />
          </div>
        </div>
      )}

      {activeSection === 'weaknesses' && practiceData.practice_areas && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
            <Target className="w-5 h-5 text-red-400" />
            אזורים לשיפור
            <span className="text-sm font-normal text-slate-500">({practiceData.practice_areas.length})</span>
          </h3>
          
          <div className="grid gap-6">
            {practiceData.practice_areas.map((area, i) => {
              // Determine guide key based on skill name
              const guideKeyMap = {
                'טכניקות מכירה': 'closing',
                'טיפול בהתנגדויות': 'objection_handling',
                'גילוי צרכים': 'discovery',
                'Discovery': 'discovery',
                'סיפורים': 'storytelling',
                'סגירה': 'closing'
              }
              const guideKey = guideKeyMap[area.skill_name] || 'objection_handling'
              
              // Get exercise context from first exercise if available
              const exerciseContext = area.practice_exercises?.[0] ? {
                scenario: area.practice_exercises[0].description,
                customer_statement: area.practice_exercises[0].example_scenario,
                ideal_response: area.practice_exercises[0].ideal_response,
                technique: area.practice_exercises[0].technique
              } : null
              
              return (
                <InteractivePracticeCard
                  key={i}
                  weakness={{
                    ...area,
                    guide_key: guideKey
                  }}
                  exerciseContext={exerciseContext}
                  TTSButton={TTSButton}
                  onFeedbackReceived={(feedback) => {
                    console.log('Feedback received:', feedback)
                    // Could save to database or update progress here
                  }}
                />
              )
            })}
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
