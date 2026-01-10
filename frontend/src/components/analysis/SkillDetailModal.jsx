import { useState } from 'react'
import { X, TrendingUp, TrendingDown, Target, MessageSquare, Zap, Users, BarChart3, Lightbulb } from 'lucide-react'

const SKILL_CONFIG = {
  'Discovery': {
    icon: MessageSquare,
    color: 'cyan',
    bgColor: 'bg-cyan-500/10',
    textColor: 'text-cyan-400',
    borderColor: 'border-cyan-500/30',
    description: 'How effectively you uncovered customer needs, pain points, and motivations',
    tips: [
      'Ask open-ended questions to understand their situation',
      'Dig deeper into pain points - quantify the cost of inaction',
      'Listen more than you talk during discovery',
      'Uncover the emotional drivers behind the logical needs'
    ]
  },
  'Objection Handling': {
    icon: Target,
    color: 'amber',
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    description: 'Your ability to address customer concerns and turn objections into opportunities',
    tips: [
      'Use Feel-Felt-Found technique for emotional objections',
      'Isolate objections: "Other than this, is there anything else?"',
      'Address the REAL concern behind surface objections',
      'Reframe objections as reasons TO buy'
    ]
  },
  'Closing': {
    icon: Target,
    color: 'emerald',
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    description: 'Your effectiveness at securing commitments and advancing the deal',
    tips: [
      'Use trial closes throughout: "Does this make sense so far?"',
      'Capitalize on buying signals immediately',
      'Use assumptive language: "When we get started..."',
      'Always have a clear next step defined'
    ]
  },
  'Value Articulation': {
    icon: Zap,
    color: 'violet',
    bgColor: 'bg-violet-500/10',
    textColor: 'text-violet-400',
    borderColor: 'border-violet-500/30',
    description: 'How clearly you communicated your unique value proposition',
    tips: [
      'Connect features to their specific pain points',
      'Use "You said... That\'s why... Which means for you..."',
      'Quantify ROI and cost of not acting',
      'Share relevant success stories with specific results'
    ]
  },
  'Rapport Building': {
    icon: Users,
    color: 'pink',
    bgColor: 'bg-pink-500/10',
    textColor: 'text-pink-400',
    borderColor: 'border-pink-500/30',
    description: 'The connection and trust you established with the customer',
    tips: [
      'Find common ground early in the conversation',
      'Mirror their communication style',
      'Show genuine interest in their business/situation',
      'Use their name naturally throughout'
    ]
  },
  'Talk Balance': {
    icon: BarChart3,
    color: 'indigo',
    bgColor: 'bg-indigo-500/10',
    textColor: 'text-indigo-400',
    borderColor: 'border-indigo-500/30',
    description: 'The balance between talking and listening - ideal is 40-60% seller talk',
    tips: [
      'Aim for 40-60% talk time in discovery',
      'Let the customer do most of the talking early on',
      'Avoid long monologues - break up your points',
      'Ask questions to keep them engaged'
    ]
  }
}

