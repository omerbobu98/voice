import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Dumbbell, Target, TrendingUp, Trophy, Flame, Zap, BookOpen, 
  ChevronRight, ChevronDown, ChevronUp, Clock, Calendar, Phone,
  CheckCircle2, Circle, Plus, Play, Sparkles, ArrowLeft, Search,
  Filter, BarChart3, Users, AlertTriangle, Lightbulb, RefreshCw,
  FileAudio, Timer, Award, Brain, Mic, Volume2, X, Menu
} from 'lucide-react'
import axios from 'axios'
import { API_URL } from '../lib/config'
import { supabase } from '../lib/supabase'

// Helper to get auth headers
const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token 
    ? { Authorization: `Bearer ${session.access_token}` }
    : {}
}

// Stats Card Component
function StatsCard({ icon: Icon, label, value, subValue, color = 'violet', trend }) {
  const colorClasses = {
    violet: 'from-violet-500/20 to-fuchsia-500/20 border-violet-500/30 text-violet-400',
    emerald: 'from-emerald-500/20 to-cyan-500/20 border-emerald-500/30 text-emerald-400',
    amber: 'from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-400',
    pink: 'from-pink-500/20 to-rose-500/20 border-pink-500/30 text-pink-400'
  }
  
  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-2xl p-4 sm:p-5 border backdrop-blur-sm`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-black/20 flex items-center justify-center`}>
          <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${colorClasses[color].split(' ').pop()}`} />
        </div>
        {trend && (
          <span className={`text-xs px-2 py-1 rounded-lg ${trend > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className="text-2xl sm:text-3xl font-bold text-white">{value}</p>
      <p className="text-sm text-slate-400 mt-1">{label}</p>
      {subValue && <p className="text-xs text-slate-500 mt-0.5">{subValue}</p>}
    </div>
  )
}

// Progress Ring
function ProgressRing({ progress, size = 80, strokeWidth = 6 }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress / 100) * circumference
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-slate-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#d946ef" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-white">{progress}%</span>
      </div>
    </div>
  )
}

