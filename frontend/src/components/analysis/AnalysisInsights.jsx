import { useState, useRef } from 'react'
import { BarChart3, MessageSquare, Target, Activity, BookOpen, Zap, Volume2, PlayCircle, PauseCircle, X, ChevronDown, ChevronUp, Copy, Check, Clock, Shield } from 'lucide-react'
import axios from 'axios'
import { API_URL } from '../../lib/config'
import SkillRadarChart from '../charts/SkillRadarChart'
import TopicFrequencyChart from '../charts/TopicFrequencyChart'
import TalkPatternChart from '../charts/TalkPatternChart'
import AISummaryCard from './AISummaryCard'
import StoryLibrary from './StoryLibrary'
import DeepInsightsTab from './DeepInsightsTab'

// Prevention Story Card Component
function PreventionStoryCard({ story, TTSButton }) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const copyStory = async () => {
    try {
      await navigator.clipboard.writeText(story.the_story)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const objectionLabels = {
    need_to_think: { label: '🤔 "צריך לחשוב"', color: 'bg-amber-500/20 text-amber-400' },
    spouse_decision: { label: '👫 "צריך לדבר עם בן/בת זוג"', color: 'bg-pink-500/20 text-pink-400' },
    too_expensive: { label: '💰 "יקר לי"', color: 'bg-red-500/20 text-red-400' },
    getting_quotes: { label: '📋 "בודק הצעות"', color: 'bg-blue-500/20 text-blue-400' },
    bad_timing: { label: '⏰ "לא עכשיו"', color: 'bg-orange-500/20 text-orange-400' },
    already_have_solution: { label: '✅ "יש לי כבר"', color: 'bg-slate-500/20 text-slate-400' },
  }

  const objectionInfo = objectionLabels[story.objection_to_prevent] || { 
    label: story.objection_to_prevent, 
    color: 'bg-slate-500/20 text-slate-400' 
  }

  return (
    <div className="p-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`px-2 py-1 rounded-lg text-xs font-medium ${objectionInfo.color}`}>
                {objectionInfo.label}
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {story.when_to_tell}
              </span>
            </div>
            <h4 className="text-base font-semibold text-slate-200">{story.story_title}</h4>
            <p className="text-sm text-slate-400 mt-1">{story.setup_line}</p>
          </div>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* The Story */}
          <div className="p-4 bg-slate-900/50 rounded-xl border-l-4 border-violet-500">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-violet-400 font-semibold">📖 The Story</p>
              <button
                onClick={copyStory}
                className="p-1.5 hover:bg-violet-500/20 rounded-lg transition-colors"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4 text-violet-400" />
                )}
              </button>
            </div>
            <p className="text-slate-300 leading-relaxed whitespace-pre-line">{story.the_story}</p>
            
            {TTSButton && (
              <div className="mt-3">
                <TTSButton text={story.the_story} label="🔊 Listen to Story" />
              </div>
            )}
          </div>

          {/* Closing Bridge */}
          <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <p className="text-xs text-emerald-400 font-semibold mb-1">🎯 After the story, ask:</p>
            <p className="text-emerald-200 font-medium">"{story.closing_bridge}"</p>
          </div>

          {/* Why This Prevents */}
          <div className="p-3 bg-slate-800/50 rounded-xl">
            <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
              <Shield className="w-3 h-3" /> Why this prevents the objection:
            </p>
            <p className="text-sm text-slate-400">{story.why_this_prevents}</p>
          </div>
        </div>
      )}
    </div>
  )
}

const tabs = [
  { id: 'overview', label: 'Overview', icon: BarChart3, gradient: 'from-blue-500 to-cyan-500' },
  { id: 'insights', label: 'Deep Insights', icon: Zap, gradient: 'from-violet-500 to-purple-500' },
  { id: 'stories', label: 'Stories', icon: BookOpen, gradient: 'from-pink-500 to-rose-500' },
]

