'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import {
  LayoutDashboard, Users, BookOpen, Video, Calendar,
  Library, DollarSign, Settings, LogOut, GraduationCap,
  Search, Bell, ChevronRight, UserCheck, BookMarked,
  BarChart3, CreditCard, UserPlus,
} from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import toast from 'react-hot-toast'

// Nav config per role
const NAV_CONFIG = {
  superadmin: [
    { href:'/dashboard/admin',            icon:LayoutDashboard, label:'Overview' },
    { href:'/dashboard/admin/teachers',   icon:UserCheck,       label:'Teachers' },
    { href:'/dashboard/admin/students',   icon:Users,           label:'Students' },
    { href:'/dashboard/admin/courses',    icon:BookOpen,        label:'Courses' },
    { href:'/dashboard/admin/payments',   icon:CreditCard,      label:'Payments' },
    { href:'/dashboard/admin/library',    icon:Library,         label:'Library' },
    { href:'/dashboard/admin/settings',   icon:Settings,        label:'Settings' },
  ],
  teacher: [
    { href:'/dashboard/teacher',           icon:LayoutDashboard, label:'Overview' },
    { href:'/dashboard/teacher/sessions',  icon:Video,           label:'Live Sessions' },
    { href:'/dashboard/teacher/bookings',  icon:Calendar,        label:'Bookings' },
    { href:'/dashboard/teacher/courses',   icon:BookOpen,        label:'My Courses' },
    { href:'/dashboard/teacher/library',   icon:Library,         label:'Library' },
    { href:'/dashboard/teacher/earnings',  icon:DollarSign,      label:'Earnings' },
    { href:'/dashboard/teacher/settings',  icon:Settings,        label:'Settings' },
  ],
  student: [
    { href:'/dashboard/student',                   icon:LayoutDashboard, label:'Overview' },
    { href:'/dashboard/student/find-teachers',     icon:Search,          label:'Find Tutors' },
    { href:'/dashboard/student/my-bookings',       icon:Calendar,        label:'My Sessions' },
    { href:'/dashboard/student/my-courses',        icon:BookMarked,      label:'My Courses' },
    { href:'/dashboard/student/library',           icon:Library,         label:'Library' },
    { href:'/dashboard/student/settings',          icon:Settings,        label:'Settings' },
  ],
  parent: [
    { href:'/dashboard/parent',            icon:LayoutDashboard, label:'Overview' },
    { href:'/dashboard/parent/children',   icon:Users,           label:'My Children' },
    { href:'/dashboard/parent/payments',   icon:CreditCard,      label:'Payments' },
    { href:'/dashboard/parent/settings',   icon:Settings,        label:'Settings' },
  ],
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth()
  const router   = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading, router])

  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out')
    router.push('/')
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    )
  }

  const navItems = NAV_CONFIG[user.role] ?? NAV_CONFIG.student

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* ─── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col fixed inset-y-0 left-0 z-30 shadow-sm">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-elimu-700 to-elimu-500 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-lg text-elimu-800">ElimuConnect</span>
          </Link>
        </div>

        {/* User card */}
        <div className="p-4 mx-3 mt-4 bg-elimu-50 rounded-xl border border-elimu-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-elimu-700 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0">
              {getInitials(user.displayName)}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">{user.displayName}</p>
              <p className="text-xs text-elimu-600 font-medium capitalize">{user.role}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link key={href} href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  active
                    ? 'bg-elimu-50 text-elimu-800 font-semibold'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                )}>
                <Icon className={cn('w-4 h-4 shrink-0', active ? 'text-elimu-700' : 'text-gray-400')} />
                {label}
                {active && <ChevronRight className="w-3 h-3 ml-auto text-elimu-400" />}
              </Link>
            )
          })}
        </nav>

        {/* Sign out */}
        <div className="p-3 border-t border-gray-100">
          <button onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* ─── Main content ──────────────────────────────────────────────────── */}
      <div className="ml-64 flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-20 shadow-sm">
          <div />
          <div className="flex items-center gap-3">
            <Link href="/dashboard/notifications"
              className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </Link>
            <div className="h-6 w-px bg-gray-200" />
            <div className="flex items-center gap-2 text-sm">
              <div className="w-8 h-8 bg-elimu-700 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                {getInitials(user.displayName)}
              </div>
              <span className="font-medium text-gray-700 hidden sm:block">{user.displayName.split(' ')[0]}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
