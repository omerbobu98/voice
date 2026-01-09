import { useState, useRef } from 'react'
import { BarChart3, MessageSquare, Target, Activity, BookOpen, Zap, Volume2, PlayCircle, PauseCircle, X } from 'lucide-react'
import axios from 'axios'
import { API_URL } from '../../lib/config'
import SkillRadarChart from '../charts/SkillRadarChart'
import TopicFrequencyChart from '../charts/TopicFrequencyChart'
import TalkPatternChart from '../charts/TalkPatternChart'
import AISummaryCard from './AISummaryCard'
import StoryLibrary from './StoryLibrary'
import DeepInsightsTab from './DeepInsightsTab'

const tabs = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'insights', label: 'Deep Insights', icon: Zap },
  { id: 'stories', label: 'Stories', icon: BookOpen },
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

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 p-1 bg-slate-800/30 rounded-xl border border-slate-700/30">
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
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left Column */}
            <div className="space-y-4">
              {/* AI Summary */}
              <AISummaryCard 
                analysisResult={analysisResult} 
                result={result}
              />
              
              {/* Topic Coverage */}
              <TopicFrequencyChart analysisResult={analysisResult} />
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Skill Radar */}
              <SkillRadarChart analysisResult={analysisResult} />
              
              {/* Talk Pattern */}
              <TalkPatternChart 
                utterances={result?.utterances || []}
                speakerRoles={result?.speaker_roles || {}}
                totalDuration={result?.audio_duration || analysisResult?.metrics?.total_duration_seconds || 0}
                onSeek={onSeek}
              />
            </div>
          </div>
        )}

        {activeTab === 'insights' && hasDeepInsights && (
          <DeepInsightsTab 
            analysisResult={analysisResult}
            onSeek={onSeek}
            TTSButton={TTSButton}
          />
        )}

        {activeTab === 'stories' && hasStories && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Story Library - Full Width on Mobile, 2/3 on Desktop */}
            <div className="lg:col-span-2">
              <StoryLibrary 
                stories={stories}
                onSeek={onSeek}
                TTSButton={TTSButton}
              />
            </div>
            
            {/* Story Tips Sidebar */}
            <div className="space-y-4">
              {/* Story Stats */}
              <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                <h3 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-pink-400" />
                  Story Stats
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Stories Told</span>
                    <span className="text-lg font-bold text-slate-200">{stories.length}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Avg Score</span>
                    <span className="text-lg font-bold text-indigo-400">
                      {Math.round(stories.reduce((sum, s) => sum + (s.effectiveness_score || 0), 0) / stories.length)}/10
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">High Impact</span>
                    <span className="text-lg font-bold text-emerald-400">
                      {stories.filter(s => s.effectiveness_score >= 7).length}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Storytelling Guide */}
              <div className="bg-gradient-to-br from-pink-500/10 to-violet-500/10 rounded-xl p-5 border border-pink-500/20">
                <h3 className="text-sm font-semibold text-slate-200 mb-3">Effective Story Framework</h3>
                <ol className="space-y-2 text-xs text-slate-400">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-pink-500/20 rounded flex items-center justify-center text-pink-400 font-bold flex-shrink-0">1</span>
                    <span><strong className="text-slate-300">Hook</strong> - Start with a relatable situation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-pink-500/20 rounded flex items-center justify-center text-pink-400 font-bold flex-shrink-0">2</span>
                    <span><strong className="text-slate-300">Problem</strong> - Paint the pain vividly</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-pink-500/20 rounded flex items-center justify-center text-pink-400 font-bold flex-shrink-0">3</span>
                    <span><strong className="text-slate-300">Solution</strong> - Show the transformation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-pink-500/20 rounded flex items-center justify-center text-pink-400 font-bold flex-shrink-0">4</span>
                    <span><strong className="text-slate-300">Result</strong> - Use specific numbers</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
