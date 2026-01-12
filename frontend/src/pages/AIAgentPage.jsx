import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Mic, MicOff, Phone, PhoneOff, Volume2, VolumeX, 
  AlertTriangle, Target, Brain, Sparkles, ArrowLeft,
  CheckCircle2, XCircle, Loader2, Settings, Headphones,
  Wifi, WifiOff, Clock, MessageCircle, TrendingUp,
  ChevronRight, X, BookOpen, Zap
} from 'lucide-react'
import axios from 'axios'
import { io } from 'socket.io-client'
import { supabase } from '../lib/supabase'
import { API_URL } from '../lib/config'

// ============================================
// AI Agent Live Coach with AssemblyAI Real-Time Streaming
// Uses WebSocket proxy server for AssemblyAI v3 API
// ============================================

// WebSocket is now integrated into main app.py server on port 5001
const WS_PROXY_URL = import.meta.env.VITE_WS_PROXY_URL || 'http://localhost:5001'

const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token 
    ? { Authorization: `Bearer ${session.access_token}` }
    : {}
}

export default function AIAgentPage() {
  const navigate = useNavigate()
  
  // Step tracking for debugging
  const [currentStep, setCurrentStep] = useState(1)
  const [stepStatus, setStepStatus] = useState({
    recording: 'pending',      // pending, testing, success, error
    transcription: 'pending',  // pending, testing, success, error
    aiCoaching: 'pending',     // pending, testing, success, error
    tts: 'pending'             // pending, testing, success, error
  })
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [micPermission, setMicPermission] = useState('unknown') // unknown, granted, denied
  
  // Transcription state
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const [transcript, setTranscript] = useState([])
  const [liveText, setLiveText] = useState('')
  
  // Coaching state
  const [insights, setInsights] = useState([])
  const [currentInsight, setCurrentInsight] = useState(null)
  
  // Audio coaching mode: 'off' | 'smart' | 'on'
  const [audioMode, setAudioMode] = useState('smart')
  
  // Timer
  const [duration, setDuration] = useState(0)
  const timerRef = useRef(null)
  
  // Audio refs
  const streamRef = useRef(null)
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const processorRef = useRef(null)
  const socketRef = useRef(null)  // Socket.IO connection to proxy server
  const fullTranscriptRef = useRef('')  // Full transcript for AI analysis
  const analysisIntervalRef = useRef(null)  // For periodic AI analysis
  const durationRef = useRef(0)
  
  // Speaker tracking state
  const [sellerWords, setSellerWords] = useState(0)
  const [buyerWords, setBuyerWords] = useState(0)
  const sellerWordsRef = useRef(0)
  const buyerWordsRef = useRef(0)
  
  // Manual speaker toggle (since AssemblyAI streaming doesn't support diarization)
  const [currentSpeaker, setCurrentSpeaker] = useState('Seller')
  
  // Auto-scroll ref
  const transcriptEndRef = useRef(null)

  // ============================================
  // STEP 1: Test Microphone Access
  // ============================================
  
  const testMicrophone = async () => {
    setStepStatus(prev => ({ ...prev, recording: 'testing' }))
    
    try {
      // Request microphone permission (use native sample rate for better compatibility)
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      })
      
      streamRef.current = stream
      setMicPermission('granted')
      
      // Create audio context for level visualization (use native sample rate)
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
      console.log(`🎵 AudioContext created with native sample rate: ${audioContextRef.current.sampleRate}Hz`)
      
      const source = audioContextRef.current.createMediaStreamSource(stream)
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      source.connect(analyserRef.current)
      
      // Start audio level monitoring
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
      const updateLevel = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray)
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length
          setAudioLevel(average)
          requestAnimationFrame(updateLevel)
        }
      }
      updateLevel()
      
      setStepStatus(prev => ({ ...prev, recording: 'success' }))
      console.log('✅ Step 1: Microphone access granted')
      return true
      
    } catch (err) {
      console.error('❌ Step 1: Microphone error:', err)
      setMicPermission('denied')
      setStepStatus(prev => ({ ...prev, recording: 'error' }))
      return false
    }
  }

  // ============================================
  // STEP 2: Connect to AssemblyAI via WebSocket Proxy
  // ============================================
  
  const testTranscription = async () => {
    if (!streamRef.current) {
      console.error('No audio stream available')
      return false
    }
    
    setStepStatus(prev => ({ ...prev, transcription: 'testing' }))
    setConnectionStatus('connecting')
    
    try {
      console.log('🔌 Connecting to WebSocket proxy server...')
      
      // Connect to Socket.IO proxy server
      const socket = io(WS_PROXY_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 3
      })
      
      socketRef.current = socket
      
      // Handle Socket.IO events
      socket.on('connect', () => {
        console.log('✅ Connected to WebSocket proxy')
      })
      
      socket.on('connected', (data) => {
        console.log('🔗 Proxy server ready:', data)
        // Always use 16kHz - we resample on frontend
        console.log(`🎵 Requesting transcription at 16000Hz`)
        socket.emit('start_transcription', { sample_rate: 16000 })
      })
      
      socket.on('transcription_started', (data) => {
        console.log('🎤 Transcription starting:', data)
        setConnectionStatus('connecting')
      })
      
      socket.on('assemblyai_connected', (data) => {
        console.log('🟢 AssemblyAI connected:', data)
        setConnectionStatus('connected')
        setStepStatus(prev => ({ ...prev, transcription: 'success' }))
        
        // Start sending audio
        startAudioStreaming()
      })
      
      socket.on('transcription', (data) => {
        handleTranscriptionData(data)
      })
      
      socket.on('error', (data) => {
        console.error('❌ Socket error:', data)
        setConnectionStatus('error')
      })
      
      socket.on('assemblyai_closed', (data) => {
        console.log('🔴 AssemblyAI disconnected:', data)
        setConnectionStatus('disconnected')
      })
      
      socket.on('disconnect', () => {
        console.log('🔌 Disconnected from proxy')
        setConnectionStatus('disconnected')
      })
      
      // Wait for connection
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Connection timeout')), 10000)
        socket.once('assemblyai_connected', () => {
          clearTimeout(timeout)
          resolve()
        })
        socket.once('error', (err) => {
          clearTimeout(timeout)
          reject(new Error(err.message || 'Connection failed'))
        })
      })
      
      console.log('✅ Step 2: Real-time transcription ready')
      return true
      
    } catch (err) {
      console.error('❌ Step 2: Transcription error:', err)
      setConnectionStatus('error')
      setStepStatus(prev => ({ ...prev, transcription: 'error' }))
      return false
    }
  }
  
  // Handle incoming transcription data (works with Deepgram and AssemblyAI)
  const handleTranscriptionData = (data) => {
    const msgType = data.type || data.message_type
    
    if (msgType === 'partial') {
      // Show live text while speaking with speaker indicator
      const speaker = data.speaker_role || 'Speaker'
      setLiveText(data.text || '')
      setCurrentSpeaker(speaker)
      
    } else if (msgType === 'final') {
      // Final transcript with speaker label from diarization
      const text = data.text || ''
      if (text.trim()) {
        // Deepgram provides speaker_role directly from diarization
        const speaker = data.speaker_role || 'Seller'
        const wordCount = text.trim().split(/\s+/).length
        
        // Update word counts
        if (speaker === 'Seller') {
          sellerWordsRef.current += wordCount
          setSellerWords(sellerWordsRef.current)
        } else {
          buyerWordsRef.current += wordCount
          setBuyerWords(buyerWordsRef.current)
        }
        
        const fullChunk = `[${speaker}]: ${text}`
        console.log(`📝 ${fullChunk}`)
        fullTranscriptRef.current += `\n${fullChunk}`
        
        setTranscript(prev => [...prev, {
          text: text,
          speaker: speaker,
          timestamp: durationRef.current,
          confidence: data.confidence || 0.9
        }])
        
        // EVENT-BASED: Analyze this new chunk for triggers immediately
        analyzeNewChunk(fullChunk)
      }
      setLiveText('')
      
    } else if (msgType === 'session_begins') {
      console.log('🎬 Transcription session started (with speaker diarization)')
      
    } else if (msgType === 'session_terminated') {
      console.log('🛑 Transcription session ended')
    }
  }
  
  // Auto-scroll to bottom when transcript updates
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [transcript, liveText])
  
  // Resample audio from source sample rate to target sample rate
  const resampleAudio = (inputData, inputSampleRate, outputSampleRate) => {
    const ratio = inputSampleRate / outputSampleRate
    const outputLength = Math.floor(inputData.length / ratio)
    const output = new Float32Array(outputLength)
    
    for (let i = 0; i < outputLength; i++) {
      const srcIndex = i * ratio
      const srcIndexFloor = Math.floor(srcIndex)
      const srcIndexCeil = Math.min(srcIndexFloor + 1, inputData.length - 1)
      const t = srcIndex - srcIndexFloor
      output[i] = inputData[srcIndexFloor] * (1 - t) + inputData[srcIndexCeil] * t
    }
    
    return output
  }
  
  // Start streaming audio to WebSocket proxy using AudioWorklet (modern, low-latency)
  const startAudioStreaming = async () => {
    if (!streamRef.current || !audioContextRef.current) {
      console.error('Audio not ready for streaming')
      return
    }
    
    const sourceSampleRate = audioContextRef.current.sampleRate
    console.log(`🎙️ Starting audio streaming with AudioWorklet...`)
    console.log(`📊 Source: ${sourceSampleRate}Hz → Target: 16000Hz`)
    
    let chunksSent = 0
    
    try {
      // Try to use AudioWorklet (modern, better performance)
      await audioContextRef.current.audioWorklet.addModule('/audio-processor.js')
      
      const source = audioContextRef.current.createMediaStreamSource(streamRef.current)
      const workletNode = new AudioWorkletNode(audioContextRef.current, 'audio-stream-processor')
      
      // Configure the worklet
      workletNode.port.postMessage({
        type: 'config',
        sourceSampleRate: sourceSampleRate,
        gain: 4.0,
        noiseGate: 0.01
      })
      
      // Handle processed audio from worklet
      workletNode.port.onmessage = (event) => {
        if (event.data.type === 'audio' && socketRef.current?.connected) {
          const pcmData = new Int16Array(event.data.pcmData)
          
          // Fast base64 encoding
          const bytes = new Uint8Array(pcmData.buffer)
          let binary = ''
          const len = bytes.length
          for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i])
          }
          
          socketRef.current.emit('audio_data', { audio: btoa(binary) })
          chunksSent++
          
          if (chunksSent % 50 === 0) {
            console.log(`📤 AudioWorklet: ${chunksSent} chunks (${(chunksSent * 100 / 1000).toFixed(1)}s)`)
          }
        }
      }
      
      // Connect: source -> worklet
      source.connect(workletNode)
      workletNode.connect(audioContextRef.current.destination)
      processorRef.current = workletNode
      
      console.log('✅ AudioWorklet initialized successfully')
      
    } catch (workletError) {
      // Fallback to ScriptProcessorNode if AudioWorklet fails
      console.warn('⚠️ AudioWorklet not available, falling back to ScriptProcessor:', workletError)
      
      const source = audioContextRef.current.createMediaStreamSource(streamRef.current)
      const gainNode = audioContextRef.current.createGain()
      gainNode.gain.value = 4.0
      
      const ratio = sourceSampleRate / 16000
      const bufferSize = 4096
      const processor = audioContextRef.current.createScriptProcessor(bufferSize, 1, 1)
      
      let audioBuffer = new Float32Array(0)
      const TARGET_SAMPLES = 1600
      
      processor.onaudioprocess = (e) => {
        if (!socketRef.current?.connected) return
        
        const inputData = e.inputBuffer.getChannelData(0)
        const outputLength = Math.ceil(inputData.length / ratio)
        const resampled = new Float32Array(outputLength)
        
        for (let i = 0; i < outputLength; i++) {
          const srcPos = i * ratio
          const srcIdx = Math.floor(srcPos)
          const frac = srcPos - srcIdx
          if (srcIdx + 1 < inputData.length) {
            resampled[i] = inputData[srcIdx] * (1 - frac) + inputData[srcIdx + 1] * frac
          } else {
            resampled[i] = inputData[srcIdx] || 0
          }
        }
        
        const newBuffer = new Float32Array(audioBuffer.length + resampled.length)
        newBuffer.set(audioBuffer)
        newBuffer.set(resampled, audioBuffer.length)
        audioBuffer = newBuffer
        
        while (audioBuffer.length >= TARGET_SAMPLES) {
          const chunk = audioBuffer.slice(0, TARGET_SAMPLES)
          audioBuffer = audioBuffer.slice(TARGET_SAMPLES)
          
          const pcmData = new Int16Array(chunk.length)
          for (let i = 0; i < chunk.length; i++) {
            const s = Math.max(-1, Math.min(1, chunk[i]))
            pcmData[i] = Math.round(s * 32767)
          }
          
          const bytes = new Uint8Array(pcmData.buffer)
          let binary = ''
          for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i])
          }
          
          socketRef.current.emit('audio_data', { audio: btoa(binary) })
          chunksSent++
          
          if (chunksSent % 50 === 0) {
            console.log(`📤 ScriptProcessor: ${chunksSent} chunks`)
          }
        }
      }
      
      source.connect(gainNode)
      gainNode.connect(processor)
      processor.connect(audioContextRef.current.destination)
      processorRef.current = processor
    }
  }
  
  // ============================================
  // ============================================
  // EVENT-BASED AI Analysis (NOT time-based!)
  // Only triggers when there's a real event to coach on
  // ============================================
  
  const lastAnalyzedChunkRef = useRef('')
  const lastInsightTimeRef = useRef(0)
  const MIN_INSIGHT_INTERVAL = 15000 // Minimum 15 seconds between insights to avoid spam
  
  const analyzeNewChunk = async (newChunk) => {
    // Skip if chunk is too short or same as last analyzed
    if (!newChunk || newChunk.length < 20) return
    if (newChunk === lastAnalyzedChunkRef.current) return
    
    // Rate limiting - don't analyze more than once per 15 seconds
    const now = Date.now()
    if (now - lastInsightTimeRef.current < MIN_INSIGHT_INTERVAL) return
    
    lastAnalyzedChunkRef.current = newChunk
    
    try {
      const headers = await getAuthHeaders()
      const totalWords = sellerWordsRef.current + buyerWordsRef.current
      const sellerPct = totalWords > 0 ? Math.round((sellerWordsRef.current / totalWords) * 100) : 50
      
      // Use the new event-based endpoint
      const response = await axios.post(`${API_URL}/api/ai-agent/analyze`, {
        transcript: fullTranscriptRef.current,
        new_chunk: newChunk,  // Send the new chunk for trigger detection
        duration_seconds: durationRef.current,
        seller_words: sellerWordsRef.current,
        buyer_words: buyerWordsRef.current,
        seller_percentage: sellerPct
      }, { headers })
      
      // Only show insight if there's a real trigger (objection, critical moment)
      if (response.data?.has_insight && response.data.insight) {
        const insight = response.data.insight
        console.log('🎯 TRIGGER DETECTED:', insight.insight_type, insight)
        
        lastInsightTimeRef.current = now
        setCurrentInsight(insight)
        setInsights(prev => [insight, ...prev]) // Add to beginning (newest first)
        
        // Play audio for urgent/high priority
        if (audioMode !== 'off' && ['urgent', 'high'].includes(insight.priority)) {
          playCoachingAudio(insight.audio_script || insight.coaching_message)
        }
      }
      // If no insight returned, AI determined nothing critical - stay silent!
    } catch (err) {
      console.error('Analysis error:', err)
    }
  }
  
  const playCoachingAudio = async (text) => {
    if (!text) return
    
    try {
      const headers = await getAuthHeaders()
      const response = await axios.post(`${API_URL}/api/tts`, {
        text: text,
        voice: 'nova'
      }, { headers })
      
      if (response.data?.audio_url) {
        const audio = new Audio(`${API_URL}${response.data.audio_url}`)
        audio.play()
      }
    } catch (err) {
      console.error('TTS error:', err)
    }
  }

  // ============================================
  // STEP 3: Test AI Coaching
  // ============================================
  
  const testAICoaching = async () => {
    setStepStatus(prev => ({ ...prev, aiCoaching: 'testing' }))
    
    try {
      const headers = await getAuthHeaders()
      
      // Test with sample sales conversation that should trigger coaching
      const testTranscript = `[Seller]: Hi there! Thanks for having me today. I'm here to talk about our exterior coating solutions.
[Buyer]: Yes, we've been having issues with our house paint peeling. How much does this cost?
[Seller]: Great question! Before we get to pricing, let me tell you about our Cool Life Paint product...
[Buyer]: I appreciate that, but I really just need to know the price. We're getting other quotes.`
      
      const response = await axios.post(`${API_URL}/api/ai-agent/analyze`, {
        transcript: testTranscript,
        duration_seconds: 300,
        seller_words: 45,
        buyer_words: 35,
        seller_percentage: 56
      }, { headers })
      
      console.log('AI Response:', response.data)
      
      // API call succeeded - mark as success even if no insight
      if (response.data) {
        if (response.data.insight) {
          setInsights([response.data.insight])
          setCurrentInsight(response.data.insight)
        }
        setStepStatus(prev => ({ ...prev, aiCoaching: 'success' }))
        console.log('✅ Step 3: AI Coaching working')
        return true
      } else {
        throw new Error('No response from API')
      }
      
    } catch (err) {
      console.error('❌ Step 3: AI Coaching error:', err)
      setStepStatus(prev => ({ ...prev, aiCoaching: 'error' }))
      return false
    }
  }

  // ============================================
  // STEP 4: Test TTS
  // ============================================
  
  const testTTS = async () => {
    setStepStatus(prev => ({ ...prev, tts: 'testing' }))
    
    try {
      const headers = await getAuthHeaders()
      
      const response = await axios.post(`${API_URL}/api/tts`, {
        text: 'בדיקת מערכת. שלום, אני ה-AI Coach שלך.'
      }, { headers })
      
      if (response.data?.audio_url) {
        const audio = new Audio(`${API_URL}${response.data.audio_url}`)
        await audio.play()
        setStepStatus(prev => ({ ...prev, tts: 'success' }))
        console.log('✅ Step 4: TTS working')
        return true
      } else {
        throw new Error('No audio URL returned')
      }
      
    } catch (err) {
      console.error('❌ Step 4: TTS error:', err)
      setStepStatus(prev => ({ ...prev, tts: 'error' }))
      return false
    }
  }

  // ============================================
  // Full Start Session
  // ============================================
  
  const startSession = async () => {
    // Reset state and refs
    setTranscript([])
    setLiveText('')
    setInsights([])
    setCurrentInsight(null)
    setDuration(0)
    setSellerWords(0)
    setBuyerWords(0)
    fullTranscriptRef.current = ''
    sellerWordsRef.current = 0
    buyerWordsRef.current = 0
    durationRef.current = 0
    
    // Step 1: Microphone
    const micOk = await testMicrophone()
    if (!micOk) return
    
    // Step 2: Transcription via WebSocket
    const transcriptionOk = await testTranscription()
    if (!transcriptionOk) return
    
    // Start timer
    setIsRecording(true)
    timerRef.current = setInterval(() => {
      durationRef.current += 1
      setDuration(durationRef.current)
    }, 1000)
    
    // EVENT-BASED coaching - no interval needed!
    // Analysis happens automatically when new transcript chunks arrive
    console.log('🎯 Event-based coaching active - will trigger only when needed')
  }
  
  const stopSession = async () => {
    console.log('🛑 Stopping session...')
    
    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    
    // Stop AI analysis interval
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current)
      analysisIntervalRef.current = null
    }
    
    // Stop audio processor
    if (processorRef.current) {
      try {
        processorRef.current.disconnect()
      } catch (e) {
        console.log('Processor already disconnected')
      }
      processorRef.current = null
    }
    
    // Stop transcription via Socket.IO
    if (socketRef.current) {
      socketRef.current.emit('stop_transcription')
      socketRef.current.disconnect()
      socketRef.current = null
    }
    
    // Stop stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    
    // Save session to Supabase for post-call analysis
    if (fullTranscriptRef.current && durationRef.current > 10) {
      await saveSessionToSupabase()
    }
    
    setIsRecording(false)
    setConnectionStatus('disconnected')
    console.log('✅ Session stopped')
  }
  
  // Save live session to Supabase for post-call analysis
  const saveSessionToSupabase = async () => {
    try {
      console.log('💾 Saving session to Supabase...')
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('No user logged in, skipping save')
        return
      }
      
      // Create call record in Supabase (use correct column names from schema)
      const callData = {
        user_id: user.id,
        file_name: `live_session_${new Date().toISOString().replace(/[:.]/g, '-')}`,
        duration_seconds: durationRef.current,
        transcription: fullTranscriptRef.current,
        status: 'completed',
        word_count: sellerWordsRef.current + buyerWordsRef.current,
        speakers_count: 2
      }
      
      const { data: call, error: callError } = await supabase
        .from('calls')
        .insert(callData)
        .select()
        .single()
      
      if (callError) {
        console.error('Error saving call:', callError)
        return
      }
      
      console.log('✅ Call saved:', call.id)
      
      // Save insights if any
      if (insights.length > 0) {
        const insightsData = insights.map(insight => ({
          call_id: call.id,
          insight_type: insight.insight_type || 'coaching_tip',
          content: insight.coaching_message,
          suggested_response: insight.suggested_response,
          priority: insight.priority,
          created_at: new Date().toISOString()
        }))
        
        const { error: insightsError } = await supabase
          .from('live_insights')
          .insert(insightsData)
        
        if (insightsError) {
          console.error('Error saving insights:', insightsError)
        } else {
          console.log('✅ Insights saved:', insights.length)
        }
      }
      
      // Trigger full analysis like regular uploaded calls
      try {
        const headers = await getAuthHeaders()
        await axios.post(`${API_URL}/api/analyze/${call.id}`, {}, { headers })
        console.log('✅ Full analysis triggered for call:', call.id)
      } catch (analysisErr) {
        console.log('Analysis will run in background')
      }
      
    } catch (err) {
      console.error('Error saving session:', err)
    }
  }
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSession()
    }
  }, [])
  
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // ============================================
  // Step Status Component
  // ============================================
  
  const StepStatusIcon = ({ status }) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />
      case 'testing':
        return <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-600" />
    }
  }

  // ============================================
  // RENDER
  // ============================================
  
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
                <Brain className="w-5 h-5 text-violet-400" />
                AI Agent - Live Coach
              </h1>
              <p className="text-sm text-gray-400">אימון מכירות בזמן אמת</p>
            </div>
          </div>
          
          {isRecording && (
            <div className="flex items-center gap-4">
              <div className="px-4 py-2 rounded-xl bg-red-500/20 text-red-400 font-mono text-lg animate-pulse flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                {formatDuration(duration)}
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 p-6">
        {!isRecording ? (
          /* Setup / Test Mode */
          <div className="max-w-2xl mx-auto space-y-6">
            
            {/* Step Checklist */}
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6">
              <h2 className="text-lg font-bold text-white mb-4">בדיקת מערכת</h2>
              
              <div className="space-y-4">
                {/* Step 1 */}
                <div className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-xl">
                  <StepStatusIcon status={stepStatus.recording} />
                  <div className="flex-1">
                    <p className="text-white font-medium">שלב 1: גישה למיקרופון</p>
                    <p className="text-sm text-gray-400">בדיקת הרשאות הקלטה</p>
                  </div>
                  <button
                    onClick={testMicrophone}
                    disabled={stepStatus.recording === 'testing'}
                    className="px-4 py-2 bg-violet-500/20 text-violet-400 rounded-lg hover:bg-violet-500/30 transition-colors disabled:opacity-50"
                  >
                    בדוק
                  </button>
                </div>
                
                {/* Audio Level Indicator */}
                {stepStatus.recording === 'success' && (
                  <div className="px-4 py-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <div className="flex items-center gap-3">
                      <Mic className="w-5 h-5 text-emerald-400" />
                      <div className="flex-1">
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 transition-all duration-75"
                            style={{ width: `${Math.min(audioLevel, 100)}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm text-emerald-400">רמת קול: {Math.round(audioLevel)}</span>
                    </div>
                  </div>
                )}
                
                {/* Step 2 */}
                <div className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-xl">
                  <StepStatusIcon status={stepStatus.transcription} />
                  <div className="flex-1">
                    <p className="text-white font-medium">שלב 2: תמלול בזמן אמת</p>
                    <p className="text-sm text-gray-400">AssemblyAI + Speaker Detection</p>
                  </div>
                  <button
                    onClick={testTranscription}
                    disabled={stepStatus.recording !== 'success' || stepStatus.transcription === 'testing'}
                    className="px-4 py-2 bg-violet-500/20 text-violet-400 rounded-lg hover:bg-violet-500/30 transition-colors disabled:opacity-50"
                  >
                    בדוק
                  </button>
                </div>
                
                {/* Step 3 */}
                <div className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-xl">
                  <StepStatusIcon status={stepStatus.aiCoaching} />
                  <div className="flex-1">
                    <p className="text-white font-medium">שלב 3: AI Coaching</p>
                    <p className="text-sm text-gray-400">ניתוח שיחה בזמן אמת</p>
                  </div>
                  <button
                    onClick={testAICoaching}
                    disabled={stepStatus.aiCoaching === 'testing'}
                    className="px-4 py-2 bg-violet-500/20 text-violet-400 rounded-lg hover:bg-violet-500/30 transition-colors disabled:opacity-50"
                  >
                    בדוק
                  </button>
                </div>
                
                {/* Step 4 */}
                <div className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-xl">
                  <StepStatusIcon status={stepStatus.tts} />
                  <div className="flex-1">
                    <p className="text-white font-medium">שלב 4: קול לאוזנייה</p>
                    <p className="text-sm text-gray-400">טקסט לדיבור (TTS)</p>
                  </div>
                  <button
                    onClick={testTTS}
                    disabled={stepStatus.tts === 'testing'}
                    className="px-4 py-2 bg-violet-500/20 text-violet-400 rounded-lg hover:bg-violet-500/30 transition-colors disabled:opacity-50"
                  >
                    בדוק
                  </button>
                </div>
              </div>
            </div>
            
            {/* Audio Mode Selection */}
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Headphones className="w-5 h-5 text-violet-400" />
                מצב אודיו
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'off', label: 'כבוי', desc: 'ללא קול' },
                  { id: 'smart', label: 'חכם', desc: 'רק דחוף' },
                  { id: 'on', label: 'מלא', desc: 'כל הטיפים' }
                ].map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => setAudioMode(mode.id)}
                    className={`p-4 rounded-xl border-2 transition-colors ${
                      audioMode === mode.id
                        ? 'border-violet-500 bg-violet-500/20'
                        : 'border-slate-600 bg-slate-900/50 hover:border-slate-500'
                    }`}
                  >
                    <p className="text-white font-medium">{mode.label}</p>
                    <p className="text-sm text-gray-400">{mode.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Start Button */}
            <button
              onClick={startSession}
              disabled={stepStatus.recording !== 'success'}
              className="w-full py-4 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-2xl font-bold text-lg transition-colors flex items-center justify-center gap-3"
            >
              <Phone className="w-6 h-6" />
              התחל שיחה
            </button>
            
          </div>
        ) : (
          /* Recording Mode - Fixed Height Layout with Call Phase Progress */
          <div className="flex flex-col gap-4" style={{ height: 'calc(100vh - 140px)' }}>
            
            {/* TOP BAR: Timer, Phase Progress, Talk Ratio */}
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-4">
              <div className="flex items-center justify-between gap-6">
                {/* Timer */}
                <div className="flex items-center gap-3">
                  <div className="px-4 py-2 rounded-xl bg-red-500/20 text-red-400 font-mono text-xl flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    {formatDuration(duration)}
                  </div>
                </div>
                
                {/* Call Phase Progress Bar */}
                <div className="flex-1">
                  <div className="flex items-center gap-1">
                    {[
                      { name: 'ICE', min: 0, color: 'bg-blue-500' },
                      { name: 'BENEFITS', min: 20, color: 'bg-cyan-500' },
                      { name: 'PRODUCT', min: 40, color: 'bg-violet-500' },
                      { name: 'COMPANY', min: 60, color: 'bg-purple-500' },
                      { name: 'PRICE', min: 75, color: 'bg-orange-500' },
                      { name: 'CLOSE', min: 90, color: 'bg-emerald-500' }
                    ].map((phase, idx) => {
                      const minutes = Math.floor(duration / 60)
                      const isActive = minutes >= phase.min && (idx === 5 || minutes < [20, 40, 60, 75, 90, 999][idx])
                      const isPast = minutes >= [20, 40, 60, 75, 90, 999][idx]
                      
                      return (
                        <div key={phase.name} className="flex-1 flex flex-col items-center gap-1">
                          <div className={`h-2 w-full rounded-full transition-all ${
                            isActive ? `${phase.color} animate-pulse` : 
                            isPast ? phase.color : 'bg-slate-700'
                          }`} />
                          <span className={`text-[10px] font-medium ${
                            isActive ? 'text-white' : isPast ? 'text-gray-400' : 'text-gray-600'
                          }`}>{phase.name}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
                
                {/* Talk Ratio */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-gray-400">יחס דיבור</p>
                    <p className={`text-sm font-bold ${
                      (sellerWords + buyerWords) > 0 && (sellerWords / (sellerWords + buyerWords)) > 0.65 
                        ? 'text-orange-400' 
                        : 'text-emerald-400'
                    }`}>
                      {(sellerWords + buyerWords) > 0 
                        ? `${Math.round((sellerWords / (sellerWords + buyerWords)) * 100)}%` 
                        : '50%'}
                    </p>
                  </div>
                  <div className="w-24 h-3 bg-slate-700 rounded-full overflow-hidden flex">
                    <div 
                      className={`h-full transition-all ${
                        (sellerWords + buyerWords) > 0 && (sellerWords / (sellerWords + buyerWords)) > 0.65 
                          ? 'bg-orange-500' 
                          : 'bg-violet-500'
                      }`}
                      style={{ 
                        width: `${(sellerWords + buyerWords) > 0 
                          ? Math.round((sellerWords / (sellerWords + buyerWords)) * 100) 
                          : 50}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* MAIN CONTENT: Transcript + Coach Panel */}
            <div className="flex gap-4 flex-1 min-h-0">
              {/* Left: Transcript */}
              <div className="flex-1 bg-slate-800/50 rounded-2xl border border-slate-700/50 flex flex-col min-h-0">
                {/* Connection Status */}
                <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      connectionStatus === 'connected' ? 'bg-emerald-500 animate-pulse' :
                      connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                      'bg-red-500'
                    }`} />
                    <span className="text-sm text-gray-400">
                      {connectionStatus === 'connected' ? '🎤 מתמלל בזמן אמת' :
                       connectionStatus === 'connecting' ? '⏳ מתחבר...' : '❌ מנותק'}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">{transcript.length} קטעים</span>
                </div>
                
                {/* Transcript - Scrollable */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                  {transcript.length === 0 && !liveText ? (
                    <div className="text-center py-20 text-gray-500">
                      <Mic className="w-12 h-12 mx-auto mb-4 opacity-50 animate-pulse" />
                      <p>מתחיל להקליט...</p>
                      <p className="text-sm mt-2">דבר למיקרופון</p>
                    </div>
                  ) : (
                    <>
                      {transcript.map((chunk, index) => (
                        <div key={index} className={`p-3 rounded-xl bg-slate-900/50 border-l-4 ${
                          chunk.speaker === 'Buyer' ? 'border-emerald-500' : 'border-violet-500'
                        }`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-xs font-medium ${
                              chunk.speaker === 'Buyer' ? 'text-emerald-400' : 'text-violet-400'
                            }`}>{chunk.speaker === 'Buyer' ? '🟢 לקוח' : '🟣 מוכר'}</span>
                            <span className="text-xs text-gray-500">{formatDuration(chunk.timestamp)}</span>
                          </div>
                          <p className="text-white text-sm" dir="auto">{chunk.text}</p>
                        </div>
                      ))}
                      
                      {liveText && (
                        <div className={`p-3 rounded-xl border-l-4 animate-pulse ${
                          currentSpeaker === 'Buyer' 
                            ? 'bg-emerald-500/10 border-emerald-400' 
                            : 'bg-violet-500/10 border-violet-400'
                        }`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-medium ${
                              currentSpeaker === 'Buyer' ? 'text-emerald-400' : 'text-violet-400'
                            }`}>{currentSpeaker === 'Buyer' ? '🟢 לקוח' : '🟣 מוכר'} (מדבר...)</span>
                          </div>
                          <p className={`text-sm ${
                            currentSpeaker === 'Buyer' ? 'text-emerald-300' : 'text-violet-300'
                          }`} dir="auto">{liveText}</p>
                        </div>
                      )}
                      
                      <div ref={transcriptEndRef} />
                    </>
                  )}
                </div>
              </div>
              
              {/* Right: AI Coach Panel - Fixed width */}
              <div className="w-96 bg-slate-800/50 rounded-2xl border border-slate-700/50 flex flex-col min-h-0">
                <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
                  <h3 className="text-white font-medium flex items-center gap-2">
                    <Brain className="w-5 h-5 text-violet-400" />
                    AI Coach
                  </h3>
                  <span className="text-xs text-gray-500">
                    {insights.length > 0 ? `${insights.length} טיפים` : 'מאזין...'}
                  </span>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                  {insights.length > 0 ? (
                    <>
                      {/* Show insights - newest first (already reversed in state) */}
                      {insights.map((insight, index) => (
                        <div key={index} className={`p-4 rounded-xl border transition-all ${
                          index === 0 
                            ? insight.priority === 'urgent' 
                              ? 'bg-red-500/20 border-red-500/50 animate-pulse' 
                              : insight.priority === 'high'
                                ? 'bg-orange-500/20 border-orange-500/50'
                                : 'bg-violet-500/20 border-violet-500/50'
                            : 'bg-slate-900/50 border-slate-700/50 opacity-60'
                        }`}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                              insight.priority === 'urgent' ? 'bg-red-500/40 text-red-300' :
                              insight.priority === 'high' ? 'bg-orange-500/40 text-orange-300' :
                              'bg-violet-500/40 text-violet-300'
                            }`}>
                              {insight.priority === 'urgent' ? '🔴 דחוף' : 
                               insight.priority === 'high' ? '🟠 חשוב' : '🟣 טיפ'}
                            </span>
                            {index === 0 && <Zap className="w-4 h-4 text-yellow-400 animate-pulse" />}
                          </div>
                          
                          <p className="text-white text-sm mb-3 font-medium">{insight.coaching_message}</p>
                          
                          {insight.suggested_response && (
                            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                              <p className="text-xs text-emerald-400 mb-1 flex items-center gap-1">
                                <MessageCircle className="w-3 h-3" /> תגיד:
                              </p>
                              <p className="text-emerald-300 text-sm" dir="auto">"{insight.suggested_response}"</p>
                            </div>
                          )}
                          
                          {insight.technique && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                              <BookOpen className="w-3 h-3" />
                              {insight.technique}
                              {insight.story && ` → ${insight.story}`}
                            </div>
                          )}
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700/50 flex items-center justify-center">
                        <Sparkles className="w-8 h-8 opacity-50" />
                      </div>
                      <p className="text-sm font-medium">מאזין לשיחה...</p>
                      <p className="text-xs mt-2 text-gray-600">
                        טיפים יופיעו רק כשיש צורך אמיתי
                      </p>
                    </div>
                  )}
                </div>
                
                {/* End Call Button */}
                <div className="p-4 border-t border-slate-700/50">
                  <button
                    onClick={stopSession}
                    className="w-full py-3 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <PhoneOff className="w-5 h-5" />
                    סיים שיחה
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
