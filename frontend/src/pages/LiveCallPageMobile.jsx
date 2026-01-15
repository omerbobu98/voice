import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Mic, MicOff, Phone, PhoneOff, Volume2, VolumeX, 
  AlertTriangle, Target, Clock, 
  ArrowLeft, User, Building, DollarSign, 
  Headphones, ChevronDown, ChevronUp, X,
  Zap, MessageSquare, Brain, Sparkles, Activity
} from 'lucide-react'
import axios from 'axios'
import { supabase } from '../lib/supabase'
import { API_URL } from '../lib/config'

const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token 
    ? { Authorization: `Bearer ${session.access_token}` }
    : {}
}

// Insight configurations with mobile-optimized colors
const INSIGHT_CONFIGS = {
  objection_detected: {
    icon: AlertTriangle,
    color: 'red',
    bgColor: 'bg-red-500',
    textColor: 'text-white',
    label: 'התנגדות זוהתה',
    emoji: '🔴'
  },
  buying_signal: {
    icon: Target,
    color: 'green',
    bgColor: 'bg-emerald-500',
    textColor: 'text-white',
    label: 'סיגנל קנייה!',
    emoji: '🟢'
  },
  stage_alert: {
    icon: Clock,
    color: 'orange',
    bgColor: 'bg-orange-500',
    textColor: 'text-white',
    label: 'התראת שלב',
    emoji: '🎯'
  },
  discovery_prompt: {
    icon: MessageSquare,
    color: 'blue',
    bgColor: 'bg-blue-500',
    textColor: 'text-white',
    label: 'שאל שאלה',
    emoji: '🟡'
  },
  closing_opportunity: {
    icon: Zap,
    color: 'violet',
    bgColor: 'bg-violet-500',
    textColor: 'text-white',
    label: 'הזדמנות לסגור!',
    emoji: '🟣'
  },
  value_building_cue: {
    icon: Sparkles,
    color: 'fuchsia',
    bgColor: 'bg-fuchsia-500',
    textColor: 'text-white',
    label: 'בנה ערך',
    emoji: '💎'
  },
  sentiment_shift: {
    icon: Activity,
    color: 'yellow',
    bgColor: 'bg-yellow-500',
    textColor: 'text-white',
    label: 'שינוי רגש',
    emoji: '😟'
  },
  talk_balance_alert: {
    icon: Activity,
    color: 'amber',
    bgColor: 'bg-amber-500',
    textColor: 'text-white',
    label: 'יחס דיבור',
    emoji: '⚖️'
  }
}

// Audio coaching modes
const AUDIO_MODES = {
  OFF: 'off',
  SMART: 'smart',
  ON: 'on'
}

