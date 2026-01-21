import { useState, useEffect, useRef } from 'react'
import { 
  Users, Mic, Volume2, Clock, Star, Target, Play,
  Pause, RotateCcw, CheckCircle2, AlertTriangle, Brain,
  Lightbulb, Award, Zap, MessageCircle, Eye, Heart,
  TrendingUp, Trophy, Flame, Crown, Shield, Sparkles
} from 'lucide-react'

// Advanced Practice Scenarios with Real-time Feedback
export default function AdvancedScenarios({ 
  scenarios, 
  userLevel, 
  onScenarioComplete, 
  language = 'he' 
}) {
  const [activeScenario, setActiveScenario] = useState(null)
  const [conversationHistory, setConversationHistory] = useState([])
  const [isRecording, setIsRecording] = useState(false)
  const [aiThinking, setAiThinking] = useState(false)
  const [customerMood, setCustomerMood] = useState('neutral')
  const [realtimeFeedback, setRealtimeFeedback] = useState([])
  const [scenarioPhase, setScenarioPhase] = useState('opening') // opening, discovery, presentation, objections, closing
  const [userInput, setUserInput] = useState('')
  const [performanceScore, setPerformanceScore] = useState(0)

  const mediaRecorderRef = useRef(null)
  const audioRef = useRef(null)

  // Advanced scenario types for Israeli home improvement sales
  const advancedScenarios = scenarios || [
    {
      id: 'price_sensitive_buyer',
      nameHe: 'לקוח רגיש למחיר - דשא סינטטי',
      nameEn: 'Price-Sensitive Buyer - Synthetic Turf',
      difficulty: 'medium',
      product: 'synthetic_turf',
      customerProfile: {
        nameHe: 'רון שמש מרמת גן',
        nameEn: 'Ron Shemesh from Ramat Gan',
        personality: 'analytical, cost-conscious',
        background: 'engineer, wants detailed explanations',
        pain_points: ['high water bills', 'lawn maintenance time', 'kids play area'],
        budget_range: '15000-25000',
        decision_maker: 'husband, but wife has strong influence'
      },
      conversation_flow: [
        {
          phase: 'opening',
          customer_opening: 'שלום, הזמנתי אותכם לבדוק אפשרות לדשא סינטטי. אבל אני חייב לומר מראש שזה נראה לי יקר מאוד.',
          customer_mood: 'skeptical',
          success_criteria: ['acknowledge price concern', 'ask discovery questions', 'avoid defensive response']
        }
      ],
      learning_objectives: [
        'Handle price objections early',
        'Build value before revealing price',
        'Use quantification technique',
        'Create urgency through cost of delay'
      ],
      ai_instructions: {
        personality: 'Ron is a detail-oriented engineer who needs logical explanations. He will ask specific questions about durability, ROI, and maintenance. He becomes more interested when shown concrete numbers and comparisons.',
        objection_patterns: ['price', 'quality concerns', 'installation disruption', 'neighborhood approval'],
        buying_signals: ['asks about warranty', 'mentions specific timeline', 'asks about financing']
      }
    },
    {
      id: 'hot_prospect_pavers',
      nameHe: 'לקוח חם - ריצוף חצר',
      nameEn: 'Hot Prospect - Patio Pavers',
      difficulty: 'easy',
      product: 'pavers',
      customerProfile: {
        nameHe: 'דנה ואבי מכפר סבא',
        nameEn: 'Dana & Avi from Kfar Saba',
        personality: 'ready to buy, just needs confidence',
        background: 'young couple, first house',
        pain_points: ['ugly concrete patio', 'want to entertain guests', 'need quick solution'],
        budget_range: '30000-40000',
        decision_maker: 'joint decision, wife leads on design'
      },
      conversation_flow: [
        {
          phase: 'opening',
          customer_opening: 'היי! אנחנו ממש רוצים לשדרג את החצר. ראינו את העבודה שלכם אצל השכנים וזה נראה מדהים!',
          customer_mood: 'excited',
          success_criteria: ['maintain enthusiasm', 'gather requirements', 'present solution confidently']
        }
      ],
      learning_objectives: [
        'Maintain customer excitement',
        'Ask qualifying questions',
        'Present options clearly',
        'Close naturally'
      ]
    },
    {
      id: 'difficult_objector_coollife',
      nameHe: 'לקוח קשה - קול לייף פיינט',
      nameEn: 'Difficult Objector - Cool Life Paint',
      difficulty: 'hard',
      product: 'cool_life',
      customerProfile: {
        nameHe: 'מנחם גולדברג מבני ברק',
        nameEn: 'Menachem Goldberg from Bnei Brak',
        personality: 'highly skeptical, has been burned before',
        background: 'business owner, very experienced negotiator',
        pain_points: ['high electric bills', 'wants cooler house', 'but very suspicious of sales people'],
        budget_range: '20000-35000',
        decision_maker: 'very independent, doesn\'t trust easily'
      },
      conversation_flow: [
        {
          phase: 'opening',
          customer_opening: 'תקשיב, יש לי נסיון רע עם קבלנים. ספרו לי על הצבע הזה אבל בלי ניסיונות מכירה. אני יודע מתי מנסים למכור לי דברים.',
          customer_mood: 'defensive',
          success_criteria: ['build trust', 'avoid sales pitch', 'use social proof', 'be authentic']
        }
      ],
      learning_objectives: [
        'Build trust with skeptical customers',
        'Handle defensive behavior',
        'Use third-party validation',
        'Overcome past bad experiences'
      ]
    }
  ]

  // Customer mood system
  const moodConfig = {
    excited: { 
      color: 'green', 
      labelHe: 'נלהב', 
      labelEn: 'Excited',
      emoji: '😊',
      description: { he: 'הלקוח מעוניין ופתוח', en: 'Customer is interested and open' }
    },
    neutral: { 
      color: 'slate', 
      labelHe: 'ניטרלי', 
      labelEn: 'Neutral',
      emoji: '😐',
      description: { he: 'הלקוח מאזין אבל לא משוכנע', en: 'Customer is listening but not convinced' }
    },
    skeptical: { 
      color: 'amber', 
      labelHe: 'ספקן', 
      labelEn: 'Skeptical',
      emoji: '🤔',
      description: { he: 'הלקוח מפקפק ודורש הוכחות', en: 'Customer doubts and needs proof' }
    },
    defensive: { 
      color: 'red', 
      labelHe: 'הגנתי', 
      labelEn: 'Defensive',
      emoji: '😤',
      description: { he: 'הלקוח חשדן ובמצב הגנתי', en: 'Customer is suspicious and defensive' }
    },
    interested: { 
      color: 'blue', 
      labelHe: 'מעוניין', 
      labelEn: 'Interested',
      emoji: '🤓',
      description: { he: 'הלקוח מתחיל להתעניין', en: 'Customer is starting to get interested' }
    },
    ready: { 
      color: 'emerald', 
      labelHe: 'מוכן לקנות', 
      labelEn: 'Ready to Buy',
      emoji: '💚',
      description: { he: 'הלקוח כמעט מוכן להחליט', en: 'Customer almost ready to decide' }
    }
  }

  // Real-time feedback system
  const provideFeedback = (userMessage, context) => {
    const feedback = []
    
    // Check for common mistakes
    if (userMessage.includes('מחיר') || userMessage.includes('price') && context.phase === 'opening') {
      feedback.push({
        type: 'warning',
        messageHe: 'זהירות: חשפת מחיר מוקדמדי',
        messageEn: 'Warning: Revealed price too early',
        impact: 'medium'
      })
    }
    
    if (userMessage.includes('?') && context.phase === 'opening') {
      feedback.push({
        type: 'positive',
        messageHe: 'מעולה: שאלת שאלה לגילוי',
        messageEn: 'Great: Asked discovery question',
        impact: 'positive'
      })
    }
    
    return feedback
  }

  // Conversation simulation
  const handleUserMessage = async (message) => {
    const newMessage = {
      role: 'seller',
      content: message,
      timestamp: new Date(),
      phase: scenarioPhase
    }
    
    setConversationHistory(prev => [...prev, newMessage])
    
    // Provide real-time feedback
    const feedback = provideFeedback(message, { phase: scenarioPhase })
    setRealtimeFeedback(feedback)
    
    // Simulate AI customer response
    setAiThinking(true)
    
    // Simulate API call delay
    setTimeout(() => {
      const customerResponse = generateCustomerResponse(message, activeScenario, scenarioPhase)
      
      setConversationHistory(prev => [...prev, {
        role: 'customer',
        content: customerResponse.message,
        timestamp: new Date(),
        mood: customerResponse.mood,
        phase: scenarioPhase
      }])
      
      setCustomerMood(customerResponse.mood)
      setAiThinking(false)
      
      // Update performance score
      setPerformanceScore(prev => prev + customerResponse.scoreImpact)
    }, 2000)
    
    setUserInput('')
  }

  // AI Customer Response Generator
  const generateCustomerResponse = (userMessage, scenario, phase) => {
    // This would be replaced with actual AI API call
    const responses = {
      opening: {
        good: [
          { he: 'זה נשמע מעניין. ספר לי עוד על זה.', en: 'That sounds interesting. Tell me more.' },
          { he: 'אוקיי, אני מקשיב.', en: 'Okay, I\'m listening.' }
        ],
        bad: [
          { he: 'רגע, אתה מנסה למכור לי משהו?', en: 'Wait, are you trying to sell me something?' },
          { he: 'זה לא מה שרציתי לשמוע.', en: 'That\'s not what I wanted to hear.' }
        ]
      }
    }
    
    // Simple sentiment analysis simulation
    const isGoodResponse = userMessage.includes('?') || userMessage.length > 30
    const responseSet = isGoodResponse ? responses[phase]?.good : responses[phase]?.bad
    
    if (responseSet) {
      const response = responseSet[Math.floor(Math.random() * responseSet.length)]
      return {
        message: language === 'he' ? response.he : response.en,
        mood: isGoodResponse ? 'interested' : 'skeptical',
        scoreImpact: isGoodResponse ? 10 : -5
      }
    }
    
    return {
      message: 'ממ... בסדר.',
      mood: 'neutral',
      scoreImpact: 0
    }
  }

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        // Handle audio data
      }
      
      mediaRecorderRef.current.onstop = () => {
        // Process recording
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorderRef.current.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error accessing microphone:', error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  // Scenario selection view
  const ScenarioSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">
          {language === 'he' ? 'בחר תרחיש מתקדם' : 'Choose Advanced Scenario'}
        </h2>
        <p className="text-slate-400">
          {language === 'he' ? 'תרחישים אמיתיים ממכירות Cool Life Paint, דשא סינטטי וריצוף' : 'Real scenarios from Cool Life Paint, synthetic turf and pavers sales'}
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {advancedScenarios.map((scenario) => (
          <div
            key={scenario.id}
            onClick={() => setActiveScenario(scenario)}
            className="p-6 bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl border border-slate-700/50 hover:border-violet-500/30 cursor-pointer transition-all group"
          >
            {/* Difficulty indicator */}
            <div className="flex items-center justify-between mb-4">
              <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                scenario.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                scenario.difficulty === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {language === 'he' ? 
                  (scenario.difficulty === 'easy' ? 'קל' : scenario.difficulty === 'medium' ? 'בינוני' : 'קשה') :
                  scenario.difficulty.charAt(0).toUpperCase() + scenario.difficulty.slice(1)
                }
              </span>
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${
                    i < (scenario.difficulty === 'easy' ? 1 : scenario.difficulty === 'medium' ? 2 : 3) 
                      ? 'text-amber-400 fill-current' 
                      : 'text-slate-600'
                  }`} />
                ))}
              </div>
            </div>

            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-violet-300 transition-colors">
              {language === 'he' ? scenario.nameHe : scenario.nameEn}
            </h3>
            
            <div className="space-y-2 text-sm text-slate-400 mb-4">
              <p>
                <span className="font-medium">{language === 'he' ? 'לקוח:' : 'Customer:'}</span> {language === 'he' ? scenario.customerProfile.nameHe : scenario.customerProfile.nameEn}
              </p>
              <p>
                <span className="font-medium">{language === 'he' ? 'מוצר:' : 'Product:'}</span> {scenario.product}
              </p>
              <p>
                <span className="font-medium">{language === 'he' ? 'אישיות:' : 'Personality:'}</span> {scenario.customerProfile.personality}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Target className="w-3 h-3" />
                <span>{scenario.learning_objectives.length} {language === 'he' ? 'יעדי למידה' : 'learning objectives'}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-violet-400">
                <Award className="w-3 h-3" />
                <span>+{scenario.difficulty === 'easy' ? '100' : scenario.difficulty === 'medium' ? '200' : '300'} XP</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  // Active scenario view
  const ActiveScenario = () => (
    <div className="space-y-6">
      {/* Scenario Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">
            {language === 'he' ? activeScenario.nameHe : activeScenario.nameEn}
          </h2>
          <p className="text-sm text-slate-400">
            {language === 'he' ? activeScenario.customerProfile.nameHe : activeScenario.customerProfile.nameEn}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Customer mood indicator */}
          <div className={`flex items-center gap-2 px-3 py-1 rounded-lg bg-${moodConfig[customerMood].color}-500/20`}>
            <span className="text-lg">{moodConfig[customerMood].emoji}</span>
            <span className={`text-sm font-medium text-${moodConfig[customerMood].color}-400`}>
              {language === 'he' ? moodConfig[customerMood].labelHe : moodConfig[customerMood].labelEn}
            </span>
          </div>
          {/* Performance score */}
          <div className="text-right">
            <p className="text-2xl font-bold text-white">{performanceScore}</p>
            <p className="text-xs text-slate-400">{language === 'he' ? 'ציון' : 'Score'}</p>
          </div>
        </div>
      </div>

      {/* Conversation Area */}
      <div className="h-96 bg-slate-900/50 rounded-xl border border-slate-700/30 overflow-hidden flex flex-col">
        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {conversationHistory.map((message, index) => (
            <div key={index} className={`flex gap-3 ${message.role === 'seller' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.role === 'customer' 
                  ? 'bg-emerald-500' 
                  : 'bg-violet-500'
              }`}>
                <span className="text-white text-sm font-bold">
                  {message.role === 'customer' ? 'ל' : 'א'}
                </span>
              </div>
              <div className={`max-w-[70%] ${message.role === 'seller' ? 'text-right' : ''}`}>
                <div className={`p-3 rounded-xl ${
                  message.role === 'customer'
                    ? 'bg-emerald-500/10 border border-emerald-500/20 rounded-tl-none'
                    : 'bg-violet-500/10 border border-violet-500/20 rounded-tr-none'
                }`}>
                  <p className="text-slate-200">{message.content}</p>
                </div>
                {message.role === 'customer' && message.mood && (
                  <div className="mt-1 text-xs text-slate-500 flex items-center gap-1">
                    <span>{moodConfig[message.mood].emoji}</span>
                    <span>{language === 'he' ? moodConfig[message.mood].labelHe : moodConfig[message.mood].labelEn}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {aiThinking && (
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">ל</span>
              </div>
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl rounded-tl-none">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                  </div>
                  <span className="text-emerald-400 text-sm">
                    {language === 'he' ? 'הלקוח חושב...' : 'Customer is thinking...'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Real-time feedback */}
        {realtimeFeedback.length > 0 && (
          <div className="border-t border-slate-700/50 p-3 bg-slate-800/50">
            <div className="space-y-1">
              {realtimeFeedback.map((feedback, index) => (
                <div key={index} className={`text-xs flex items-center gap-2 ${
                  feedback.type === 'positive' ? 'text-emerald-400' :
                  feedback.type === 'warning' ? 'text-amber-400' :
                  'text-red-400'
                }`}>
                  {feedback.type === 'positive' ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                  <span>{language === 'he' ? feedback.messageHe : feedback.messageEn}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-slate-700/50 p-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && userInput.trim() && handleUserMessage(userInput)}
              placeholder={language === 'he' ? 'הקלד את התגובה שלך...' : 'Type your response...'}
              className="flex-1 px-4 py-2 bg-slate-800 border border-slate-600 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500"
              dir={language === 'he' ? 'rtl' : 'ltr'}
            />
            <button
              onClick={() => isRecording ? stopRecording() : startRecording()}
              className={`p-2 rounded-xl transition-all ${
                isRecording 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <Mic className="w-5 h-5" />
            </button>
            <button
              onClick={() => userInput.trim() && handleUserMessage(userInput)}
              disabled={!userInput.trim()}
              className="px-4 py-2 bg-violet-500 text-white rounded-xl font-medium hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {language === 'he' ? 'שלח' : 'Send'}
            </button>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-between">
        <button
          onClick={() => {
            setActiveScenario(null)
            setConversationHistory([])
            setPerformanceScore(0)
            setCustomerMood('neutral')
          }}
          className="px-4 py-2 bg-slate-700/50 text-slate-300 rounded-xl hover:bg-slate-600/50 transition-colors"
        >
          {language === 'he' ? 'חזור לבחירה' : 'Back to Selection'}
        </button>
        
        <div className="flex gap-3">
          <button
            onClick={() => {
              setConversationHistory([])
              setPerformanceScore(0)
              setCustomerMood('neutral')
              setScenarioPhase('opening')
            }}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 text-amber-300 rounded-xl hover:bg-amber-500/30 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            {language === 'he' ? 'התחל מחדש' : 'Reset'}
          </button>
          
          <button
            onClick={() => onScenarioComplete?.(activeScenario, performanceScore, conversationHistory)}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-green-600 transition-all"
          >
            <Trophy className="w-4 h-4" />
            {language === 'he' ? 'סיים תרחיש' : 'Complete Scenario'}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-700/50 overflow-hidden" dir={language === 'he' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="p-6 border-b border-slate-700/50 bg-gradient-to-r from-emerald-500/10 to-blue-500/10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              {language === 'he' ? 'תרחישי תרגול מתקדמים' : 'Advanced Practice Scenarios'}
            </h2>
            <p className="text-sm text-slate-400">
              {language === 'he' ? 'תרחישים אמיתיים עם בינה מלאכותית מותאמת אישית' : 'Real scenarios with personalized AI feedback'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {!activeScenario ? <ScenarioSelection /> : <ActiveScenario />}
      </div>
    </div>
  )
}