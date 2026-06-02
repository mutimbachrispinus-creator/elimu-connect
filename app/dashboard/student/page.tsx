'use client'

import { useEffect, useState } from 'react'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import {
  BookOpen, Calendar, Search, Clock, PlayCircle,
  ChevronRight, Star, GraduationCap, Library,
} from 'lucide-react'
import { formatKES, curriculumColor, cn } from '@/lib/utils'
import type { ClassSession, Course, BookingRequest } from '@/types'

export default function StudentDashboard() {
  const { user } = useAuth()
  const [sessions,  setSessions]  = useState<ClassSession[]>([])
  const [courses,   setCourses]   = useState<Course[]>([])
  const [bookings,  setBookings]  = useState<BookingRequest[]>([])
  const [loading,   setLoading]   = useState(true)

  useEffect(()=>{
    if(!user) return
    const load = async()=>{
      const [sessSnap, courseSnap, bookSnap] = await Promise.all([
        getDocs(query(collection(db,'sessions'),where('participants','array-contains',user.uid),limit(5))),
        getDocs(query(collection(db,'courses'),where('isPublished','==',true),orderBy('createdAt','desc'),limit(6))),
        getDocs(query(collection(db,'bookings'),where('studentId','==',user.uid),limit(5))),
      ])
      setSessions(sessSnap.docs.map(d=>({id:d.id,...d.data()} as ClassSession)))
      setCourses(courseSnap.docs.map(d=>({id:d.id,...d.data()} as Course)))
      setBookings(bookSnap.docs.map(d=>({id:d.id,...d.data()} as BookingRequest)))
      setLoading(false)
    }
    load()
  },[user])

  const upcomingSessions = sessions.filter(s=>s.status==='scheduled'&&new Date(s.scheduledAt)>new Date())
  const pendingBookings  = bookings.filter(b=>b.status==='pending')

  if(loading) return <div className="flex items-center justify-center h-64"><div className="spinner"/></div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">
          Welcome back, {user?.displayName.split(' ')[0]}! 📚
        </h1>
        <p className="text-gray-500 mt-1">Continue your learning journey</p>
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { href:'/dashboard/student/find-teachers', icon:Search,    label:'Find a Tutor',    desc:'Browse verified teachers',    color:'bg-blue-600' },
          { href:'/dashboard/student/my-courses',    icon:PlayCircle,label:'Continue Learning',desc:'Pick up where you left off',  color:'bg-purple-600' },
          { href:'/dashboard/student/library',       icon:Library,   label:'Resource Library', desc:'Free & paid study materials', color:'bg-amber-600' },
        ].map(a=>(
          <Link key={a.href} href={a.href}
            className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow group flex items-start gap-4">
            <div className={`w-10 h-10 ${a.color} rounded-xl flex items-center justify-center shrink-0`}>
              <a.icon className="w-5 h-5 text-white"/>
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{a.label}</p>
              <p className="text-xs text-gray-500">{a.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upcoming sessions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-elimu-600"/> Upcoming Sessions
            </h2>
            <Link href="/dashboard/student/my-bookings" className="text-xs text-elimu-600 font-semibold hover:underline flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3"/>
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {upcomingSessions.length===0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-gray-400 text-sm mb-3">No upcoming sessions</p>
                <Link href="/dashboard/student/find-teachers"
                  className="text-elimu-700 text-sm font-semibold hover:underline">Book a teacher →</Link>
              </div>
            ) : upcomingSessions.map(s=>(
              <div key={s.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4 text-purple-600"/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{s.title}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3"/>
                    {new Date(s.scheduledAt).toLocaleString('en-KE',{dateStyle:'medium',timeStyle:'short'})}
                  </p>
                </div>
                <Link href={`/classroom/${s.id}`}
                  className="text-xs bg-elimu-700 text-white font-semibold px-3 py-1.5 rounded-lg shrink-0">
                  Join
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Booking requests */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-elimu-600"/> My Booking Requests
            </h2>
          </div>
          <div className="divide-y divide-gray-50">
            {bookings.length===0 ? (
              <p className="text-center text-gray-400 text-sm py-8">No bookings yet</p>
            ) : bookings.slice(0,4).map(b=>(
              <div key={b.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{b.subject}</p>
                  <p className="text-xs text-gray-500">{new Date(b.createdAt).toLocaleDateString('en-KE')}</p>
                </div>
                <span className={cn('text-xs px-2 py-1 rounded-full font-semibold capitalize', {
                  pending:'bg-amber-100 text-amber-800',
                  accepted:'bg-green-100 text-green-800',
                  rejected:'bg-red-100 text-red-800',
                  cancelled:'bg-gray-100 text-gray-600',
                }[b.status])}>
                  {b.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Discover courses */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Discover Courses</h2>
          <Link href="/dashboard/student/my-courses" className="text-xs text-elimu-600 font-semibold hover:underline flex items-center gap-1">
            Browse all <ChevronRight className="w-3 h-3"/>
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map(c=>(
            <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              <div className="aspect-video bg-gray-100 relative">
                {c.thumbnailUrl
                  ? <img src={c.thumbnailUrl} alt={c.title} className="w-full h-full object-cover"/>
                  : <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-8 h-8 text-gray-300"/></div>}
              </div>
              <div className="p-4">
                <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium mb-2 inline-block', curriculumColor(c.curriculum))}>{c.curriculum}</span>
                <h3 className="font-bold text-sm text-gray-900 line-clamp-2 mb-1">{c.title}</h3>
                <p className="text-xs text-gray-500 mb-3">{c.teacherName} · {c.subject}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400"/>{(c.rating??0).toFixed(1)}
                    <span className="text-gray-300 mx-1">·</span>
                    <PlayCircle className="w-3 h-3"/>{c.lessons?.length??0} lessons
                  </div>
                  <span className="font-bold text-elimu-700 text-sm">{c.price===0?'Free':formatKES(c.price)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
