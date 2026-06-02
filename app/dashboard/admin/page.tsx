'use client'

import { useEffect, useState } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import {
  Users, GraduationCap, BookOpen, DollarSign,
  TrendingUp, AlertTriangle, CheckCircle, Clock,
  BarChart3, Settings, ChevronRight,
} from 'lucide-react'
import Link from 'next/link'
import { formatKES } from '@/lib/utils'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    teachers: 0, students: 0, parents: 0,
    courses: 0, sessions: 0, revenue: 0,
    pendingTeachers: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    const load = async()=>{
      const [usersSnap, coursesSnap, sessionsSnap, paymentsSnap] = await Promise.all([
        getDocs(collection(db,'users')),
        getDocs(collection(db,'courses')),
        getDocs(collection(db,'sessions')),
        getDocs(query(collection(db,'payments'),where('status','==','completed'))),
      ])
      const users = usersSnap.docs.map(d=>d.data())
      const revenue = paymentsSnap.docs.reduce((s,d)=>s+(d.data().amount??0),0)
      const pendingTeachers = (await getDocs(query(collection(db,'teachers'),where('isVerified','==',false)))).size
      setStats({
        teachers: users.filter(u=>u.role==='teacher').length,
        students: users.filter(u=>u.role==='student').length,
        parents:  users.filter(u=>u.role==='parent').length,
        courses:  coursesSnap.size,
        sessions: sessionsSnap.size,
        revenue:  revenue * 0.15, // platform commission
        pendingTeachers,
      })
      setLoading(false)
    }
    load()
  },[])

  if(loading) return <div className="flex items-center justify-center h-64"><div className="spinner"/></div>

  const statCards = [
    { label:'Teachers',        value:stats.teachers,        icon:GraduationCap, color:'text-blue-600 bg-blue-50',   href:'/dashboard/admin/teachers' },
    { label:'Students',        value:stats.students,        icon:Users,         color:'text-green-600 bg-green-50',  href:'/dashboard/admin/students' },
    { label:'Active Courses',  value:stats.courses,         icon:BookOpen,      color:'text-purple-600 bg-purple-50',href:'/dashboard/admin/courses' },
    { label:'Platform Revenue',value:formatKES(stats.revenue),icon:DollarSign,  color:'text-amber-600 bg-amber-50',  href:'/dashboard/admin/payments' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Admin Overview</h1>
          <p className="text-gray-500 mt-1">ElimuConnect platform management</p>
        </div>
        <Link href="/dashboard/admin/settings"
          className="inline-flex items-center gap-2 border border-gray-200 text-gray-700 text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
          <Settings className="w-4 h-4"/> Platform Settings
        </Link>
      </div>

      {/* Alert */}
      {stats.pendingTeachers > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600"/>
            <span className="text-sm text-amber-800"><strong>{stats.pendingTeachers} teacher{stats.pendingTeachers>1?'s':''}</strong> pending verification</span>
          </div>
          <Link href="/dashboard/admin/teachers?filter=pending"
            className="text-xs text-amber-800 font-semibold hover:underline flex items-center gap-1">
            Review <ChevronRight className="w-3 h-3"/>
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({label,value,icon:Icon,color,href})=>(
          <Link key={label} href={href}
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
                <Icon className="w-5 h-5"/>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors"/>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
          </Link>
        ))}
      </div>

      {/* Quick settings preview */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Settings className="w-4 h-4 text-elimu-600"/> Platform Settings
        </h2>
        <div className="grid sm:grid-cols-3 gap-4 text-sm">
          {[
            { label:'Registration Fee', value:'KES 500', href:'/dashboard/admin/settings' },
            { label:'Platform Commission', value:'15%', href:'/dashboard/admin/settings' },
            { label:'Trial Duration', value:'14 days', href:'/dashboard/admin/settings' },
          ].map(({label,value,href})=>(
            <div key={label} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <p className="text-gray-500 text-xs">{label}</p>
                <p className="font-bold text-gray-900">{value}</p>
              </div>
              <Link href={href} className="text-xs text-elimu-600 font-semibold hover:underline">Edit</Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
