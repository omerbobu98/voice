import { useState, useEffect, useRef } from 'react'
import {
  BookOpen, Sparkles, Wand2, Volume2, Pause, Copy, Check, CheckCircle2,
  Lightbulb, User, Clock, TrendingUp, Heart, AlertCircle, Target,
  ChevronDown, ChevronUp, ArrowRight, Loader2, RefreshCw, Save,
  MessageSquare, DollarSign, Users, Zap, Brain, Star, Play, 
  Mic, Award, Quote, ThumbsUp, FileText, PenTool
} from 'lucide-react'
import axios from 'axios'
import { supabase } from '../../lib/supabase'
import { API_URL } from '../../lib/config'

// ============ 6 STORYTELLING ELEMENTS ============
const STORY_ELEMENTS = [
  { 
    id: 'relatable_character', 
    key: 'has_relatable_character',
    icon: User, 
    color: 'violet',
    labelEn: 'Relatable Character', 
    labelHe: 'דמות להזדהות',
    descEn: 'Name, location, similar situation to the customer',
    descHe: 'שם, מיקום, מצב דומה ללקוח',
    exampleEn: '"David and Sarah from Scottsdale, a young family with two kids..."',
    exampleHe: '"דוד ושרה מסקוטסדייל, משפחה צעירה עם שני ילדים..."'
  },
  { 
    id: 'same_hesitation', 
    key: 'has_same_hesitation',
    icon: AlertCircle, 
    color: 'amber',
    labelEn: 'Same Hesitation', 
    labelHe: 'אותו היסוס',
    descEn: 'They had the EXACT same objection as your customer',
    descHe: 'היתה להם בדיוק אותה התנגדות כמו ללקוח',
    exampleEn: '"He said the exact same thing - I need to think about it"',
    exampleHe: '"הוא אמר בדיוק את אותו דבר - אני צריך לחשוב על זה"'
  },
  { 
    id: 'decision_moment', 
    key: 'has_decision_moment',
    icon: Lightbulb, 
    color: 'blue',
    labelEn: 'Decision Moment', 
    labelHe: 'רגע ההחלטה',
    descEn: 'The specific trigger that made them say YES',
    descHe: 'הטריגר הספציפי שגרם להם להגיד כן',
    exampleEn: '"When he saw his neighbor\'s water bill was $47 while his was $380..."',
    exampleHe: '"כשהוא ראה שחשבון המים של השכן היה $47 בעוד שלו $380..."'
  },
  { 
    id: 'cost_of_waiting', 
    key: 'has_cost_of_waiting',
    icon: Clock, 
    color: 'red',
    labelEn: 'Cost of Waiting', 
    labelHe: 'מחיר ההמתנה',
    descEn: 'What they lost or almost lost by hesitating',
    descHe: 'מה הם הפסידו או כמעט הפסידו בגלל ההיסוס',
    exampleEn: '"They paid $3,000 more because prices went up"',
    exampleHe: '"הם שילמו $3,000 יותר כי המחירים עלו"'
  },
  { 
    id: 'specific_results', 
    key: 'has_specific_results',
    icon: TrendingUp, 
    color: 'emerald',
    labelEn: 'Specific Results', 
    labelHe: 'תוצאות ספציפיות',
    descEn: 'Measurable outcomes with REAL numbers',
    descHe: 'תוצאות מדידות עם מספרים אמיתיים',
    exampleEn: '"Cut their water bill from $380 to $47/month - $4,000/year saved"',
    exampleHe: '"הורידו את חשבון המים מ-$380 ל-$47 לחודש - חסכון של $4,000 בשנה"'
  },
  { 
    id: 'emotional_payoff', 
    key: 'has_emotional_payoff',
    icon: Heart, 
    color: 'pink',
    labelEn: 'Emotional Payoff', 
    labelHe: 'תגמול רגשי',
    descEn: 'A powerful direct quote from the customer',
    descHe: 'ציטוט ישיר ועוצמתי מהלקוח',
    exampleEn: '"Sarah told me: I can\'t believe we almost didn\'t do this"',
    exampleHe: '"שרה אמרה לי: אני לא מאמינה שכמעט לא עשינו את זה"'
  }
]

