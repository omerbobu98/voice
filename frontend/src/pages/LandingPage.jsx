import { Link } from 'react-router-dom'
import { 
  Phone, Zap, Shield, Brain, Target, BarChart3, AlertTriangle, 
  TrendingUp, Award, MessageSquare, CheckCircle2, ArrowRight,
  Sparkles, Users, Clock, ChevronRight
} from 'lucide-react'

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Analysis',
    description: 'GPT-5.2 analyzes every word, tone, and pattern in your sales conversations.'
  },
  {
    icon: AlertTriangle,
    title: 'Objection Detection',
    description: 'Automatically identify objections and get AI-suggested better responses.'
  },
  {
    icon: Target,
    title: 'MEDDIC & BANT Scoring',
    description: 'Score every call against proven sales methodologies automatically.'
  },
  {
    icon: BarChart3,
    title: 'Talk-to-Listen Ratio',
    description: 'Understand speaking dynamics and optimize your conversation balance.'
  },
  {
    icon: TrendingUp,
    title: 'Deal Risk Assessment',
    description: 'Predict deal success probability based on conversation signals.'
  },
  {
    icon: Award,
    title: 'AI Coaching',
    description: 'Get personalized coaching tips with example scripts to improve.'
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
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
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
                <p className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">Conversation Intelligence</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Link 
                to="/login"
                className="px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-300 hover:text-white transition-colors font-medium"
              >
                Login
              </Link>
              <Link 
                to="/register"
                className="px-4 sm:px-6 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base hover:from-violet-500 hover:to-fuchsia-500 transition-all shadow-lg shadow-violet-500/20"
              >
                Get Started
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
            <span className="text-xs sm:text-sm text-violet-300">Powered by GPT-5.2 & AssemblyAI</span>
          </div>
          
          <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight">
            Transform Your Sales Calls
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
              Into Revenue Insights
            </span>
          </h1>
          
          <p className="text-base sm:text-xl text-gray-400 max-w-3xl mx-auto mb-8 sm:mb-12 px-4">
            AI-powered conversation intelligence that transcribes, analyzes, and coaches your sales team 
            to close more deals. Get actionable insights from every call.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link 
              to="/register"
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl font-semibold text-base sm:text-lg hover:from-violet-500 hover:to-fuchsia-500 transition-all shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 flex items-center justify-center gap-2"
            >
              <Zap className="w-5 h-5" />
              Start Free Trial
            </Link>
            <a 
              href="#features"
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 border border-white/20 text-white rounded-xl font-semibold text-base sm:text-lg hover:bg-white/5 transition-all flex items-center justify-center gap-2"
            >
              Learn More
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 lg:gap-12 mt-10 sm:mt-16 text-gray-500">
            <div className="flex items-center gap-2">
              <Shield className="w-4 sm:w-5 h-4 sm:h-5" />
              <span className="text-xs sm:text-sm">Enterprise Security</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 sm:w-5 h-4 sm:h-5" />
              <span className="text-xs sm:text-sm">Real-time Processing</span>
            </div>
            <div className="flex items-center gap-2">
              <Brain className="w-4 sm:w-5 h-4 sm:h-5" />
              <span className="text-xs sm:text-sm">GPT-5.2 Powered</span>
            </div>
            <div className="flex items-center gap-2 hidden sm:flex">
              <Users className="w-4 sm:w-5 h-4 sm:h-5" />
              <span className="text-xs sm:text-sm">10,000+ Users</span>
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
              <p className="text-xs sm:text-base text-gray-500">Increase in Win Rate</p>
            </div>
            <div className="text-center">
              <p className="text-3xl sm:text-5xl font-bold text-white mb-1 sm:mb-2">2.5x</p>
              <p className="text-xs sm:text-base text-gray-500">Faster Onboarding</p>
            </div>
            <div className="text-center">
              <p className="text-3xl sm:text-5xl font-bold text-white mb-1 sm:mb-2">60%</p>
              <p className="text-xs sm:text-base text-gray-500">Less Coaching Time</p>
            </div>
            <div className="text-center">
              <p className="text-3xl sm:text-5xl font-bold text-white mb-1 sm:mb-2">95%</p>
              <p className="text-xs sm:text-base text-gray-500">Transcription Accuracy</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-4">
              Everything You Need to
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400"> Win More Deals</span>
            </h2>
            <p className="text-base sm:text-xl text-gray-400 max-w-2xl mx-auto px-4">
              Comprehensive AI analysis that turns every conversation into a learning opportunity.
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
              How It Works
            </h2>
            <p className="text-base sm:text-xl text-gray-400">
              Three simple steps to transform your sales performance.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 text-xl sm:text-2xl font-bold text-white">
                1
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">Upload Your Call</h3>
              <p className="text-sm sm:text-base text-gray-400">
                Simply drag and drop your sales call recording. We support all major audio formats.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 text-xl sm:text-2xl font-bold text-white">
                2
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">AI Analyzes Everything</h3>
              <p className="text-sm sm:text-base text-gray-400">
                Our AI transcribes, identifies speakers, detects objections, and scores your call.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 text-xl sm:text-2xl font-bold text-white">
                3
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">Get Actionable Insights</h3>
              <p className="text-sm sm:text-base text-gray-400">
                Review detailed analysis, coaching suggestions, and better response alternatives.
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
              Simple, Transparent Pricing
            </h2>
            <p className="text-base sm:text-xl text-gray-400">
              Start free, upgrade when you're ready.
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
                    Most Popular
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
              Ready to Transform Your Sales?
            </h2>
            <p className="text-base sm:text-xl text-gray-300 mb-6 sm:mb-8">
              Start your free trial today. No credit card required.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl font-semibold text-base sm:text-lg hover:from-violet-500 hover:to-fuchsia-500 transition-all shadow-lg shadow-violet-500/20"
            >
              <Zap className="w-5 h-5" />
              Get Started Free
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
                <p className="text-[10px] sm:text-xs text-gray-500">Conversation Intelligence</p>
              </div>
            </div>
            <p className="text-gray-500 text-xs sm:text-sm">
              © 2026 SalesAI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