// Call Card for Practice
function CallPracticeCard({ call, onGeneratePractice, onViewPractice, generating }) {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' })
  }
  
  const formatDuration = (seconds) => {
    if (!seconds) return '--:--'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-400 bg-emerald-500/20'
    if (score >= 60) return 'text-amber-400 bg-amber-500/20'
    return 'text-red-400 bg-red-500/20'
  }
  
  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 hover:border-slate-600/50 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <FileAudio className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <h3 className="font-medium text-slate-200 truncate">{call.file_name}</h3>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(call.created_at)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(call.duration_seconds)}
            </span>
            {call.overall_score && (
              <span className={`px-2 py-0.5 rounded-lg ${getScoreColor(call.overall_score)}`}>
                ציון: {call.overall_score}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          {call.has_practice ? (
            <>
              <div className="flex items-center gap-2">
                <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"
                    style={{ width: `${call.practice_progress}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400">{call.practice_progress}%</span>
              </div>
              <button
                onClick={() => onViewPractice(call)}
                className="px-3 py-1.5 bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" />
                המשך תרגול
              </button>
            </>
          ) : (
            <button
              onClick={() => onGeneratePractice(call)}
              disabled={generating === call.id}
              className="px-3 py-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {generating === call.id ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  מייצר...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  צור תרגול
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Practice Session Card
function PracticeSessionCard({ session, onView, onDelete }) {
  const [showMenu, setShowMenu] = useState(false)
  
  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' })
  }
  
  const getPriorityAreas = () => {
    const areas = session.practice_data?.practice_areas || []
    return areas.filter(a => a.priority === 'critical' || a.priority === 'high').slice(0, 3)
  }
  
  return (
    <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl border border-slate-700/50 overflow-hidden hover:border-violet-500/30 transition-all group">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-700/30">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-200 truncate mb-1">{session.call_name}</h3>
            <p className="text-xs text-slate-500 flex items-center gap-2">
              <Calendar className="w-3 h-3" />
              {formatDate(session.created_at)}
              <span className="w-1 h-1 bg-slate-600 rounded-full" />
              {session.total_exercises} תרגילים
            </p>
          </div>
          
          <ProgressRing progress={session.progress_percent} size={56} strokeWidth={5} />
        </div>
      </div>
      
      {/* Priority Areas */}
      <div className="p-4 sm:p-5">
        <p className="text-xs text-slate-500 mb-2">אזורים לשיפור:</p>
        <div className="flex flex-wrap gap-2">
          {getPriorityAreas().map((area, i) => (
            <span 
              key={i}
              className={`px-2 py-1 rounded-lg text-xs font-medium ${
                area.priority === 'critical' 
                  ? 'bg-red-500/20 text-red-400' 
                  : 'bg-orange-500/20 text-orange-400'
              }`}
            >
              {area.skill_name}
            </span>
          ))}
          {getPriorityAreas().length === 0 && (
            <span className="text-xs text-slate-500">אין אזורים קריטיים</span>
          )}
        </div>
      </div>
      
      {/* Actions */}
      <div className="px-4 pb-4 sm:px-5 sm:pb-5 flex gap-2">
        <button
          onClick={() => onView(session)}
          className="flex-1 py-2.5 bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Dumbbell className="w-4 h-4" />
          התחל תרגול
        </button>
        <button
          onClick={() => onDelete(session.id)}
          className="p-2.5 bg-slate-700/50 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-xl transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// Weakness Summary Card
function WeaknessSummaryCard({ weakness }) {
  const getScoreColor = (score) => {
    if (score >= 70) return 'text-emerald-400'
    if (score >= 50) return 'text-amber-400'
    return 'text-red-400'
  }
  
  return (
    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700/30">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
          <Target className="w-4 h-4 text-red-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-200">{weakness.skill}</p>
          <p className="text-xs text-slate-500">{weakness.count} שיחות</p>
        </div>
      </div>
      <span className={`text-lg font-bold ${getScoreColor(weakness.avg_score)}`}>
        {weakness.avg_score}
      </span>
    </div>
  )
}

// Main Practice Page Component
export default function PracticePage({ onBack }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('sessions') // sessions | calls
  const [stats, setStats] = useState(null)
  const [sessions, setSessions] = useState([])
  const [calls, setCalls] = useState([])
  const [generating, setGenerating] = useState(null)
  const [selectedSession, setSelectedSession] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPriority, setFilterPriority] = useState('all')
  
  useEffect(() => {
    fetchData()
  }, [])
  
  const fetchData = async () => {
    setLoading(true)
    try {
      const headers = await getAuthHeaders()
      
      const [statsRes, sessionsRes, callsRes] = await Promise.all([
        axios.get(`${API_URL}/api/practice-sessions/stats`, { headers }),
        axios.get(`${API_URL}/api/practice-sessions`, { headers }),
        axios.get(`${API_URL}/api/calls-for-practice`, { headers })
      ])
      
      setStats(statsRes.data)
      setSessions(sessionsRes.data)
      setCalls(callsRes.data)
    } catch (err) {
      console.error('Error fetching practice data:', err)
    } finally {
      setLoading(false)
    }
  }
  
  const generatePractice = async (call) => {
    setGenerating(call.id)
    try {
      const headers = await getAuthHeaders()
      
      // First, get the full call analysis
      const callRes = await axios.get(`${API_URL}/api/calls/${call.id}`, { headers })
      const analysis = callRes.data
      
      // Generate practice recommendations
      const practiceRes = await axios.post(`${API_URL}/api/generate-practice`, {
        analysis
      }, { headers })
      
      if (practiceRes.data.practice_recommendations) {
        // Save to database
        await axios.post(`${API_URL}/api/practice-sessions`, {
          call_id: call.id,
          call_name: call.file_name,
          practice_data: practiceRes.data.practice_recommendations
        }, { headers })
        
        // Refresh data
        fetchData()
      }
    } catch (err) {
      console.error('Error generating practice:', err)
    } finally {
      setGenerating(null)
    }
  }
  
  const viewPractice = (session) => {
    setSelectedSession(session)
  }
  
  const deletePractice = async (sessionId) => {
    if (!confirm('האם למחוק את מפגש התרגול הזה?')) return
    
    try {
      const headers = await getAuthHeaders()
      await axios.delete(`${API_URL}/api/practice-sessions/${sessionId}`, { headers })
      fetchData()
    } catch (err) {
      console.error('Error deleting practice session:', err)
    }
  }
  
  const filteredSessions = sessions.filter(s => {
    if (searchQuery && !s.call_name?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    return true
  })
  
  const filteredCalls = calls.filter(c => {
    if (searchQuery && !c.file_name?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    return true
  })
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 relative">
            <div className="absolute inset-0 rounded-full border-4 border-violet-500/20" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-violet-500 animate-spin" />
            <Dumbbell className="absolute inset-0 m-auto w-6 h-6 text-violet-400" />
          </div>
          <p className="text-slate-300 font-medium">טוען מרכז תרגול...</p>
        </div>
      </div>
    )
  }
  
  // If a session is selected, show the practice view
  if (selectedSession) {
    return (
      <PracticeSessionView 
        session={selectedSession} 
        onBack={() => {
          setSelectedSession(null)
          fetchData()
        }}
      />
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-slate-400" />
                </button>
              )}
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                <Dumbbell className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">מרכז תרגול</h1>
                <p className="text-xs sm:text-sm text-slate-400">שפר את מיומנויות המכירה שלך</p>
              </div>
            </div>
            
            <button
              onClick={fetchData}
              className="p-2.5 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl transition-colors"
            >
              <RefreshCw className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatsCard
            icon={Dumbbell}
            label="מפגשי תרגול"
            value={stats?.total_sessions || 0}
            color="violet"
          />
          <StatsCard
            icon={Target}
            label="תרגילים"
            value={stats?.total_exercises || 0}
            subValue={`${stats?.completed_exercises || 0} הושלמו`}
            color="emerald"
          />
          <StatsCard
            icon={TrendingUp}
            label="התקדמות ממוצעת"
            value={`${stats?.avg_progress || 0}%`}
            color="amber"
          />
          <StatsCard
            icon={Trophy}
            label="שיחות עם תרגול"
            value={calls.filter(c => c.has_practice).length}
            subValue={`מתוך ${calls.length} שיחות`}
            color="pink"
          />
        </div>
        
        {/* Top Weaknesses */}
        {stats?.top_weaknesses && stats.top_weaknesses.length > 0 && (
          <div className="bg-gradient-to-br from-red-500/5 to-orange-500/5 rounded-2xl border border-red-500/20 p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <h2 className="text-lg font-semibold text-slate-200">אזורים לשיפור דחוף</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {stats.top_weaknesses.map((w, i) => (
                <WeaknessSummaryCard key={i} weakness={w} />
              ))}
            </div>
          </div>
        )}
        
        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-slate-800/30 rounded-xl border border-slate-700/30 w-fit">
          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'sessions'
                ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Dumbbell className="w-4 h-4" />
            מפגשי תרגול ({sessions.length})
          </button>
          <button
            onClick={() => setActiveTab('calls')}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'calls'
                ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Phone className="w-4 h-4" />
            שיחות לתרגול ({calls.length})
          </button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="חיפוש..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-11 pl-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50"
          />
        </div>
        
        {/* Content */}
        {activeTab === 'sessions' ? (
          <div>
            {filteredSessions.length === 0 ? (
              <div className="text-center py-16 bg-slate-800/30 rounded-2xl border border-slate-700/30">
                <div className="w-20 h-20 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Dumbbell className="w-10 h-10 text-slate-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-300 mb-2">אין מפגשי תרגול</h3>
                <p className="text-slate-500 mb-4">צור תרגול מותאם אישית משיחות שעברו ניתוח</p>
                <button
                  onClick={() => setActiveTab('calls')}
                  className="px-5 py-2.5 bg-violet-500 hover:bg-violet-600 text-white rounded-xl transition-colors inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  צור תרגול חדש
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSessions.map(session => (
                  <PracticeSessionCard
                    key={session.id}
                    session={session}
                    onView={viewPractice}
                    onDelete={deletePractice}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCalls.length === 0 ? (
              <div className="text-center py-16 bg-slate-800/30 rounded-2xl border border-slate-700/30">
                <div className="w-20 h-20 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-10 h-10 text-slate-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-300 mb-2">אין שיחות לתרגול</h3>
                <p className="text-slate-500">העלה שיחות ונתח אותן כדי ליצור תרגולים</p>
              </div>
            ) : (
              filteredCalls.map(call => (
                <CallPracticeCard
                  key={call.id}
                  call={call}
                  onGeneratePractice={generatePractice}
                  onViewPractice={(c) => {
                    const session = sessions.find(s => s.call_id === c.id)
                    if (session) viewPractice(session)
                  }}
                  generating={generating}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Practice Session View Component (full practice experience)
function PracticeSessionView({ session, onBack }) {
  const [activeSection, setActiveSection] = useState('weaknesses')
  const [completedExercises, setCompletedExercises] = useState(new Set(session.completed_exercises || []))
  const [completedActions, setCompletedActions] = useState(new Set(session.completed_actions || []))
  const [saving, setSaving] = useState(false)
  
  const practiceData = session.practice_data || {}
  
  const saveProgress = async () => {
    setSaving(true)
    try {
      const headers = await getAuthHeaders()
      await axios.put(`${API_URL}/api/practice-sessions/${session.id}`, {
        completed_exercises: Array.from(completedExercises),
        completed_actions: Array.from(completedActions)
      }, { headers })
    } catch (err) {
      console.error('Error saving progress:', err)
    } finally {
      setSaving(false)
    }
  }
  
  // Auto-save on change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (completedExercises.size > 0 || completedActions.size > 0) {
        saveProgress()
      }
    }, 1000)
    return () => clearTimeout(timer)
  }, [completedExercises, completedActions])
  
  const toggleExercise = (id) => {
    setCompletedExercises(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) newSet.delete(id)
      else newSet.add(id)
      return newSet
    })
  }
  
  const toggleAction = (idx) => {
    setCompletedActions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(idx)) newSet.delete(idx)
      else newSet.add(idx)
      return newSet
    })
  }
  
  const totalExercises = practiceData.practice_areas?.reduce(
    (sum, area) => sum + (area.practice_exercises?.length || 0), 0
  ) || 0
  const progressPercent = totalExercises > 0 ? Math.round((completedExercises.size / totalExercises) * 100) : 0
  
  const sections = [
    { id: 'weaknesses', label: 'חולשות', icon: Target },
    { id: 'exercises', label: 'תרגילים', icon: Dumbbell },
    { id: 'roleplay', label: 'תרחישים', icon: Users },
    { id: 'actions', label: 'משימות', icon: CheckCircle2 }
  ]
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="p-2 hover:bg-slate-800 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-400" />
              </button>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white truncate max-w-[200px] sm:max-w-none">
                  {session.call_name}
                </h1>
                <p className="text-xs text-slate-400">מפגש תרגול</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-left">
                <p className="text-lg font-bold text-white">{progressPercent}%</p>
                <p className="text-xs text-slate-500">{completedExercises.size}/{totalExercises}</p>
              </div>
              {saving && (
                <RefreshCw className="w-4 h-4 text-violet-400 animate-spin" />
              )}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-3 h-2 bg-slate-700/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Section Navigation */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
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
        
        {/* Weaknesses Section */}
        {activeSection === 'weaknesses' && (
          <div className="space-y-4">
            {practiceData.practice_areas?.map((area, i) => (
              <div key={i} className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${
                        area.priority === 'critical' ? 'bg-red-500/20 text-red-400' :
                        area.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                        area.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {area.priority === 'critical' ? 'קריטי' :
                         area.priority === 'high' ? 'גבוה' :
                         area.priority === 'medium' ? 'בינוני' : 'נמוך'}
                      </span>
                      <h3 className="text-lg font-semibold text-slate-200">{area.skill_name}</h3>
                    </div>
                    <p className="text-sm text-slate-400">{area.weakness_summary}</p>
                  </div>
                  <div className="text-left flex-shrink-0">
                    <p className="text-2xl font-bold text-slate-200">{area.current_score}</p>
                    <p className="text-xs text-slate-500">יעד: {area.target_score}</p>
                  </div>
                </div>
                
                {area.specific_issues?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {area.specific_issues.map((issue, j) => (
                      <span key={j} className="px-2 py-1 bg-slate-700/50 text-slate-300 text-xs rounded-lg">
                        {issue}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Exercises Section */}
        {activeSection === 'exercises' && (
          <div className="space-y-3">
            {practiceData.practice_areas?.flatMap((area, areaIdx) =>
              area.practice_exercises?.map((ex, exIdx) => {
                const id = `${areaIdx}-${exIdx}`
                const isCompleted = completedExercises.has(id)
                
                return (
                  <div 
                    key={id}
                    className={`bg-slate-800/50 rounded-xl border p-4 transition-all ${
                      isCompleted ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-slate-700/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleExercise(id)}
                        className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                          isCompleted
                            ? 'bg-emerald-500 text-white'
                            : 'border-2 border-slate-600 hover:border-emerald-500'
                        }`}
                      >
                        {isCompleted && <CheckCircle2 className="w-4 h-4" />}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-medium mb-1 ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                          {ex.title}
                        </h4>
                        <p className="text-sm text-slate-400 mb-3">{ex.description}</p>
                        
                        {ex.practice_script && (
                          <div className="p-3 bg-violet-500/10 rounded-xl border border-violet-500/20 mb-3">
                            <p className="text-xs text-violet-400 mb-2 flex items-center gap-1">
                              <Mic className="w-3 h-3" />
                              תרגל:
                            </p>
                            <p className="text-slate-200 text-sm whitespace-pre-line">{ex.practice_script}</p>
                          </div>
                        )}
                        
                        {ex.technique && (
                          <span className="px-2 py-1 bg-indigo-500/20 text-indigo-400 text-xs rounded-lg">
                            {ex.technique}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
        
        {/* Roleplay Section */}
        {activeSection === 'roleplay' && (
          <div className="space-y-4">
            {practiceData.roleplay_scenarios?.length > 0 ? (
              practiceData.roleplay_scenarios.map((scenario, i) => (
                <div key={i} className="bg-gradient-to-br from-pink-500/5 to-violet-500/5 rounded-xl border border-pink-500/20 p-4 sm:p-5">
                  <h3 className="text-lg font-semibold text-slate-200 mb-2">{scenario.scenario_name}</h3>
                  <p className="text-sm text-slate-400 mb-4">{scenario.context}</p>
                  
                  <div className="p-3 bg-slate-900/50 rounded-xl mb-4">
                    <p className="text-xs text-pink-400 mb-1">הלקוח אומר:</p>
                    <p className="text-slate-200">"{scenario.customer_opening}"</p>
                  </div>
                  
                  <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <p className="text-xs text-emerald-400 mb-1">המטרה שלך:</p>
                    <p className="text-slate-300 text-sm">{scenario.goal}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-slate-800/30 rounded-xl">
                <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">אין תרחישים לתרגול</p>
              </div>
            )}
          </div>
        )}
        
        {/* Actions Section */}
        {activeSection === 'actions' && (
          <div className="space-y-3">
            {practiceData.action_items?.map((item, i) => {
              const isCompleted = completedActions.has(i)
              
              return (
                <div 
                  key={i}
                  className={`flex items-start gap-3 p-4 rounded-xl transition-all ${
                    isCompleted
                      ? 'bg-emerald-500/10 border border-emerald-500/20'
                      : 'bg-slate-800/50 border border-slate-700/50'
                  }`}
                >
                  <button
                    onClick={() => toggleAction(i)}
                    className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                      isCompleted
                        ? 'bg-emerald-500 text-white'
                        : 'border-2 border-slate-600 hover:border-emerald-500'
                    }`}
                  >
                    {isCompleted && <CheckCircle2 className="w-4 h-4" />}
                  </button>
                  
                  <div className="flex-1">
                    <p className={`font-medium ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                      {item.action}
                    </p>
                    {item.why && (
                      <p className="text-sm text-slate-500 mt-1">{item.why}</p>
                    )}
                    {item.deadline && (
                      <span className="inline-block mt-2 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-lg">
                        {item.deadline}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
            
            {(!practiceData.action_items || practiceData.action_items.length === 0) && (
              <div className="text-center py-12 bg-slate-800/30 rounded-xl">
                <CheckCircle2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">אין משימות</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