// ============ STORY TEMPLATES ============
const STORY_TEMPLATES = {
  military_tank: {
    titleEn: 'Military Tank Story',
    titleHe: 'סיפור הטנק הצבאי',
    forProduct: 'cool_life',
    forObjection: '',
    templateEn: `You know what's interesting? The military invented this paint technology for their tanks. They needed to reduce heat absorption so soldiers wouldn't cook inside. [CHARACTER] from [LOCATION] heard about this and said [SAME HESITATION]. But then [DECISION MOMENT]. The result? [SPECIFIC RESULTS]. [CHARACTER] told me: "[EMOTIONAL QUOTE]"`,
    templateHe: `אתה יודע מה מעניין? הצבא המציא את טכנולוגיית הצבע הזו לטנקים שלהם. הם היו צריכים להפחית את ספיגת החום כדי שהחיילים לא יתבשלו בפנים. [CHARACTER] מ[LOCATION] שמע על זה ואמר [SAME HESITATION]. אבל אז [DECISION MOMENT]. התוצאה? [SPECIFIC RESULTS]. [CHARACTER] אמר לי: "[EMOTIONAL QUOTE]"`,
    fullExampleEn: `You know what's interesting? The military invented this paint technology for their tanks. They needed to reduce heat absorption so soldiers wouldn't cook inside. David from Scottsdale heard about this and said "Sounds too good to be true - I need to think about it." But then I showed him the thermal camera comparison - his neighbor's Cool Life patio was 25 degrees cooler than his. He decided right there. Now his energy bill dropped $180/month, and his kids can play on the patio even in July. David told me last week: "My only regret is waiting 6 months. That's $1,080 I could have saved."`,
  },
  think_about_it: {
    titleEn: 'David\'s 3-Month Wait Story',
    titleHe: 'סיפור 3 החודשים של דוד',
    forProduct: '',
    forObjection: 'need_to_think',
    templateEn: `I totally understand wanting to think about it. [CHARACTER] from [LOCATION] said the exact same thing. He waited [TIME PERIOD]. What happened? [COST OF WAITING]. He finally decided when [DECISION MOMENT]. Now [SPECIFIC RESULTS]. He told me: "[EMOTIONAL QUOTE]"`,
    templateHe: `אני לגמרי מבין את הרצון לחשוב על זה. [CHARACTER] מ[LOCATION] אמר בדיוק את אותו דבר. הוא חיכה [TIME PERIOD]. מה קרה? [COST OF WAITING]. הוא סוף סוף החליט כש[DECISION MOMENT]. עכשיו [SPECIFIC RESULTS]. הוא אמר לי: "[EMOTIONAL QUOTE]"`,
    fullExampleEn: `I totally understand wanting to think about it. David from Fountain Hills said the exact same thing. He waited 3 months. What happened? Prices went up $2,800 and he missed the entire summer. His kids couldn't play outside because the yard was dead. He finally decided when his wife said "We've been talking about this for 3 months - let's just do it." Now his backyard is green year-round, water bill dropped from $340 to $45, and the kids play outside every day. David told me: "The thinking didn't help - it just cost me money and time."`,
  },
  spouse_decision: {
    titleEn: 'Maria\'s Spouse Story',
    titleHe: 'סיפור בן הזוג של מריה',
    forProduct: '',
    forObjection: 'spouse_decision',
    templateEn: `[CHARACTER] said the same thing - needed to talk to [his/her] spouse. What we did: [WHAT YOU DID]. [SPOUSE NAME] had [SPECIFIC CONCERNS]. Once [SPOUSE NAME] saw [WHAT THEY SAW], [DECISION MOMENT]. The result: [SPECIFIC RESULTS]. [CHARACTER] told me: "[EMOTIONAL QUOTE]"`,
    templateHe: `[CHARACTER] אמר את אותו דבר - היה צריך לדבר עם [בעלה/אשתו]. מה שעשינו: [WHAT YOU DID]. ל[SPOUSE NAME] היו [SPECIFIC CONCERNS]. ברגע ש[SPOUSE NAME] ראה [WHAT THEY SAW], [DECISION MOMENT]. התוצאה: [SPECIFIC RESULTS]. [CHARACTER] אמר לי: "[EMOTIONAL QUOTE]"`,
    fullExampleEn: `Maria from Gilbert said the same thing - needed to talk to her husband first. What we did: I came back the next evening when both could be there. Her husband John had real concerns about durability and cost. Once John saw our 25-year warranty and the financing with no payments for 60 days, he actually got more excited than Maria. They signed that night. Now their driveway is the best-looking on the street, and Maria told me: "John brags about it to everyone who visits. He's glad I didn't let him talk me out of it."`,
  },
  too_expensive: {
    titleEn: 'Johnson\'s Cheap Contractor Story',
    titleHe: 'סיפור הקבלן הזול של ג\'ונסון',
    forProduct: '',
    forObjection: 'too_expensive',
    templateEn: `I hear you on price. [CHARACTER] from [LOCATION] went with the cheaper option first. [WHAT HAPPENED WITH CHEAP]. After [TIME], they had to [WHAT THEY HAD TO DO]. Total cost: [TOTAL COST] - more than if they'd done it right the first time. They called us and said [QUOTE]. Now [CURRENT SITUATION]. [CHARACTER]'s advice: "[EMOTIONAL QUOTE]"`,
    templateHe: `אני שומע אותך לגבי המחיר. [CHARACTER] מ[LOCATION] הלך עם האופציה הזולה קודם. [WHAT HAPPENED WITH CHEAP]. אחרי [TIME], הם היו צריכים [WHAT THEY HAD TO DO]. עלות כוללת: [TOTAL COST] - יותר ממה שהיה עולה להם לעשות נכון מההתחלה. הם התקשרו אלינו ואמרו [QUOTE]. עכשיו [CURRENT SITUATION]. העצה של [CHARACTER]: "[EMOTIONAL QUOTE]"`,
    fullExampleEn: `I hear you on price. The Johnsons from Mesa went with a contractor who was $4,000 cheaper. Six months later, the pavers were cracking, weeds were coming through, and it looked terrible. They had to rip it all out and start over. Total cost: $18,000 - $6,000 more than if they'd done it right the first time. They called us and said "We learned our lesson." Now they have a beautiful patio that'll last 30 years. Mr. Johnson's advice to everyone: "Cheap is expensive. Just do it right once."`,
  }
}

