import { useState } from 'react'
import { BarChart3, MessageSquare, Target, Activity, BookOpen, Zap } from 'lucide-react'
import SkillRadarChart from '../charts/SkillRadarChart'
import TopicFrequencyChart from '../charts/TopicFrequencyChart'
import TalkPatternChart from '../charts/TalkPatternChart'
import AISummaryCard from './AISummaryCard'
import StoryLibrary from './StoryLibrary'

const tabs = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'insights', label: 'Deep Insights', icon: Zap },
  { id: 'stories', label: 'Stories', icon: BookOpen },
]

export default function AnalysisInsights({ 
  analysisResult, 
  result, 
  onSeek,
  onPlayTTS 
}) {
  const [activeTab, setActiveTab] = useState('overview')
  
  const stories = analysisResult?.analysis?.storytelling_analysis || []
  const hasStories = stories.length > 0

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex items-center gap-1 p-1 bg-slate-800/30 rounded-xl border border-slate-700/30">
        {tabs.map(tab => {
          // Hide stories tab if no stories
          if (tab.id === 'stories' && !hasStories) return null
          
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

        {activeTab === 'insights' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left Column - Performance Analysis */}
            <div className="space-y-4">
              {/* Skill Radar - Larger */}
              <SkillRadarChart analysisResult={analysisResult} />
              
              {/* Strengths & Improvements */}
              {analysisResult?.analysis?.seller_performance && (
                <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                  <h3 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
                    <Target className="w-4 h-4 text-indigo-400" />
                    Performance Analysis
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Strengths */}
                    {analysisResult.analysis.seller_performance.strengths?.length > 0 && (
                      <div>
                        <p className="text-xs text-emerald-400 uppercase tracking-wide mb-2">Strengths</p>
                        <ul className="space-y-1">
                          {analysisResult.analysis.seller_performance.strengths.map((s, i) => (
                            <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                              <span className="text-emerald-400">✓</span> {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Areas to Improve */}
                    {analysisResult.analysis.seller_performance.improvements?.length > 0 && (
                      <div>
                        <p className="text-xs text-amber-400 uppercase tracking-wide mb-2">Areas to Improve</p>
                        <ul className="space-y-1">
                          {analysisResult.analysis.seller_performance.improvements.map((imp, i) => (
                            <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                              <span className="text-amber-400">→</span> {imp}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Talk Ratio Feedback */}
                    {analysisResult.analysis.seller_performance.talk_ratio_feedback && (
                      <div className="pt-3 border-t border-slate-700/50">
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Talk Ratio</p>
                        <p className="text-sm text-slate-400">{analysisResult.analysis.seller_performance.talk_ratio_feedback}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Conversation Analysis */}
            <div className="space-y-4">
              {/* Topic Coverage */}
              <TopicFrequencyChart analysisResult={analysisResult} />
              
              {/* Talk Pattern */}
              <TalkPatternChart 
                utterances={result?.utterances || []}
                speakerRoles={result?.speaker_roles || {}}
                totalDuration={result?.audio_duration || analysisResult?.metrics?.total_duration_seconds || 0}
                onSeek={onSeek}
              />
              
              {/* Key Moments Quick View */}
              {analysisResult?.analysis?.key_moments?.length > 0 && (
                <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                  <h3 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-400" />
                    Key Moments
                  </h3>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                    {analysisResult.analysis.key_moments.slice(0, 5).map((moment, i) => (
                      <div 
                        key={i}
                        className={`p-2 rounded-lg cursor-pointer transition-all ${
                          moment.type === 'positive' ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20' :
                          moment.type === 'negative' ? 'bg-red-500/10 hover:bg-red-500/20 border border-red-500/20' :
                          'bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20'
                        }`}
                        onClick={() => onSeek && moment.timestamp_ms && onSeek(moment.timestamp_ms)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-slate-400">{moment.timestamp}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            moment.type === 'positive' ? 'bg-emerald-500/20 text-emerald-400' :
                            moment.type === 'negative' ? 'bg-red-500/20 text-red-400' :
                            'bg-amber-500/20 text-amber-400'
                          }`}>
                            {moment.type}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300">{moment.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'stories' && hasStories && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Story Library - Full Width on Mobile, 2/3 on Desktop */}
            <div className="lg:col-span-2">
              <StoryLibrary 
                stories={stories}
                onSeek={onSeek}
                onPlayAudio={onPlayTTS}
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