export default function LiveCallPageMobile() {
  const navigate = useNavigate()
  
  // Session state
  const [session, setSession] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [duration, setDuration] = useState(0)
  
  // Setup modal
  const [showSetup, setShowSetup] = useState(true)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [dealType, setDealType] = useState('')
  const [estimatedValue, setEstimatedValue] = useState('')
  const [coachingLanguage, setCoachingLanguage] = useState('he')
  const [audioMode, setAudioMode] = useState(AUDIO_MODES.SMART)
  
  // Recording state
  const [transcript, setTranscript] = useState([])
  const [currentChunk, setCurrentChunk] = useState('')
  const [sellerTalkPct, setSellerTalkPct] = useState(50)
  
  // Coaching state
  const [insights, setInsights] = useState([])
  const [currentInsight, setCurrentInsight] = useState(null)
  const [isPlayingCoaching, setIsPlayingCoaching] = useState(false)
  const [coachingQueue, setCoachingQueue] = useState([])
  const [showInsightHistory, setShowInsightHistory] = useState(false)
  
  // Real-time transcription
  const [liveText, setLiveText] = useState('')
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const [totalWords, setTotalWords] = useState(0)
  
  // Mobile UI state
  const [showTranscript, setShowTranscript] = useState(true)
  const [insightSheetHeight, setInsightSheetHeight] = useState('collapsed') // collapsed, peek, full
  
  // Refs
  const audioContextRef = useRef(null)
  const coachingAudioRef = useRef(null)
  const timerRef = useRef(null)
  const analyzeIntervalRef = useRef(null)
  const socketRef = useRef(null)
  const streamRef = useRef(null)
  const insightSheetRef = useRef(null)
  
  // Check for active session on mount
  useEffect(() => {
    checkActiveSession()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (analyzeIntervalRef.current) clearInterval(analyzeIntervalRef.current)
    }
  }, [])
  
  // Auto-show insight sheet when new insight arrives
  useEffect(() => {
    if (currentInsight && insightSheetHeight === 'collapsed') {
      setInsightSheetHeight('peek')
      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(currentInsight.priority === 'urgent' ? [100, 50, 100] : 100)
      }
    }
  }, [currentInsight])
  
  const checkActiveSession = async () => {
    try {
      const headers = await getAuthHeaders()
      const response = await axios.get(`${API_URL}/api/live/active`, { headers })
      if (response.data.has_active) {
        setSession(response.data.session)
        setShowSetup(false)
        setIsRecording(true)
        startTimer()
      }
    } catch (err) {
      console.error('Error checking active session:', err)
    }
  }
  
  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setDuration(prev => prev + 1)
    }, 1000)
  }
  
  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }
  
  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  const startSession = async () => {
    try {
      const headers = await getAuthHeaders()
      const response = await axios.post(`${API_URL}/api/live/sessions`, {
        customer_name: customerName,
        customer_phone: customerPhone,
        deal_type: dealType,
        estimated_value: estimatedValue ? parseFloat(estimatedValue) : null,
        coaching_language: coachingLanguage,
        coaching_intensity: 'balanced'
      }, { headers })
      
      setSession(response.data)
      setShowSetup(false)
      startRecording()
    } catch (err) {
      console.error('Error starting session:', err)
      alert('שגיאה בהתחלת הסשן')
    }
  }
  
  const startRecording = async () => {
    setIsRecording(true)
    startTimer()
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      })
      streamRef.current = stream
      
      let token = null
      try {
        const headers = await getAuthHeaders()
        const tokenRes = await axios.get(`${API_URL}/api/live/assemblyai-token`, { headers })
        token = tokenRes.data?.token
        console.log('Got AssemblyAI token:', token ? 'yes' : 'no')
      } catch (tokenErr) {
        console.error('Failed to get AssemblyAI token:', tokenErr)
        setConnectionStatus('error')
      }
      
      if (token) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 })
        const source = audioContextRef.current.createMediaStreamSource(stream)
        const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1)
        
        setConnectionStatus('connecting')
        // Correct AssemblyAI Universal Streaming URL format
        const socket = new WebSocket(`wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000&token=${token}`)
        socketRef.current = socket
        
        socket.onopen = () => {
          console.log('AssemblyAI WebSocket connected!')
          setConnectionStatus('connected')
        }
        
        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            console.log('AssemblyAI message:', data.message_type, data)
            
            // Handle AssemblyAI real-time API format
            if (data.message_type === 'FinalTranscript' && data.text) {
              const newChunk = {
                text: data.text,
                speaker: 'דובר',
                timestamp: duration,
                confidence: data.confidence || 1.0
              }
              setTranscript(prev => [...prev, newChunk])
              setLiveText('')
              setTotalWords(prev => prev + data.text.split(' ').length)
            } else if (data.message_type === 'PartialTranscript' && data.text) {
              setLiveText(data.text)
            } else if (data.error) {
              console.error('AssemblyAI error:', data.error)
              setConnectionStatus('error')
            } else if (data.message_type === 'SessionBegins') {
              console.log('Session started:', data.session_id)
            } else if (data.message_type === 'SessionTerminated') {
              console.log('Session terminated')
              setConnectionStatus('disconnected')
            }
          } catch (parseErr) {
            console.error('Error parsing message:', parseErr, event.data)
          }
        }
        
        socket.onerror = (error) => {
          console.error('WebSocket error:', error)
          setConnectionStatus('error')
        }
        
        socket.onclose = (event) => {
          console.log('WebSocket closed:', event.code, event.reason)
          setConnectionStatus('disconnected')
        }
        
        processor.onaudioprocess = (e) => {
          if (socket.readyState === WebSocket.OPEN && !isPaused) {
            const inputData = e.inputBuffer.getChannelData(0)
            const pcmData = new Int16Array(inputData.length)
            for (let i = 0; i < inputData.length; i++) {
              const s = Math.max(-1, Math.min(1, inputData[i]))
              pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
            }
            
            const uint8 = new Uint8Array(pcmData.buffer)
            let binary = ''
            for (let i = 0; i < uint8.length; i++) {
              binary += String.fromCharCode(uint8[i])
            }
            const base64 = btoa(binary)
            
            // AssemblyAI real-time API expects audio_data field
            socket.send(JSON.stringify({ audio_data: base64 }))
          }
        }
        
        source.connect(processor)
        processor.connect(audioContextRef.current.destination)
      } else {
        setConnectionStatus('manual')
      }
      
      analyzeIntervalRef.current = setInterval(() => {
        analyzeCurrentChunk()
      }, 20000)
      
    } catch (err) {
      console.error('Error starting recording:', err)
      setConnectionStatus('error')
      alert('שגיאה: ' + err.message)
    }
  }
  
  const endSession = async () => {
    if (!session) return
    
    if (socketRef.current) {
      socketRef.current.close()
      socketRef.current = null
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    
    if (analyzeIntervalRef.current) {
      clearInterval(analyzeIntervalRef.current)
    }
    stopTimer()
    setIsRecording(false)
    setConnectionStatus('disconnected')
    
    try {
      const headers = await getAuthHeaders()
      const fullTranscript = transcript.map(t => t.text).join(' ')
      
      await axios.post(`${API_URL}/api/live/sessions/${session.id}/end`, {
        transcript: fullTranscript,
        total_words: totalWords,
        seller_talk_percentage: sellerTalkPct,
        buyer_talk_percentage: 100 - sellerTalkPct,
        objections_count: insights.filter(i => i.insight_type === 'objection_detected').length,
        buying_signals_count: insights.filter(i => i.insight_type === 'buying_signal').length,
        coaching_tips_delivered: insights.length,
        duration_seconds: duration
      }, { headers })
      
      navigate('/app')
    } catch (err) {
      console.error('Error ending session:', err)
    }
  }
  
  const analyzeCurrentChunk = async () => {
    if (!session || transcript.length === 0) return
    
    const recentText = transcript.slice(-10).map(t => t.text).join(' ')
    const fullTranscript = transcript.map(t => t.text).join(' ')
    
    try {
      const headers = await getAuthHeaders()
      const response = await axios.post(`${API_URL}/api/live/sessions/${session.id}/process-transcript`, {
        recent_text: recentText,
        full_transcript: fullTranscript,
        duration_seconds: duration,
        seller_words: Math.round(totalWords * sellerTalkPct / 100),
        buyer_words: Math.round(totalWords * (100 - sellerTalkPct) / 100),
        coaching_language: coachingLanguage
      }, { headers })
      
      if (response.data.has_insight && response.data.insight) {
        const newInsight = {
          ...response.data.insight,
          timestamp: duration,
          id: response.data.saved_id || Date.now()
        }
        
        setInsights(prev => [...prev, newInsight])
        
        // Audio logic based on mode
        const shouldPlayAudio = 
          audioMode === AUDIO_MODES.ON ||
          (audioMode === AUDIO_MODES.SMART && ['urgent', 'high'].includes(newInsight.priority))
        
        if (shouldPlayAudio) {
          setCoachingQueue(prev => [...prev, newInsight])
        } else {
          setCurrentInsight(newInsight)
        }
      }
    } catch (err) {
      console.error('Error analyzing chunk:', err)
    }
  }
  
  useEffect(() => {
    if (coachingQueue.length > 0 && !isPlayingCoaching) {
      playCoachingAudio(coachingQueue[0])
    }
  }, [coachingQueue, isPlayingCoaching])
  
  const playCoachingAudio = async (insight) => {
    if (!session || !insight.audio_script) {
      setCurrentInsight(insight)
      setCoachingQueue(prev => prev.slice(1))
      return
    }
    
    setIsPlayingCoaching(true)
    setCurrentInsight(insight)
    
    try {
      const headers = await getAuthHeaders()
      const response = await axios.post(`${API_URL}/api/live/sessions/${session.id}/tts`, {
        text: insight.audio_script || insight.coaching_message
      }, { headers })
      
      if (response.data.audio_url) {
        const audio = new Audio(`${API_URL}${response.data.audio_url}`)
        coachingAudioRef.current = audio
        
        audio.onended = () => {
          setIsPlayingCoaching(false)
          setCoachingQueue(prev => prev.slice(1))
          setTimeout(() => {
            if (currentInsight?.id === insight.id) {
              setCurrentInsight(null)
            }
          }, 5000)
        }
        
        audio.play()
      }
    } catch (err) {
      console.error('Error playing coaching audio:', err)
      setIsPlayingCoaching(false)
      setCoachingQueue(prev => prev.slice(1))
    }
  }
  
  const cycleAudioMode = () => {
    const modes = [AUDIO_MODES.OFF, AUDIO_MODES.SMART, AUDIO_MODES.ON]
    const currentIndex = modes.indexOf(audioMode)
    const nextMode = modes[(currentIndex + 1) % modes.length]
    setAudioMode(nextMode)
    
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }
  }
  
  const getAudioModeIcon = () => {
    switch (audioMode) {
      case AUDIO_MODES.OFF:
        return <VolumeX className="w-5 h-5" />
      case AUDIO_MODES.SMART:
        return <Volume2 className="w-5 h-5" />
      case AUDIO_MODES.ON:
        return <Headphones className="w-5 h-5" />
      default:
        return <Volume2 className="w-5 h-5" />
    }
  }
  
  const getAudioModeLabel = () => {
    switch (audioMode) {
      case AUDIO_MODES.OFF:
        return 'כבוי'
      case AUDIO_MODES.SMART:
        return 'חכם'
      case AUDIO_MODES.ON:
        return 'תמיד'
      default:
        return 'חכם'
    }
  }
  
  // Setup Modal
  if (showSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] to-[#1a1a2e] flex items-center justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-lg bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-2xl sm:rounded-3xl border border-white/10 p-4 sm:p-6 shadow-2xl my-auto max-h-[90vh] overflow-y-auto">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Phone className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Live Call Coach</h1>
            <p className="text-gray-400 text-sm">אימון מכירות בזמן אמת עם AI מתקדם</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2 font-medium">שם הלקוח</label>
              <div className="relative">
                <User className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="ישראל ישראלי"
                  className="w-full bg-white/[0.05] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-base text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2 font-medium">טלפון</label>
              <div className="relative">
                <Phone className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="050-000-0000"
                  className="w-full bg-white/[0.05] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-base text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2 font-medium">סוג העסקה</label>
              <div className="relative">
                <Building className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={dealType}
                  onChange={(e) => setDealType(e.target.value)}
                  placeholder="Cool Life Paint, Turf, Pavers..."
                  className="w-full bg-white/[0.05] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-base text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2 font-medium">ערך משוער (₪)</label>
              <div className="relative">
                <DollarSign className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  value={estimatedValue}
                  onChange={(e) => setEstimatedValue(e.target.value)}
                  placeholder="10000"
                  className="w-full bg-white/[0.05] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-base text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-white/[0.03] rounded-xl border border-white/10">
              <div className="flex items-center gap-3">
                <Headphones className="w-5 h-5 text-violet-400" />
                <div>
                  <p className="text-white font-medium text-sm">מצב אודיו</p>
                  <p className="text-xs text-gray-500">כבוי / חכם / תמיד</p>
                </div>
              </div>
              <button
                onClick={cycleAudioMode}
                className="px-4 py-2 bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 rounded-lg font-medium transition-colors text-sm"
              >
                {getAudioModeLabel()}
              </button>
            </div>
            
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => navigate('/app')}
                className="flex-1 px-6 py-3 bg-white/[0.05] hover:bg-white/[0.1] text-white rounded-xl font-medium transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                חזור
              </button>
              <button
                onClick={startSession}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white rounded-xl font-medium transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2"
              >
                <Phone className="w-5 h-5" />
                התחל שיחה
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  // Main Live Call UI - Mobile Optimized
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] to-[#1a1a2e] flex flex-col overflow-hidden">
      {/* Compact Header */}
      <header className="border-b border-white/10 bg-black/60 backdrop-blur-xl sticky top-0 z-50 shadow-lg">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/app')}
              className="p-2 text-gray-400 hover:text-white transition-colors active:scale-90"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base font-bold text-white flex items-center gap-2">
                <Phone className="w-4 h-4 text-violet-400" />
                Live Coach
              </h1>
              {customerName && (
                <p className="text-xs text-gray-400">{customerName}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Duration */}
            <div className={`px-3 py-1.5 rounded-lg font-mono text-sm ${
              isRecording && !isPaused 
                ? 'bg-red-500/20 text-red-400' 
                : 'bg-white/[0.05] text-white'
            }`}>
              <div className="flex items-center gap-1.5">
                {isRecording && !isPaused && <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />}
                {formatDuration(duration)}
              </div>
            </div>
            
            {/* Audio Mode Toggle */}
            <button
              onClick={cycleAudioMode}
              className={`p-2 rounded-lg transition-all active:scale-90 ${
                audioMode === AUDIO_MODES.OFF 
                  ? 'bg-gray-500/20 text-gray-400' 
                  : audioMode === AUDIO_MODES.SMART
                  ? 'bg-violet-500/20 text-violet-400'
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}
              title={`מצב אודיו: ${getAudioModeLabel()}`}
            >
              {getAudioModeIcon()}
            </button>
            
            {/* End Call Button */}
            <button
              onClick={endSession}
              className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all active:scale-90"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Connection Status Bar */}
        <div className="px-4 py-2 border-t border-white/5 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-emerald-500 animate-pulse' :
              connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
              connectionStatus === 'manual' ? 'bg-blue-500' :
              connectionStatus === 'error' ? 'bg-red-500' : 'bg-gray-500'
            }`} />
            <span className="text-xs text-gray-400">
              {connectionStatus === 'connected' ? 'מתמלל בזמן אמת' :
               connectionStatus === 'connecting' ? 'מתחבר...' :
               connectionStatus === 'manual' ? 'מצב ידני' :
               connectionStatus === 'error' ? 'שגיאה' : 'מנותק'}
            </span>
          </div>
          <span className="text-xs text-gray-500">{totalWords} מילים</span>
        </div>
      </header>
      
      {/* Main Content Area - Transcript */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-32">
        {transcript.length === 0 && !liveText ? (
          <div className="text-center py-20 text-gray-500">
            <Mic className="w-12 h-12 mx-auto mb-4 opacity-50 animate-pulse" />
            <p className="text-base">מתחיל להקליט...</p>
            <p className="text-sm mt-2">התמלול יופיע כאן בזמן אמת</p>
          </div>
        ) : (
          <>
            {transcript.map((chunk, index) => (
              <div
                key={index}
                className="p-4 rounded-2xl bg-white/[0.05] border border-white/10 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 font-medium">{formatDuration(chunk.timestamp)}</span>
                  {chunk.confidence && (
                    <span className="text-xs text-gray-600 bg-white/5 px-2 py-0.5 rounded-full">
                      {Math.round(chunk.confidence * 100)}%
                    </span>
                  )}
                </div>
                <p className="text-white text-base leading-relaxed" dir="auto">{chunk.text}</p>
              </div>
            ))}
            
            {/* Live text being transcribed */}
            {liveText && (
              <div className="p-4 rounded-2xl bg-violet-500/10 border-2 border-violet-400/50 backdrop-blur-sm animate-pulse">
                <p className="text-violet-300 text-base leading-relaxed" dir="auto">{liveText}...</p>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Bottom Sheet - Insights */}
      <div 
        ref={insightSheetRef}
        className={`fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/95 to-black/90 backdrop-blur-xl border-t border-white/10 transition-all duration-300 ease-out shadow-2xl ${
          insightSheetHeight === 'collapsed' ? 'translate-y-full' :
          insightSheetHeight === 'peek' ? 'translate-y-0' :
          'translate-y-0 h-[70vh]'
        }`}
        style={{
          maxHeight: insightSheetHeight === 'peek' ? '280px' : '70vh'
        }}
      >
        {/* Sheet Handle */}
        <div 
          className="flex items-center justify-center py-3 cursor-pointer"
          onClick={() => {
            if (insightSheetHeight === 'peek') {
              setInsightSheetHeight('full')
            } else if (insightSheetHeight === 'full') {
              setInsightSheetHeight('peek')
            }
          }}
        >
          <div className="w-12 h-1.5 bg-white/20 rounded-full" />
        </div>
        
        {/* Current Insight */}
        {currentInsight && (
          <div className="px-4 pb-4">
            <div className={`${INSIGHT_CONFIGS[currentInsight.insight_type]?.bgColor || 'bg-violet-500'} rounded-3xl p-5 shadow-2xl relative overflow-hidden`}>
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
              </div>
              
              {/* Close button */}
              <button
                onClick={() => setCurrentInsight(null)}
                className="absolute top-3 left-3 p-1.5 bg-black/20 rounded-full hover:bg-black/30 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
              
              {/* Content */}
              <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{INSIGHT_CONFIGS[currentInsight.insight_type]?.emoji}</span>
                  <div className="flex-1">
                    <span className="font-bold text-white text-lg block">
                      {INSIGHT_CONFIGS[currentInsight.insight_type]?.label || currentInsight.insight_type}
                    </span>
                    {currentInsight.priority && (
                      <span className="text-xs text-white/80 font-medium">
                        {currentInsight.priority === 'urgent' ? '⚡ דחוף' : 
                         currentInsight.priority === 'high' ? '🔥 גבוה' : 
                         currentInsight.priority === 'medium' ? '📌 בינוני' : '💡 נמוך'}
                      </span>
                    )}
                  </div>
                  {isPlayingCoaching && (
                    <Volume2 className="w-6 h-6 text-white animate-pulse" />
                  )}
                </div>
                
                <p className="text-white text-base leading-relaxed mb-4 font-medium">
                  {currentInsight.coaching_message}
                </p>
                
                {currentInsight.suggested_response && (
                  <div className="bg-black/20 rounded-2xl p-4 backdrop-blur-sm">
                    <p className="text-xs text-white/70 mb-2 font-medium">💬 תגובה מוצעת:</p>
                    <p className="text-white text-sm leading-relaxed font-medium">
                      "{currentInsight.suggested_response}"
                    </p>
                  </div>
                )}
                
                {currentInsight.technique && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs text-white/60">טכניקה:</span>
                    <span className="text-xs text-white/90 bg-black/20 px-3 py-1 rounded-full font-medium">
                      {currentInsight.technique}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Insight History */}
        {insightSheetHeight === 'full' && (
          <div className="px-4 pb-6 overflow-y-auto max-h-[calc(70vh-300px)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-lg">היסטוריית תובנות</h3>
              <span className="text-gray-400 text-sm">{insights.length} תובנות</span>
            </div>
            
            <div className="space-y-3">
              {insights.slice().reverse().map((insight, index) => (
                <button
                  key={insight.id || index}
                  onClick={() => setCurrentInsight(insight)}
                  className="w-full text-right p-4 rounded-2xl bg-white/[0.05] border border-white/10 hover:bg-white/[0.08] transition-all active:scale-98"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xl">{INSIGHT_CONFIGS[insight.insight_type]?.emoji}</span>
                    <div className="flex-1">
                      <span className="text-white font-medium text-sm block">
                        {INSIGHT_CONFIGS[insight.insight_type]?.label}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDuration(insight.timestamp)}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm line-clamp-2">
                    {insight.coaching_message}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Empty state */}
        {!currentInsight && insights.length === 0 && (
          <div className="px-4 pb-6 text-center py-12">
            <Brain className="w-12 h-12 mx-auto mb-4 text-gray-600 opacity-50" />
            <p className="text-gray-500 text-sm">ממתין לתובנות...</p>
            <p className="text-gray-600 text-xs mt-2">התובנות יופיעו כאן בזמן אמת</p>
          </div>
        )}
      </div>
    </div>
  )
}