// ============ EMOTION OPTIONS ============
const EMOTION_OPTIONS = [
  { value: 'trust', labelEn: 'Trust', labelHe: 'אמון', icon: Users, color: 'blue' },
  { value: 'urgency', labelEn: 'Urgency', labelHe: 'דחיפות', icon: Clock, color: 'red' },
  { value: 'value', labelEn: 'Value', labelHe: 'ערך', icon: DollarSign, color: 'emerald' },
  { value: 'fear_of_loss', labelEn: 'Fear of Loss', labelHe: 'פחד מהפסד', icon: AlertCircle, color: 'orange' },
  { value: 'peace_of_mind', labelEn: 'Peace of Mind', labelHe: 'שקט נפשי', icon: Heart, color: 'cyan' },
  { value: 'pride', labelEn: 'Pride', labelHe: 'גאווה', icon: Award, color: 'amber' },
  { value: 'social_proof', labelEn: 'Social Proof', labelHe: 'הוכחה חברתית', icon: ThumbsUp, color: 'violet' }
]

const OBJECTION_OPTIONS = [
  { value: '', labelEn: 'No specific objection', labelHe: 'ללא התנגדות ספציפית' },
  { value: 'need_to_think', labelEn: 'Need to think about it', labelHe: 'צריך לחשוב על זה' },
  { value: 'too_expensive', labelEn: 'Too expensive', labelHe: 'יקר לי' },
  { value: 'spouse_decision', labelEn: 'Need to talk to spouse', labelHe: 'צריך לדבר עם בן/בת זוג' },
  { value: 'getting_quotes', labelEn: 'Getting other quotes', labelHe: 'בודק עוד הצעות' },
  { value: 'bad_timing', labelEn: 'Not the right time', labelHe: 'לא עכשיו' }
]

