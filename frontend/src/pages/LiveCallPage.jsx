import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Mic, MicOff, Phone, PhoneOff, Volume2, VolumeX, 
  AlertTriangle, Target, TrendingUp, Clock, Users,
  Play, Pause, Square, Settings, ChevronRight, 
  Zap, MessageSquare, Brain, Sparkles, ArrowLeft,
  User, Building, DollarSign, Activity, CheckCircle2,
  XCircle, Info, Headphones
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

// Insight type configurations
const INSIGHT_CONFIGS = {
  objection_detected: {
    icon: AlertTriangle,
    color: 'red',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500/50',
    textColor: 'text-red-400',
    label: 'התנגדות זוהתה'
  },
  buying_signal: {
    icon: Target,
    color: 'green',
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/50',
    textColor: 'text-emerald-400',
    label: 'סיגנל קנייה!'
  },
  talk_balance_alert: {
    icon: Activity,
    color: 'yellow',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500/50',
    textColor: 'text-yellow-400',
    label: 'יחס דיבור'
  },
  discovery_prompt: {
    icon: MessageSquare,
    color: 'blue',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/50',
    textColor: 'text-blue-400',
    label: 'שאל שאלה'
  },
  closing_opportunity: {
    icon: Zap,
    color: 'violet',
    bgColor: 'bg-violet-500/20',
    borderColor: 'border-violet-500/50',
    textColor: 'text-violet-400',
    label: 'הזדמנות לסגור!'
  },
  value_building_cue: {
    icon: Sparkles,
    color: 'fuchsia',
    bgColor: 'bg-fuchsia-500/20',
    borderColor: 'border-fuchsia-500/50',
    textColor: 'text-fuchsia-400',
    label: 'בנה ערך'
  }
}

