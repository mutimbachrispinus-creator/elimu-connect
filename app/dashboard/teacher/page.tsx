'use client'

import { useEffect, useState } from 'react'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import {
  Users, Video, BookOpen, DollarSign,
  Calendar, Star, ChevronRight, PlusCircle,
  Clock, TrendingUp, AlertCircle, CheckCircle,
} from 'lucide-react'
import { formatKES } from '@/lib/utils'
import type { ClassSession, BookingRequest, TeacherProfile } from '@/types'

interface StatCard { label:string; value:string|number; icon:any; color:string; sub?:string }

export default function TeacherDashboard() {
  const { user } = useAuth()
  const [profile,    setProfile]    = useState<TeacherProfile|null>(null)
  const [sessions,   setSessions]   = useState<ClassSession[]>([])
  const [bookings,   setBookings]   = useState<BookingRequest[]>([])
  const [earnings,   setEarnings]   = useState(0)
  const [loading,    setLoading]    = useState(true)

  useEffect(()=>{
    if(!user) return
    const load = async()=>{
      const [profSnap, sessSnap, bookSnap, paySnap] = await Promise.all([
        getDocs(query(collection(db,'teachers'),where('uid','==',user.uid))),
        getDocs(query(collection(db,'sessions'),where('teacherId','==',user.uid),orderBy('scheduledAt','desc'),limit(5))),
        getDocs(query(collection(db,'bookings'),where('teacherId','==',user.uid),where('status','==','pending'))),
        getDocs(query(collection(db,'payments'),where('userId','==',user.uid),where('status','==','completed'))),
      ])
      if(!profSnap.empty) setProfile(profSnap.docs[0].data() as TeacherProfile)
      setSessions(sessSnap.docs.map(d=>d.data() as ClassSession))
      setBookings(bookSnap.docs.map(d=>d.data() as BookingRequest))
      const total = paySnap.docs.reduce((s,d)=>s+(d.data().amount??0),0)
      setEarnings(total * 0.85) // after 15% platform commission
      setLoading(false)
    }
    load()
  },[user])

  if(loading) return <div className="flex items-center justify-center h-64"><div className="spinner"/></div>

  const subTier = profile?.subscription.tier ?? 'trial'
  const subEnd  = profile?.subscription.endDate ? new Date(profile.subscription.endDate) : null
  const subDays = subEnd ? Math.ceil((subEnd.getTime()-Date.now())/86400000) : 0

  const stats: StatCard[] = [
    { label:'Total Students', value: profile?.totalStudents??0,  icon:Users,      color:'text-blue-600 bg-blue-50',   sub:'All time' },
    { label:'Sessions Hosted', value: profile?.totalSessions??0, icon:Video,      color:'text-purple-600 bg-purple-50',sub:'All time' },
    { label:'Earnings (net)',  value: formatKES(earnings),       icon:DollarSign, color:'text-green-600 bg-green-50',  sub:'After 15% commission' },
    { label:'Rating',         value: `${profile?.rating??0}/5`, icon:Star,       color:'text-gold-600 bg-amber-50',   sub:`${profile?.reviewCount??0} reviews` },
  ]

  const upcomingSessions = sessions.filter(s=>s.status==='scheduled' && new Date(s.scheduledAt)>new Date())
  const pendingBookings  = bookings.filter(b=>b.status==='pending')

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">
            Good {new Date().getHours()<12?'morning':new Date().getHours()<18?'afternoon':'evening'}, {user?.displayName.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-500 mt-1">Here's what's happening on your ElimuConnect account.</p>
        </div>
        <Link href="/dashboard/teacher/sessions/new"
          className="inline-flex items-center gap-2 bg-elimu-700 hover:bg-elimu-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
          <PlusCircle className="w-4 h-4"/> New Session
        </Link>
      </div>

      {/* Subscription alert */}
      {subTier==='trial' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0"/>
          <div className="flex-1 text-sm">
            <span className="font-semibold text-amber-800">Free Trial Active</span>
            <span className="text-amber-700"> — {subDays} days remaining. </span>
            <Link href="/dashboard/teacher/settings#subscription" className="text-amber-800 font-semibold underline">Upgrade now</Link>
          </div>
        </div>
      )}
      {subTier!=='trial' && subDays <= 7 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0"/>
          <p className="text-sm text-red-800">Your subscription expires in <strong>{subDays} days</strong>. <Link href="/dashboard/teacher/settings#subscription" className="underline font-semibold">Renew now →</Link></p>
        </div>
      )}

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({label,value,icon:Icon,color,sub})=>(
          <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
              </div>
              <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
                <Icon className="w-5 h-5"/>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pending bookings */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-elimu-600"/> Pending Booking Requests
              {pendingBookings.length>0 && <span className="ml-1 bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">{pendingBookings.length}</span>}
            </h2>
            <Link href="/dashboard/teacher/bookings" className="text-xs text-elimu-600 font-semibold hover:underline flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3"/>
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {pendingBookings.length===0 && (
              <p className="px-5 py-8 text-center text-gray-400 text-sm">No pending requests</p>
            )}
            {pendingBookings.slice(0,4).map(b=>(
              <div key={b.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700 font-bold text-xs shrink-0">
                  {b.studentName.split(' ').map(n=>n[0]).join('').slice(0,2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{b.studentName}</p>
                  <p className="text-xs text-gray-500">{b.subject} · {b.level}</p>
                </div>
                <Link href={`/dashboard/teacher/bookings?id=${b.id}`}
                  className="text-xs bg-elimu-50 hover:bg-elimu-100 text-elimu-700 font-semibold px-3 py-1.5 rounded-lg transition-colors shrink-0">
                  Respond
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming sessions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Video className="w-4 h-4 text-elimu-600"/> Upcoming Sessions
            </h2>
            <Link href="/dashboard/teacher/sessions" className="text-xs text-elimu-600 font-semibold hover:underline flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3"/>
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {upcomingSessions.length===0 && (
              <div className="px-5 py-8 text-center">
                <p className="text-gray-400 text-sm mb-3">No upcoming sessions</p>
                <Link href="/dashboard/teacher/sessions/new"
                  className="inline-flex items-center gap-1 text-elimu-700 text-sm font-semibold hover:underline">
                  <PlusCircle className="w-4 h-4"/> Schedule one
                </Link>
              </div>
            )}
            {upcomingSessions.slice(0,4).map(s=>(
              <div key={s.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
                  <Video className="w-4 h-4 text-purple-600"/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{s.title}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3"/>
                    {new Date(s.scheduledAt).toLocaleString('en-KE',{dateStyle:'medium',timeStyle:'short'})}
                    · {s.participants.length} joined
                  </p>
                </div>
                <Link href={`/classroom/${s.id}`}
                  className="text-xs bg-elimu-700 hover:bg-elimu-800 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors shrink-0">
                  Start
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { href:'/dashboard/teacher/courses/new', icon:BookOpen,  label:'Create Course',       desc:'Upload video lessons & earn' },
          { href:'/dashboard/teacher/library',     icon:TrendingUp,label:'Upload Resource',     desc:'Add to the shared library' },
          { href:'/dashboard/teacher/sessions/new',icon:Video,     label:'Schedule Session',    desc:'Book a live classroom slot' },
        ].map(a=>(
          <Link key={a.href} href={a.href}
            className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-elimu-200 transition-all group">
            <div className="w-10 h-10 bg-elimu-50 group-hover:bg-elimu-100 rounded-xl flex items-center justify-center mb-3 transition-colors">
              <a.icon className="w-5 h-5 text-elimu-700"/>
            </div>
            <p className="font-semibold text-gray-900 text-sm">{a.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{a.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
