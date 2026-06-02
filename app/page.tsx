import Link from 'next/link'
import {
  BookOpen, Users, Video, Shield, Star, Award,
  ChevronRight, GraduationCap, Globe, Smartphone,
  CheckCircle, PlayCircle, Zap,
} from 'lucide-react'

const CURRICULA = ['CBC', 'Cambridge', 'IB', 'Montessori', '8-4-4', 'American', 'French', 'GCSE', 'BTEC']

const FEATURES = [
  { icon: Video,         title: 'Live Virtual Classrooms',    desc: 'Built-in video conferencing — no Zoom needed. HD video, screen share, whiteboard & chat.' },
  { icon: BookOpen,      title: 'Paid Video Courses',         desc: 'Teachers publish courses and earn. Learners unlock premium lessons with M-Pesa or card.' },
  { icon: Users,         title: 'Smart Teacher Discovery',    desc: 'Filter by curriculum, level, subject and availability. Send a booking request in seconds.' },
  { icon: Globe,         title: 'All Curricula Covered',      desc: 'CBC, Cambridge, IB, Montessori, 8-4-4 and more — from PP1 to A-Level and beyond.' },
  { icon: Shield,        title: 'Verified Educators',         desc: 'Every teacher is verified by the ElimuConnect team before going live on the platform.' },
  { icon: Smartphone,    title: 'M-Pesa Payments',            desc: 'Seamless Safaricom STK push, Pesapal, and card payments for Kenyan and global learners.' },
]

const HOW_IT_WORKS = [
  { step: '01', role: 'Teacher', items: ['Create a teacher account & pay registration fee', 'Choose your subscription tier', 'Set up your profile, subjects & availability', 'Accept booking requests & host live sessions', 'Upload paid courses and earn commissions'] },
  { step: '02', role: 'Student/Parent', items: ['Register as a student or link a child as a parent', 'Search for teachers by subject, curriculum & level', 'Send a booking request with your preferred dates', 'Join the built-in live classroom', 'Access the resource library & unlock paid courses'] },
]

const PRICING = [
  { name: 'Free Trial', price: 0, duration: '14 days', color: 'border-gray-200', badge: null, features: ['Up to 5 students', 'Live classroom access', 'Basic library access', 'Email support'] },
  { name: 'Basic', price: 500, duration: '/month', color: 'border-elimu-400', badge: 'Most Popular', features: ['Up to 20 students', 'Live classroom access', 'Upload up to 10 courses', 'Full library access', 'Priority support'] },
  { name: 'Professional', price: 1500, duration: '/month', color: 'border-gold-400', badge: 'Best Value', features: ['Up to 100 students', 'Unlimited live sessions', 'Unlimited course uploads', 'Analytics dashboard', 'Verified badge', 'Dedicated support'] },
  { name: 'Enterprise', price: 5000, duration: '/month', color: 'border-purple-400', badge: null, features: ['Unlimited students', 'Custom branding', 'API access', 'School/institution tier', 'SLA guarantee', 'Account manager'] },
]

