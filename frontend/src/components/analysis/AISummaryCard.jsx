import { useState } from 'react'
import { CheckCircle2, AlertTriangle, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react'

export default function AISummaryCard({ analysisResult, result }) {
  const [copied, setCopied] = useState(null)
  const [expandedSection, setExpandedSection] = useState('summary')

  const callSummary = analysisResult?.analysis?.call_summary || {}
  const customerInterest = analysisResult?.analysis?.customer_interest || {}
  const dealRisk = analysisResult?.analysis?.deal_risk_score || {}
  const nextSteps = analysisResult?.analysis?.next_steps_recommended || []
  const keyMoments = analysisResult?.analysis?.key_moments || []

  // Extract key decisions from key moments
  const decisions = keyMoments
    .filter(m => m.type === 'commitment' || m.type === 'positive')
    .map(m => m.description)
    .slice(0, 3)

  // Extract risks
  const risks = dealRisk.risk_factors || []

  // Extract action items from next steps
  const actionItems = nextSteps.map((step, i) => ({
    id: i,
    text: step,
    completed: false
  }))

  const copyToClipboard = async (text, section) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(section)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const generateSummaryText = () => {
    let text = `# Call Summary: ${result?.file_name || 'Sales Call'}\n\n`
    text += `## TL;DR\n${callSummary.one_liner || 'No summary available'}\n\n`
    text += `## Outcome: ${callSummary.outcome?.toUpperCase() || 'N/A'}\n\n`
    
    if (callSummary.key_topics?.length > 0) {
      text += `## Key Topics\n${callSummary.key_topics.map(t => `- ${t}`).join('\n')}\n\n`
    }
    
    if (decisions.length > 0) {
      text += `## Key Decisions\n${decisions.map(d => `- ${d}`).join('\n')}\n\n`
    }
    
    if (risks.length > 0) {
      text += `## Risks\n${risks.map(r => `- ⚠️ ${r}`).join('\n')}\n\n`
    }
    
    if (actionItems.length > 0) {
      text += `## Next Steps\n${actionItems.map((a, i) => `${i + 1}. ${a.text}`).join('\n')}\n`
    }
    
    return text
  }

  const SectionHeader = ({ title, icon: Icon, section, count }) => (
    <button
      onClick={() => setExpandedSection(expandedSection === section ? null : section)}
      className="w-full flex items-center justify-between py-2 text-left group"
    >
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-indigo-400" />
        <span className="text-sm font-medium text-slate-200">{title}</span>
        {count !== undefined && (
          <span className="px-1.5 py-0.5 bg-slate-700 rounded text-xs text-slate-400">{count}</span>
        )}
      </div>
      {expandedSection === section ? (
        <ChevronUp className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
      ) : (
        <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
      )}
    </button>
  )

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-200">AI Summary</h3>
            <p className="text-xs text-slate-500">Auto-generated insights</p>
          </div>
        </div>
        <button
          onClick={() => copyToClipboard(generateSummaryText(), 'all')}
          className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors group"
          title="Copy summary"
        >
          {copied === 'all' ? (
            <Check className="w-4 h-4 text-emerald-400" />
          ) : (
            <Copy className="w-4 h-4 text-slate-400 group-hover:text-slate-200" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-1">
        {/* TL;DR - Always visible */}
        <div className="pb-3 border-b border-slate-700/30">
          <div className="flex items-start gap-3">
            <div className={`mt-1 px-2 py-0.5 rounded text-xs font-semibold ${
              callSummary.outcome === 'positive' ? 'bg-emerald-500/20 text-emerald-400' :
              callSummary.outcome === 'neutral' ? 'bg-amber-500/20 text-amber-400' :
              callSummary.outcome === 'negative' ? 'bg-red-500/20 text-red-400' :
              'bg-slate-700 text-slate-400'
            }`}>
              {callSummary.outcome?.toUpperCase() || 'N/A'}
            </div>
            <p className="text-sm text-slate-300 leading-relaxed flex-1">
              {callSummary.one_liner || 'Analysis summary not available'}
            </p>
          </div>
        </div>

        {/* Key Topics */}
        {callSummary.key_topics?.length > 0 && (
          <div className="py-2 border-b border-slate-700/30">
            <SectionHeader 
              title="Key Topics" 
              icon={({ className }) => (
                <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              )}
              section="topics"
              count={callSummary.key_topics.length}
            />
            {expandedSection === 'topics' && (
              <div className="pt-2 flex flex-wrap gap-2">
                {callSummary.key_topics.map((topic, i) => (
                  <span key={i} className="px-2 py-1 bg-slate-700/50 rounded-full text-xs text-slate-300">
                    {topic}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Decisions */}
        {decisions.length > 0 && (
          <div className="py-2 border-b border-slate-700/30">
            <SectionHeader 
              title="Key Decisions" 
              icon={CheckCircle2}
              section="decisions"
              count={decisions.length}
            />
            {expandedSection === 'decisions' && (
              <ul className="pt-2 space-y-2">
                {decisions.map((decision, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span>{decision}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Risks */}
        {risks.length > 0 && (
          <div className="py-2 border-b border-slate-700/30">
            <SectionHeader 
              title="Risks & Concerns" 
              icon={AlertTriangle}
              section="risks"
              count={risks.length}
            />
            {expandedSection === 'risks' && (
              <ul className="pt-2 space-y-2">
                {risks.map((risk, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Action Items */}
        {actionItems.length > 0 && (
          <div className="py-2">
            <SectionHeader 
              title="Next Steps" 
              icon={({ className }) => (
                <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              )}
              section="actions"
              count={actionItems.length}
            />
            {expandedSection === 'actions' && (
              <ul className="pt-2 space-y-2">
                {actionItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 p-2 bg-slate-900/30 rounded-lg">
                    <span className="w-5 h-5 bg-indigo-500/20 rounded flex items-center justify-center text-xs font-bold text-indigo-400 flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-sm text-slate-300">{item.text}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Customer Interest Quick View */}
        {customerInterest.what_they_want && (
          <div className="mt-3 p-3 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
            <p className="text-xs text-indigo-400 font-semibold mb-1">What Customer Wants</p>
            <p className="text-sm text-slate-300">{customerInterest.what_they_want}</p>
          </div>
        )}
      </div>
    </div>
  )
}
