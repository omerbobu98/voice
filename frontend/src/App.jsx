import { useState, useEffect, useRef } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { 
  Upload, Users, MessageSquare, Clock, FileAudio, CheckCircle2, Mic, Brain, UserCheck,
  BarChart3, TrendingUp, AlertTriangle, Target, Zap, Phone, PlayCircle, PauseCircle,
  ChevronRight, Sparkles, Shield, Award, PieChart, Activity, Volume2, Home, History,
  Settings, User, Menu, X, ChevronDown, Calendar, Hash, LogOut, FileDown
} from 'lucide-react'
import axios from 'axios'
import { useAuth } from './contexts/AuthContext'
import { supabase } from './lib/supabase'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AdminDashboard from './pages/AdminDashboard'
import AdminCallsPage from './pages/AdminCallsPage'
import AdminCallView from './pages/AdminCallView'
import { API_URL } from './lib/config'

const stages = [
  { key: 'upload', label: 'Uploading', icon: Upload, progress: 10 },
  { key: 'queue', label: 'In Queue', icon: Clock, progress: 25 },
  { key: 'transcribe', label: 'Transcribing', icon: Mic, progress: 50 },
  { key: 'speakers', label: 'Identifying Speakers', icon: Users, progress: 75 },
  { key: 'classify', label: 'Analyzing Roles', icon: Brain, progress: 90 },
  { key: 'complete', label: 'Complete', icon: CheckCircle2, progress: 100 },
]

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'upload', label: 'New Call', icon: Upload },
  { id: 'calls', label: 'Call History', icon: History },
  { id: 'settings', label: 'Settings', icon: Settings },
]

const upcomingFeatures = [
  { icon: BarChart3, title: 'Talk-to-Listen Ratio', description: 'Analyze speaking time distribution', status: 'coming' },
  { icon: AlertTriangle, title: 'Objection Detection', description: 'Identify and categorize objections', status: 'coming' },
  { icon: Target, title: 'MEDDIC/BANT Scoring', description: 'Score calls against sales methodologies', status: 'coming' },
  { icon: TrendingUp, title: 'Deal Risk Score', description: 'Predict deal success probability', status: 'coming' },
  { icon: Award, title: 'Rep Performance', description: 'Benchmark against top performers', status: 'coming' },
  { icon: Zap, title: 'AI Coaching', description: 'Get personalized improvement tips', status: 'coming' },
]

// Helper to get auth headers for API calls
const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token 
    ? { Authorization: `Bearer ${session.access_token}` }
    : {}
}

// TTS Audio Player Component - Mini player for text-to-speech
function TTSPlayer({ text, label = "🔊 Listen", onPlay, onStop }) {
  const [loading, setLoading] = useState(false)
  const [audioUrl, setAudioUrl] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef(null)

  const playAudio = () => {
    if (audioRef.current) {
      // Notify parent to stop main audio
      if (onPlay) onPlay()
      audioRef.current.play()
      setPlaying(true)
    }
  }

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setPlaying(false)
      setCurrentTime(0)
      if (onStop) onStop()
    }
  }

  const togglePlay = () => {
    if (playing) {
      audioRef.current.pause()
      setPlaying(false)
    } else {
      playAudio()
    }
  }

  const generateAudio = async () => {
    if (audioUrl) {
      togglePlay()
      return
    }

    setLoading(true)
    try {
      const response = await axios.post(`${API_URL}/api/tts`, { 
        text,
        voice: 'nova'
      })
      const fullUrl = `${API_URL}${response.data.audio_url}`
      setAudioUrl(fullUrl)
      
      // Auto-play after generation
      setTimeout(() => {
        playAudio()
      }, 100)
    } catch (err) {
      console.error('TTS error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  const handleEnded = () => {
    setPlaying(false)
    setCurrentTime(0)
  }

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    if (audioRef.current && duration > 0) {
      audioRef.current.currentTime = percent * duration
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="mt-3 sm:mt-4">
      {!audioUrl ? (
        <button
          onClick={generateAudio}
          disabled={loading}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 rounded-xl transition-all text-sm sm:text-base font-medium disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4" />
              <span>{label}</span>
            </>
          )}
        </button>
      ) : (
        <div className="bg-black/30 rounded-xl p-3 border border-violet-500/20">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Play/Pause Button */}
            <button
              onClick={togglePlay}
              className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform flex-shrink-0"
            >
              {playing ? (
                <PauseCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              ) : (
                <PlayCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              )}
            </button>
            
            {/* Stop Button */}
            <button
              onClick={stopAudio}
              className="w-9 h-9 sm:w-10 sm:h-10 bg-red-500/20 hover:bg-red-500/30 rounded-full flex items-center justify-center transition-colors flex-shrink-0 border border-red-500/30"
              title="Stop"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
            </button>
            
            {/* Progress Bar */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-violet-300">AI Voice</span>
                <span className="text-xs text-gray-400 font-mono">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
              <div 
                className="h-2 bg-white/10 rounded-full cursor-pointer overflow-hidden"
                onClick={handleSeek}
              >
                <div 
                  className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all"
                  style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
          <audio
            ref={audioRef}
            src={audioUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleEnded}
            className="hidden"
          />
        </div>
      )}
    </div>
  )
}

// Floating Audio Control - Shows when audio is playing for easy stop access
function FloatingAudioControl({ isPlaying, currentTime, duration, onStop, onTogglePlay, label = "Call Audio" }) {
  if (!isPlaying && currentTime === 0) return null

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-black/90 backdrop-blur-xl rounded-2xl p-3 sm:p-4 border border-violet-500/30 shadow-2xl shadow-violet-500/20 w-[calc(100%-2rem)] max-w-md">
      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <button
          onClick={onTogglePlay}
          className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform flex-shrink-0"
        >
          {isPlaying ? (
            <PauseCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          ) : (
            <PlayCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          )}
        </button>
        
        {/* Progress Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-violet-300 truncate">{label}</span>
            <span className="text-xs text-gray-400 font-mono flex-shrink-0 ml-2">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        
        {/* Stop Button */}
        <button
          onClick={onStop}
          className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500/20 hover:bg-red-500/30 rounded-full flex items-center justify-center transition-colors flex-shrink-0 border border-red-500/30"
          title="Stop"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" />
        </button>
      </div>
    </div>
  )
}

// PDF Download Button Component
function PDFDownloadButton({ analysisResult, fileName = 'call_analysis' }) {
  const [loading, setLoading] = useState(false)

  const downloadPDF = async () => {
    if (!analysisResult) return
    
    setLoading(true)
    try {
      const response = await axios.post(
        `${API_URL}/api/generate-pdf`,
        {
          analysis_data: analysisResult,
          file_name: fileName
        },
        {
          responseType: 'blob'
        }
      )
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${fileName}_report.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('PDF download error:', err)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={downloadPDF}
      disabled={loading || !analysisResult}
      className="px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white rounded-xl transition-all font-medium flex items-center gap-2 text-sm sm:text-base disabled:opacity-50 shadow-lg shadow-emerald-500/20"
    >
      {loading ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span className="hidden sm:inline">Generating...</span>
        </>
      ) : (
        <>
          <FileDown className="w-4 h-4" />
          <span className="hidden sm:inline">Download PDF</span>
          <span className="sm:hidden">PDF</span>
        </>
      )}
    </button>
  )
}

