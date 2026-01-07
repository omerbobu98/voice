import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { 
  Phone, Clock, Calendar, Users, ChevronRight, ArrowLeft,
  Search, Target, Filter, PlayCircle
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

export default function AdminCallsPage() {
  const navigate = useNavigate()
  const [calls, setCalls] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all') // all, analyzed, transcribed

  useEffect(() => {
    fetchAllCalls()
  }, [])

  const fetchAllCalls = async () => {
    setLoading(true)
    try {
      const headers = await getAuthHeaders()
      const response = await axios.get(`${API_URL}/api/admin/calls`, { headers })
      setCalls(response.data)
    } catch (err) {
      console.error('Error fetching calls:', err)
      if (err.response?.status === 403) {
        navigate('/')
      }
    }
    setLoading(false)
  }

  const viewCall = (callId) => {
    navigate(`/admin/calls/${callId}`)
  }

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}m ${secs}s`
  }

  const filteredCalls = calls.filter(call => {
    const matchesSearch = 
      call.file_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      call.user_id?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = 
      filterStatus === 'all' ||
      (filterStatus === 'analyzed' && call.status === 'analyzed') ||
      (filterStatus === 'transcribed' && call.status === 'transcribed')
    
    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Admin Dashboard
        </button>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Phone className="w-7 h-7 text-blue-400" />
            All Calls ({calls.length})
          </h1>
          
          <div className="flex items-center gap-3">
            {/* Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-violet-500/50"
            >
              <option value="all">All Status</option>
              <option value="analyzed">Analyzed</option>
              <option value="transcribed">Transcribed</option>
            </select>

            {/* Search */}
            <div className="relative">
              <Search className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search calls..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/[0.05] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 w-64"
              />
            </div>
          </div>
        </div>

        {/* Calls List */}
        <div className="space-y-3">
          {filteredCalls.map((call) => (
            <div
              key={call.id}
              onClick={() => viewCall(call.id)}
              className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-2xl p-5 border border-white/10 cursor-pointer hover:border-violet-500/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <Phone className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{call.file_name}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
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
                      <span className="text-violet-400 text-xs">
                        User: {call.user_id?.slice(0, 8)}...
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

          {filteredCalls.length === 0 && (
            <div className="text-center py-20 bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-2xl border border-white/10">
              <Phone className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500">No calls found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
