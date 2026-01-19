import { useState, useRef, useEffect } from 'react'
import { 
  Users, ChevronDown, ChevronUp, Target, Zap, MessageCircle,
  Volume2, Play, Mic, Clock, Star, Sparkles, ArrowRight, Send,
  Square, Loader2, RotateCcw, Trophy, CheckCircle2, X, Pause,
  Brain, ThumbsUp, ThumbsDown, Award, Lightbulb, Wand2, PlayCircle,
  StopCircle, BookOpen, GraduationCap, AlertCircle, Check, SpellCheck
} from 'lucide-react'
import axios from 'axios'
import { API_URL } from '../../../lib/config'
import { PRACTICE_TRANSLATIONS } from './PracticeTranslations'

export default function InteractiveRoleplay({ scenario, lang = 'en', TTSButton, onComplete }) {
  const pt = PRACTICE_TRANSLATIONS[lang] || PRACTICE_TRANSLATIONS.en
  
  // Conversation state
  const [conversationMode, setConversationMode] = useState('preview') // preview, active, completed, ai_demo
  const [messages, setMessages] = useState([])
  const [userInput, setUserInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [score, setScore] = useState(null)
  const [turnCount, setTurnCount] = useState(0)
  const [showTips, setShowTips] = useState(false)
  
  // Grammar correction state
  const [grammarCorrection, setGrammarCorrection] = useState(null)
  const [showGrammarPopup, setShowGrammarPopup] = useState(false)
  const [isCorrectingGrammar, setIsCorrectingGrammar] = useState(false)
  
  // AI Demo conversation state
  const [aiConversation, setAiConversation] = useState(null)
  const [generatingDemo, setGeneratingDemo] = useState(false)
  const [playingAudio, setPlayingAudio] = useState(false)
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState(-1)
  const [autoPlayMode, setAutoPlayMode] = useState(false)
  const speechSynthRef = useRef(null)
  
  // Audio recording
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const messagesEndRef = useRef(null)
  const audioRef = useRef(null)
  
  // Estimate difficulty
  const difficulty = scenario.techniques_to_use?.length > 2 ? 'hard' : scenario.techniques_to_use?.length > 1 ? 'medium' : 'easy'
  const diffConfig = {
    easy: { labelEn: 'Beginner', labelHe: 'מתחיל', color: 'emerald', stars: 1, maxTurns: 4 },
    medium: { labelEn: 'Intermediate', labelHe: 'בינוני', color: 'amber', stars: 2, maxTurns: 6 },
    hard: { labelEn: 'Advanced', labelHe: 'מתקדם', color: 'red', stars: 3, maxTurns: 8 }
  }[difficulty]
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  // Start the roleplay
  const startRoleplay = () => {
    setConversationMode('active')
    setMessages([{
      role: 'customer',
      text: scenario.customer_opening,
      timestamp: new Date()
    }])
    setTurnCount(0)
    setFeedback(null)
    setScore(null)
  }
  
  // Send message to AI customer
  const sendMessage = async (text) => {
    if (!text.trim() || isLoading) return
    
    const userMessage = {
      role: 'agent',
      text: text.trim(),
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setUserInput('')
    setIsLoading(true)
    setTurnCount(prev => prev + 1)
    
    try {
      const response = await axios.post(`${API_URL}/api/roleplay/respond`, {
        scenario: {
          name: scenario.scenario_name,
          context: scenario.context,
          goal: scenario.goal,
          customer_personality: scenario.customer_personality || 'skeptical but interested',
          objection_type: scenario.objection_type || 'general'
        },
        conversation: [...messages, userMessage].map(m => ({
          role: m.role,
          text: m.text
        })),
        techniques_to_use: scenario.techniques_to_use,
        turn_count: turnCount + 1,
        max_turns: diffConfig.maxTurns,
        language: lang
      })
      
      if (response.data.customer_response) {
        setMessages(prev => [...prev, {
          role: 'customer',
          text: response.data.customer_response,
          emotion: response.data.customer_emotion,
          timestamp: new Date()
        }])
      }
      
      // Check if conversation should end
      if (response.data.should_end || turnCount + 1 >= diffConfig.maxTurns) {
        await getFinalFeedback([...messages, userMessage, {
          role: 'customer',
          text: response.data.customer_response
        }])
      }
      
      // Show inline feedback if available
      if (response.data.inline_feedback) {
        setFeedback(response.data.inline_feedback)
      }
      
    } catch (error) {
      console.error('Error getting AI response:', error)
      // Fallback response
      setMessages(prev => [...prev, {
        role: 'customer',
        text: lang === 'en' 
          ? "I understand, but I'm still not sure. Can you tell me more about the benefits?"
          : "אני מבין, אבל אני עדיין לא בטוח. אתה יכול לספר לי יותר על היתרונות?",
        emotion: 'skeptical',
        timestamp: new Date()
      }])
    } finally {
      setIsLoading(false)
    }
  }
  
  // Get final feedback
  const getFinalFeedback = async (finalMessages) => {
    setIsLoading(true)
    try {
      const response = await axios.post(`${API_URL}/api/roleplay/feedback`, {
        scenario: {
          name: scenario.scenario_name,
          context: scenario.context,
          goal: scenario.goal
        },
        conversation: finalMessages.map(m => ({
          role: m.role,
          text: m.text
        })),
        techniques_to_use: scenario.techniques_to_use,
        language: lang
      })
      
      setConversationMode('completed')
      setScore(response.data.score || 75)
      setFeedback(response.data.feedback)
      
      if (onComplete) {
        onComplete(response.data)
      }
    } catch (error) {
      console.error('Error getting feedback:', error)
      setConversationMode('completed')
      setScore(70)
      setFeedback({
        strengths: [lang === 'en' ? 'Good effort!' : 'מאמץ טוב!'],
        improvements: [lang === 'en' ? 'Keep practicing' : 'המשך להתאמן'],
        overall: lang === 'en' ? 'Nice practice session!' : 'תרגול נחמד!'
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Voice recording
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
        await transcribeAndSend(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorderRef.current.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error starting recording:', error)
    }
  }
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }
  
  const transcribeAndSend = async (audioBlob) => {
    setIsLoading(true)
    setIsCorrectingGrammar(true)
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')
      
      // First transcribe
      const transcribeResponse = await axios.post(`${API_URL}/api/transcribe-quick`, formData)
      
      if (transcribeResponse.data.text) {
        const originalText = transcribeResponse.data.text
        
        // Get grammar correction
        try {
          const grammarResponse = await axios.post(`${API_URL}/api/grammar/correct`, {
            text: originalText,
            language: lang
          })
          
          if (grammarResponse.data.has_errors) {
            // Show grammar correction popup
            setGrammarCorrection({
              original: originalText,
              corrected: grammarResponse.data.corrected,
              corrections: grammarResponse.data.corrections || []
            })
            setShowGrammarPopup(true)
            
            // Play corrected audio using TTS
            playGrammarCorrectionAudio(grammarResponse.data.corrected)
          }
          
          setIsCorrectingGrammar(false)
          // Send the original text to continue conversation
          await sendMessage(originalText)
          
        } catch (grammarError) {
          console.error('Grammar check failed:', grammarError)
          setIsCorrectingGrammar(false)
          await sendMessage(originalText)
        }
      }
    } catch (error) {
      console.error('Error transcribing:', error)
      setIsCorrectingGrammar(false)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Play grammar correction audio using OpenAI TTS
  const playGrammarCorrectionAudio = async (text) => {
    try {
      const response = await axios.post(`${API_URL}/api/tts`, {
        text: text,
        voice: 'nova',
        hd: true,
        speed: 0.9
      })
      
      if (response.data.audio_url) {
        const audioUrl = `${API_URL}${response.data.audio_url}`
        if (audioRef.current) {
          audioRef.current.pause()
        }
        audioRef.current = new Audio(audioUrl)
        audioRef.current.play()
      }
    } catch (error) {
      console.error('TTS error:', error)
      // Fallback to browser TTS
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'
      utterance.rate = 0.9
      window.speechSynthesis.speak(utterance)
    }
  }
  
  // Reset roleplay
  const resetRoleplay = () => {
    setConversationMode('preview')
    setMessages([])
    setUserInput('')
    setFeedback(null)
    setScore(null)
    setGrammarCorrection(null)
    setShowGrammarPopup(false)
    setTurnCount(0)
    setAiConversation(null)
    setCurrentPlayingIndex(-1)
    setAutoPlayMode(false)
    stopAudio()
  }
  
  // Generate full AI conversation demo
  const generateAIDemo = async () => {
    setGeneratingDemo(true)
    try {
      const response = await axios.post(`${API_URL}/api/roleplay/generate-full-conversation`, {
        scenario: {
          name: scenario.scenario_name,
          context: scenario.context,
          customer_opening: scenario.customer_opening,
          objection_type: scenario.objection_type || 'general'
        },
        techniques_to_use: scenario.techniques_to_use,
        language: lang,
        max_turns: 10
      })
      
      if (response.data.conversation) {
        setAiConversation(response.data)
        setConversationMode('ai_demo')
      }
    } catch (error) {
      console.error('Error generating AI demo:', error)
      alert(lang === 'en' ? 'Error generating demo conversation' : 'שגיאה ביצירת שיחה לדוגמה')
    } finally {
      setGeneratingDemo(false)
    }
  }
  
  // Text-to-Speech functions
  const speakText = (text, index, voiceType = 'customer') => {
    stopAudio()
    
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang === 'he' ? 'he-IL' : 'en-US'
    utterance.rate = 0.9
    
    // Different pitch for customer vs sales rep
    utterance.pitch = voiceType === 'customer' ? 1.1 : 0.9
    
    const voices = window.speechSynthesis.getVoices()
    const targetVoice = voices.find(v => v.lang.includes(lang === 'he' ? 'he' : 'en-US'))
    if (targetVoice) utterance.voice = targetVoice
    
    utterance.onstart = () => {
      setPlayingAudio(true)
      setCurrentPlayingIndex(index)
    }
    
    utterance.onend = () => {
      setPlayingAudio(false)
      setCurrentPlayingIndex(-1)
      
      // Auto-play next message if in autoplay mode
      if (autoPlayMode && aiConversation?.conversation) {
        const nextIndex = index + 1
        if (nextIndex < aiConversation.conversation.length) {
          setTimeout(() => {
            const nextMsg = aiConversation.conversation[nextIndex]
            speakText(nextMsg.text, nextIndex, nextMsg.role)
          }, 800) // Small pause between messages
        } else {
          setAutoPlayMode(false)
        }
      }
    }
    
    utterance.onerror = () => {
      setPlayingAudio(false)
      setCurrentPlayingIndex(-1)
      setAutoPlayMode(false)
    }
    
    speechSynthRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }
  
  const stopAudio = () => {
    window.speechSynthesis.cancel()
    setPlayingAudio(false)
    setCurrentPlayingIndex(-1)
    setAutoPlayMode(false)
  }
  
  const playAllAudio = () => {
    if (!aiConversation?.conversation?.length) return
    setAutoPlayMode(true)
    speakText(aiConversation.conversation[0].text, 0, aiConversation.conversation[0].role)
  }
  
  // Get emotion color
  const getEmotionColor = (emotion) => {
    const colors = {
      interested: 'text-emerald-400',
      skeptical: 'text-amber-400',
      resistant: 'text-red-400',
      convinced: 'text-green-400',
      neutral: 'text-slate-400'
    }
    return colors[emotion] || 'text-slate-400'
  }
  
  return (
    <div className="bg-gradient-to-br from-pink-500/5 via-rose-500/5 to-violet-500/5 rounded-2xl border border-pink-500/20 overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-pink-500/10 bg-gradient-to-r from-pink-500/10 to-violet-500/10">
        <div className="flex items-start gap-4">
          <div className="relative">
            <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/30">
              <Users className="w-7 h-7 text-white" />
            </div>
            {conversationMode === 'active' && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse" />
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-xs font-medium bg-${diffConfig.color}-500/20 text-${diffConfig.color}-400`}>
                {[...Array(3)].map((_, i) => (
                  <Star key={i} className={`w-3 h-3 ${i < diffConfig.stars ? 'fill-current' : 'opacity-30'}`} />
                ))}
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Clock className="w-3 h-3" />
                {diffConfig.maxTurns} {lang === 'en' ? 'turns' : 'תורות'}
              </span>
              {conversationMode === 'active' && (
                <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/20 px-2 py-0.5 rounded-lg">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  {lang === 'en' ? 'Live' : 'פעיל'}
                </span>
              )}
            </div>
            
            <h3 className="text-lg font-bold text-slate-100 mb-1">{scenario.scenario_name}</h3>
            <p className="text-sm text-slate-400">{scenario.context}</p>
          </div>
        </div>
      </div>
      
      {/* Preview Mode */}
      {conversationMode === 'preview' && (
        <div className="p-5 space-y-4">
          {/* Customer Opening Preview */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <div className="flex-1">
              <p className="text-xs text-emerald-400 font-medium mb-2">{pt.customerSays}</p>
              <div className="p-4 bg-emerald-500/10 rounded-2xl rounded-tl-none border border-emerald-500/20">
                <p className="text-slate-200 font-medium">"{scenario.customer_opening}"</p>
                {TTSButton && (
                  <div className="mt-3 flex justify-end">
                    <TTSButton text={scenario.customer_opening} />
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Goal & Techniques */}
          <div className="grid md:grid-cols-2 gap-3">
            <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-amber-400" />
                <p className="text-xs text-amber-400 font-medium">{pt.yourGoal}</p>
              </div>
              <p className="text-slate-300 text-sm">{scenario.goal}</p>
            </div>
            
            {scenario.techniques_to_use?.length > 0 && (
              <div className="p-4 bg-violet-500/10 rounded-xl border border-violet-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-violet-400" />
                  <p className="text-xs text-violet-400 font-medium">{pt.techniquesToUse}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {scenario.techniques_to_use.map((tech, i) => (
                    <span key={i} className="px-2 py-0.5 bg-violet-500/20 text-violet-300 text-xs rounded-lg">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Tips Toggle */}
          <button
            onClick={() => setShowTips(!showTips)}
            className="w-full p-3 bg-slate-800/50 rounded-xl text-sm text-slate-300 hover:bg-slate-700/50 transition-colors flex items-center justify-center gap-2"
          >
            <Lightbulb className="w-4 h-4 text-amber-400" />
            {showTips ? (lang === 'en' ? 'Hide Tips' : 'הסתר טיפים') : (lang === 'en' ? 'Show Tips' : 'הצג טיפים')}
            {showTips ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {showTips && (
            <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/30 space-y-3">
              <p className="text-sm text-slate-300">
                {lang === 'en' 
                  ? '• Listen carefully to the customer\'s concerns'
                  : '• הקשב בתשומת לב לחששות הלקוח'
                }
              </p>
              <p className="text-sm text-slate-300">
                {lang === 'en'
                  ? '• Use the recommended techniques naturally'
                  : '• השתמש בטכניקות המומלצות בצורה טבעית'
                }
              </p>
              <p className="text-sm text-slate-300">
                {lang === 'en'
                  ? '• Build rapport before addressing objections'
                  : '• בנה קשר לפני התמודדות עם התנגדויות'
                }
              </p>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={startRoleplay}
              className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-lg shadow-pink-500/30 hover:shadow-xl hover:shadow-pink-500/40"
            >
              <Play className="w-6 h-6" />
              {lang === 'en' ? 'Start Interactive Practice' : 'התחל תרגול אינטראקטיבי'}
            </button>
            
            {/* AI Demo Button */}
            <button
              onClick={generateAIDemo}
              disabled={generatingDemo}
              className="w-full py-4 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-lg shadow-violet-500/30"
            >
              {generatingDemo ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  {lang === 'en' ? 'Generating Demo...' : 'יוצר דמו...'}
                </>
              ) : (
                <>
                  <Wand2 className="w-6 h-6" />
                  {lang === 'en' ? 'Watch AI Demo Conversation' : 'צפה בשיחה לדוגמה'}
                </>
              )}
            </button>
            <p className="text-xs text-slate-500 text-center">
              {lang === 'en' 
                ? 'See how a pro handles this objection with perfect technique'
                : 'צפה איך מקצוען מטפל בהתנגדות הזו עם טכניקה מושלמת'
              }
            </p>
          </div>
        </div>
      )}
      
      {/* Active Conversation Mode */}
      {conversationMode === 'active' && (
        <div className="flex flex-col" style={{ minHeight: '400px' }}>
          {/* Progress bar */}
          <div className="px-5 py-2 border-b border-pink-500/10 bg-slate-800/30">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>{lang === 'en' ? 'Progress' : 'התקדמות'}</span>
              <span>{turnCount}/{diffConfig.maxTurns} {lang === 'en' ? 'turns' : 'תורות'}</span>
            </div>
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full transition-all duration-300"
                style={{ width: `${(turnCount / diffConfig.maxTurns) * 100}%` }}
              />
            </div>
          </div>
          
          {/* Messages */}
          <div className="flex-1 p-5 space-y-4 overflow-y-auto max-h-[350px]">
            {messages.map((msg, i) => (
              <div 
                key={i}
                className={`flex gap-3 ${msg.role === 'agent' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'customer'
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-500'
                    : 'bg-gradient-to-br from-violet-500 to-pink-500'
                }`}>
                  <span className="text-white text-sm font-bold">
                    {msg.role === 'customer' ? 'C' : 'Y'}
                  </span>
                </div>
                
                <div className={`max-w-[75%] ${msg.role === 'agent' ? 'text-right' : ''}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <p className={`text-xs font-medium ${
                      msg.role === 'customer' ? 'text-emerald-400' : 'text-violet-400'
                    }`}>
                      {msg.role === 'customer' ? pt.customer : pt.you}
                    </p>
                    {msg.emotion && (
                      <span className={`text-xs ${getEmotionColor(msg.emotion)}`}>
                        ({msg.emotion})
                      </span>
                    )}
                  </div>
                  <div className={`p-4 rounded-2xl ${
                    msg.role === 'customer'
                      ? 'bg-emerald-500/10 border border-emerald-500/20 rounded-tl-none'
                      : 'bg-violet-500/10 border border-violet-500/20 rounded-tr-none'
                  }`}>
                    <p className="text-slate-200">{msg.text}</p>
                  </div>
                  {TTSButton && msg.role === 'customer' && (
                    <div className="mt-2">
                      <TTSButton text={msg.text} size="sm" />
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">C</span>
                </div>
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl rounded-tl-none">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                    <span className="text-emerald-400 text-sm">
                      {lang === 'en' ? 'Customer is typing...' : 'הלקוח מקליד...'}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Inline feedback */}
          {feedback && typeof feedback === 'string' && (
            <div className="mx-5 mb-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-300">{feedback}</p>
              </div>
            </div>
          )}
          
          {/* Grammar Correction Popup */}
          {showGrammarPopup && grammarCorrection && (
            <div className="mx-5 mb-3 p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl animate-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <SpellCheck className="w-5 h-5 text-blue-400" />
                  <span className="text-sm font-semibold text-blue-300">
                    {lang === 'en' ? 'Grammar Correction' : 'תיקון דקדוק'}
                  </span>
                </div>
                <button
                  onClick={() => setShowGrammarPopup(false)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              
              {/* Original vs Corrected */}
              <div className="space-y-3">
                {/* What you said */}
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-xs text-red-400 mb-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {lang === 'en' ? 'What you said:' : 'מה שאמרת:'}
                  </p>
                  <p className="text-slate-300 text-sm">{grammarCorrection.original}</p>
                </div>
                
                {/* Corrected version */}
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <p className="text-xs text-emerald-400 mb-1 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    {lang === 'en' ? 'Correct way to say it:' : 'הדרך הנכונה:'}
                  </p>
                  <p className="text-slate-200 text-sm font-medium">{grammarCorrection.corrected}</p>
                  
                  {/* Listen button */}
                  <button
                    onClick={() => playGrammarCorrectionAudio(grammarCorrection.corrected)}
                    className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 text-emerald-300 rounded-lg text-xs font-medium hover:bg-emerald-500/30 transition-colors"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    {lang === 'en' ? 'Listen Again' : 'האזן שוב'}
                  </button>
                </div>
                
                {/* Corrections details */}
                {grammarCorrection.corrections?.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-700/50">
                    <p className="text-xs text-slate-500">{lang === 'en' ? 'Corrections:' : 'תיקונים:'}</p>
                    {grammarCorrection.corrections.map((c, i) => (
                      <div key={i} className="text-xs">
                        <span className="text-red-400 line-through">{c.original_phrase}</span>
                        <span className="text-slate-500 mx-2">→</span>
                        <span className="text-emerald-400">{c.corrected_phrase}</span>
                        {c.explanation && (
                          <p className="text-slate-500 mt-0.5 italic">{c.explanation}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Grammar checking indicator */}
          {isCorrectingGrammar && (
            <div className="mx-5 mb-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
              <span className="text-sm text-blue-300">
                {lang === 'en' ? 'Checking grammar...' : 'בודק דקדוק...'}
              </span>
            </div>
          )}
          
          {/* Input Area */}
          <div className="p-4 border-t border-pink-500/10 bg-slate-800/50">
            <div className="flex gap-3">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage(userInput)}
                placeholder={lang === 'en' ? 'Type your response...' : 'הקלד את תשובתך...'}
                className="flex-1 px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-colors"
                disabled={isLoading}
              />
              
              <button
                onClick={() => isRecording ? stopRecording() : startRecording()}
                className={`p-3 rounded-xl transition-all ${
                  isRecording
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
                disabled={isLoading}
              >
                {isRecording ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              
              <button
                onClick={() => sendMessage(userInput)}
                disabled={!userInput.trim() || isLoading}
                className="px-5 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-medium hover:from-pink-600 hover:to-rose-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            
            {/* End early button */}
            <button
              onClick={() => getFinalFeedback(messages)}
              className="w-full mt-3 py-2 text-sm text-slate-400 hover:text-slate-300 transition-colors"
            >
              {lang === 'en' ? 'End practice and get feedback' : 'סיים תרגול וקבל משוב'}
            </button>
          </div>
        </div>
      )}
      
      {/* AI Demo Mode */}
      {conversationMode === 'ai_demo' && aiConversation && (
        <div className="flex flex-col">
          {/* Header with controls */}
          <div className="px-5 py-3 border-b border-violet-500/20 bg-gradient-to-r from-violet-500/10 to-purple-500/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-violet-400" />
                <span className="text-sm font-semibold text-violet-300">
                  {lang === 'en' ? 'AI Training Demo' : 'דמו אימון AI'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {autoPlayMode ? (
                  <button
                    onClick={stopAudio}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-colors"
                  >
                    <StopCircle className="w-4 h-4" />
                    {lang === 'en' ? 'Stop' : 'עצור'}
                  </button>
                ) : (
                  <button
                    onClick={playAllAudio}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-500/20 text-violet-400 rounded-lg text-sm font-medium hover:bg-violet-500/30 transition-colors"
                  >
                    <PlayCircle className="w-4 h-4" />
                    {lang === 'en' ? 'Play All' : 'נגן הכל'}
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Conversation Messages */}
          <div className="flex-1 p-5 space-y-4 overflow-y-auto max-h-[450px]">
            {aiConversation.conversation.map((msg, i) => (
              <div 
                key={i}
                className={`flex gap-3 ${msg.role === 'sales_rep' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'customer'
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-500'
                    : 'bg-gradient-to-br from-violet-500 to-pink-500'
                }`}>
                  <span className="text-white text-sm font-bold">
                    {msg.role === 'customer' ? 'C' : 'S'}
                  </span>
                </div>
                
                <div className={`max-w-[80%] ${msg.role === 'sales_rep' ? 'text-right' : ''}`}>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className={`text-xs font-medium ${
                      msg.role === 'customer' ? 'text-emerald-400' : 'text-violet-400'
                    }`}>
                      {msg.role === 'customer' 
                        ? (lang === 'en' ? 'Customer' : 'לקוח')
                        : (lang === 'en' ? 'Sales Rep' : 'איש מכירות')
                      }
                    </p>
                    {msg.emotion && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getEmotionColor(msg.emotion)} bg-slate-800/50`}>
                        {msg.emotion}
                      </span>
                    )}
                    {msg.technique_used && (
                      <span className="text-xs px-2 py-0.5 rounded-full text-amber-400 bg-amber-500/20">
                        {msg.technique_used}
                      </span>
                    )}
                  </div>
                  
                  <div className={`p-4 rounded-2xl ${
                    msg.role === 'customer'
                      ? 'bg-emerald-500/10 border border-emerald-500/20 rounded-tl-none'
                      : 'bg-violet-500/10 border border-violet-500/20 rounded-tr-none'
                  } ${currentPlayingIndex === i ? 'ring-2 ring-violet-500' : ''}`}>
                    <p className="text-slate-200">{msg.text}</p>
                  </div>
                  
                  {/* Audio & Coaching Note */}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => speakText(msg.text, i, msg.role)}
                      disabled={playingAudio && currentPlayingIndex !== i}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all ${
                        currentPlayingIndex === i
                          ? 'bg-violet-500 text-white'
                          : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {currentPlayingIndex === i ? <Pause className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                      {lang === 'en' ? 'Listen' : 'האזן'}
                    </button>
                    
                    {msg.coaching_note && (
                      <div className="flex items-center gap-1 text-xs text-amber-400/70">
                        <Lightbulb className="w-3 h-3" />
                        <span>{msg.coaching_note}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Learning Points */}
          {aiConversation.key_learning_points?.length > 0 && (
            <div className="p-4 border-t border-violet-500/20 bg-slate-800/30">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-semibold text-amber-400">
                  {lang === 'en' ? 'Key Takeaways' : 'נקודות מפתח'}
                </span>
              </div>
              <div className="space-y-2">
                {aiConversation.key_learning_points.map((point, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
              
              {/* Techniques demonstrated */}
              {aiConversation.techniques_demonstrated?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {aiConversation.techniques_demonstrated.map((tech, i) => (
                    <span key={i} className="px-3 py-1 bg-violet-500/20 text-violet-300 rounded-full text-xs">
                      ✓ {tech}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="p-4 border-t border-violet-500/20 flex gap-3">
            <button
              onClick={resetRoleplay}
              className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <ArrowRight className="w-5 h-5" />
              {lang === 'en' ? 'Back to Preview' : 'חזרה'}
            </button>
            <button
              onClick={() => {
                resetRoleplay()
                setTimeout(startRoleplay, 100)
              }}
              className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              {lang === 'en' ? 'Try It Yourself' : 'נסה בעצמך'}
            </button>
          </div>
        </div>
      )}
      
      {/* Completed Mode */}
      {conversationMode === 'completed' && (
        <div className="p-6 space-y-6">
          {/* Score Display */}
          <div className="text-center">
            <div className="relative inline-block">
              <div className="w-32 h-32 mx-auto">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-slate-700"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="url(#scoreGradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(score / 100) * 351.86} 351.86`}
                    className="transition-all duration-1000"
                  />
                  <defs>
                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ec4899" />
                      <stop offset="100%" stopColor="#f43f5e" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-white">{score}</span>
                  <span className="text-sm text-slate-400">/100</span>
                </div>
              </div>
            </div>
            
            <h3 className="mt-4 text-xl font-bold text-white">
              {score >= 80 
                ? (lang === 'en' ? 'Excellent!' : 'מצוין!')
                : score >= 60 
                  ? (lang === 'en' ? 'Good Job!' : 'עבודה טובה!')
                  : (lang === 'en' ? 'Keep Practicing!' : 'המשך להתאמן!')
              }
            </h3>
          </div>
          
          {/* Feedback Details */}
          {feedback && typeof feedback === 'object' && (
            <div className="space-y-4">
              {/* Strengths */}
              {feedback.strengths?.length > 0 && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <ThumbsUp className="w-5 h-5 text-emerald-400" />
                    <h4 className="font-semibold text-emerald-400">
                      {lang === 'en' ? 'What You Did Well' : 'מה עשית טוב'}
                    </h4>
                  </div>
                  <ul className="space-y-2">
                    {feedback.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Improvements */}
              {feedback.improvements?.length > 0 && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-5 h-5 text-amber-400" />
                    <h4 className="font-semibold text-amber-400">
                      {lang === 'en' ? 'Areas to Improve' : 'תחומים לשיפור'}
                    </h4>
                  </div>
                  <ul className="space-y-2">
                    {feedback.improvements.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <ArrowRight className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Overall */}
              {feedback.overall && (
                <div className="p-4 bg-violet-500/10 border border-violet-500/20 rounded-xl">
                  <p className="text-sm text-slate-300 italic">"{feedback.overall}"</p>
                </div>
              )}
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={resetRoleplay}
              className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              {lang === 'en' ? 'Practice Again' : 'תרגל שוב'}
            </button>
            <button
              onClick={() => setConversationMode('preview')}
              className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              {lang === 'en' ? 'Done' : 'סיום'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
