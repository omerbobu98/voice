import { Link } from 'react-router-dom'
import { 
  Phone, Zap, Shield, Brain, Target, BarChart3, AlertTriangle, 
  TrendingUp, Award, MessageSquare, CheckCircle2, ArrowRight,
  Sparkles, Users, Clock, ChevronRight
} from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { t } from '../lib/translations'
import { LanguageToggle } from '../components/LanguageToggle'

// Feature items with translation keys
const getFeatures = (T) => [
  {
    icon: Brain,
    title: T('landing.featureAiAnalysis'),
    description: T('landing.featureAiAnalysisDesc')
  },
  {
    icon: AlertTriangle,
    title: T('landing.featureObjection'),
    description: T('landing.featureObjectionDesc')
  },
  {
    icon: Target,
    title: T('landing.featureScoring'),
    description: T('landing.featureScoringDesc')
  },
  {
    icon: BarChart3,
    title: T('landing.featureTalkRatio'),
    description: T('landing.featureTalkRatioDesc')
  },
  {
    icon: TrendingUp,
    title: T('landing.featureRisk'),
    description: T('landing.featureRiskDesc')
  },
  {
    icon: Award,
    title: T('landing.featureCoaching'),
    description: T('landing.featureCoachingDesc')
  }
]

const pricingPlans = [
  {
    name: 'Starter',
    price: '$49',
    period: '/month',
    description: 'Perfect for individual sales reps',
    features: [
      '50 call analyses/month',
      'Basic objection detection',
      'MEDDIC scoring',
      'Email support'
    ],
    cta: 'Start Free Trial',
    popular: false
  },
  {
    name: 'Professional',
    price: '$149',
    period: '/month',
    description: 'For growing sales teams',
    features: [
      'Unlimited call analyses',
      'Advanced AI coaching',
      'MEDDIC & BANT scoring',
      'Team dashboards',
      'Priority support',
      'API access'
    ],
    cta: 'Start Free Trial',
    popular: true
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large organizations',
    features: [
      'Everything in Professional',
      'Custom integrations',
      'Dedicated success manager',
      'SSO & advanced security',
      'Custom AI training',
      'On-premise option'
    ],
    cta: 'Contact Sales',
    popular: false
  }
]

