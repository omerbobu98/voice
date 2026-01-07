import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { 
  Phone, Clock, Calendar, Users, ArrowLeft, PlayCircle, PauseCircle,
  Target, AlertTriangle, TrendingUp, Shield, Award, Zap, ChevronRight,
  MessageSquare, BarChart3, Brain, CheckCircle2
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

export default function AdminCallView() {
  const navigate = useNavigate()
  const { callId } = useParams()
  const [callData, setCallData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [audioPlaying, setAudioPlaying] = useState(false)
  const [audioCurrentTime, setAudioCurrentTime] = useState(0)
  const [audioDuration, setAudioDuration] = useState(0)
  const audioRef = useRef(null)

  useEffect(() => {
    fetchCallData()
  }, [callId])

  const fetchCallData = async () => {
    setLoading(true)
    try {
      const headers = await getAuthHeaders()
      const response = await axios.get(`${API_URL}/api/admin/calls/${callId}`, { headers })
      setCallData(response.data)
    } catch (err) {
      console.error('Error fetching call:', err)
      if (err.response?.status === 403) {
        navigate('/admin')
      }
    }
    setLoading(false)
  }

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

  const formatTime = (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const formatAudioTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!callData) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <Phone className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500">Call not found</p>
          <button
            onClick={() => navigate('/admin')}
            className="mt-4 px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-xl"
          >
            Back to Admin
          </button>
        </div>
      </div>
    )
  }

  const call = callData.call
  const analysis = callData.analysis

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/admin/calls')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to All Calls
        </button>

        {/* Call Header */}
        <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-2xl p-6 border border-white/10 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-violet-500 rounded-2xl flex items-center justify-center">
                <Phone className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{call.file_name}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatDuration(call.duration_seconds || 0)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {call.speakers_count} speakers
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(call.created_at).toLocaleDateString()}
                  </span>
                  <span className="text-violet-400">
                    User: {call.user_id?.slice(0, 8)}...
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {analysis && (
                <span className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-xl font-semibold">
                  Score: {analysis.overall_score}/100
                </span>
              )}
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                call.status === 'analyzed' 
                  ? 'bg-emerald-500/20 text-emerald-400' 
                  : 'bg-yellow-500/20 text-yellow-400'
              }`}>
                {call.status === 'analyzed' ? 'Analyzed' : 'Transcribed'}
              </span>
            </div>
          </div>
        </div>

        {/* Audio Player */}
        {call.audio_url && (
          <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-2xl p-6 border border-white/10 mb-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <PlayCircle className="w-5 h-5 text-violet-400" />
              Audio Player
            </h3>
            <audio
              ref={audioRef}
              src={call.audio_url}
              onTimeUpdate={(e) => setAudioCurrentTime(e.target.currentTime)}
              onLoadedMetadata={(e) => setAudioDuration(e.target.duration)}
              onEnded={() => setAudioPlaying(false)}
            />
            <div className="flex items-center gap-4">
              <button
                onClick={toggleAudioPlayback}
                className="w-12 h-12 bg-violet-500 hover:bg-violet-600 rounded-full flex items-center justify-center transition-colors"
              >
                {audioPlaying ? (
                  <PauseCircle className="w-6 h-6 text-white" />
                ) : (
                  <PlayCircle className="w-6 h-6 text-white" />
                )}
              </button>
              <div className="flex-1">
                <div 
                  className="h-2 bg-white/10 rounded-full cursor-pointer"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const percent = (e.clientX - rect.left) / rect.width
                    if (audioRef.current) {
                      audioRef.current.currentTime = percent * audioDuration
                    }
                  }}
                >
                  <div 
                    className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"
                    style={{ width: `${(audioCurrentTime / audioDuration) * 100 || 0}%` }}
                  />
                </div>
              </div>
              <span className="text-gray-400 text-sm font-mono">
                {formatAudioTime(audioCurrentTime)} / {formatAudioTime(audioDuration)}
              </span>
            </div>
          </div>
        )}

        {/* Analysis Scores (if analyzed) */}
        {analysis && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-2xl p-5 border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-5 h-5 text-emerald-400" />
                <span className="text-gray-500 text-sm">Overall Score</span>
              </div>
              <p className="text-3xl font-bold text-white">{analysis.overall_score}<span className="text-lg text-gray-500">/100</span></p>
            </div>
            <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-2xl p-5 border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                <span className="text-gray-500 text-sm">MEDDIC Score</span>
              </div>
              <p className="text-3xl font-bold text-white">{analysis.meddic_score}<span className="text-lg text-gray-500">/100</span></p>
            </div>
            <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-2xl p-5 border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <Award className="w-5 h-5 text-violet-400" />
                <span className="text-gray-500 text-sm">BANT Score</span>
              </div>
              <p className="text-3xl font-bold text-white">{analysis.bant_score}<span className="text-lg text-gray-500">/100</span></p>
            </div>
            <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-2xl p-5 border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <Shield className={`w-5 h-5 ${
                  analysis.deal_risk_level === 'low' ? 'text-emerald-400' :
                  analysis.deal_risk_level === 'high' ? 'text-red-400' : 'text-yellow-400'
                }`} />
                <span className="text-gray-500 text-sm">Deal Risk</span>
              </div>
              <p className={`text-2xl font-bold capitalize ${
                analysis.deal_risk_level === 'low' ? 'text-emerald-400' :
                analysis.deal_risk_level === 'high' ? 'text-red-400' : 'text-yellow-400'
              }`}>{analysis.deal_risk_level}</p>
            </div>
          </div>
        )}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Transcription */}
          <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-2xl p-6 border border-white/10">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-400" />
              Transcription
            </h3>
            <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
              {(call.utterances || []).map((utterance, index) => {
                const role = call.speaker_roles?.[utterance.speaker] || 'Unknown'
                return (
                  <div 
                    key={index}
                    onClick={() => seekToTime(utterance.start)}
                    className={`p-4 rounded-xl cursor-pointer transition-colors hover:opacity-80 ${
                      role === 'Seller' ? 'bg-blue-500/10 border-l-4 border-blue-500' :
                      role === 'Buyer' ? 'bg-emerald-500/10 border-l-4 border-emerald-500' :
                      'bg-gray-500/10 border-l-4 border-gray-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleBadgeColor(role)}`}>
                        {role}
                      </span>
                      <span className="text-xs text-gray-500">{formatTime(utterance.start)}</span>
                    </div>
                    <p className="text-gray-300 text-sm">{utterance.text}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Objections & Analysis */}
          <div className="space-y-6">
            {/* Objections */}
            {analysis?.analysis?.objections && analysis.analysis.objections.length > 0 && (
              <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-2xl p-6 border border-white/10">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-400" />
                  Objections ({analysis.analysis.objections.length})
                </h3>
                <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                  {analysis.analysis.objections.map((objection, index) => (
                    <div 
                      key={index}
                      onClick={() => objection.timestamp_ms && seekToTime(objection.timestamp_ms)}
                      className="p-4 bg-orange-500/10 rounded-xl border border-orange-500/20 cursor-pointer hover:bg-orange-500/20 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-1 bg-orange-500/30 text-orange-300 rounded text-xs font-medium capitalize">
                          {objection.type}
                        </span>
                        {objection.timestamp_ms && (
                          <span className="text-xs text-gray-500">{formatTime(objection.timestamp_ms)}</span>
                        )}
                      </div>
                      <p className="text-gray-300 text-sm mb-2">"{objection.quote}"</p>
                      {objection.better_response && (
                        <div className="mt-2 p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                          <p className="text-xs text-emerald-400 font-medium mb-1">Better Response:</p>
                          <p className="text-xs text-gray-400">{objection.better_response}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Coaching Suggestions */}
            {analysis?.analysis?.coaching_suggestions && analysis.analysis.coaching_suggestions.length > 0 && (
              <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-2xl p-6 border border-white/10">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  Coaching Suggestions
                </h3>
                <div className="space-y-3">
                  {analysis.analysis.coaching_suggestions.slice(0, 5).map((suggestion, index) => (
                    <div key={index} className="p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                      <p className="text-xs text-yellow-400 font-medium mb-1">{suggestion.area}</p>
                      <p className="text-sm text-gray-300">{suggestion.suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
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