export default function LiveCallPage() {
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
  const [audioCoachingEnabled, setAudioCoachingEnabled] = useState(true)
  
  // Recording state
  const [transcript, setTranscript] = useState([])
  const [currentChunk, setCurrentChunk] = useState('')
  const [sellerTalkPct, setSellerTalkPct] = useState(50)
  
  // Coaching state
  const [insights, setInsights] = useState([])
  const [currentInsight, setCurrentInsight] = useState(null)
  const [isPlayingCoaching, setIsPlayingCoaching] = useState(false)
  const [coachingQueue, setCoachingQueue] = useState([])
  
  // New state for real-time transcription
  const [liveText, setLiveText] = useState('')
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const [totalWords, setTotalWords] = useState(0)
  
  // Audio refs
  const mediaRecorderRef = useRef(null)
  const audioContextRef = useRef(null)
  const coachingAudioRef = useRef(null)
  const timerRef = useRef(null)
  const analyzeIntervalRef = useRef(null)
  const socketRef = useRef(null)
  const streamRef = useRef(null)
  
  // Check for active session on mount
  useEffect(() => {
    checkActiveSession()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (analyzeIntervalRef.current) clearInterval(analyzeIntervalRef.current)
    }
  }, [])
  
  const checkActiveSession = async () => {
    try {
      const headers = await getAuthHeaders()
      const response = await axios.get(`${API_URL}/api/live/active`, { headers })
      if (response.data.has_active) {
        setSession(response.data.session)
        setShowSetup(false)
        // Resume recording state
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
    // Start timer immediately
    setIsRecording(true)
    startTimer()
    
    try {
      // Get microphone access first
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      
      // Try to get AssemblyAI real-time token
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
        // Create audio context for processing
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
        const source = audioContextRef.current.createMediaStreamSource(stream)
        const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1)
        
        // Connect to AssemblyAI Universal Streaming WebSocket (new API)
        setConnectionStatus('connecting')
        const socket = new WebSocket(`wss://streaming.assemblyai.com?token=${token}`)
        socketRef.current = socket
        
        socket.onopen = () => {
          console.log('AssemblyAI WebSocket connected!')
          setConnectionStatus('connected')
        }
        
        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            console.log('AssemblyAI message:', data.type || data.message_type, data)
            
            // Handle Universal Streaming API format
            if (data.type === 'turn' && data.transcript?.text) {
              // Turn event with transcript
              const newChunk = {
                text: data.transcript.text,
                speaker: 'דובר',
                timestamp: duration,
                confidence: 1.0
              }
              setTranscript(prev => [...prev, newChunk])
              setLiveText('')
              setTotalWords(prev => prev + data.transcript.text.split(' ').length)
            } else if (data.type === 'partial' && data.transcript?.text) {
              // Partial transcript - show live
              setLiveText(data.transcript.text)
            } else if (data.message_type === 'FinalTranscript' && data.text) {
              // Old API format fallback
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
            } else if (data.type === 'begin') {
              console.log('Session started:', data.id)
            } else if (data.type === 'termination') {
              console.log('Session terminated')
              setConnectionStatus('disconnected')
            }
          } catch (parseErr) {
            console.error('Error parsing message:', parseErr)
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
        
        // Process audio and send to WebSocket
        processor.onaudioprocess = (e) => {
          if (socket.readyState === WebSocket.OPEN && !isPaused) {
            const inputData = e.inputBuffer.getChannelData(0)
            // Convert float32 to int16
            const pcmData = new Int16Array(inputData.length)
            for (let i = 0; i < inputData.length; i++) {
              const s = Math.max(-1, Math.min(1, inputData[i]))
              pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
            }
            // Send as base64
            const uint8 = new Uint8Array(pcmData.buffer)
            let binary = ''
            for (let i = 0; i < uint8.length; i++) {
              binary += String.fromCharCode(uint8[i])
            }
            const base64 = btoa(binary)
            socket.send(JSON.stringify({ audio_data: base64 }))
          }
        }
        
        source.connect(processor)
        processor.connect(audioContextRef.current.destination)
      } else {
        // No token - manual mode only
        console.log('Running in manual mode - no real-time transcription')
        setConnectionStatus('manual')
      }
      
      // Start analysis interval (every 20 seconds)
      analyzeIntervalRef.current = setInterval(() => {
        analyzeCurrentChunk()
      }, 20000)
      
    } catch (err) {
      console.error('Error starting recording:', err)
      setConnectionStatus('error')
      alert('שגיאה: ' + err.message)
    }
  }
  
  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause()
      setIsPaused(true)
      stopTimer()
    }
  }
  
  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume()
      setIsPaused(false)
      startTimer()
    }
  }
  
  const endSession = async () => {
    if (!session) return
    
    // Stop WebSocket
    if (socketRef.current) {
      socketRef.current.close()
      socketRef.current = null
    }
    
    // Stop audio stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    // Stop audio context
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
      
      // Navigate to session summary or back to main
      navigate('/app')
    } catch (err) {
      console.error('Error ending session:', err)
    }
  }
  
  const analyzeCurrentChunk = async () => {
    if (!session || transcript.length === 0) return
    
    // Get recent transcript (last 10 chunks)
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
        
        // Add to coaching queue if audio enabled and priority is urgent/high
        if (audioCoachingEnabled && ['urgent', 'high'].includes(newInsight.priority)) {
          setCoachingQueue(prev => [...prev, newInsight])
        } else {
          setCurrentInsight(newInsight)
        }
      }
    } catch (err) {
      console.error('Error analyzing chunk:', err)
    }
  }
  
  // Process coaching queue
  useEffect(() => {
    if (coachingQueue.length > 0 && !isPlayingCoaching) {
      playCoachingAudio(coachingQueue[0])
    }
  }, [coachingQueue, isPlayingCoaching])
  
  const playCoachingAudio = async (insight) => {
    if (!session || !insight.audio_script) {
      // Show visual instead
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
          // Keep insight visible for a few more seconds
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
  
  // Manual transcript input (backup/testing)
  const addManualTranscript = (speaker, text) => {
    const newChunk = {
      speaker,
      text,
      timestamp: duration,
      confidence: 1.0
    }
    setTranscript(prev => [...prev, newChunk])
    setTotalWords(prev => prev + text.split(' ').length)
  }
  
  // Setup Modal
  if (showSetup) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-3xl border border-white/10 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Phone className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Live Call Coach</h1>
            <p className="text-gray-400">אימון מכירות בזמן אמת</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">שם הלקוח (אופציונלי)</label>
              <div className="relative">
                <User className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="ישראל ישראלי"
                  className="w-full bg-white/[0.05] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">טלפון (אופציונלי)</label>
              <div className="relative">
                <Phone className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="050-000-0000"
                  className="w-full bg-white/[0.05] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">סוג העסקה</label>
              <div className="relative">
                <Building className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={dealType}
                  onChange={(e) => setDealType(e.target.value)}
                  placeholder="שירותי שיווק, ייעוץ..."
                  className="w-full bg-white/[0.05] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">ערך משוער (₪)</label>
              <div className="relative">
                <DollarSign className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  value={estimatedValue}
                  onChange={(e) => setEstimatedValue(e.target.value)}
                  placeholder="10000"
                  className="w-full bg-white/[0.05] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-white/[0.03] rounded-xl border border-white/10">
              <div className="flex items-center gap-3">
                <Headphones className="w-5 h-5 text-violet-400" />
                <div>
                  <p className="text-white font-medium">אימון קולי</p>
                  <p className="text-xs text-gray-500">קבל טיפים דרך האוזניה</p>
                </div>
              </div>
              <button
                onClick={() => setAudioCoachingEnabled(!audioCoachingEnabled)}
                className={`w-12 h-7 rounded-full transition-colors ${
                  audioCoachingEnabled ? 'bg-violet-500' : 'bg-gray-600'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  audioCoachingEnabled ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
            
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => navigate('/app')}
                className="flex-1 px-6 py-3 bg-white/[0.05] hover:bg-white/[0.1] text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                חזור
              </button>
              <button
                onClick={startSession}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
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
  
  // Main Live Call UI
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/40 backdrop-blur-xl sticky top-0 z-30">
        <div className="px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/app')}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                <Phone className="w-5 h-5 text-violet-400" />
                Live Call Coach
              </h1>
              {customerName && (
                <p className="text-sm text-gray-400">{customerName}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Duration */}
            <div className={`px-4 py-2 rounded-xl font-mono text-lg ${
              isRecording && !isPaused 
                ? 'bg-red-500/20 text-red-400 animate-pulse' 
                : 'bg-white/[0.05] text-white'
            }`}>
              <div className="flex items-center gap-2">
                {isRecording && !isPaused && <div className="w-2 h-2 bg-red-500 rounded-full" />}
                {formatDuration(duration)}
              </div>
            </div>
            
            {/* Audio coaching toggle */}
            <button
              onClick={() => setAudioCoachingEnabled(!audioCoachingEnabled)}
              className={`p-2 rounded-xl transition-colors ${
                audioCoachingEnabled 
                  ? 'bg-violet-500/20 text-violet-400' 
                  : 'bg-white/[0.05] text-gray-400'
              }`}
              title={audioCoachingEnabled ? 'אימון קולי מופעל' : 'אימון קולי כבוי'}
            >
              {audioCoachingEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Panel - Transcript */}
        <div className="flex-1 flex flex-col border-r border-white/10">
          {/* Connection Status */}
          <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-emerald-500 animate-pulse' :
                connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                connectionStatus === 'manual' ? 'bg-blue-500' :
                connectionStatus === 'error' ? 'bg-red-500' : 'bg-gray-500'
              }`} />
              <span className="text-xs text-gray-400">
                {connectionStatus === 'connected' ? '🎤 מחובר - מתמלל בזמן אמת' :
                 connectionStatus === 'connecting' ? '⏳ מתחבר...' :
                 connectionStatus === 'manual' ? '✏️ מצב ידני - הקלד טקסט למטה' :
                 connectionStatus === 'error' ? '❌ שגיאת חיבור - השתמש במצב ידני' : 'מנותק'}
              </span>
            </div>
            <span className="text-xs text-gray-500">{totalWords} מילים</span>
          </div>
          
          {/* Transcript Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" id="transcript-container">
            {transcript.length === 0 && !liveText ? (
              <div className="text-center py-20 text-gray-500">
                <Mic className="w-12 h-12 mx-auto mb-4 opacity-50 animate-pulse" />
                <p>מתחיל להקליט...</p>
                <p className="text-sm mt-2">התמלול יופיע כאן בזמן אמת</p>
              </div>
            ) : (
              <>
                {transcript.map((chunk, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-xl bg-white/[0.05] border-l-4 border-violet-500"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">{formatDuration(chunk.timestamp)}</span>
                      {chunk.confidence && (
                        <span className="text-xs text-gray-600">{Math.round(chunk.confidence * 100)}%</span>
                      )}
                    </div>
                    <p className="text-white text-sm" dir="auto">{chunk.text}</p>
                  </div>
                ))}
                
                {/* Live text being transcribed */}
                {liveText && (
                  <div className="p-3 rounded-xl bg-violet-500/10 border-l-4 border-violet-400 animate-pulse">
                    <p className="text-violet-300 text-sm" dir="auto">{liveText}...</p>
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Manual Input - kept for testing/backup */}
          <div className="p-4 border-t border-white/10 bg-black/20">
            <div className="flex gap-2">
              <input
                type="text"
                value={currentChunk}
                onChange={(e) => setCurrentChunk(e.target.value)}
                placeholder="הקלד טקסט ידני (גיבוי)..."
                className="flex-1 bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 text-sm"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && currentChunk) {
                    addManualTranscript('ידני', currentChunk)
                    setCurrentChunk('')
                  }
                }}
              />
              <button
                onClick={() => {
                  if (currentChunk) {
                    addManualTranscript('ידני', currentChunk)
                    setCurrentChunk('')
                  }
                }}
                className="px-4 py-2 bg-violet-500/20 text-violet-400 rounded-xl hover:bg-violet-500/30 transition-colors text-sm"
              >
                הוסף
              </button>
              <button
                onClick={analyzeCurrentChunk}
                className="px-4 py-2 bg-violet-500/20 text-violet-400 rounded-xl hover:bg-violet-500/30 transition-colors text-sm"
              >
                <Brain className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Right Panel - Coaching */}
        <div className="w-96 flex flex-col bg-black/20">
          {/* Live Metrics */}
          <div className="p-4 border-b border-white/10">
            <h3 className="text-sm font-medium text-gray-400 mb-3">מדדים חיים</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/[0.05] rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-4 h-4 text-violet-400" />
                  <span className="text-xs text-gray-500">יחס דיבור</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        sellerTalkPct > 60 ? 'bg-red-500' : sellerTalkPct > 50 ? 'bg-yellow-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${sellerTalkPct}%` }}
                    />
                  </div>
                  <span className="text-white text-sm font-medium">{sellerTalkPct}%</span>
                </div>
              </div>
              
              <div className="bg-white/[0.05] rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                  <span className="text-xs text-gray-500">התנגדויות</span>
                </div>
                <p className="text-white text-lg font-bold">
                  {insights.filter(i => i.insight_type === 'objection_detected').length}
                </p>
              </div>
              
              <div className="bg-white/[0.05] rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-gray-500">סיגנלי קנייה</span>
                </div>
                <p className="text-white text-lg font-bold">
                  {insights.filter(i => i.insight_type === 'buying_signal').length}
                </p>
              </div>
              
              <div className="bg-white/[0.05] rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Brain className="w-4 h-4 text-fuchsia-400" />
                  <span className="text-xs text-gray-500">טיפים</span>
                </div>
                <p className="text-white text-lg font-bold">{insights.length}</p>
              </div>
            </div>
          </div>
          
          {/* Current Insight */}
          {currentInsight && (
            <div className={`m-4 p-4 rounded-2xl border-2 ${
              INSIGHT_CONFIGS[currentInsight.insight_type]?.bgColor || 'bg-violet-500/20'
            } ${INSIGHT_CONFIGS[currentInsight.insight_type]?.borderColor || 'border-violet-500/50'} animate-pulse`}>
              <div className="flex items-center gap-2 mb-3">
                {(() => {
                  const config = INSIGHT_CONFIGS[currentInsight.insight_type]
                  const IconComponent = config?.icon || Info
                  return <IconComponent className={`w-5 h-5 ${config?.textColor || 'text-violet-400'}`} />
                })()}
                <span className={`font-bold ${INSIGHT_CONFIGS[currentInsight.insight_type]?.textColor || 'text-violet-400'}`}>
                  {INSIGHT_CONFIGS[currentInsight.insight_type]?.label || currentInsight.insight_type}
                </span>
                {isPlayingCoaching && (
                  <Volume2 className="w-4 h-4 text-white animate-pulse ml-auto" />
                )}
              </div>
              
              <p className="text-white text-sm mb-3">{currentInsight.coaching_message}</p>
              
              {currentInsight.suggested_response && (
                <div className="bg-black/30 rounded-xl p-3 border border-white/10">
                  <p className="text-xs text-gray-400 mb-1">תגיד:</p>
                  <p className="text-white text-sm font-medium">"{currentInsight.suggested_response}"</p>
                </div>
              )}
              
              {currentInsight.technique && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="px-2 py-1 bg-white/10 rounded-lg text-xs text-gray-300">
                    {currentInsight.technique}
                  </span>
                </div>
              )}
            </div>
          )}
          
          {/* Insights History */}
          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3">היסטוריית טיפים</h3>
            {insights.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">
                טיפים יופיעו כאן במהלך השיחה
              </p>
            ) : (
              <div className="space-y-2">
                {insights.slice().reverse().map((insight, index) => {
                  const config = INSIGHT_CONFIGS[insight.insight_type]
                  const IconComponent = config?.icon || Info
                  return (
                    <div
                      key={insight.id || index}
                      className="p-3 bg-white/[0.03] rounded-xl border border-white/5 cursor-pointer hover:bg-white/[0.05] transition-colors"
                      onClick={() => setCurrentInsight(insight)}
                    >
                      <div className="flex items-center gap-2">
                        <IconComponent className={`w-4 h-4 ${config?.textColor || 'text-gray-400'}`} />
                        <span className="text-xs text-gray-400">{formatDuration(insight.timestamp)}</span>
                        <span className={`text-xs ${config?.textColor || 'text-gray-400'}`}>
                          {config?.label || insight.insight_type}
                        </span>
                      </div>
                      <p className="text-white text-xs mt-1 line-clamp-2">{insight.coaching_message}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Bottom Controls */}
      <div className="border-t border-white/10 bg-black/40 backdrop-blur-xl p-4">
        <div className="flex items-center justify-center gap-4">
          {isPaused ? (
            <button
              onClick={resumeRecording}
              className="w-14 h-14 bg-emerald-500 hover:bg-emerald-600 rounded-full flex items-center justify-center transition-colors"
            >
              <Play className="w-6 h-6 text-white" />
            </button>
          ) : (
            <button
              onClick={pauseRecording}
              className="w-14 h-14 bg-yellow-500 hover:bg-yellow-600 rounded-full flex items-center justify-center transition-colors"
            >
              <Pause className="w-6 h-6 text-white" />
            </button>
          )}
          
          <button
            onClick={endSession}
            className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors shadow-lg shadow-red-500/30"
          >
            <PhoneOff className="w-7 h-7 text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}