export default function LandingPage() {
  const { language, dir } = useLanguage()
  const T = (key) => t(key, language)
  const features = getFeatures(T)
  
  return (
    <div className="min-h-screen bg-[#0a0a0f]" dir={dir}>
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-lg sm:rounded-xl flex items-center justify-center">
                <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white">SalesAI</h1>
                <p className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">{T('landing.conversationIntelligence')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <LanguageToggle compact />
              <Link 
                to="/login"
                className="px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-300 hover:text-white transition-colors font-medium"
              >
                {T('landing.login')}
              </Link>
              <Link 
                to="/register"
                className="px-4 sm:px-6 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base hover:from-violet-500 hover:to-fuchsia-500 transition-all shadow-lg shadow-violet-500/20"
              >
                {T('landing.getStarted')}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-12 sm:py-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-full mb-6 sm:mb-8">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span className="text-xs sm:text-sm text-violet-300">{T('landing.poweredBy')}</span>
          </div>
          
          <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight">
            {T('landing.heroTitle1')}
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
              {T('landing.heroTitle2')}
            </span>
          </h1>
          
          <p className="text-base sm:text-xl text-gray-400 max-w-3xl mx-auto mb-8 sm:mb-12 px-4">
            {T('landing.heroSubtitle')}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link 
              to="/register"
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl font-semibold text-base sm:text-lg hover:from-violet-500 hover:to-fuchsia-500 transition-all shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 flex items-center justify-center gap-2"
            >
              <Zap className="w-5 h-5" />
              {T('landing.startFreeTrial')}
            </Link>
            <a 
              href="#features"
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 border border-white/20 text-white rounded-xl font-semibold text-base sm:text-lg hover:bg-white/5 transition-all flex items-center justify-center gap-2"
            >
              {T('landing.learnMore')}
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 lg:gap-12 mt-10 sm:mt-16 text-gray-500">
            <div className="flex items-center gap-2">
              <Shield className="w-4 sm:w-5 h-4 sm:h-5" />
              <span className="text-xs sm:text-sm">{T('landing.enterpriseSecurity')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 sm:w-5 h-4 sm:h-5" />
              <span className="text-xs sm:text-sm">{T('landing.realtimeProcessing')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Brain className="w-4 sm:w-5 h-4 sm:h-5" />
              <span className="text-xs sm:text-sm">{T('landing.poweredBy')}</span>
            </div>
            <div className="flex items-center gap-2 hidden sm:flex">
              <Users className="w-4 sm:w-5 h-4 sm:h-5" />
              <span className="text-xs sm:text-sm">{T('landing.users')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-10 sm:py-16 px-4 sm:px-6 border-y border-white/10 bg-gradient-to-b from-violet-500/5 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
            <div className="text-center">
              <p className="text-3xl sm:text-5xl font-bold text-white mb-1 sm:mb-2">40%</p>
              <p className="text-xs sm:text-base text-gray-500">{T('landing.increaseWinRate')}</p>
            </div>
            <div className="text-center">
              <p className="text-3xl sm:text-5xl font-bold text-white mb-1 sm:mb-2">2.5x</p>
              <p className="text-xs sm:text-base text-gray-500">{T('landing.fasterOnboarding')}</p>
            </div>
            <div className="text-center">
              <p className="text-3xl sm:text-5xl font-bold text-white mb-1 sm:mb-2">60%</p>
              <p className="text-xs sm:text-base text-gray-500">{T('landing.lessCoachingTime')}</p>
            </div>
            <div className="text-center">
              <p className="text-3xl sm:text-5xl font-bold text-white mb-1 sm:mb-2">95%</p>
              <p className="text-xs sm:text-base text-gray-500">{T('landing.transcriptionAccuracy')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-4">
              {T('landing.featuresTitle')}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400"> {T('landing.featuresTitle2')}</span>
            </h2>
            <p className="text-base sm:text-xl text-gray-400 max-w-2xl mx-auto px-4">
              {T('landing.featuresSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-xl sm:rounded-2xl p-5 sm:p-8 border border-white/10 hover:border-violet-500/30 transition-all group"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 rounded-lg sm:rounded-xl flex items-center justify-center mb-4 sm:mb-6 group-hover:from-violet-500/30 group-hover:to-fuchsia-500/30 transition-colors">
                    <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-violet-400" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">{feature.title}</h3>
                  <p className="text-sm sm:text-base text-gray-400">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-12 sm:py-24 px-4 sm:px-6 bg-gradient-to-b from-violet-500/5 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-4">
              {T('landing.howItWorks')}
            </h2>
            <p className="text-base sm:text-xl text-gray-400">
              {T('landing.howItWorksSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 text-xl sm:text-2xl font-bold text-white">
                1
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">{T('landing.step1Title')}</h3>
              <p className="text-sm sm:text-base text-gray-400">
                {T('landing.step1Desc')}
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 text-xl sm:text-2xl font-bold text-white">
                2
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">{T('landing.step2Title')}</h3>
              <p className="text-sm sm:text-base text-gray-400">
                {T('landing.step2Desc')}
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 text-xl sm:text-2xl font-bold text-white">
                3
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">{T('landing.step3Title')}</h3>
              <p className="text-sm sm:text-base text-gray-400">
                {T('landing.step3Desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-12 sm:py-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-4">
              {T('landing.pricingTitle')}
            </h2>
            <p className="text-base sm:text-xl text-gray-400">
              {T('landing.pricingSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-xl sm:rounded-2xl p-5 sm:p-8 border ${
                  plan.popular ? 'border-violet-500' : 'border-white/10'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2 px-3 sm:px-4 py-1 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full text-xs sm:text-sm font-semibold text-white">
                    {T('landing.mostPopular')}
                  </div>
                )}
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6">{plan.description}</p>
                <div className="mb-4 sm:mb-6">
                  <span className="text-3xl sm:text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-gray-500">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-gray-300">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500'
                      : 'border border-white/20 text-white hover:bg-white/5'
                  }`}
                >
                  {plan.cta}
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 rounded-2xl sm:rounded-3xl p-6 sm:p-12 border border-violet-500/30 text-center">
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-4">
              {T('landing.ctaTitle')}
            </h2>
            <p className="text-base sm:text-xl text-gray-300 mb-6 sm:mb-8">
              {T('landing.ctaSubtitle')}
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl font-semibold text-base sm:text-lg hover:from-violet-500 hover:to-fuchsia-500 transition-all shadow-lg shadow-violet-500/20"
            >
              <Zap className="w-5 h-5" />
              {T('landing.getStartedFree')}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 px-4 sm:px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-lg sm:rounded-xl flex items-center justify-center">
                <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white">SalesAI</h1>
                <p className="text-[10px] sm:text-xs text-gray-500">{T('landing.conversationIntelligence')}</p>
              </div>
            </div>
            <p className="text-gray-500 text-xs sm:text-sm">
              {T('landing.copyright')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
