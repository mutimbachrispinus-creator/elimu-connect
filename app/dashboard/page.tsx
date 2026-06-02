'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function DashboardIndex() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user) { router.replace('/login'); return }
    const routes: Record<string, string> = {
      superadmin: '/dashboard/admin',
      teacher:    '/dashboard/teacher',
      student:    '/dashboard/student',
      parent:     '/dashboard/parent',
    }
    router.replace(routes[user.role] ?? '/dashboard/student')
  }, [user, loading, router])

  return (
    <div className="flex items-center justify-center h-64">
      <div className="spinner" />
    </div>
  )
}