function MainApp() {
  const { user, signOut } = useAuth()
  
  // Navigation state
  const [activeTab, setActiveTab] = useState('upload')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Admin state
  const [isAdmin, setIsAdmin] = useState(false)
  const [userRole, setUserRole] = useState('user')
  
  // Dashboard state
  const [dashboardStats, setDashboardStats] = useState(null)
  const [dashboardLoading, setDashboardLoading] = useState(false)
  
  // Calls history state
  const [callsList, setCallsList] = useState([])
  const [callsLoading, setCallsLoading] = useState(false)
  const [selectedCall, setSelectedCall] = useState(null)
  
  // Upload state
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState('')
  const [elapsedTime, setElapsedTime] = useState(0)
  const [jobId, setJobId] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [analysisStage, setAnalysisStage] = useState('')
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [audioPlaying, setAudioPlaying] = useState(false)
  const [audioCurrentTime, setAudioCurrentTime] = useState(0)
  const [audioDuration, setAudioDuration] = useState(0)
  const timerRef = useRef(null)
  const pollRef = useRef(null)
  const audioRef = useRef(null)

  // Seek audio to specific timestamp (in milliseconds)
  const seekToTime = (timeMs) => {
    if (audioRef.current) {
      audioRef.current.currentTime = timeMs / 1000
      if (!audioPlaying) {
        audioRef.current.play()
        setAudioPlaying(true)
      }
    }
  }

  const toggleAudioPlayback = () => {
    if (audioRef.current) {
      if (audioPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setAudioPlaying(!audioPlaying)
    }
  }

  // Stop main audio (used when TTS plays)
  const stopMainAudio = () => {
    if (audioRef.current && audioPlaying) {
      audioRef.current.pause()
      setAudioPlaying(false)
    }
  }

  // Completely stop and reset main audio
  const stopAndResetMainAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setAudioPlaying(false)
      setAudioCurrentTime(0)
    }
  }

  const formatAudioTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Check if user is admin on mount
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const headers = await getAuthHeaders()
        const response = await axios.get(`${API_URL}/api/admin/check`, { headers })
        setIsAdmin(response.data.is_admin)
        setUserRole(response.data.role || 'user')
      } catch (err) {
        console.error('Error checking admin status:', err)
        setIsAdmin(false)
      }
    }
    checkAdminStatus()
  }, [user])

  // Fetch dashboard stats when tab changes
  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboard()
    } else if (activeTab === 'calls') {
      fetchCalls()
    }
  }, [activeTab])

  const fetchDashboard = async () => {
    setDashboardLoading(true)
    try {
      const headers = await getAuthHeaders()
      const response = await axios.get(`${API_URL}/api/dashboard`, { headers })
      setDashboardStats(response.data)
    } catch (err) {
      console.error('Error fetching dashboard:', err)
    }
    setDashboardLoading(false)
  }

  const fetchCalls = async () => {
    setCallsLoading(true)
    try {
      const headers = await getAuthHeaders()
      const response = await axios.get(`${API_URL}/api/calls`, { headers })
      setCallsList(response.data)
    } catch (err) {
      console.error('Error fetching calls:', err)
    }
    setCallsLoading(false)
  }

  const viewCall = async (callId) => {
    try {
      const headers = await getAuthHeaders()
      const response = await axios.get(`${API_URL}/api/calls/${callId}`, { headers })
      setSelectedCall(response.data)
      
      // Map database fields to UI expected format
      const callData = response.data.call
      const mappedResult = {
        ...callData,
        audio_duration: callData.duration_seconds || 0,
        utterances: callData.utterances || [],
        speaker_roles: callData.speaker_roles || {},
        speakers_count: callData.speakers_count || 0,
        word_count: callData.word_count || 0,
        transcription: callData.transcription || '',
        call_id: callData.id
      }
      setResult(mappedResult)
      setJobId(callData.id) // Set jobId for potential re-analysis
      
      if (response.data.analysis) {
        setAnalysisResult({ 
          metrics: response.data.analysis.metrics || {}, 
          analysis: response.data.analysis.analysis || {} 
        })
        setShowAnalysis(true)
      } else {
        setShowAnalysis(false)
        setAnalysisResult(null)
      }
      setActiveTab('upload')
    } catch (err) {
      console.error('Error fetching call:', err)
    }
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  const startTimer = () => {
    setElapsedTime(0)
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1)
    }, 1000)
  }

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError(null)
      setResult(null)
      setProgress(0)
      setStage('')
    }
  }

  const pollStatus = async (jobId) => {
    try {
      const response = await axios.get(`${API_URL}/api/status/${jobId}`)
      const data = response.data

      setProgress(data.progress)
      setStage(data.stage)

      if (data.status === 'completed') {
        clearInterval(pollRef.current)
        stopTimer()
        setResult(data.result)
        setLoading(false)
      } else if (data.status === 'error') {
        clearInterval(pollRef.current)
        stopTimer()
        setError(data.error)
        setLoading(false)
      }
    } catch (err) {
      console.error('Polling error:', err)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Please select an audio file')
      return
    }

    const formData = new FormData()
    formData.append('audio', file)

    setLoading(true)
    setError(null)
    setResult(null)
    setProgress(5)
    setStage('Uploading file...')
    startTimer()

    try {
      const headers = await getAuthHeaders()
      const response = await axios.post(`${API_URL}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', ...headers },
      })

      const newJobId = response.data.job_id
      setJobId(newJobId)
      pollRef.current = setInterval(() => pollStatus(newJobId), 1000)

    } catch (err) {
      stopTimer()
      setError(err.response?.data?.error || 'Failed to process audio file')
      setLoading(false)
    }
  }

  const handleAnalyze = async () => {
    if (!jobId) return
    
    setAnalyzing(true)
    setAnalysisResult(null)
    setAnalysisProgress(0)
    setAnalysisStage('Starting analysis...')
    startTimer()

    try {
      const headers = await getAuthHeaders()
      const response = await axios.post(`${API_URL}/api/analyze/${jobId}`, {}, { headers })
      const analysisId = response.data.analysis_id
      
      const pollAnalysis = setInterval(async () => {
        try {
          const statusRes = await axios.get(`${API_URL}/api/status/${analysisId}`)
          const data = statusRes.data
          
          setAnalysisProgress(data.progress)
          setAnalysisStage(data.stage)
          
          if (data.status === 'completed') {
            clearInterval(pollAnalysis)
            stopTimer()
            setAnalysisResult(data.result)
            setAnalyzing(false)
            setShowAnalysis(true)
          } else if (data.status === 'error') {
            clearInterval(pollAnalysis)
            stopTimer()
            setError(data.error)
            setAnalyzing(false)
          }
        } catch (err) {
          console.error('Analysis polling error:', err)
        }
      }, 1000)
      
    } catch (err) {
      stopTimer()
      setError(err.response?.data?.error || 'Failed to start analysis')
      setAnalyzing(false)
    }
  }

  const formatTime = (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const formatElapsed = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}m ${secs}s`
  }

  const getRoleBadgeColor = (role) => {
    if (role === 'Seller') return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
    if (role === 'Buyer') return 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white'
    return 'bg-gray-200 text-gray-700'
  }

  const getRoleBgColor = (role) => {
    if (role === 'Seller') return 'bg-blue-50 border-l-4 border-blue-500'
    if (role === 'Buyer') return 'bg-emerald-50 border-l-4 border-emerald-500'
    return 'bg-gray-50 border-l-4 border-gray-300'
  }

  const getCurrentStageIndex = () => {
    if (progress >= 100) return 5
    if (progress >= 85) return 4
    if (progress >= 75) return 3
    if (progress >= 30) return 2
    if (progress >= 20) return 1
    return 0
  }

  // Render Dashboard View
  const renderDashboard = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Dashboard</h2>
      
      {dashboardLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : dashboardStats ? (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-2xl p-5 border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <Phone className="w-5 h-5 text-violet-400" />
                <span className="text-gray-500 text-sm">Total Calls</span>
              </div>
              <p className="text-4xl font-bold text-white">{dashboardStats.total_calls || 0}</p>
            </div>
            <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-2xl p-5 border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-5 h-5 text-blue-400" />
                <span className="text-gray-500 text-sm">Avg Duration</span>
              </div>
              <p className="text-4xl font-bold text-white">{formatDuration(dashboardStats.avg_duration_seconds || 0)}</p>
            </div>
            <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-2xl p-5 border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-5 h-5 text-emerald-400" />
                <span className="text-gray-500 text-sm">Avg Score</span>
              </div>
              <p className="text-4xl font-bold text-white">{dashboardStats.avg_overall_score || 0}<span className="text-lg text-gray-500">/100</span></p>
            </div>
            <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-2xl p-5 border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <Volume2 className="w-5 h-5 text-fuchsia-400" />
                <span className="text-gray-500 text-sm">Talk Ratio</span>
              </div>
              <p className="text-4xl font-bold text-white">{dashboardStats.avg_seller_talk_pct || 50}<span className="text-lg text-gray-500">%</span></p>
            </div>
          </div>

          {/* Second Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Objections */}
            <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
                Top Objections
              </h3>
              {Object.keys(dashboardStats.objection_counts || {}).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(dashboardStats.objection_counts).slice(0, 5).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-gray-300 capitalize">{type}</span>
                      <span className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded-full text-sm">{count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No objections recorded yet</p>
              )}
            </div>

            {/* Areas to Improve */}
            <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                Areas to Improve
              </h3>
              {(dashboardStats.improvement_areas || []).length > 0 ? (
                <ul className="space-y-2">
                  {dashboardStats.improvement_areas.map(([area, count], i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-300">
                      <ChevronRight className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
                      {area}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">Analyze more calls to see improvement areas</p>
              )}
            </div>
          </div>

          {/* Risk Distribution */}
          <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-2xl p-6 border border-white/10">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-violet-400" />
              Deal Risk Distribution
            </h3>
            <div className="flex gap-4">
              <div className="flex-1 text-center p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <p className="text-3xl font-bold text-emerald-400">{dashboardStats.risk_distribution?.low || 0}</p>
                <p className="text-sm text-gray-500">Low Risk</p>
              </div>
              <div className="flex-1 text-center p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                <p className="text-3xl font-bold text-yellow-400">{dashboardStats.risk_distribution?.medium || 0}</p>
                <p className="text-sm text-gray-500">Medium Risk</p>
              </div>
              <div className="flex-1 text-center p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                <p className="text-3xl font-bold text-red-400">{dashboardStats.risk_distribution?.high || 0}</p>
                <p className="text-sm text-gray-500">High Risk</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-20">
          <p className="text-gray-500">No data available. Upload and analyze calls to see stats.</p>
        </div>
      )}
    </div>
  )

  // Render Calls History View
  const renderCallsHistory = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Call History</h2>
        <button
          onClick={() => setActiveTab('upload')}
          className="px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-xl font-medium flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          New Call
        </button>
      </div>

      {callsLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : callsList.length > 0 ? (
        <div className="space-y-3">
          {callsList.map((call) => (
            <div
              key={call.id}
              onClick={() => viewCall(call.id)}
              className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-2xl p-5 border border-white/10 cursor-pointer hover:border-violet-500/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-violet-500/20 rounded-xl flex items-center justify-center">
                    <Phone className="w-6 h-6 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{call.file_name}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(call.duration_seconds || 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {call.speakers_count} speakers
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(call.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    call.status === 'analyzed' 
                      ? 'bg-emerald-500/20 text-emerald-400' 
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {call.status === 'analyzed' ? 'Analyzed' : 'Transcribed'}
                  </span>
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-2xl border border-white/10">
          <Phone className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500">No calls yet</p>
          <button
            onClick={() => setActiveTab('upload')}
            className="mt-4 px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-xl font-medium"
          >
            Upload First Call
          </button>
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      {/* Floating Audio Control - Shows when main audio is playing */}
      <FloatingAudioControl
        isPlaying={audioPlaying}
        currentTime={audioCurrentTime}
        duration={audioDuration}
        onStop={stopAndResetMainAudio}
        onTogglePlay={toggleAudioPlayback}
        label={result?.file_name || "Call Audio"}
      />

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:relative inset-y-0 left-0 z-50 w-64
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        bg-black/95 lg:bg-black/40 border-r border-white/10 flex flex-col transition-all duration-300
      `}>
        {/* Logo */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">SalesAI</h1>
              <p className="text-xs text-gray-500">Conversation Intelligence</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      setActiveTab(item.id)
                      setMobileMenuOpen(false)
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      isActive
                        ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>

          {/* Admin Section */}
          {isAdmin && (
            <div className="mt-6 pt-4 border-t border-white/10">
              <p className="px-4 text-xs text-gray-600 uppercase tracking-wider mb-2">Admin</p>
              <ul className="space-y-2">
                <li>
                  <a
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-gray-400 hover:text-white hover:bg-white/5"
                  >
                    <Shield className="w-5 h-5 flex-shrink-0 text-violet-400" />
                    <span className="font-medium">Admin Panel</span>
                  </a>
                </li>
              </ul>
            </div>
          )}
        </nav>

        {/* User & Logout */}
        <div className="p-4 border-t border-white/10 space-y-2">
          {user && (
            <div className="px-4 py-2 text-xs text-gray-500 truncate">
              {user.email}
            </div>
          )}
          <button
            onClick={() => {
              signOut()
              setMobileMenuOpen(false)
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Logout</span>
          </button>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-400 hover:text-white transition-colors lg:hidden"
          >
            <X className="w-5 h-5" />
            <span className="text-sm">Close Menu</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl sticky top-0 z-30">
          <div className="px-4 sm:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 text-gray-400 hover:text-white lg:hidden"
              >
                <Menu className="w-6 h-6" />
              </button>
              <h2 className="text-lg font-semibold text-white capitalize">
                {navItems.find(n => n.id === activeTab)?.label || 'SalesAI'}
              </h2>
            </div>
            <span className="px-3 py-1 bg-violet-500/20 text-violet-400 rounded-full text-xs font-medium">Beta</span>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'calls' && renderCallsHistory()}
          {activeTab === 'settings' && (
            <div className="text-center py-20">
              <Settings className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500">Settings coming soon</p>
            </div>
          )}
          {activeTab === 'upload' && (
            <>
              {!loading && !result && (
                <>
              {/* Hero Section */}
              <div className="text-center mb-8 sm:mb-12">
                <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-full mb-4 sm:mb-6">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  <span className="text-xs sm:text-sm text-violet-300">Powered by GPT-5.2 & AssemblyAI</span>
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                  Analyze Your Sales Calls
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
                    Like Never Before
                  </span>
                </h2>
                <p className="text-base sm:text-xl text-gray-400 max-w-2xl mx-auto px-4">
                  AI-powered transcription with automatic speaker identification and role classification
                </p>
              </div>

              {/* Upload Card */}
              <div className="max-w-2xl mx-auto mb-8 sm:mb-16">
                <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-white/10 shadow-2xl">
                  <label className="block cursor-pointer group">
                    <div className="relative border-2 border-dashed border-white/20 rounded-2xl p-6 sm:p-12 text-center hover:border-violet-500/50 hover:bg-violet-500/5 transition-all duration-300">
                      <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 via-violet-500/5 to-fuchsia-500/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative">
                        <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-violet-500/25">
                          <Upload className="w-10 h-10 text-white" />
                        </div>
                        <p className="text-lg text-white mb-2">
                          <span className="hidden sm:inline">Drop your audio file here or </span>
                          <span className="text-violet-400 font-semibold">
                            <span className="sm:hidden">Tap to select audio file</span>
                            <span className="hidden sm:inline">browse</span>
                          </span>
                        </p>
                        <p className="text-sm text-gray-500">
                          Supports MP3, WAV, M4A, and more
                        </p>
                        {/* Mobile-friendly button */}
                        <div className="sm:hidden mt-4">
                          <span className="inline-flex items-center gap-2 px-6 py-3 bg-violet-500/20 border border-violet-500/30 rounded-xl text-violet-300 font-medium">
                            <Upload className="w-5 h-5" />
                            Choose File
                          </span>
                        </div>
                        {file && (
                          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span className="text-emerald-300 font-medium">{file.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="audio/*,audio/mpeg,audio/mp3,audio/wav,audio/m4a,audio/aac,audio/ogg,audio/webm,.mp3,.wav,.m4a,.aac,.ogg,.webm,.flac,.wma"
                      onChange={handleFileChange} 
                    />
                  </label>

                  <button
                    onClick={handleUpload}
                    disabled={!file}
                    className="w-full mt-6 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white py-4 px-8 rounded-xl font-semibold text-lg hover:from-violet-500 hover:to-fuchsia-500 disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 flex items-center justify-center gap-3"
                  >
                    <Zap className="w-5 h-5" />
                    Analyze Call
                  </button>

                  {error && (
                    <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                      {error}
                    </div>
                  )}
                </div>
              </div>

              {/* Features Grid */}
              <div className="mb-8 sm:mb-16">
                <div className="text-center mb-6 sm:mb-8">
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Coming Soon</h3>
                  <p className="text-sm sm:text-base text-gray-500">Advanced features in development</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {upcomingFeatures.map((feature, index) => {
                    const Icon = feature.icon
                    return (
                      <div
                        key={index}
                        className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 hover:bg-white/[0.05] hover:border-violet-500/30 transition-all duration-300 group"
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:from-violet-500/30 group-hover:to-fuchsia-500/30 transition-colors">
                          <Icon className="w-6 h-6 text-violet-400" />
                        </div>
                        <h4 className="text-white font-semibold mb-1">{feature.title}</h4>
                        <p className="text-sm text-gray-500">{feature.description}</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-gray-600">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 sm:w-5 h-4 sm:h-5" />
                  <span className="text-xs sm:text-sm">Enterprise Security</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 sm:w-5 h-4 sm:h-5" />
                  <span className="text-xs sm:text-sm">Real-time Processing</span>
                </div>
                <div className="flex items-center gap-2">
                  <Brain className="w-4 sm:w-5 h-4 sm:h-5" />
                  <span className="text-xs sm:text-sm">GPT-5.2 Powered</span>
                </div>
              </div>
            </>
          )}

          {loading && (
            <div className="max-w-3xl mx-auto">
              <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-2xl sm:rounded-3xl p-4 sm:p-10 border border-white/10 shadow-2xl">
                {/* Timer */}
                <div className="text-center mb-6 sm:mb-10">
                  <div className="inline-flex items-center gap-4 px-8 py-4 bg-violet-500/10 border border-violet-500/20 rounded-2xl mb-6">
                    <div className="w-12 h-12 bg-violet-500/20 rounded-full flex items-center justify-center">
                      <Clock className="w-6 h-6 text-violet-400 animate-pulse" />
                    </div>
                    <span className="text-4xl font-mono font-bold text-white tracking-wider">
                      {formatElapsed(elapsedTime)}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">{stage}</h2>
                  <p className="text-gray-500">Analyzing your sales conversation...</p>
                </div>

                {/* Progress Bar */}
                <div className="mb-10">
                  <div className="flex justify-between text-sm mb-3">
                    <span className="text-gray-400">Processing</span>
                    <span className="text-violet-400 font-semibold">{progress}%</span>
                  </div>
                  <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-500 ease-out relative"
                      style={{ width: `${progress}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
                    </div>
                  </div>
                </div>

                {/* Stage Indicators */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
                  {stages.map((s, index) => {
                    const currentIndex = getCurrentStageIndex()
                    const isActive = index === currentIndex
                    const isCompleted = index < currentIndex
                    const Icon = s.icon

                    return (
                      <div
                        key={s.key}
                        className={`flex flex-col items-center p-2 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-300 ${
                          isActive
                            ? 'bg-violet-500/20 border border-violet-500/30 scale-105'
                            : isCompleted
                            ? 'bg-emerald-500/10 border border-emerald-500/20'
                            : 'bg-white/[0.02] border border-white/5'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3 ${
                            isActive
                              ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/30'
                              : isCompleted
                              ? 'bg-emerald-500'
                              : 'bg-white/5'
                          }`}
                        >
                          <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive || isCompleted ? 'text-white' : 'text-gray-600'}`} />
                        </div>
                        <span className={`text-[10px] sm:text-xs text-center font-medium ${isActive ? 'text-violet-300' : isCompleted ? 'text-emerald-400' : 'text-gray-600'}`}>
                          {s.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Analyzing State */}
          {analyzing && (
            <div className="max-w-3xl mx-auto">
              <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-3xl p-10 border border-white/10 shadow-2xl">
                <div className="text-center mb-10">
                  <div className="inline-flex items-center gap-4 px-8 py-4 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-2xl mb-6">
                    <div className="w-12 h-12 bg-fuchsia-500/20 rounded-full flex items-center justify-center">
                      <Brain className="w-6 h-6 text-fuchsia-400 animate-pulse" />
                    </div>
                    <span className="text-4xl font-mono font-bold text-white tracking-wider">
                      {formatElapsed(elapsedTime)}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">{analysisStage}</h2>
                  <p className="text-gray-500">AI Sales Coach is analyzing your conversation...</p>
                </div>
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-3">
                    <span className="text-gray-400">Deep Analysis</span>
                    <span className="text-fuchsia-400 font-semibold">{analysisProgress}%</span>
                  </div>
                  <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-fuchsia-500 to-violet-500 rounded-full transition-all duration-500 ease-out relative"
                      style={{ width: `${analysisProgress}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {result && !analyzing && !showAnalysis && (
            <div className="space-y-6">
              {/* Call Name Header (for saved calls) */}
              {selectedCall && (
                <div className="flex items-center gap-4 mb-2">
                  <button
                    onClick={() => {
                      setSelectedCall(null)
                      setResult(null)
                      setActiveTab('calls')
                    }}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-gray-300 rounded-xl transition-colors font-medium flex items-center gap-2"
                  >
                    ← Back to History
                  </button>
                  <h1 className="text-xl font-bold text-white">{result.file_name}</h1>
                </div>
              )}
              
              {/* Stats Header */}
              <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-3xl p-6 border border-white/10">
                <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                    {selectedCall ? 'Call Details' : 'Transcription Complete'}
                  </h2>
                  <div className="flex gap-3">
                    <button
                      onClick={handleAnalyze}
                      className="px-6 py-3 bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-500 hover:to-violet-500 text-white rounded-xl transition-all font-semibold flex items-center gap-2 shadow-lg shadow-fuchsia-500/20"
                    >
                      <Brain className="w-5 h-5" />
                      Analyze Call
                    </button>
                    <button
                      onClick={() => {
                        setResult(null)
                        setFile(null)
                        setProgress(0)
                        setElapsedTime(0)
                        setJobId(null)
                        setAnalysisResult(null)
                        setShowAnalysis(false)
                      }}
                      className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-gray-300 rounded-xl transition-colors font-medium flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      New Upload
                    </button>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5">
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="w-5 h-5 text-violet-400" />
                      <span className="text-gray-500 text-sm">Speakers</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{result.speakers_count}</p>
                  </div>
                  <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5">
                    <div className="flex items-center gap-3 mb-2">
                      <MessageSquare className="w-5 h-5 text-blue-400" />
                      <span className="text-gray-500 text-sm">Segments</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{result.utterances.length}</p>
                  </div>
                  <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5">
                    <div className="flex items-center gap-3 mb-2">
                      <Clock className="w-5 h-5 text-fuchsia-400" />
                      <span className="text-gray-500 text-sm">Duration</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{result.audio_duration > 0 ? formatDuration(result.audio_duration) : '--'}</p>
                  </div>
                  <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5">
                    <div className="flex items-center gap-3 mb-2">
                      <Activity className="w-5 h-5 text-emerald-400" />
                      <span className="text-gray-500 text-sm">Words</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{result.word_count || '--'}</p>
                  </div>
                </div>

                {/* Speaker Roles */}
                <div className="flex flex-wrap gap-3">
                  {Object.entries(result.speaker_roles).map(([speaker, role]) => (
                    <div
                      key={speaker}
                      className={`px-5 py-3 rounded-xl font-semibold flex items-center gap-3 ${
                        role === 'Seller' 
                          ? 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-500/30 text-blue-300' 
                          : role === 'Buyer'
                          ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30 text-emerald-300'
                          : 'bg-gray-500/20 border border-gray-500/30 text-gray-300'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        role === 'Seller' ? 'bg-blue-500' : role === 'Buyer' ? 'bg-emerald-500' : 'bg-gray-500'
                      }`}>
                        <UserCheck className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs opacity-70">Speaker {speaker}</p>
                        <p className="font-bold">{role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Audio Player */}
              {result.audio_url && (
                <div className="bg-gradient-to-b from-violet-500/10 to-white/[0.02] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-violet-500/20">
                  <div className="flex items-center gap-3 sm:gap-4 mb-4">
                    <button
                      onClick={toggleAudioPlayback}
                      className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-full flex items-center justify-center shadow-lg shadow-violet-500/30 hover:scale-105 transition-transform flex-shrink-0"
                    >
                      {audioPlaying ? (
                        <PauseCircle className="w-8 h-8 text-white" />
                      ) : (
                        <PlayCircle className="w-8 h-8 text-white" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-semibold">Call Recording</span>
                        <span className="text-gray-400 text-sm font-mono">
                          {formatAudioTime(audioCurrentTime)} / {formatAudioTime(audioDuration)}
                        </span>
                      </div>
                      <div 
                        className="h-2 bg-white/10 rounded-full cursor-pointer overflow-hidden"
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect()
                          const percent = (e.clientX - rect.left) / rect.width
                          if (audioRef.current) {
                            audioRef.current.currentTime = percent * audioDuration
                          }
                        }}
                      >
                        <div 
                          className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all"
                          style={{ width: `${audioDuration > 0 ? (audioCurrentTime / audioDuration) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <audio
                    ref={audioRef}
                    src={result.audio_url}
                    onTimeUpdate={(e) => setAudioCurrentTime(e.target.currentTime)}
                    onLoadedMetadata={(e) => setAudioDuration(e.target.duration)}
                    onEnded={() => setAudioPlaying(false)}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-500 mt-2">💡 Click on any transcript segment or timeline event to jump to that moment</p>
                </div>
              )}

              {/* Transcription */}
              <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/10">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-3">
                  <Mic className="w-5 h-5 text-violet-400" />
                  Full Transcription
                </h3>
                <div className="space-y-2 sm:space-y-3 max-h-[400px] sm:max-h-[600px] overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
                  {result.utterances.map((utterance, index) => {
                    const role = result.speaker_roles[utterance.speaker] || 'Unknown'
                    const isSeller = role === 'Seller'
                    return (
                      <div
                        key={index}
                        onClick={() => result.audio_url && seekToTime(utterance.start)}
                        className={`flex gap-2 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-200 hover:scale-[1.005] ${
                          result.audio_url ? 'cursor-pointer' : ''
                        } ${
                          isSeller 
                            ? 'bg-blue-500/5 border border-blue-500/10 hover:border-blue-500/30 hover:bg-blue-500/10' 
                            : 'bg-emerald-500/5 border border-emerald-500/10 hover:border-emerald-500/30 hover:bg-emerald-500/10'
                        }`}
                      >
                        <div className="flex-shrink-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            isSeller ? 'bg-blue-500' : 'bg-emerald-500'
                          }`}>
                            <span className="text-white font-bold text-sm">{utterance.speaker}</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <span className={`text-sm font-semibold ${isSeller ? 'text-blue-400' : 'text-emerald-400'}`}>
                              {role}
                            </span>
                            <button 
                              className={`text-xs font-mono px-2 py-0.5 rounded ${result.audio_url ? 'bg-white/10 hover:bg-white/20 text-violet-400' : 'text-gray-600'}`}
                              onClick={(e) => {
                                e.stopPropagation()
                                if (result.audio_url) seekToTime(utterance.start)
                              }}
                            >
                              {formatTime(utterance.start)}
                            </button>
                          </div>
                          <p className="text-gray-300 leading-relaxed">{utterance.text}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Analysis Results View */}
          {showAnalysis && analysisResult && (
            <div className="space-y-6">
              {/* Back to History (for saved calls) */}
              {selectedCall && (
                <div className="flex items-center gap-4 mb-2">
                  <button
                    onClick={() => {
                      setSelectedCall(null)
                      setResult(null)
                      setShowAnalysis(false)
                      setAnalysisResult(null)
                      setActiveTab('calls')
                    }}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-gray-300 rounded-xl transition-colors font-medium flex items-center gap-2"
                  >
                    ← Back to History
                  </button>
                  <h1 className="text-xl font-bold text-white">{result?.file_name}</h1>
                </div>
              )}
              
              {/* Premium Header with Key Metrics Dashboard */}
              <div className="bg-gradient-to-br from-violet-900/40 via-fuchsia-900/30 to-cyan-900/20 rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-violet-500/20 shadow-2xl shadow-violet-500/10">
                {/* Top Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30">
                      <Brain className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-white">Sales Analysis Report</h2>
                      <p className="text-xs sm:text-sm text-gray-400">{result?.file_name || 'Call Analysis'}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => setShowAnalysis(false)}
                      className="px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl transition-all text-sm border border-white/10"
                    >
                      ← Back
                    </button>
                    <PDFDownloadButton analysisResult={analysisResult} fileName={result?.file_name} />
                    <button
                      onClick={() => {
                        setResult(null)
                        setFile(null)
                        setJobId(null)
                        setAnalysisResult(null)
                        setShowAnalysis(false)
                      }}
                      className="px-3 py-2 bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 rounded-xl transition-all text-sm border border-violet-500/30"
                    >
                      <Upload className="w-4 h-4 inline mr-1" />
                      New
                    </button>
                  </div>
                </div>

                {/* Key Metrics Dashboard - Clean Design */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  {/* Overall Score */}
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                    <div className="text-xs text-slate-400 uppercase tracking-wide mb-2">Performance</div>
                    <div className="text-3xl font-bold text-indigo-400">
                      {analysisResult.analysis?.seller_performance?.overall_score || 0}
                    </div>
                  </div>
                  
                  {/* Buying Readiness */}
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                    <div className="text-xs text-slate-400 uppercase tracking-wide mb-2">Buying Ready</div>
                    <div className="text-3xl font-bold text-indigo-400">
                      {analysisResult.analysis?.customer_interest?.buying_readiness || 0}%
                    </div>
                  </div>
                  
                  {/* Objections Count */}
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                    <div className="text-xs text-slate-400 uppercase tracking-wide mb-2">Objections</div>
                    <div className="text-3xl font-bold text-indigo-400">
                      {analysisResult.analysis?.objections?.length || 0}
                    </div>
                  </div>
                  
                  {/* Risk Level */}
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                    <div className="text-xs text-slate-400 uppercase tracking-wide mb-2">Risk Level</div>
                    <div className={`text-xl font-bold ${
                      analysisResult.analysis?.deal_risk_score?.risk_level === 'low' ? 'text-emerald-400' :
                      analysisResult.analysis?.deal_risk_score?.risk_level === 'medium' ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {(analysisResult.analysis?.deal_risk_score?.risk_level || 'N/A').toUpperCase()}
                    </div>
                  </div>
                </div>

                {/* Call Outcome - Clean */}
                {analysisResult.analysis?.call_summary && (
                  <div className="mt-4 p-4 bg-slate-800/30 rounded-xl border border-slate-700/30">
                    <div className="flex items-start gap-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        analysisResult.analysis.call_summary.outcome === 'positive' ? 'bg-emerald-500/20 text-emerald-400' :
                        analysisResult.analysis.call_summary.outcome === 'neutral' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {analysisResult.analysis.call_summary.outcome?.toUpperCase()}
                      </span>
                      <p className="text-sm text-slate-300 flex-1">{analysisResult.analysis.call_summary.one_liner}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Audio Player - Clean Design */}
              {result?.audio_url && (
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={toggleAudioPlayback}
                      className="w-12 h-12 bg-indigo-500 hover:bg-indigo-600 rounded-full flex items-center justify-center transition-colors flex-shrink-0"
                    >
                      {audioPlaying ? (
                        <PauseCircle className="w-6 h-6 text-white" />
                      ) : (
                        <PlayCircle className="w-6 h-6 text-white" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-200 font-medium text-sm">Call Recording</span>
                        <span className="text-slate-400 text-xs font-mono">
                          {formatAudioTime(audioCurrentTime)} / {formatAudioTime(audioDuration)}
                        </span>
                      </div>
                      <div 
                        className="h-1.5 bg-slate-700 rounded-full cursor-pointer overflow-hidden"
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect()
                          const percent = (e.clientX - rect.left) / rect.width
                          if (audioRef.current) {
                            audioRef.current.currentTime = percent * audioDuration
                          }
                        }}
                      >
                        <div 
                          className="h-full bg-indigo-500 rounded-full transition-all"
                          style={{ width: `${audioDuration > 0 ? (audioCurrentTime / audioDuration) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <audio
                    ref={audioRef}
                    src={result.audio_url}
                    onTimeUpdate={(e) => setAudioCurrentTime(e.target.currentTime)}
                    onLoadedMetadata={(e) => setAudioDuration(e.target.duration)}
                    onEnded={() => setAudioPlaying(false)}
                    className="hidden"
                  />
                </div>
              )}

              {/* Visual Timeline */}
              {analysisResult.analysis?.timeline_events?.length > 0 && (
                <div className="bg-gradient-to-b from-cyan-500/5 to-transparent rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-cyan-500/10 backdrop-blur-sm">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
                      <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    Call Timeline
                    <span className="ml-auto text-xs sm:text-sm font-normal text-gray-500">{analysisResult.analysis.timeline_events.length} events</span>
                  </h3>
                  <div className="relative">
                    {/* Timeline bar */}
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-violet-500 via-fuchsia-500 to-cyan-500" />
                    
                    <div className="space-y-4">
                      {analysisResult.analysis.timeline_events.map((event, i) => {
                        const eventColors = {
                          discovery_question: { bg: 'bg-cyan-500', border: 'border-cyan-500/30', text: 'text-cyan-400', label: '🔍 Discovery' },
                          diagnose: { bg: 'bg-blue-500', border: 'border-blue-500/30', text: 'text-blue-400', label: '🩺 Diagnose' },
                          closing_attempt: { bg: 'bg-emerald-500', border: 'border-emerald-500/30', text: 'text-emerald-400', label: '🎯 Closing' },
                          rapport_building: { bg: 'bg-pink-500', border: 'border-pink-500/30', text: 'text-pink-400', label: '🤝 Rapport' },
                          value_proposition: { bg: 'bg-amber-500', border: 'border-amber-500/30', text: 'text-amber-400', label: '💎 Value Prop' },
                          objection: { bg: 'bg-red-500', border: 'border-red-500/30', text: 'text-red-400', label: '⚠️ Objection' },
                          pain_point: { bg: 'bg-orange-500', border: 'border-orange-500/30', text: 'text-orange-400', label: '😣 Pain Point' },
                          commitment: { bg: 'bg-green-500', border: 'border-green-500/30', text: 'text-green-400', label: '✅ Commitment' },
                          next_step: { bg: 'bg-violet-500', border: 'border-violet-500/30', text: 'text-violet-400', label: '➡️ Next Step' },
                        }
                        const colors = eventColors[event.type] || { bg: 'bg-gray-500', border: 'border-gray-500/30', text: 'text-gray-400', label: event.type }
                        
                        return (
                          <div 
                            key={i} 
                            className={`relative pl-14 cursor-pointer group`}
                            onClick={() => {
                              if (result?.audio_url && event.timestamp_ms) {
                                seekToTime(event.timestamp_ms)
                              }
                            }}
                          >
                            {/* Timeline dot */}
                            <div className={`absolute left-4 w-5 h-5 rounded-full ${colors.bg} border-4 border-[#0a0a0f] group-hover:scale-125 transition-transform`} />
                            
                            <div className={`p-4 rounded-2xl bg-white/[0.03] border ${colors.border} group-hover:bg-white/[0.06] transition-all`}>
                              <div className="flex items-center gap-3 mb-2">
                                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${colors.bg}/20 ${colors.text}`}>
                                  {colors.label}
                                </span>
                                <span className={`text-xs font-mono ${colors.text}`}>{event.timestamp}</span>
                                <span className={`text-xs px-2 py-0.5 rounded ${event.speaker === 'Seller' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                  {event.speaker}
                                </span>
                              </div>
                              <p className="text-gray-300 text-sm">"{event.content}"</p>
                              {event.significance && (
                                <p className="text-gray-500 text-xs mt-2 italic">{event.significance}</p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Call Summary - Hidden since shown in header */}

              {/* Customer Interest Analysis - Clean Design */}
              {analysisResult.analysis?.customer_interest && (
                <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                  <h3 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
                    <Target className="w-4 h-4 text-indigo-400" />
                    Customer Interest
                  </h3>
                  
                  {/* Interest Level & Readiness */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Interest Level</p>
                      <p className={`text-lg font-bold ${
                        analysisResult.analysis.customer_interest.overall_level === 'high' ? 'text-emerald-400' :
                        analysisResult.analysis.customer_interest.overall_level === 'medium' ? 'text-amber-400' :
                        'text-red-400'
                      }`}>
                        {analysisResult.analysis.customer_interest.overall_level?.toUpperCase()}
                      </p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Buying Readiness</p>
                      <p className="text-lg font-bold text-indigo-400">
                        {analysisResult.analysis.customer_interest.buying_readiness || 0}%
                      </p>
                    </div>
                  </div>

                  {/* What They Want */}
                  {analysisResult.analysis.customer_interest.what_they_want && (
                    <div className="mb-4">
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">What They Want</p>
                      <p className="text-sm text-slate-300">{analysisResult.analysis.customer_interest.what_they_want}</p>
                    </div>
                  )}

                  {/* Main Concerns */}
                  {analysisResult.analysis.customer_interest.main_concerns?.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Main Concerns</p>
                      <ul className="space-y-1">
                        {analysisResult.analysis.customer_interest.main_concerns.map((concern, i) => (
                          <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                            <span className="text-amber-400 mt-1">•</span> {concern}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Interest & Hesitation Signals */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {analysisResult.analysis.customer_interest.interest_signals?.length > 0 && (
                      <div>
                        <p className="text-xs text-emerald-400 uppercase tracking-wide mb-2">Interest Signals</p>
                        <ul className="space-y-1">
                          {analysisResult.analysis.customer_interest.interest_signals.map((signal, i) => (
                            <li key={i} className="text-xs text-slate-400">• {signal}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {analysisResult.analysis.customer_interest.hesitation_signals?.length > 0 && (
                      <div>
                        <p className="text-xs text-red-400 uppercase tracking-wide mb-2">Hesitation Signals</p>
                        <ul className="space-y-1">
                          {analysisResult.analysis.customer_interest.hesitation_signals.map((signal, i) => (
                            <li key={i} className="text-xs text-slate-400">• {signal}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Scores Grid - Clean Design */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Overall Score */}
                {analysisResult.analysis?.seller_performance && (
                  <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 text-center">
                    <h3 className="text-sm font-medium text-slate-400 mb-3">Seller Performance</h3>
                    <div className="text-4xl font-bold text-indigo-400 mb-1">
                      {analysisResult.analysis.seller_performance.overall_score || 0}
                    </div>
                    <p className="text-slate-500 text-xs">out of 100</p>
                  </div>
                )}

                {/* MEDDIC Score */}
                {analysisResult.analysis?.meddic_score && (
                  <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-slate-400">MEDDIC</h3>
                      <div className="text-xl font-bold text-indigo-400">{analysisResult.analysis.meddic_score.total_score || 0}%</div>
                    </div>
                    <div className="space-y-2">
                      {['metrics', 'economic_buyer', 'decision_criteria', 'decision_process', 'identify_pain', 'champion'].map(key => {
                        const item = analysisResult.analysis.meddic_score[key]
                        if (!item) return null
                        return (
                          <div key={key} className="flex items-center gap-2">
                            <div className="w-20 text-xs text-slate-500 capitalize truncate">{key.replace('_', ' ')}</div>
                            <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500 rounded-full" style={{width: `${item.score || 0}%`}} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* BANT Score */}
                {analysisResult.analysis?.bant_score && (
                  <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-slate-400">BANT</h3>
                      <div className={`text-sm font-semibold ${analysisResult.analysis.bant_score.overall_qualified ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {analysisResult.analysis.bant_score.overall_qualified ? 'Qualified' : 'Not Qualified'}
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {['budget', 'authority', 'need', 'timeline'].map(key => {
                        const item = analysisResult.analysis.bant_score[key]
                        if (!item) return null
                        return (
                          <div key={key} className={`p-2 rounded-lg text-center ${item.qualified ? 'bg-emerald-500/10' : 'bg-slate-700/50'}`}>
                            <div className="text-xs text-slate-500 capitalize">{key.charAt(0).toUpperCase()}</div>
                            <div className={`text-sm font-bold ${item.qualified ? 'text-emerald-400' : 'text-slate-500'}`}>
                              {item.qualified ? '✓' : '✗'}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Talk Ratio - Clean */}
              {analysisResult.metrics?.talk_ratio && (
                <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                  <h3 className="text-sm font-medium text-slate-400 mb-3">Talk-to-Listen Ratio</h3>
                  <div className="h-8 bg-slate-700 rounded-full overflow-hidden flex">
                    <div className="h-full bg-indigo-500 flex items-center justify-center text-xs font-medium text-white" style={{width: `${analysisResult.metrics.talk_ratio.seller_percentage}%`}}>
                      Seller {analysisResult.metrics.talk_ratio.seller_percentage}%
                    </div>
                    <div className="h-full bg-emerald-500 flex items-center justify-center text-xs font-medium text-white" style={{width: `${analysisResult.metrics.talk_ratio.buyer_percentage}%`}}>
                      Buyer {analysisResult.metrics.talk_ratio.buyer_percentage}%
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Ideal seller range: 40-60%</p>
                </div>
              )}

              {/* OBJECTIONS - Clean Design */}
              {analysisResult.analysis?.objections?.length > 0 && (
                <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                  <h3 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Objections ({analysisResult.analysis.objections.length})
                  </h3>
                  <div className="space-y-4">
                    {analysisResult.analysis.objections.map((obj, i) => (
                      <div 
                        key={i} 
                        className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30 hover:border-indigo-500/30 transition-all cursor-pointer"
                        onClick={() => {
                          if (result?.audio_url && obj.timestamp_ms) {
                            seekToTime(obj.timestamp_ms)
                          }
                        }}
                      >
                        {/* Header Row */}
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className="px-2 py-1 rounded text-xs font-medium bg-slate-700 text-slate-300">
                            {obj.type?.toUpperCase()?.replace('_', ' ') || 'OBJECTION'}
                          </span>
                          <button 
                            className="text-xs font-mono px-2 py-1 rounded bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-colors flex items-center gap-1"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (result?.audio_url && obj.timestamp_ms) seekToTime(obj.timestamp_ms)
                            }}
                          >
                            <PlayCircle className="w-3 h-3" /> {obj.timestamp}
                          </button>
                          <div className="ml-auto">
                            <span className={`text-sm font-bold ${
                              obj.handling_score >= 7 ? 'text-emerald-400' :
                              obj.handling_score >= 4 ? 'text-amber-400' :
                              'text-red-400'
                            }`}>{obj.handling_score}/10</span>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          {/* Customer Objection */}
                          <div 
                            className="p-3 bg-slate-800/50 rounded-lg border-l-2 border-red-400 cursor-pointer hover:bg-slate-800 transition-all"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (result?.audio_url && obj.timestamp_ms) seekToTime(obj.timestamp_ms)
                            }}
                          >
                            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Customer</p>
                            <p className="text-slate-200 text-sm">"{obj.buyer_statement}"</p>
                          </div>

                          {/* Real Concern */}
                          {obj.real_concern && (
                            <div 
                              className="p-3 bg-slate-800/50 rounded-lg border-l-2 border-amber-400"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Underlying Concern</p>
                              <p className="text-slate-300 text-sm">{obj.real_concern}</p>
                            </div>
                          )}
                          
                          {/* Seller's Response - Click to play original audio */}
                          <div 
                            className="p-3 sm:p-4 bg-blue-500/10 rounded-xl border-l-4 border-blue-500 cursor-pointer hover:bg-blue-500/20 transition-all group"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (result?.audio_url && obj.response_timestamp_ms) {
                                seekToTime(obj.response_timestamp_ms)
                              } else if (result?.audio_url && obj.timestamp_ms) {
                                // Fallback to objection timestamp + a few seconds
                                seekToTime(obj.timestamp_ms + 3000)
                              }
                            }}
                          >
                            <div className="flex items-center justify-between mb-1 sm:mb-2">
                              <p className="text-xs text-blue-400 font-semibold">💬 SELLER'S RESPONSE:</p>
                              {result?.audio_url && (
                                <span className="text-xs text-blue-400/60 group-hover:text-blue-400 flex items-center gap-1 transition-colors">
                                  <PlayCircle className="w-3 h-3" /> Play from call
                                </span>
                              )}
                            </div>
                            <p className="text-gray-300 text-sm sm:text-base">"{obj.seller_response}"</p>
                          </div>
                          
                          {/* Better Response - NO click to play original audio, only TTS */}
                          <div 
                            className="p-3 sm:p-4 bg-emerald-500/10 rounded-xl border-l-4 border-emerald-500"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <p className="text-xs text-emerald-400 mb-1 sm:mb-2 font-semibold">✨ BETTER RESPONSE:</p>
                            <p className="text-emerald-200 text-sm sm:text-lg font-medium">"{obj.better_response}"</p>
                            {obj.why_better && (
                              <p className="text-xs sm:text-sm text-gray-400 mt-2 sm:mt-3 italic">{obj.why_better}</p>
                            )}
                            {/* TTS Player for Better Response - Completely separate from call audio */}
                            <TTSPlayer text={obj.better_response} label="🔊 שמע תשובה" onPlay={stopAndResetMainAudio} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Closing Opportunities */}
              {analysisResult.analysis?.closing_opportunities?.length > 0 && (
                <div className="bg-gradient-to-b from-emerald-500/10 to-white/[0.02] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-emerald-500/20">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                    <Target className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                    Missed Closing Opportunities
                  </h3>
                  <div className="space-y-3 sm:space-y-4">
                    {analysisResult.analysis.closing_opportunities.map((opp, i) => (
                      <div 
                        key={i} 
                        className="bg-black/20 rounded-xl p-3 sm:p-4 border border-emerald-500/20 cursor-pointer hover:border-emerald-500/40 transition-all"
                        onClick={() => {
                          if (result?.audio_url && opp.timestamp_ms) seekToTime(opp.timestamp_ms)
                        }}
                      >
                        <div className="flex items-center gap-2 mb-2 sm:mb-3">
                          <button 
                            className="text-xs sm:text-sm font-mono px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors flex items-center gap-1"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (result?.audio_url && opp.timestamp_ms) seekToTime(opp.timestamp_ms)
                            }}
                          >
                            <PlayCircle className="w-3 h-3 sm:w-4 sm:h-4" /> {opp.timestamp}
                          </button>
                          <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded-lg text-xs">
                            {opp.close_type?.replace('_', ' ')?.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-400 mb-2">
                          <span className="text-cyan-400">Customer signal:</span> "{opp.customer_signal}"
                        </p>
                        <div className="p-3 bg-emerald-500/10 rounded-lg border-l-4 border-emerald-500">
                          <p className="text-xs text-emerald-400 font-semibold mb-1">💬 Suggested Close:</p>
                          <p className="text-sm sm:text-base text-emerald-200">"{opp.suggested_close}"</p>
                          {/* TTS Player for Suggested Close - Separate from call audio */}
                          <TTSPlayer text={opp.suggested_close} label="🔊 שמע סגירה" onPlay={stopAndResetMainAudio} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Storytelling Analysis */}
              {analysisResult.analysis?.storytelling_analysis?.length > 0 && (
                <div className="bg-gradient-to-b from-pink-500/10 to-white/[0.02] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-pink-500/20">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                    <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-pink-400" />
                    Storytelling Analysis ({analysisResult.analysis.storytelling_analysis.length})
                  </h3>
                  <div className="space-y-4 sm:space-y-6">
                    {analysisResult.analysis.storytelling_analysis.map((story, i) => (
                      <div 
                        key={i} 
                        className="bg-black/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/10 hover:border-pink-500/30 transition-all cursor-pointer"
                        onClick={() => {
                          if (result?.audio_url && story.timestamp_ms) seekToTime(story.timestamp_ms)
                        }}
                      >
                        {/* Header */}
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                          <span className="px-2 sm:px-3 py-1 bg-pink-500/20 text-pink-300 rounded-lg text-xs sm:text-sm font-bold">
                            {story.story_type?.replace('_', ' ')?.toUpperCase()}
                          </span>
                          <button 
                            className="text-xs sm:text-sm font-mono px-2 py-1 rounded bg-pink-500/20 text-pink-400 hover:bg-pink-500/30 transition-colors flex items-center gap-1"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (result?.audio_url && story.timestamp_ms) seekToTime(story.timestamp_ms)
                            }}
                          >
                            <PlayCircle className="w-3 h-3 sm:w-4 sm:h-4" /> {story.timestamp}
                          </button>
                          {story.storytelling_technique && (
                            <span className="px-2 py-1 bg-violet-500/20 text-violet-300 rounded-lg text-xs hidden sm:inline">
                              {story.storytelling_technique}
                            </span>
                          )}
                          <div className="ml-auto flex items-center gap-1 sm:gap-2">
                            <span className="text-xs text-gray-500 hidden sm:inline">Score:</span>
                            <span className={`text-base sm:text-lg font-bold ${
                              story.effectiveness_score >= 7 ? 'text-emerald-400' :
                              story.effectiveness_score >= 4 ? 'text-yellow-400' :
                              'text-red-400'
                            }`}>{story.effectiveness_score}/10</span>
                          </div>
                        </div>

                        {/* Intended Message */}
                        {story.intended_message && (
                          <div className="p-3 sm:p-4 bg-violet-500/10 rounded-xl border-l-4 border-violet-500 mb-3 sm:mb-4">
                            <p className="text-xs text-violet-400 font-semibold mb-1">🎯 המסר שרצית להעביר:</p>
                            <p className="text-sm sm:text-base text-gray-200">{story.intended_message}</p>
                          </div>
                        )}

                        {/* Original Story */}
                        <div className="p-3 sm:p-4 bg-gray-500/10 rounded-xl border-l-4 border-gray-500 mb-3 sm:mb-4">
                          <p className="text-xs text-gray-400 font-semibold mb-1 sm:mb-2">📖 הסיפור שסיפרת:</p>
                          <p className="text-sm sm:text-base text-gray-300">"{story.original_story}"</p>
                        </div>

                        {/* Issues */}
                        {story.issues?.length > 0 && (
                          <div className="p-3 sm:p-4 bg-orange-500/10 rounded-xl border-l-4 border-orange-500 mb-3 sm:mb-4">
                            <p className="text-xs text-orange-400 font-semibold mb-2">⚠️ מה לשפר:</p>
                            <ul className="space-y-1">
                              {story.issues.map((issue, j) => (
                                <li key={j} className="text-xs sm:text-sm text-gray-400 flex items-start gap-2">
                                  <span className="text-orange-400">•</span> {issue}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Improved Story */}
                        <div className="p-3 sm:p-4 bg-emerald-500/10 rounded-xl border-l-4 border-emerald-500">
                          <p className="text-xs text-emerald-400 font-semibold mb-1 sm:mb-2">✨ סיפור משופר (חזותי ומחבר):</p>
                          <p className="text-sm sm:text-base text-emerald-200 font-medium leading-relaxed">"{story.improved_story}"</p>
                          {story.why_better && (
                            <p className="text-xs sm:text-sm text-gray-400 mt-2 sm:mt-3 italic border-t border-emerald-500/20 pt-2 mt-2">
                              💡 {story.why_better}
                            </p>
                          )}
                          {/* TTS Player for Improved Story - Separate from call audio */}
                          <TTSPlayer text={story.improved_story} label="🔊 שמע סיפור" onPlay={stopAndResetMainAudio} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Better Responses */}
              {analysisResult.analysis?.better_responses?.length > 0 && (
                <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/10">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                    <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                    More Response Improvements
                  </h3>
                  <div className="space-y-4">
                    {analysisResult.analysis.better_responses.map((resp, i) => (
                      <div key={i} className="bg-white/[0.03] rounded-2xl p-5 border border-white/5">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="text-sm text-gray-500 font-mono">{resp.timestamp}</span>
                          <span className="px-3 py-1 bg-violet-500/20 text-violet-300 rounded-lg text-sm font-medium">{resp.technique_used}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 bg-gray-500/10 rounded-xl">
                            <p className="text-xs text-gray-400 mb-2">❌ Original:</p>
                            <p className="text-gray-400 line-through">"{resp.original_seller_statement}"</p>
                          </div>
                          <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                            <p className="text-xs text-emerald-400 mb-2">✅ Improved:</p>
                            <p className="text-emerald-200 font-medium">"{resp.improved_response}"</p>
                            {/* TTS Player for Improved Response - Separate from call audio */}
                            <TTSPlayer text={resp.improved_response} label="🔊 שמע" onPlay={stopAndResetMainAudio} />
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-3">{resp.expected_impact}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Coaching Suggestions */}
              {analysisResult.analysis?.coaching_suggestions?.length > 0 && (
                <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-3xl p-6 border border-white/10">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                    <Award className="w-5 h-5 text-yellow-400" />
                    Coaching Recommendations
                  </h3>
                  <div className="space-y-4">
                    {analysisResult.analysis.coaching_suggestions.map((sug, i) => (
                      <div key={i} className={`p-5 rounded-2xl border ${
                        sug.priority === 'high' ? 'bg-red-500/10 border-red-500/30' :
                        sug.priority === 'medium' ? 'bg-yellow-500/10 border-yellow-500/30' :
                        'bg-gray-500/10 border-gray-500/30'
                      }`}>
                        <div className="flex items-center gap-3 mb-3">
                          <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                            sug.priority === 'high' ? 'bg-red-500 text-white' :
                            sug.priority === 'medium' ? 'bg-yellow-500 text-black' :
                            'bg-gray-500 text-white'
                          }`}>{sug.priority?.toUpperCase()}</span>
                          <span className="text-sm text-gray-500 capitalize">{sug.area}</span>
                        </div>
                        <p className="text-gray-300 mb-3">{sug.suggested_change}</p>
                        {sug.example_script && (
                          <div className="p-4 bg-violet-500/10 rounded-xl border border-violet-500/20">
                            <p className="text-xs text-violet-400 mb-2">Example script:</p>
                            <p className="text-violet-200 italic">"{sug.example_script}"</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Deal Risk */}
              {analysisResult.analysis?.deal_risk_score && (
                <div className={`rounded-3xl p-6 border ${
                  analysisResult.analysis.deal_risk_score.risk_level === 'low' ? 'bg-emerald-500/10 border-emerald-500/30' :
                  analysisResult.analysis.deal_risk_score.risk_level === 'medium' ? 'bg-yellow-500/10 border-yellow-500/30' :
                  'bg-red-500/10 border-red-500/30'
                }`}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-3">
                      <Shield className="w-5 h-5" />
                      Deal Risk Assessment
                    </h3>
                    <div className={`px-5 py-2 rounded-xl text-lg font-bold ${
                      analysisResult.analysis.deal_risk_score.risk_level === 'low' ? 'bg-emerald-500 text-white' :
                      analysisResult.analysis.deal_risk_score.risk_level === 'medium' ? 'bg-yellow-500 text-black' :
                      'bg-red-500 text-white'
                    }`}>
                      {analysisResult.analysis.deal_risk_score.risk_level?.toUpperCase()} RISK
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-400 mb-3 font-semibold">⚠️ Risk Factors</p>
                      <ul className="space-y-2">
                        {analysisResult.analysis.deal_risk_score.risk_factors?.map((f, i) => (
                          <li key={i} className="text-red-400 flex items-start gap-2">
                            <span className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-3 font-semibold">✅ Positive Signals</p>
                      <ul className="space-y-2">
                        {analysisResult.analysis.deal_risk_score.positive_signals?.map((s, i) => (
                          <li key={i} className="text-emerald-400 flex items-start gap-2">
                            <span className="w-2 h-2 bg-emerald-400 rounded-full mt-2 flex-shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Next Steps */}
              {analysisResult.analysis?.next_steps_recommended?.length > 0 && (
                <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-3xl p-6 border border-white/10">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                    <ChevronRight className="w-5 h-5 text-blue-400" />
                    Recommended Next Steps
                  </h3>
                  <ul className="space-y-3">
                    {analysisResult.analysis.next_steps_recommended.map((step, i) => (
                      <li key={i} className="flex items-start gap-3 p-3 bg-blue-500/10 rounded-xl">
                        <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0">{i + 1}</span>
                        <span className="text-gray-300">{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
            </>
          )}
        </div>
      </main>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.05);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139,92,246,0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139,92,246,0.5);
        }
      `}</style>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/app" element={
        <ProtectedRoute>
          <MainApp />
        </ProtectedRoute>
      } />
      <Route path="/app/*" element={
        <ProtectedRoute>
          <MainApp />
        </ProtectedRoute>
      } />
      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/calls" element={
        <ProtectedRoute>
          <AdminCallsPage />
        </ProtectedRoute>
      } />
      <Route path="/admin/calls/:callId" element={
        <ProtectedRoute>
          <AdminCallView />
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
