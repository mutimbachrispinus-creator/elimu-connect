'use client'

import { useEffect, useState } from 'react'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import { Calendar, Clock, Video, MessageSquare, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { BookingRequest, ClassSession } from '@/types'

const STATUS_COLORS: Record<string,string> = {
  pending:   'bg-amber-100 text-amber-800',
  accepted:  'bg-green-100 text-green-800',
  rejected:  'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-600',
}

export default function StudentBookingsPage() {
  const { user } = useAuth()
  const [bookings,  setBookings]  = useState<BookingRequest[]>([])
  const [sessions,  setSessions]  = useState<ClassSession[]>([])
  const [loading,   setLoading]   = useState(true)
  const [tab,       setTab]       = useState<'bookings'|'sessions'>('sessions')

  useEffect(()=>{
    if(!user) return
    const load = async()=>{
      const [bSnap, sSnap] = await Promise.all([
        getDocs(query(collection(db,'bookings'),where('studentId','==',user.uid),orderBy('createdAt','desc'))),
        getDocs(query(collection(db,'sessions'),where('participants','array-contains',user.uid),orderBy('scheduledAt','desc'))),
      ])
      setBookings(bSnap.docs.map(d=>({id:d.id,...d.data()} as BookingRequest)))
      setSessions(sSnap.docs.map(d=>({id:d.id,...d.data()} as ClassSession)))
      setLoading(false)
    }
    load()
  },[user])

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">My Sessions</h1>
        <p className="text-gray-500 mt-1">Booked classes and upcoming live sessions</p>
      </div>

      <div className="flex gap-2">
        {[{id:'sessions',label:'Live Sessions'},{id:'bookings',label:'Booking Requests'}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id as any)}
            className={cn('px-4 py-2 rounded-xl text-sm font-semibold transition-colors',
              tab===t.id?'bg-elimu-700 text-white':'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50')}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><div className="spinner"/></div>
      ) : tab==='sessions' ? (
        sessions.length===0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
            <Video className="w-10 h-10 text-gray-200 mx-auto mb-3"/>
            <p className="text-gray-400 text-sm mb-3">No sessions yet</p>
            <Link href="/dashboard/student/find-teachers" className="text-elimu-700 text-sm font-semibold hover:underline">Book a teacher →</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map(s=>{
              const isUpcoming = s.status==='scheduled' && new Date(s.scheduledAt)>new Date()
              const isLive = s.status==='live'
              return (
                <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
                    isLive?'bg-red-100':isUpcoming?'bg-blue-100':'bg-gray-100')}>
                    <Video className={cn('w-6 h-6', isLive?'text-red-600':isUpcoming?'text-blue-600':'text-gray-400')}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-900">{s.title}</p>
                      {isLive && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">LIVE</span>}
                    </div>
                    <p className="text-sm text-gray-500">{s.teacherName} · {s.subject}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3"/>
                      {new Date(s.scheduledAt).toLocaleString('en-KE',{dateStyle:'medium',timeStyle:'short'})}
                    </p>
                  </div>
                  {(isLive||isUpcoming) && (
                    <Link href={`/classroom/${s.id}`}
                      className="bg-elimu-700 hover:bg-elimu-800 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shrink-0">
                      {isLive?'Join Now':'Join'}
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        )
      ) : (
        bookings.length===0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
            <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-3"/>
            <p className="text-gray-400 text-sm mb-3">No booking requests sent yet</p>
            <Link href="/dashboard/student/find-teachers" className="text-elimu-700 text-sm font-semibold hover:underline">Find a teacher →</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map(b=>(
              <div key={b.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-gray-900">{b.subject} Tutoring</p>
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',STATUS_COLORS[b.status])}>{b.status}</span>
                    </div>
                    <p className="text-sm text-gray-500">{b.curriculum} · {b.level}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(b.createdAt).toLocaleString('en-KE',{dateStyle:'medium',timeStyle:'short'})}</p>
                  </div>
                  {b.sessionId && (
                    <Link href={`/classroom/${b.sessionId}`}
                      className="flex items-center gap-1.5 bg-elimu-700 text-white text-sm font-semibold px-3 py-2 rounded-xl transition-colors shrink-0">
                      <Video className="w-3.5 h-3.5"/> Join Session
                    </Link>
                  )}
                </div>
                {b.message && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-xl text-sm text-gray-600 flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 text-gray-400 shrink-0 mt-0.5"/>
                    <p className="text-xs">{b.message}</p>
                  </div>
                )}
                {b.teacherNote && (
                  <div className="mt-2 p-3 bg-elimu-50 rounded-xl text-sm text-elimu-800 border-l-2 border-elimu-400">
                    <strong>Teacher note:</strong> {b.teacherNote}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
