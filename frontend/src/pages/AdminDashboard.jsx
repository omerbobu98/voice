import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Users, Phone, TrendingUp, Activity, Shield, AlertTriangle,
  ChevronRight, Crown, Target, Clock, Calendar, Search,
  BarChart3, Award, ArrowLeft, Home, Menu, X, Play, Pause,
  Volume2, FileAudio, Eye
} from 'lucide-react'
import axios from 'axios'
import { supabase } from '../lib/supabase'
import { API_URL } from '../lib/config'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token 
    ? { Authorization: `Bearer ${session.access_token}` }
    : {}
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [trends, setTrends] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedUserCalls, setSelectedUserCalls] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [playingCallId, setPlayingCallId] = useState(null)
  const audioRef = useRef(null)

  useEffect(() => {
    fetchAdminData()
  }, [])

  const fetchAdminData = async () => {
    setLoading(true)
    try {
      const headers = await getAuthHeaders()
      const [statsRes, usersRes, trendsRes] = await Promise.all([
        axios.get(`${API_URL}/api/admin/stats`, { headers }),
        axios.get(`${API_URL}/api/admin/users`, { headers }),
        axios.get(`${API_URL}/api/admin/trends?days=30`, { headers })
      ])
      setStats(statsRes.data)
      setUsers(usersRes.data)
      setTrends(trendsRes.data)
    } catch (err) {
      console.error('Error fetching admin data:', err)
      if (err.response?.status === 403) {
        navigate('/app')
      }
    }
    setLoading(false)
  }

  const selectUser = async (userId) => {
    try {
      const headers = await getAuthHeaders()
      const [userRes, callsRes] = await Promise.all([
        axios.get(`${API_URL}/api/admin/users/${userId}`, { headers }),
        axios.get(`${API_URL}/api/admin/users/${userId}/calls`, { headers })
      ])
      setSelectedUser(userRes.data)
      setSelectedUserCalls(callsRes.data)
      setActiveTab('user')
    } catch (err) {
      console.error('Error fetching user detail:', err)
    }
  }

  const viewCall = (callId) => {
    navigate(`/admin/calls/${callId}`)
  }

  const playAudio = (call) => {
    if (playingCallId === call.id) {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      setPlayingCallId(null)
    } else {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      setPlayingCallId(call.id)
    }
  }

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredUsers = users.filter(user => 
    user.user_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const chartData = trends?.daily_stats?.slice(-14).map(d => ({
    date: d.date.slice(5),
    calls: d.calls,
    score: d.avg_score
  })) || []

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:relative inset-y-0 left-0 z-50 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${sidebarCollapsed ? 'w-16' : 'w-72 lg:w-80'} bg-black/95 lg:bg-black/40 border-r border-white/10 flex flex-col transition-all duration-300`}>
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              {!sidebarCollapsed && (
                <div>
                  <h1 className="text-lg font-bold text-white">Admin Panel</h1>
                  <p className="text-xs text-gray-500">{users.length} users</p>
                </div>
              )}
            </div>
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2 text-gray-400 hover:text-white">
              {sidebarCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {!sidebarCollapsed && (
          <div className="p-4 border-b border-white/10">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="חיפוש משתמשים..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/[0.05] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50"
              />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {!sidebarCollapsed && (
            <div className="p-2">
              <button
                onClick={() => { setSelectedUser(null); setActiveTab('overview'); setMobileMenuOpen(false) }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl mb-2 transition-all ${activeTab === 'overview' ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              >
                <Home className="w-5 h-5" />
                <span className="font-medium">סקירה כללית</span>
              </button>

              <button
                onClick={() => { setSelectedUser(null); setActiveTab('calls'); setMobileMenuOpen(false) }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl mb-2 transition-all ${activeTab === 'calls' ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              >
                <Phone className="w-5 h-5" />
                <span className="font-medium">כל השיחות</span>
              </button>

              <div className="text-xs text-gray-600 uppercase tracking-wider px-3 py-2 mt-2">משתמשים</div>
              
              {filteredUsers.map((user) => (
                <button
                  key={user.user_id}
                  onClick={() => { selectUser(user.user_id); setMobileMenuOpen(false) }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl mb-1 transition-all ${selectedUser?.user_id === user.user_id ? 'bg-violet-500/20 text-white border border-violet-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${user.role === 'admin' ? 'bg-violet-500/20' : 'bg-white/[0.05]'}`}>
                    {user.role === 'admin' ? <Crown className="w-4 h-4 text-violet-400" /> : <Users className="w-4 h-4 text-gray-400" />}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium truncate">{user.display_name || user.email?.split('@')[0] || 'Unknown'}</p>
                    <p className="text-xs text-gray-500">{user.total_calls || 0} שיחות</p>
                  </div>
                  {user.avg_score > 0 && (
                    <span className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg">{user.avg_score}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/10">
          <button onClick={() => navigate('/app')} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl">
            <ArrowLeft className="w-5 h-5" />
            {!sidebarCollapsed && <span className="text-sm">חזרה לאפליקציה</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl sticky top-0 z-30">
          <div className="px-4 sm:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileMenuOpen(true)} className="p-2 text-gray-400 hover:text-white lg:hidden">
                <Menu className="w-6 h-6" />
              </button>
              <h2 className="text-lg font-semibold text-white">
                {activeTab === 'overview' ? 'סקירה כללית' : activeTab === 'calls' ? 'כל השיחות' : selectedUser?.display_name || selectedUser?.email || 'משתמש'}
              </h2>
            </div>
            <span className="px-3 py-1 bg-violet-500/20 text-violet-400 rounded-full text-xs font-medium">Admin</span>
          </div>
        </header>

        <div className="p-4 sm:p-6">
          {activeTab === 'overview' && !selectedUser && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-2xl p-5 border border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="w-5 h-5 text-violet-400" />
                    <span className="text-gray-500 text-sm">משתמשים</span>
                  </div>
                  <p className="text-4xl font-bold text-white">{stats?.total_users || 0}</p>
                </div>
                <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-2xl p-5 border border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <Phone className="w-5 h-5 text-blue-400" />
                    <span className="text-gray-500 text-sm">שיחות</span>
                  </div>
                  <p className="text-4xl font-bold text-white">{stats?.total_calls || 0}</p>
                </div>
                <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-2xl p-5 border border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <Target className="w-5 h-5 text-emerald-400" />
                    <span className="text-gray-500 text-sm">ממוצע ציון</span>
                  </div>
                  <p className="text-4xl font-bold text-white">{stats?.avg_team_score || 0}<span className="text-lg text-gray-500">/100</span></p>
                </div>
                <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-2xl p-5 border border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <Activity className="w-5 h-5 text-fuchsia-400" />
                    <span className="text-gray-500 text-sm">פעילים היום</span>
                  </div>
                  <p className="text-4xl font-bold text-white">{stats?.active_users_today || 0}</p>
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Calls Over Time Chart */}
                <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-2xl p-6 border border-white/10">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-violet-400" />
                    שיחות לאורך זמן
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                        <YAxis stroke="#6b7280" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                          labelStyle={{ color: '#fff' }}
                        />
                        <Bar dataKey="calls" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Average Score Over Time Chart */}
                <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-2xl p-6 border border-white/10">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-emerald-400" />
                    ציון ממוצע לאורך זמן
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                        <YAxis stroke="#6b7280" fontSize={12} domain={[0, 100]} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                          labelStyle={{ color: '#fff' }}
                        />
                        <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', strokeWidth: 2 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Top Performers & Objections */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-2xl p-6 border border-white/10">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-yellow-400" />
                    מובילים
                  </h3>
                  {stats?.top_performers?.length > 0 ? (
                    <div className="space-y-3">
                      {stats.top_performers.map((performer, index) => (
                        <div key={performer.user_id} onClick={() => selectUser(performer.user_id)} className="flex items-center justify-between p-3 bg-white/[0.03] rounded-xl cursor-pointer hover:bg-white/[0.06]">
                          <div className="flex items-center gap-3">
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-500/20 text-yellow-400' : index === 1 ? 'bg-gray-400/20 text-gray-300' : 'bg-orange-500/20 text-orange-400'}`}>
                              {index + 1}
                            </span>
                            <span className="text-white">{performer.display_name || performer.email?.split('@')[0] || 'Unknown'}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-gray-500 text-sm">{performer.calls} שיחות</span>
                            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium">{performer.avg_score}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-6">אין נתונים עדיין</p>
                  )}
                </div>

                <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-2xl p-6 border border-white/10">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-400" />
                    התנגדויות נפוצות
                  </h3>
                  {stats?.objection_counts && Object.keys(stats.objection_counts).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(stats.objection_counts).slice(0, 5).map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between">
                          <span className="text-gray-300 capitalize">{type}</span>
                          <span className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded-full text-sm">{count}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-6">אין התנגדויות רשומות</p>
                  )}
                </div>
              </div>

              {/* Risk Distribution */}
              <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-2xl p-6 border border-white/10">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-violet-400" />
                  התפלגות סיכון עסקאות
                </h3>
                <div className="flex gap-4">
                  <div className="flex-1 text-center p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <p className="text-3xl font-bold text-emerald-400">{stats?.risk_distribution?.low || 0}</p>
                    <p className="text-sm text-gray-500">סיכון נמוך</p>
                  </div>
                  <div className="flex-1 text-center p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                    <p className="text-3xl font-bold text-yellow-400">{stats?.risk_distribution?.medium || 0}</p>
                    <p className="text-sm text-gray-500">סיכון בינוני</p>
                  </div>
                  <div className="flex-1 text-center p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                    <p className="text-3xl font-bold text-red-400">{stats?.risk_distribution?.high || 0}</p>
                    <p className="text-sm text-gray-500">סיכון גבוה</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'calls' && !selectedUser && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Phone className="w-6 h-6 text-violet-400" />
                כל השיחות ({trends?.recent_calls?.length || 0})
              </h3>
              
              <div className="space-y-3">
                {trends?.recent_calls?.map((call) => (
                  <div key={call.id} className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-xl p-4 border border-white/10">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-12 h-12 bg-violet-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                          <FileAudio className="w-6 h-6 text-violet-400" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-white font-medium truncate">{call.file_name}</h4>
                          <div className="flex items-center gap-3 text-sm text-gray-500 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {call.user_name || call.user_email?.split('@')[0] || 'Unknown'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDuration(call.duration_seconds)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(call.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {call.overall_score && (
                          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium">
                            {call.overall_score}
                          </span>
                        )}
                        {call.deal_risk_level && (
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            call.deal_risk_level === 'low' ? 'bg-emerald-500/20 text-emerald-400' :
                            call.deal_risk_level === 'high' ? 'bg-red-500/20 text-red-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {call.deal_risk_level === 'low' ? 'נמוך' : call.deal_risk_level === 'high' ? 'גבוה' : 'בינוני'}
                          </span>
                        )}
                        <button
                          onClick={() => viewCall(call.id)}
                          className="px-4 py-2 bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 rounded-xl flex items-center gap-2 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          צפה
                        </button>
                      </div>
                    </div>
                    
                    {call.audio_url && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <audio 
                          controls 
                          className="w-full h-10 opacity-80"
                          style={{ filter: 'invert(1) hue-rotate(180deg)' }}
                        >
                          <source src={call.audio_url} type="audio/mpeg" />
                        </audio>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedUser && (
            <div className="space-y-6">
              {/* User Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-2xl p-5 border border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <Phone className="w-5 h-5 text-violet-400" />
                    <span className="text-gray-500 text-sm">שיחות</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{selectedUser.total_calls || 0}</p>
                </div>
                <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-2xl p-5 border border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <Target className="w-5 h-5 text-emerald-400" />
                    <span className="text-gray-500 text-sm">ממוצע ציון</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{selectedUser.avg_score || 0}<span className="text-lg text-gray-500">/100</span></p>
                </div>
                <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-2xl p-5 border border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <BarChart3 className="w-5 h-5 text-blue-400" />
                    <span className="text-gray-500 text-sm">MEDDIC</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{selectedUser.avg_meddic_score || 0}</p>
                </div>
                <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-2xl p-5 border border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <Activity className="w-5 h-5 text-fuchsia-400" />
                    <span className="text-gray-500 text-sm">יחס דיבור</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{selectedUser.avg_talk_ratio || 50}<span className="text-lg text-gray-500">%</span></p>
                </div>
              </div>

              {/* User's Calls */}
              <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-2xl p-6 border border-white/10">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-violet-400" />
                  שיחות ({selectedUserCalls.length})
                </h3>
                
                {selectedUserCalls.length > 0 ? (
                  <div className="space-y-3">
                    {selectedUserCalls.map((call) => (
                      <div key={call.id} className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-violet-500/20 rounded-xl flex items-center justify-center">
                              <Phone className="w-5 h-5 text-violet-400" />
                            </div>
                            <div>
                              <h4 className="text-white font-medium">{call.file_name}</h4>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatDuration(call.duration_seconds)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(call.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {call.overall_score && (
                              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium">
                                {call.overall_score}
                              </span>
                            )}
                            <button onClick={() => viewCall(call.id)} className="px-4 py-2 bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 rounded-xl flex items-center gap-2">
                              <Eye className="w-4 h-4" />
                              צפה בניתוח
                            </button>
                          </div>
                        </div>
                        
                        {call.audio_url && (
                          <div className="mt-3 pt-3 border-t border-white/10">
                            <audio controls className="w-full h-10 opacity-80" style={{ filter: 'invert(1) hue-rotate(180deg)' }}>
                              <source src={call.audio_url} type="audio/mpeg" />
                            </audio>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-500">
                    <Phone className="w-10 h-10 mx-auto mb-3 opacity-50" />
                    אין שיחות למשתמש זה
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.3); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(139,92,246,0.5); }
      `}</style>
    </div>
  )
}
