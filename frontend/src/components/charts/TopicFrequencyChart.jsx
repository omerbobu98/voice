import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts'
import { ChevronRight } from 'lucide-react'

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 shadow-xl">
        <p className="text-slate-200 font-medium text-sm">{data.name}</p>
        <p className="text-indigo-400 font-bold">{data.count} mentions</p>
        <p className="text-xs text-slate-500 mt-1">Click to view details</p>
      </div>
    )
  }
  return null
}

const TOPIC_COLORS = {
  'Discovery': '#06b6d4',      // cyan
  'Pain Points': '#f97316',    // orange
  'Pricing': '#eab308',        // yellow
  'Competitors': '#ef4444',    // red
  'Timeline': '#8b5cf6',       // violet
  'Features': '#3b82f6',       // blue
  'Objections': '#f59e0b',     // amber
  'Value Prop': '#10b981',     // emerald
  'Next Steps': '#6366f1',     // indigo
  'Closing': '#22c55e',        // green
  'Rapport': '#ec4899',        // pink
}

export default function TopicFrequencyChart({ analysisResult, onTopicClick }) {
  // Extract topic data from timeline events and analysis
  const timelineEvents = analysisResult?.analysis?.timeline_events || []
  const objections = analysisResult?.analysis?.objections || []
  const closingOpps = analysisResult?.analysis?.closing_opportunities || []
  const keyMoments = analysisResult?.analysis?.key_moments || []

  // Count topics from timeline events
  const topicCounts = {}
  
  const topicMapping = {
    'discovery_question': 'Discovery',
    'diagnose': 'Pain Points',
    'closing_attempt': 'Closing',
    'rapport_building': 'Rapport',
    'value_proposition': 'Value Prop',
    'objection': 'Objections',
    'pain_point': 'Pain Points',
    'commitment': 'Closing',
    'next_step': 'Next Steps',
  }

  timelineEvents.forEach(event => {
    const topic = topicMapping[event.type] || event.type
    topicCounts[topic] = (topicCounts[topic] || 0) + 1
  })

  // Add objection types
  objections.forEach(obj => {
    const topic = obj.type === 'price' || obj.type === 'pricing' ? 'Pricing' : 
                  obj.type === 'competition' ? 'Competitors' :
                  obj.type === 'timing' || obj.type === 'timeline' ? 'Timeline' :
                  'Objections'
    topicCounts[topic] = (topicCounts[topic] || 0) + 1
  })

  // Add closing opportunities
  if (closingOpps.length > 0) {
    topicCounts['Closing'] = (topicCounts['Closing'] || 0) + closingOpps.length
  }

  // Convert to array and sort
  const data = Object.entries(topicCounts)
    .map(([name, count]) => ({
      name,
      count,
      color: TOPIC_COLORS[name] || '#6366f1'
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8) // Top 8 topics

  if (data.length === 0) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
        <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2 mb-4">
          <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
          Topic Coverage
        </h3>
        <div className="text-center py-8 text-slate-500">
          No topic data available
        </div>
      </div>
    )
  }

  const totalMentions = data.reduce((sum, d) => sum + d.count, 0)

  return (
    <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
          <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
          Topic Coverage
        </h3>
        <div className="text-right">
          <div className="text-lg font-bold text-indigo-400">{totalMentions}</div>
          <div className="text-xs text-slate-500">total mentions</div>
        </div>
      </div>
      
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={data} 
            layout="vertical"
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            onClick={(e) => {
              if (e && e.activePayload && e.activePayload[0]) {
                const topicName = e.activePayload[0].payload.name
                onTopicClick && onTopicClick(topicName)
              }
            }}
            style={{ cursor: 'pointer' }}
          >
            <XAxis 
              type="number" 
              tick={{ fill: '#64748b', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              type="category" 
              dataKey="name" 
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={80}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.15)' }} />
            <Bar 
              dataKey="count" 
              radius={[0, 4, 4, 0]}
              maxBarSize={24}
              className="cursor-pointer"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color} 
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Topic Pills - Clickable */}
      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-700/50">
        {data.slice(0, 6).map((topic, i) => (
          <button 
            key={i} 
            onClick={() => onTopicClick && onTopicClick(topic.name)}
            className="px-2.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 hover:scale-105 transition-all group"
            style={{ 
              backgroundColor: `${topic.color}20`,
              color: topic.color
            }}
          >
            {topic.name} ({topic.count})
            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>
    </div>
  )
}
