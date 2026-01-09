import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts'

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 shadow-xl">
        <p className="text-slate-200 font-medium text-sm">{data.skill}</p>
        <p className="text-indigo-400 font-bold">{data.score}/100</p>
        {data.feedback && (
          <p className="text-slate-400 text-xs mt-1 max-w-[200px]">{data.feedback}</p>
        )}
      </div>
    )
  }
  return null
}

export default function SkillRadarChart({ analysisResult }) {
  // Extract skill data from analysis
  const sellerPerformance = analysisResult?.analysis?.seller_performance || {}
  const meddicScore = analysisResult?.analysis?.meddic_score || {}
  const bantScore = analysisResult?.analysis?.bant_score || {}
  const metrics = analysisResult?.metrics || {}

  // Calculate skill scores
  const calculateDiscoveryScore = () => {
    const questionQuality = sellerPerformance.question_quality
    const identifyPain = meddicScore.identify_pain?.score || 0
    const needScore = bantScore.need?.score || 0
    return Math.round((identifyPain + needScore) / 2) || 50
  }

  const calculateClosingScore = () => {
    const closingOpps = analysisResult?.analysis?.closing_opportunities?.length || 0
    const nextStepsClarity = sellerPerformance.next_steps_clarity ? 70 : 50
    // More closing opportunities missed = lower score
    return Math.max(30, 100 - (closingOpps * 15))
  }

  const calculateObjectionScore = () => {
    const objections = analysisResult?.analysis?.objections || []
    if (objections.length === 0) return 75
    const avgHandling = objections.reduce((sum, obj) => sum + (obj.handling_score || 5), 0) / objections.length
    return Math.round(avgHandling * 10)
  }

  const calculateRapportScore = () => {
    const timeline = analysisResult?.analysis?.timeline_events || []
    const rapportEvents = timeline.filter(e => e.type === 'rapport_building').length
    return Math.min(100, 50 + (rapportEvents * 15))
  }

  const calculateValuePropScore = () => {
    const timeline = analysisResult?.analysis?.timeline_events || []
    const valueEvents = timeline.filter(e => e.type === 'value_proposition').length
    return Math.min(100, 40 + (valueEvents * 20))
  }

  const calculateTalkRatioScore = () => {
    const sellerPct = metrics?.talk_ratio?.seller_percentage || 50
    // Optimal is 40-60%, penalize deviation
    const deviation = Math.abs(50 - sellerPct)
    return Math.max(30, 100 - (deviation * 2))
  }

  const data = [
    { 
      skill: 'Discovery', 
      score: calculateDiscoveryScore(),
      fullMark: 100,
      feedback: 'How well you uncovered customer needs and pain points'
    },
    { 
      skill: 'Objection Handling', 
      score: calculateObjectionScore(),
      fullMark: 100,
      feedback: sellerPerformance.objection_handling || 'How effectively you addressed concerns'
    },
    { 
      skill: 'Closing', 
      score: calculateClosingScore(),
      fullMark: 100,
      feedback: 'Ability to advance the deal and secure commitments'
    },
    { 
      skill: 'Value Articulation', 
      score: calculateValuePropScore(),
      fullMark: 100,
      feedback: 'How clearly you communicated your value proposition'
    },
    { 
      skill: 'Rapport Building', 
      score: calculateRapportScore(),
      fullMark: 100,
      feedback: 'Connection and trust established with the customer'
    },
    { 
      skill: 'Talk Balance', 
      score: calculateTalkRatioScore(),
      fullMark: 100,
      feedback: metrics?.talk_ratio?.assessment || 'Balance between talking and listening'
    },
  ]

  // Calculate average score
  const avgScore = Math.round(data.reduce((sum, d) => sum + d.score, 0) / data.length)

  return (
    <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
          <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Skill Breakdown
        </h3>
        <div className="text-right">
          <div className="text-2xl font-bold text-indigo-400">{avgScore}</div>
          <div className="text-xs text-slate-500">avg score</div>
        </div>
      </div>
      
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
            <PolarGrid 
              stroke="#334155" 
              strokeDasharray="3 3"
            />
            <PolarAngleAxis 
              dataKey="skill" 
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickLine={false}
            />
            <PolarRadiusAxis 
              angle={30} 
              domain={[0, 100]} 
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickCount={5}
              axisLine={false}
            />
            <Radar
              name="Skills"
              dataKey="score"
              stroke="#6366f1"
              fill="#6366f1"
              fillOpacity={0.3}
              strokeWidth={2}
              dot={{ fill: '#6366f1', strokeWidth: 0, r: 4 }}
              activeDot={{ fill: '#818cf8', strokeWidth: 0, r: 6 }}
            />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend with scores */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-700/50">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              item.score >= 70 ? 'bg-emerald-400' : 
              item.score >= 50 ? 'bg-amber-400' : 
              'bg-red-400'
            }`} />
            <span className="text-xs text-slate-400 truncate">{item.skill}</span>
            <span className={`text-xs font-bold ml-auto ${
              item.score >= 70 ? 'text-emerald-400' : 
              item.score >= 50 ? 'text-amber-400' : 
              'text-red-400'
            }`}>{item.score}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