export default function SkillDetailModal({ 
  isOpen, 
  onClose, 
  skillName, 
  skillScore,
  analysisResult 
}) {
  if (!isOpen || !skillName) return null

  const config = SKILL_CONFIG[skillName] || {
    icon: BarChart3,
    color: 'slate',
    bgColor: 'bg-slate-500/10',
    textColor: 'text-slate-400',
    borderColor: 'border-slate-500/30',
    description: 'Skill assessment',
    tips: []
  }

  const Icon = config.icon
  const analysis = analysisResult?.analysis || {}
  const sellerPerformance = analysis.seller_performance || {}

  // Get relevant data for each skill
  const getSkillData = () => {
    switch (skillName) {
      case 'Discovery':
        const meddicPain = analysis.meddic_score?.identify_pain || {}
        const bantNeed = analysis.bant_score?.need || {}
        return {
          evidence: meddicPain.evidence || bantNeed.evidence || 'Discovery questions were asked throughout the call',
          missing: meddicPain.missing || bantNeed.missing || 'Could dig deeper into pain points',
          items: analysis.timeline_events?.filter(e => e.type === 'discovery_question') || []
        }
      
      case 'Objection Handling':
        const objections = analysis.objections || []
        const avgScore = objections.length > 0 
          ? objections.reduce((sum, o) => sum + (o.handling_score || 0), 0) / objections.length 
          : 0
        return {
          evidence: `Handled ${objections.length} objection(s) with an average score of ${avgScore.toFixed(1)}/10`,
          missing: sellerPerformance.objection_handling_quality || 'Consider addressing the real concern behind objections',
          items: objections.slice(0, 3)
        }
      
      case 'Closing':
        const closingOpps = analysis.closing_opportunities || []
        const closingAttempts = analysis.timeline_events?.filter(e => 
          e.type === 'closing_attempt' || e.type === 'commitment'
        ) || []
        return {
          evidence: `${closingAttempts.length} closing attempt(s), ${closingOpps.length} opportunity(ies) identified`,
          missing: closingOpps.length > 0 ? `${closingOpps.length} closing opportunities were missed` : 'Good closing execution',
          items: [...closingAttempts, ...closingOpps].slice(0, 3)
        }
      
      case 'Value Articulation':
        const valueEvents = analysis.timeline_events?.filter(e => e.type === 'value_proposition') || []
        return {
          evidence: `${valueEvents.length} value proposition statement(s) made`,
          missing: valueEvents.length < 3 ? 'Could articulate more value throughout' : 'Good value articulation',
          items: valueEvents.slice(0, 3)
        }
      
      case 'Rapport Building':
        const rapportEvents = analysis.timeline_events?.filter(e => e.type === 'rapport_building') || []
        return {
          evidence: `${rapportEvents.length} rapport building moment(s) detected`,
          missing: rapportEvents.length < 2 ? 'Build more personal connection early' : 'Good rapport established',
          items: rapportEvents.slice(0, 3)
        }
      
      case 'Talk Balance':
        const metrics = analysisResult?.metrics || {}
        const talkRatio = metrics.talk_ratio || {}
        return {
          evidence: `Seller: ${talkRatio.seller_percentage || 50}%, Buyer: ${talkRatio.buyer_percentage || 50}%`,
          missing: talkRatio.assessment === 'seller_too_dominant' 
            ? 'Let the customer talk more' 
            : talkRatio.assessment === 'seller_too_passive'
            ? 'Take more control of the conversation'
            : 'Good talk balance',
          items: []
        }
      
      default:
        return { evidence: '', missing: '', items: [] }
    }
  }

  const skillData = getSkillData()
  const scoreColor = skillScore >= 70 ? 'text-emerald-400' : skillScore >= 50 ? 'text-amber-400' : 'text-red-400'
  const scoreBg = skillScore >= 70 ? 'bg-emerald-500/10' : skillScore >= 50 ? 'bg-amber-500/10' : 'bg-red-500/10'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-xl max-h-[85vh] bg-slate-900 rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className={`p-5 border-b border-slate-700/50 ${config.bgColor}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${config.bgColor} border ${config.borderColor}`}>
                <Icon className={`w-6 h-6 ${config.textColor}`} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{skillName}</h2>
                <p className="text-sm text-slate-400">{config.description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          
          {/* Score display */}
          <div className="mt-4 flex items-center gap-4">
            <div className={`px-4 py-2 rounded-xl ${scoreBg} flex items-center gap-2`}>
              <span className={`text-3xl font-bold ${scoreColor}`}>{skillScore}</span>
              <span className="text-slate-500">/100</span>
            </div>
            <div className="flex items-center gap-2">
              {skillScore >= 70 ? (
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              ) : (
                <TrendingDown className="w-5 h-5 text-amber-400" />
              )}
              <span className={`text-sm font-medium ${scoreColor}`}>
                {skillScore >= 70 ? 'Strong' : skillScore >= 50 ? 'Needs Work' : 'Critical'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[calc(85vh-200px)] custom-scrollbar space-y-5">
          {/* Analysis */}
          <div className="space-y-3">
            {skillData.evidence && (
              <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/30">
                <p className="text-xs text-emerald-400 font-semibold mb-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> What We Found
                </p>
                <p className="text-sm text-slate-300">{skillData.evidence}</p>
              </div>
            )}
            
            {skillData.missing && skillScore < 80 && (
              <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/20">
                <p className="text-xs text-amber-400 font-semibold mb-1 flex items-center gap-1">
                  <Lightbulb className="w-3 h-3" /> Room for Improvement
                </p>
                <p className="text-sm text-slate-300">{skillData.missing}</p>
              </div>
            )}
          </div>

          {/* Related moments */}
          {skillData.items.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-400 mb-3">Related Moments</h4>
              <div className="space-y-2">
                {skillData.items.map((item, i) => (
                  <div key={i} className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
                    <div className="flex items-center gap-2 mb-1">
                      {item.timestamp && (
                        <span className="text-xs font-mono text-indigo-400 bg-indigo-500/20 px-2 py-0.5 rounded">
                          {item.timestamp}
                        </span>
                      )}
                      {item.type && (
                        <span className="text-xs text-slate-500">{item.type.replace('_', ' ')}</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-300">
                      {item.content || item.buyer_statement || item.customer_signal || 'Moment detected'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips */}
          <div>
            <h4 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              Pro Tips to Improve
            </h4>
            <div className="grid gap-2">
              {config.tips.map((tip, i) => (
                <div 
                  key={i}
                  className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/30 flex items-start gap-3"
                >
                  <span className={`w-6 h-6 rounded-full ${config.bgColor} ${config.textColor} flex items-center justify-center text-xs font-bold flex-shrink-0`}>
                    {i + 1}
                  </span>
                  <p className="text-sm text-slate-300">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