const PRODUCT_OPTIONS = [
  { value: '', labelEn: 'General', labelHe: 'כללי' },
  { value: 'cool_life', labelEn: 'Cool Life Paint', labelHe: 'Cool Life Paint' },
  { value: 'turf', labelEn: 'Synthetic Turf', labelHe: 'דשא סינטטי' },
  { value: 'pavers', labelEn: 'Pavers', labelHe: 'ריצוף' },
  { value: 'concrete', labelEn: 'Concrete', labelHe: 'בטון' },
  { value: 'fence', labelEn: 'Fencing', labelHe: 'גדר' }
]

// ============ TEXT TO SPEECH HOOK (OpenAI TTS) ============
const useTextToSpeech = () => {
  const [speaking, setSpeaking] = useState(false)
  const [currentId, setCurrentId] = useState(null)
  const [loading, setLoading] = useState(false)
  const audioRef = useRef(null)

  const speak = async (text, id, lang = 'en') => {
    // Stop current audio if playing same id
    if (speaking && currentId === id) {
      stop()
      return
    }
    
    // Stop any existing audio
    stop()
    
    setLoading(true)
    setCurrentId(id)
    
    try {
      // Call OpenAI TTS API via backend
      const response = await axios.post(`${API_URL}/api/tts`, {
        text: text,
        voice: 'nova',  // Natural, warm voice
        hd: true,       // High quality
        speed: 1.0
      })
      
      if (response.data.audio_url) {
        const audioUrl = `${API_URL}${response.data.audio_url}`
        const audio = new Audio(audioUrl)
        audioRef.current = audio
        
        audio.onplay = () => { setSpeaking(true); setLoading(false) }
        audio.onended = () => { setSpeaking(false); setCurrentId(null) }
        audio.onerror = () => { setSpeaking(false); setCurrentId(null); setLoading(false) }
        
        await audio.play()
      }
    } catch (error) {
      console.error('TTS error:', error)
      setLoading(false)
      setCurrentId(null)
      // Fallback to browser TTS if API fails
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = lang === 'he' ? 'he-IL' : 'en-US'
      utterance.rate = 0.9
      utterance.onstart = () => setSpeaking(true)
      utterance.onend = () => { setSpeaking(false); setCurrentId(null) }
      window.speechSynthesis.speak(utterance)
    }
  }

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
    }
    window.speechSynthesis.cancel()
    setSpeaking(false)
    setCurrentId(null)
    setLoading(false)
  }

  return { speak, stop, speaking, currentId, loading }
}

// ============ LANGUAGE TOGGLE ============
function LanguageToggle({ lang, setLang }) {
  return (
    <button
      onClick={() => setLang(lang === 'en' ? 'he' : 'en')}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 hover:border-violet-500/50 transition-all text-sm font-medium"
    >
      <span className={lang === 'en' ? 'text-violet-400' : 'text-slate-500'}>EN</span>
      <span className="text-slate-600">/</span>
      <span className={lang === 'he' ? 'text-violet-400' : 'text-slate-500'}>עב</span>
    </button>
  )
}