const TESTIMONIALS = [
  { name: 'Amina Ochieng', role: 'Form 4 Student, Nairobi', text: 'I found an amazing Chemistry tutor for my KCSE prep. The live classroom feels just like being in school!', stars: 5 },
  { name: 'Mr. David Kipkoech', role: 'Mathematics Teacher, Eldoret', text: 'ElimuConnect let me reach 40+ students across Kenya. My video courses are now earning me extra income every month.', stars: 5 },
  { name: 'Grace Wanjiku', role: 'Parent, Nakuru', text: 'I enrolled my Grade 6 child in CBC classes. Booking a teacher and paying via M-Pesa was incredibly easy.', stars: 5 },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ─── Navigation ─────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-elimu-700 to-elimu-500 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-elimu-800">ElimuConnect</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link href="#features"   className="hover:text-elimu-700 transition-colors">Features</Link>
            <Link href="#how-it-works" className="hover:text-elimu-700 transition-colors">How It Works</Link>
            <Link href="#pricing"    className="hover:text-elimu-700 transition-colors">Pricing</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-semibold text-elimu-700 hover:text-elimu-900 transition-colors px-4 py-2 rounded-lg hover:bg-elimu-50">
              Sign In
            </Link>
            <Link href="/register" className="text-sm font-semibold text-white bg-elimu-700 hover:bg-elimu-800 transition-colors px-4 py-2 rounded-lg shadow-sm">
              Get Started →
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ────────────────────────────────────────────────────────── */}
      <section className="hero-gradient min-h-screen flex items-center pt-16 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-20 right-10 w-96 h-96 bg-elimu-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-64 h-64 bg-gold-400/10 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 grid lg:grid-cols-2 gap-16 items-center">
          <div className="text-white">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-sm font-medium mb-8">
              <Zap className="w-4 h-4 text-gold-300" />
              <span className="text-white/90">Kenya's #1 Online Learning Platform</span>
            </div>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6">
              Connecting
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-gold-300 to-gold-400">
                Learners to
              </span>
              Excellence
            </h1>
            <p className="text-white/80 text-lg sm:text-xl leading-relaxed mb-10 max-w-lg">
              Find verified tutors across CBC, Cambridge, IB, Montessori and more. Book live sessions, unlock video lessons, and access a world-class resource library — all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register/student" className="inline-flex items-center justify-center gap-2 bg-white text-elimu-800 font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
                I'm a Student / Parent <ChevronRight className="w-5 h-5" />
              </Link>
              <Link href="/register/teacher" className="inline-flex items-center justify-center gap-2 bg-elimu-600 border border-elimu-400 text-white font-bold px-8 py-4 rounded-xl hover:bg-elimu-500 transition-all">
                I'm a Teacher <Award className="w-5 h-5" />
              </Link>
            </div>
            <div className="flex items-center gap-6 mt-10">
              {[['2,400+', 'Tutors'],['18,000+', 'Students'],['9 Curricula', 'Supported']].map(([num, label]) => (
                <div key={label}>
                  <p className="text-2xl font-bold text-white">{num}</p>
                  <p className="text-white/60 text-sm">{label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="hidden lg:block relative">
            {/* Mock classroom preview card */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <span className="flex items-center gap-2 text-white font-semibold">
                  <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                  Live Session – Grade 10 Maths
                </span>
                <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full">12 students</span>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {Array.from({length:6}).map((_,i)=>(
                  <div key={i} className="aspect-video bg-elimu-800/50 rounded-lg flex items-center justify-center">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${['from-blue-400 to-blue-600','from-purple-400 to-purple-600','from-rose-400 to-rose-600','from-amber-400 to-amber-600','from-teal-400 to-teal-600','from-indigo-400 to-indigo-600'][i]}`} />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-4">
                {['🎤','📹','💬','✋','📤'].map(icon => (
                  <div key={icon} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-lg cursor-pointer hover:bg-white/30 transition-colors">{icon}</div>
                ))}
                <div className="w-10 h-10 bg-red-500/80 rounded-full flex items-center justify-center cursor-pointer">📵</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Curricula ticker ────────────────────────────────────────────── */}
      <section className="bg-elimu-800 py-4 overflow-hidden">
        <div className="flex whitespace-nowrap">
          <div className="marquee-track flex gap-8 px-4">
            {[...CURRICULA,...CURRICULA].map((c, i) => (
              <span key={i} className="text-white/70 font-medium text-sm uppercase tracking-widest">
                {c} <span className="text-gold-400 mx-4">✦</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-elimu-600 font-semibold text-sm uppercase tracking-widest mb-3">Platform Features</p>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-gray-900 mb-4">Everything you need to learn & teach</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">A complete ecosystem built for Kenya's educators and learners, with global curriculum support.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow border border-gray-100 group">
                <div className="w-12 h-12 bg-elimu-50 group-hover:bg-elimu-100 rounded-xl flex items-center justify-center mb-6 transition-colors">
                  <Icon className="w-6 h-6 text-elimu-700" />
                </div>
                <h3 className="font-display font-bold text-xl text-gray-900 mb-3">{title}</h3>
                <p className="text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-elimu-600 font-semibold text-sm uppercase tracking-widest mb-3">Simple Process</p>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-gray-900">How ElimuConnect Works</h2>
          </div>
          <div className="grid lg:grid-cols-2 gap-12">
            {HOW_IT_WORKS.map(({ step, role, items }) => (
              <div key={role} className="relative">
                <div className="flex items-center gap-4 mb-8">
                  <span className="font-display text-6xl font-bold text-elimu-100">{step}</span>
                  <h3 className="font-display text-2xl font-bold text-gray-900">For {role}s</h3>
                </div>
                <div className="space-y-4">
                  {items.map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-elimu-500 mt-0.5 shrink-0" />
                      <p className="text-gray-600">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ─────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-elimu-600 font-semibold text-sm uppercase tracking-widest mb-3">Teacher Subscriptions</p>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-gray-900 mb-4">Start with a Free Trial</h2>
            <p className="text-gray-500 text-lg">A one-time registration fee applies. Subscription billed monthly or annually.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PRICING.map(({ name, price, duration, color, badge, features }) => (
              <div key={name} className={`bg-white rounded-2xl p-7 border-2 ${color} relative shadow-sm hover:shadow-lg transition-shadow`}>
                {badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-elimu-700 text-white text-xs font-bold px-3 py-1 rounded-full">
                    {badge}
                  </span>
                )}
                <h3 className="font-display text-xl font-bold text-gray-900 mb-1">{name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl font-bold text-elimu-700">KES {price.toLocaleString()}</span>
                  <span className="text-gray-400 text-sm">{duration}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-elimu-500 shrink-0 mt-0.5" /> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register/teacher" className="block text-center bg-elimu-700 hover:bg-elimu-800 text-white font-semibold py-3 rounded-xl transition-colors text-sm">
                  {price === 0 ? 'Start Free Trial' : 'Get Started'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ────────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold text-gray-900">What our community says</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {TESTIMONIALS.map(({ name, role, text, stars }) => (
              <div key={name} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <div className="flex text-gold-400 text-lg mb-4">{'★'.repeat(stars)}</div>
                <p className="text-gray-700 italic leading-relaxed mb-6">"{text}"</p>
                <div>
                  <p className="font-semibold text-gray-900">{name}</p>
                  <p className="text-gray-400 text-sm">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────────────────────────── */}
      <section className="hero-gradient py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-white mb-6">
            Ready to transform your learning journey?
          </h2>
          <p className="text-white/70 text-lg mb-10 max-w-xl mx-auto">Join thousands of Kenyan learners and educators already on ElimuConnect.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register/student" className="inline-flex items-center justify-center gap-2 bg-white text-elimu-800 font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all">
              Join as Student / Parent
            </Link>
            <Link href="/register/teacher" className="inline-flex items-center justify-center gap-2 bg-elimu-600 border border-elimu-400 text-white font-bold px-8 py-4 rounded-xl hover:bg-elimu-500 transition-all">
              Join as Teacher
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-elimu-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-white">ElimuConnect</span>
            </div>
            <p className="text-sm">© {new Date().getFullYear()} ElimuConnect. Connecting Learners to Excellence across Kenya and beyond.</p>
            <div className="flex gap-6 text-sm">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms"   className="hover:text-white transition-colors">Terms</Link>
              <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
