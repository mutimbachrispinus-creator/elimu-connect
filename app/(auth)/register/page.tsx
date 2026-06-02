import Link from 'next/link'
import { GraduationCap, Users, BookOpen, Shield } from 'lucide-react'

const ROLES = [
  {
    href: '/register/teacher',
    icon: GraduationCap,
    title: 'Teacher / Tutor',
    desc: 'Register as an educator, set your subjects and availability, host live classes and sell courses.',
    color: 'border-elimu-400 hover:bg-elimu-50',
    badge: 'Registration fee applies',
  },
  {
    href: '/register/student',
    icon: BookOpen,
    title: 'Student',
    desc: 'Find tutors, join live sessions, access the resource library and unlock courses.',
    color: 'border-blue-300 hover:bg-blue-50',
    badge: 'Free to join',
  },
  {
    href: '/register/parent',
    icon: Users,
    title: 'Parent / Guardian',
    desc: 'Register and link your children. Monitor their progress and manage payments.',
    color: 'border-purple-300 hover:bg-purple-50',
    badge: 'Free to join',
  },
]

export default function RegisterPage() {
  return (
    <div className="w-full max-w-2xl">
      <div className="text-center mb-10">
        <h1 className="font-display text-4xl font-bold text-gray-900 mb-3">Join ElimuConnect</h1>
        <p className="text-gray-500 text-lg">How would you like to use the platform?</p>
      </div>

      <div className="space-y-4">
        {ROLES.map(({ href, icon: Icon, title, desc, color, badge }) => (
          <Link key={href} href={href}
            className={`flex items-center gap-6 bg-white border-2 ${color} rounded-2xl p-6 shadow-sm transition-all hover:shadow-md group`}
          >
            <div className="w-14 h-14 bg-gray-100 group-hover:bg-white rounded-2xl flex items-center justify-center shrink-0 transition-colors">
              <Icon className="w-7 h-7 text-gray-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h2 className="font-display font-bold text-xl text-gray-900">{title}</h2>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">{badge}</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
            <div className="text-gray-300 group-hover:text-elimu-600 transition-colors text-2xl">→</div>
          </Link>
        ))}
      </div>

      <p className="text-center text-sm text-gray-500 mt-8">
        Already have an account?{' '}
        <Link href="/login" className="text-elimu-700 font-semibold hover:underline">Sign in</Link>
      </p>
    </div>
  )
}