// ============ ELEMENT SCORE CARD ============
function ElementScoreCard({ element, isPresent, lang, onClick }) {
  const Icon = element.icon
  
  return (
    <button
      onClick={onClick}
      className={`relative group p-4 rounded-xl border transition-all text-left w-full ${
        isPresent 
          ? `bg-${element.color}-500/10 border-${element.color}-500/30 hover:border-${element.color}-500/50`
          : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600 opacity-60 hover:opacity-100'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isPresent 
            ? `bg-${element.color}-500/20` 
            : 'bg-slate-700/50'
        }`}>
          {isPresent ? (
            <Check className={`w-5 h-5 text-${element.color}-400`} />
          ) : (
            <Icon className="w-5 h-5 text-slate-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${isPresent ? `text-${element.color}-300` : 'text-slate-400'}`}>
            {lang === 'en' ? element.labelEn : element.labelHe}
          </p>
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
            {lang === 'en' ? element.descEn : element.descHe}
          </p>
        </div>
      </div>
      
      {/* Hover tooltip with example */}
      <div className="absolute bottom-full left-0 right-0 mb-2 p-3 bg-slate-900 rounded-lg border border-slate-700 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
        <p className="text-xs text-slate-400 mb-1">{lang === 'en' ? 'Example:' : 'דוגמה:'}</p>
        <p className="text-xs text-slate-200 italic">
          {lang === 'en' ? element.exampleEn : element.exampleHe}
        </p>
      </div>
    </button>
  )
}

// ============ STORY TEMPLATE CARD ============
function StoryTemplateCard({ template, templateKey, lang, onUse }) {
  const [expanded, setExpanded] = useState(false)
  
  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden hover:border-violet-500/30 transition-all">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 text-left"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500/20 to-pink-500/20 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-200">
                {lang === 'en' ? template.titleEn : template.titleHe}
              </h4>
              <p className="text-xs text-slate-500">
                {template.forProduct && `${lang === 'en' ? 'For' : 'עבור'}: ${PRODUCT_OPTIONS.find(p => p.value === template.forProduct)?.labelEn || 'General'}`}
                {template.forObjection && `${lang === 'en' ? 'For' : 'עבור'}: ${OBJECTION_OPTIONS.find(o => o.value === template.forObjection)?.[lang === 'en' ? 'labelEn' : 'labelHe'] || ''}`}
              </p>
            </div>
          </div>
          <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>
      
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Template structure */}
          <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/30">
            <p className="text-xs text-violet-400 font-medium mb-2">{lang === 'en' ? 'Template Structure:' : 'מבנה התבנית:'}</p>
            <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
              {lang === 'en' ? template.templateEn : template.templateHe}
            </p>
          </div>
          
          {/* Full example */}
          {template.fullExampleEn && (
            <div className="p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/20">
              <p className="text-xs text-emerald-400 font-medium mb-2">{lang === 'en' ? 'Full Example:' : 'דוגמה מלאה:'}</p>
              <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                {template.fullExampleEn}
              </p>
            </div>
          )}
          
          <button
            onClick={() => onUse(template)}
            className="w-full py-2.5 bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all"
          >
            <PenTool className="w-4 h-4" />
            {lang === 'en' ? 'Use This Template' : 'השתמש בתבנית'}
          </button>
        </div>
      )}
    </div>
  )
}