export default function AnalysisInsights({ 
  analysisResult, 
  result, 
  onSeek,
  onStopMainAudio 
}) {
  const [activeTab, setActiveTab] = useState('overview')
  const [ttsLoading, setTtsLoading] = useState(false)
  const [ttsAudioUrl, setTtsAudioUrl] = useState(null)
  const [ttsPlaying, setTtsPlaying] = useState(false)
  const [ttsCurrentTime, setTtsCurrentTime] = useState(0)
  const [ttsDuration, setTtsDuration] = useState(0)
  const ttsAudioRef = useRef(null)
  
  const stories = analysisResult?.analysis?.storytelling_analysis || []
  const hasStories = stories.length > 0
  const hasObjections = (analysisResult?.analysis?.objections?.length || 0) > 0
  const hasBetterResponses = (analysisResult?.analysis?.better_responses?.length || 0) > 0
  const hasDeepInsights = hasObjections || hasBetterResponses

  // TTS Functions
  const generateAndPlayTTS = async (text) => {
    if (ttsLoading) return
    
    // Stop main audio first
    if (onStopMainAudio) onStopMainAudio()
    
    // If already have audio for different text, reset
    setTtsLoading(true)
    setTtsAudioUrl(null)
    
    try {
      const response = await axios.post(`${API_URL}/api/tts`, { 
        text,
        voice: 'nova'
      })
      const fullUrl = `${API_URL}${response.data.audio_url}`
      setTtsAudioUrl(fullUrl)
      
      // Auto-play after a brief delay
      setTimeout(() => {
        if (ttsAudioRef.current) {
          ttsAudioRef.current.play()
          setTtsPlaying(true)
        }
      }, 100)
    } catch (err) {
      console.error('TTS error:', err)
    } finally {
      setTtsLoading(false)
    }
  }

  const toggleTtsPlay = () => {
    if (!ttsAudioRef.current) return
    if (ttsPlaying) {
      ttsAudioRef.current.pause()
      setTtsPlaying(false)
    } else {
      if (onStopMainAudio) onStopMainAudio()
      ttsAudioRef.current.play()
      setTtsPlaying(true)
    }
  }

  const stopTts = () => {
    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause()
      ttsAudioRef.current.currentTime = 0
      setTtsPlaying(false)
      setTtsCurrentTime(0)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // TTS Button Component to pass to children
  const TTSButton = ({ text, label = "🔊 Listen" }) => {
    if (!text) return null
    
    return (
      <button
        onClick={() => generateAndPlayTTS(text)}
        disabled={ttsLoading}
        className="flex items-center gap-2 px-3 py-2 bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 rounded-lg transition-all text-sm font-medium disabled:opacity-50 w-full justify-center"
      >
        {ttsLoading ? (
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
    )
  }

  return (
    <div className="space-y-4">
      {/* Global TTS Audio Player */}
      {ttsAudioUrl && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 backdrop-blur-xl rounded-2xl p-3 border border-violet-500/30 shadow-2xl shadow-violet-500/20 max-w-sm w-[90%]">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTtsPlay}
              className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform flex-shrink-0"
            >
              {ttsPlaying ? (
                <PauseCircle className="w-5 h-5 text-white" />
              ) : (
                <PlayCircle className="w-5 h-5 text-white" />
              )}
            </button>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-violet-300 font-medium">AI Voice</span>
                <span className="text-xs text-slate-400 font-mono">
                  {formatTime(ttsCurrentTime)} / {formatTime(ttsDuration)}
                </span>
              </div>
              <div 
                className="h-1.5 bg-slate-700 rounded-full cursor-pointer overflow-hidden"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const percent = (e.clientX - rect.left) / rect.width
                  if (ttsAudioRef.current && ttsDuration > 0) {
                    ttsAudioRef.current.currentTime = percent * ttsDuration
                  }
                }}
              >
                <div 
                  className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all"
                  style={{ width: `${ttsDuration > 0 ? (ttsCurrentTime / ttsDuration) * 100 : 0}%` }}
                />
              </div>
            </div>
            
            <button
              onClick={() => {
                stopTts()
                setTtsAudioUrl(null)
              }}
              className="w-8 h-8 bg-slate-700 hover:bg-red-500/30 rounded-full flex items-center justify-center transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
          
          <audio
            ref={ttsAudioRef}
            src={ttsAudioUrl}
            onTimeUpdate={(e) => setTtsCurrentTime(e.target.currentTime)}
            onLoadedMetadata={(e) => setTtsDuration(e.target.duration)}
            onEnded={() => setTtsPlaying(false)}
            className="hidden"
          />
        </div>
      )}

      {/* Tab Navigation - Premium Design */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-lg">
        {tabs.map(tab => {
          // Hide stories tab if no stories, hide insights if no data
          if (tab.id === 'stories' && !hasStories) return null
          if (tab.id === 'insights' && !hasDeepInsights) return null
          
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                isActive
                  ? `bg-gradient-to-r ${tab.gradient} text-white shadow-xl shadow-indigo-500/30 scale-[1.02]`
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Top Row - Summary & Skill */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AISummaryCard analysisResult={analysisResult} result={result} />
              <SkillRadarChart analysisResult={analysisResult} />
            </div>

            {/* Middle Row - Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TopicFrequencyChart analysisResult={analysisResult} />
              <TalkPatternChart 
                utterances={result?.utterances || []}
                speakerRoles={result?.speaker_roles || {}}
                totalDuration={result?.audio_duration || analysisResult?.metrics?.total_duration_seconds || 0}
                onSeek={onSeek}
              />
            </div>

            {/* Objections Summary - Show in Overview for visibility */}
            {analysisResult?.analysis?.objections?.length > 0 && (
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="p-4 border-b border-slate-700/50 bg-gradient-to-r from-red-500/10 to-orange-500/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-red-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-200">Objections Detected</h3>
                        <p className="text-sm text-slate-500">{analysisResult.analysis.objections.length} objections • Click for details</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-slate-200">
                        {Math.round(analysisResult.analysis.objections.reduce((sum, o) => sum + (o.handling_score || 0), 0) / analysisResult.analysis.objections.length)}/10
                      </div>
                      <p className="text-xs text-slate-500">Avg Handling</p>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-slate-700/30 max-h-[400px] overflow-y-auto">
                  {analysisResult.analysis.objections.map((objection, i) => {
                    const typeColors = {
                      price: { label: '💰 Price', color: 'bg-red-500/20 text-red-400' },
                      timing: { label: '⏰ Timing', color: 'bg-amber-500/20 text-amber-400' },
                      authority: { label: '👥 Authority', color: 'bg-purple-500/20 text-purple-400' },
                      need: { label: '❓ Need', color: 'bg-blue-500/20 text-blue-400' },
                      trust: { label: '🤝 Trust', color: 'bg-orange-500/20 text-orange-400' },
                      spouse_decision: { label: '👫 Spouse', color: 'bg-pink-500/20 text-pink-400' },
                      need_to_think: { label: '🤔 Think', color: 'bg-cyan-500/20 text-cyan-400' },
                    }
                    const typeInfo = typeColors[objection.type] || { label: objection.type, color: 'bg-slate-500/20 text-slate-400' }
                    const scoreColor = objection.handling_score >= 7 ? 'text-emerald-400' : objection.handling_score >= 4 ? 'text-amber-400' : 'text-red-400'
                    
                    return (
                      <div key={i} className="p-4 hover:bg-slate-800/30 transition-colors">
                        {/* Header with type and score */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${typeInfo.color}`}>
                              {typeInfo.label}
                            </span>
                            {objection.timestamp && (
                              <button 
                                className="text-xs font-mono px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30 transition-colors flex items-center gap-1"
                                onClick={() => onSeek && objection.timestamp_ms && onSeek(objection.timestamp_ms)}
                              >
                                ▶ {objection.timestamp}
                              </button>
                            )}
                          </div>
                          <span className={`text-lg font-bold ${scoreColor}`}>
                            {objection.handling_score}/10
                          </span>
                        </div>

                        {/* Customer Objection */}
                        <div className="mb-3">
                          <p className="text-xs text-red-400 font-semibold mb-1">🗣️ Customer Said:</p>
                          <p className="text-slate-200 font-medium">"{objection.buyer_statement}"</p>
                        </div>

                        {/* Real Concern */}
                        <div className="mb-3 p-2 bg-slate-900/50 rounded-lg">
                          <p className="text-xs text-slate-500">Real Concern: <span className="text-slate-300">{objection.real_concern}</span></p>
                        </div>

                        {/* Our Response */}
                        <div className="mb-3">
                          <p className="text-xs text-slate-500 font-semibold mb-1">💬 Your Response:</p>
                          <p className="text-slate-400 text-sm">"{objection.seller_response}"</p>
                        </div>

                        {/* Better Response */}
                        <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                              ✨ Better Response {objection.technique_to_use && `(${objection.technique_to_use})`}
                            </p>
                            <button
                              onClick={async () => {
                                await navigator.clipboard.writeText(objection.better_response)
                              }}
                              className="p-1 hover:bg-emerald-500/20 rounded-lg transition-colors"
                            >
                              <Copy className="w-3 h-3 text-emerald-400" />
                            </button>
                          </div>
                          <p className="text-emerald-200 text-sm font-medium">"{objection.better_response}"</p>
                          
                          {/* TTS Button */}
                          <div className="mt-2">
                            <TTSButton text={objection.better_response} label="🔊 Listen" />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Timeline Events - Professional Design */}
            {analysisResult?.analysis?.timeline_events?.length > 0 && (
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="p-4 border-b border-slate-700/50 bg-gradient-to-r from-cyan-500/10 to-indigo-500/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                        <Activity className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-200">Call Timeline</h3>
                        <p className="text-sm text-slate-500">{analysisResult.analysis.timeline_events.length} key moments • Click to jump</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 relative">
                  {/* Timeline bar */}
                  <div className="absolute left-8 top-4 bottom-4 w-0.5 bg-gradient-to-b from-cyan-500 via-indigo-500 to-violet-500" />
                  
                  <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
                    {analysisResult.analysis.timeline_events.map((event, i) => {
                      const eventColors = {
                        discovery_question: { bg: 'bg-cyan-500', text: 'text-cyan-400', label: '🔍 Discovery' },
                        diagnose: { bg: 'bg-blue-500', text: 'text-blue-400', label: '🩺 Diagnose' },
                        closing_attempt: { bg: 'bg-emerald-500', text: 'text-emerald-400', label: '🎯 Closing' },
                        rapport_building: { bg: 'bg-pink-500', text: 'text-pink-400', label: '🤝 Rapport' },
                        value_proposition: { bg: 'bg-amber-500', text: 'text-amber-400', label: '💎 Value' },
                        objection: { bg: 'bg-red-500', text: 'text-red-400', label: '⚠️ Objection' },
                        pain_point: { bg: 'bg-orange-500', text: 'text-orange-400', label: '😣 Pain' },
                        commitment: { bg: 'bg-green-500', text: 'text-green-400', label: '✅ Commitment' },
                        next_step: { bg: 'bg-violet-500', text: 'text-violet-400', label: '➡️ Next Step' },
                      }
                      const colors = eventColors[event.type] || { bg: 'bg-slate-500', text: 'text-slate-400', label: event.type }
                      
                      return (
                        <div 
                          key={i} 
                          className="relative pl-10 cursor-pointer group"
                          onClick={() => onSeek && event.timestamp_ms && onSeek(event.timestamp_ms)}
                        >
                          <div className={`absolute left-[22px] w-3 h-3 rounded-full ${colors.bg} border-2 border-slate-800 group-hover:scale-125 transition-transform`} />
                          
                          <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-700/30 group-hover:border-slate-600/50 transition-all">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className={`text-xs font-semibold ${colors.text}`}>{colors.label}</span>
                              <span className="text-xs font-mono text-slate-500">{event.timestamp}</span>
                              <span className={`text-xs px-1.5 py-0.5 rounded ${event.speaker === 'Seller' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                {event.speaker}
                              </span>
                            </div>
                            <p className="text-sm text-slate-300">"{event.content}"</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'insights' && hasDeepInsights && (
          <DeepInsightsTab 
            analysisResult={analysisResult}
            onSeek={onSeek}
            TTSButton={TTSButton}
          />
        )}

        {activeTab === 'stories' && (
          <div className="space-y-6">
            {/* Stories You Told - Only show if there are stories */}
            {hasStories && (
              <div>
                <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-pink-400" />
                  Stories You Told
                  <span className="text-sm font-normal text-slate-500">({stories.length})</span>
                </h2>
                <StoryLibrary 
                  stories={stories}
                  onSeek={onSeek}
                  TTSButton={TTSButton}
                />
              </div>
            )}

            {/* Objection Prevention Stories - Premium Design */}
            {analysisResult?.analysis?.objection_prevention_stories?.length > 0 && (
              <div className="bg-gradient-to-br from-violet-500/15 to-pink-500/10 rounded-2xl border border-violet-500/30 overflow-hidden shadow-xl shadow-violet-500/10">
                <div className="p-5 border-b border-violet-500/20 bg-gradient-to-r from-violet-500/15 via-purple-500/10 to-transparent">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30">
                        <Zap className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Objection Prevention Stories</h3>
                        <p className="text-sm text-slate-400">Tell these stories BEFORE objections come up</p>
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-violet-500/20 rounded-full">
                      <span className="text-xs text-violet-300 font-medium">🛡️ Prevention</span>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-violet-500/10">
                  {analysisResult.analysis.objection_prevention_stories.map((story, i) => (
                    <PreventionStoryCard key={i} story={story} TTSButton={TTSButton} />
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {!hasStories && !analysisResult?.analysis?.objection_prevention_stories?.length && (
              <div className="bg-slate-800/50 rounded-xl p-12 border border-slate-700/50 text-center">
                <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-slate-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-300 mb-2">No Stories Detected</h3>
                <p className="text-slate-500">This call didn't include any stories. Storytelling is powerful for building value!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