// ============ MAIN STORY ENHANCER COMPONENT ============
export default function StoryEnhancer({ story, analysisResult, onSaveToBank }) {
  const [lang, setLang] = useState('en')
  const [activeTab, setActiveTab] = useState('analysis') // analysis, improve, templates
  const [improving, setImproving] = useState(false)
  const [improvedStory, setImprovedStory] = useState(null)
  const [selectedEmotions, setSelectedEmotions] = useState([])
  const [selectedObjection, setSelectedObjection] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(analysisResult?.analysis?.product_detected?.product_type || '')
  const [targetMessage, setTargetMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const { speak, speaking, currentId, loading: ttsLoading } = useTextToSpeech()

  // Detect story intent
  const detectMessage = () => {
    const text = (story?.original_story || '').toLowerCase()
    if (text.includes('military') || text.includes('tank') || text.includes('צבא')) return 'Show product credibility'
    if (text.includes('יקר') || text.includes('expensive') || text.includes('price')) return 'Overcome price objection'
    if (text.includes('חשוב') || text.includes('think')) return 'Create urgency'
    if (text.includes('אשתי') || text.includes('בעלי') || text.includes('spouse')) return 'Handle spouse objection'
    return 'Persuade customer'
  }

  // Get elements check
  const sixElements = story?.six_elements_check || {}
  const presentCount = Object.values(sixElements).filter(Boolean).length
  const scorePercent = Math.round((presentCount / 6) * 100)

  // Improve story function
  const improveStory = async () => {
    setImproving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await axios.post(`${API_URL}/api/story-bank/generate`, {
        mode: 'improve',
        raw_story: story.original_story,
        target_emotions: selectedEmotions.length > 0 ? selectedEmotions : ['trust', 'value'],
        target_message: targetMessage || detectMessage(),
        objection_type: selectedObjection,
        product: selectedProduct
      }, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      })
      
      if (response.data.story) {
        setImprovedStory(response.data.story)
        setActiveTab('analysis')
      }
    } catch (err) {
      console.error('Error improving story:', err)
      alert('Error improving story: ' + (err.response?.data?.error || err.message))
    }
    setImproving(false)
  }

  // Copy to clipboard
  const copyToClipboard = async (text) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Save to bank
  const saveToBank = async () => {
    if (!improvedStory) return
    setSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        alert(lang === 'en' ? 'Please log in to save stories' : 'יש להתחבר כדי לשמור סיפורים')
        setSaving(false)
        return
      }
      
      const response = await axios.post(`${API_URL}/api/story-bank`, {
        title: improvedStory.title || 'Improved Story',
        content: improvedStory.story_content,
        story_content: improvedStory.story_content,
        setup_line: improvedStory.setup_line,
        closing_bridge: improvedStory.closing_bridge,
        target_emotions: selectedEmotions.length > 0 ? selectedEmotions : ['trust'],
        objection_type: selectedObjection,
        product: selectedProduct,
        structure: improvedStory.structure,
        original_story: story.original_story
      }, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      })
      
      if (response.data.success || response.data.story) {
        setSaved(true)
        onSaveToBank?.()
      } else {
        throw new Error('Failed to save story')
      }
    } catch (err) {
      console.error('Error saving:', err)
      alert(lang === 'en' 
        ? `Error saving story: ${err.response?.data?.error || err.message}` 
        : `שגיאה בשמירת הסיפור: ${err.response?.data?.error || err.message}`)
    }
    setSaving(false)
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 rounded-2xl border border-slate-700/50 overflow-hidden shadow-2xl" dir={lang === 'he' ? 'rtl' : 'ltr'}>
      
      {/* ===== HEADER WITH SCORE ===== */}
      <div className="relative p-6 bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-pink-500/10 border-b border-slate-700/50">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Score Ring */}
            <div className="relative">
              <svg className="w-20 h-20 transform -rotate-90">
                <circle cx="40" cy="40" r="36" fill="none" stroke="currentColor" strokeWidth="6" className="text-slate-700" />
                <circle 
                  cx="40" cy="40" r="36" fill="none" strokeWidth="6" strokeLinecap="round"
                  className={scorePercent >= 70 ? 'text-emerald-500' : scorePercent >= 40 ? 'text-amber-500' : 'text-red-500'}
                  strokeDasharray={`${scorePercent * 2.26} 226`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-2xl font-bold ${scorePercent >= 70 ? 'text-emerald-400' : scorePercent >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                  {presentCount}
                </span>
                <span className="text-xs text-slate-500">/6</span>
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-violet-400" />
                {lang === 'en' ? 'Story Analysis' : 'ניתוח סיפור'}
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                {lang === 'en' 
                  ? `${presentCount} of 6 storytelling elements detected`
                  : `${presentCount} מתוך 6 אלמנטים זוהו`
                }
              </p>
              {presentCount < 4 && (
                <p className="text-xs text-amber-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {lang === 'en' ? 'This story needs enhancement' : 'הסיפור הזה צריך שיפור'}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <LanguageToggle lang={lang} setLang={setLang} />
          </div>
        </div>
      </div>

      {/* ===== TAB NAVIGATION ===== */}
      <div className="flex border-b border-slate-700/50">
        {[
          { id: 'analysis', labelEn: 'Analysis', labelHe: 'ניתוח', icon: Target },
          { id: 'improve', labelEn: 'Improve', labelHe: 'שפר', icon: Wand2 },
          { id: 'templates', labelEn: 'Templates', labelHe: 'תבניות', icon: FileText }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-4 flex items-center justify-center gap-2 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'text-violet-400 border-b-2 border-violet-400 bg-violet-500/5'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {lang === 'en' ? tab.labelEn : tab.labelHe}
          </button>
        ))}
      </div>

      {/* ===== CONTENT ===== */}
      <div className="p-6">
        
        {/* ANALYSIS TAB */}
        {activeTab === 'analysis' && (
          <div className="space-y-6">
            {/* Original Story */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-orange-500/5 rounded-xl blur-xl" />
              <div className="relative bg-slate-800/80 rounded-xl p-5 border border-slate-700/50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <Quote className="w-4 h-4 text-amber-400" />
                    {lang === 'en' ? 'Your Story' : 'הסיפור שלך'}
                  </h3>
                  <button
                    onClick={() => speak(story.original_story, 'original', lang)}
                    disabled={ttsLoading && currentId === 'original'}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      speaking && currentId === 'original'
                        ? 'bg-amber-500 text-white'
                        : ttsLoading && currentId === 'original'
                        ? 'bg-slate-700/50 text-slate-400 cursor-wait'
                        : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {ttsLoading && currentId === 'original' ? <Loader2 className="w-3 h-3 animate-spin" /> : speaking && currentId === 'original' ? <Pause className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                    {lang === 'en' ? 'Listen' : 'האזן'}
                  </button>
                </div>
                <p className="text-slate-200 leading-relaxed">{story.original_story}</p>
              </div>
            </div>

            {/* 6 Elements Grid */}
            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                <Star className="w-4 h-4 text-violet-400" />
                {lang === 'en' ? '6 Storytelling Elements' : '6 אלמנטים של סיפור'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {STORY_ELEMENTS.map(element => (
                  <ElementScoreCard
                    key={element.id}
                    element={element}
                    isPresent={sixElements[element.key]}
                    lang={lang}
                    onClick={() => {}}
                  />
                ))}
              </div>
            </div>

            {/* Improved Story (if exists) */}
            {improvedStory && (
              <div className="relative group mt-6">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl blur-xl" />
                <div className="relative bg-emerald-500/5 rounded-xl p-5 border border-emerald-500/20">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      {lang === 'en' ? 'Improved Version' : 'גרסה משופרת'}
                      <span className="px-2 py-0.5 bg-emerald-500/20 rounded-full text-xs">6/6 {lang === 'en' ? 'elements' : 'אלמנטים'}</span>
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => speak(improvedStory.story_content, 'improved', lang)}
                        disabled={ttsLoading && currentId === 'improved'}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          speaking && currentId === 'improved'
                            ? 'bg-emerald-500 text-white'
                            : ttsLoading && currentId === 'improved'
                            ? 'bg-emerald-500/20 text-emerald-400 cursor-wait'
                            : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                        }`}
                      >
                        {ttsLoading && currentId === 'improved' ? <Loader2 className="w-3 h-3 animate-spin" /> : speaking && currentId === 'improved' ? <Pause className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                      </button>
                      <button
                        onClick={() => copyToClipboard(improvedStory.story_content)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-all"
                      >
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                  <p className="text-emerald-100 leading-relaxed whitespace-pre-wrap">{improvedStory.story_content}</p>
                  
                  {/* Setup line & Closing bridge */}
                  {(improvedStory.setup_line || improvedStory.closing_bridge) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                      {improvedStory.setup_line && (
                        <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                          <p className="text-xs text-amber-400 font-medium mb-1">{lang === 'en' ? 'Setup Line:' : 'משפט פתיחה:'}</p>
                          <p className="text-sm text-slate-200">{improvedStory.setup_line}</p>
                        </div>
                      )}
                      {improvedStory.closing_bridge && (
                        <div className="p-3 bg-violet-500/10 rounded-lg border border-violet-500/20">
                          <p className="text-xs text-violet-400 font-medium mb-1">{lang === 'en' ? 'Closing Bridge:' : 'גשר סגירה:'}</p>
                          <p className="text-sm text-slate-200">{improvedStory.closing_bridge}</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Save button */}
                  <button
                    onClick={saveToBank}
                    disabled={saving || saved}
                    className={`w-full mt-4 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                      saved 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg'
                    }`}
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {saving ? (lang === 'en' ? 'Saving...' : 'שומר...') : saved ? (lang === 'en' ? 'Saved to Story Bank!' : 'נשמר בבנק הסיפורים!') : (lang === 'en' ? 'Save to Story Bank' : 'שמור לבנק הסיפורים')}
                  </button>
                </div>
              </div>
            )}

            {/* CTA to improve if no improved story */}
            {!improvedStory && presentCount < 6 && (
              <button
                onClick={() => setActiveTab('improve')}
                className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20 transition-all"
              >
                <Wand2 className="w-5 h-5" />
                {lang === 'en' ? 'Enhance This Story with AI' : 'שפר את הסיפור עם AI'}
              </button>
            )}
          </div>
        )}

        {/* IMPROVE TAB */}
        {activeTab === 'improve' && (
          <div className="space-y-6">
            {/* Emotion Selection */}
            <div>
              <label className="text-sm text-slate-300 font-medium mb-3 flex items-center gap-2">
                <Heart className="w-4 h-4 text-pink-400" />
                {lang === 'en' ? 'What emotions should the story evoke?' : 'אילו רגשות הסיפור צריך לעורר?'}
              </label>
              <div className="flex flex-wrap gap-2">
                {EMOTION_OPTIONS.map(emotion => {
                  const Icon = emotion.icon
                  const isSelected = selectedEmotions.includes(emotion.value)
                  return (
                    <button
                      key={emotion.value}
                      onClick={() => setSelectedEmotions(prev => 
                        prev.includes(emotion.value) ? prev.filter(e => e !== emotion.value) : [...prev, emotion.value]
                      )}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                        isSelected
                          ? `bg-${emotion.color}-500/20 text-${emotion.color}-400 border-${emotion.color}-500/30 shadow-lg`
                          : 'bg-slate-800/50 text-slate-400 border-slate-700/50 hover:border-slate-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {lang === 'en' ? emotion.labelEn : emotion.labelHe}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Objection & Product */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-300 font-medium mb-2 block">
                  {lang === 'en' ? 'Target Objection' : 'נגד התנגדות'}
                </label>
                <select
                  value={selectedObjection}
                  onChange={(e) => setSelectedObjection(e.target.value)}
                  className="w-full p-3.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-violet-500"
                >
                  {OBJECTION_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{lang === 'en' ? opt.labelEn : opt.labelHe}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-300 font-medium mb-2 block">
                  {lang === 'en' ? 'Product' : 'מוצר'}
                </label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full p-3.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-violet-500"
                >
                  {PRODUCT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{lang === 'en' ? opt.labelEn : opt.labelHe}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Custom message */}
            <div>
              <label className="text-sm text-slate-300 font-medium mb-2 block">
                {lang === 'en' ? 'Message to Convey (optional)' : 'מסר להעביר (אופציונלי)'}
              </label>
              <input
                type="text"
                value={targetMessage}
                onChange={(e) => setTargetMessage(e.target.value)}
                placeholder={lang === 'en' ? 'e.g., "Quality pays off in the long run"' : 'לדוגמה: "איכות משתלמת בטווח הארוך"'}
                className="w-full p-3.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-violet-500"
              />
            </div>

            {/* Generate button */}
            <button
              onClick={improveStory}
              disabled={improving}
              className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:from-slate-700 disabled:to-slate-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20 transition-all"
            >
              {improving ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> {lang === 'en' ? 'Creating enhanced version...' : 'יוצר גרסה משופרת...'}</>
              ) : (
                <><Wand2 className="w-5 h-5" /> {lang === 'en' ? 'Generate Improved Story' : 'צור סיפור משופר'}</>
              )}
            </button>
          </div>
        )}

        {/* TEMPLATES TAB */}
        {activeTab === 'templates' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-400 mb-4">
              {lang === 'en' 
                ? 'Use these proven story templates to create compelling sales stories:'
                : 'השתמש בתבניות סיפור מוכחות אלה ליצירת סיפורי מכירות משכנעים:'
              }
            </p>
            
            {Object.entries(STORY_TEMPLATES).map(([key, template]) => (
              <StoryTemplateCard
                key={key}
                template={template}
                templateKey={key}
                lang={lang}
                onUse={(t) => {
                  // Could copy or use template
                  copyToClipboard(t.fullExampleEn || t.templateEn)
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
