'use client'

import { useEffect, useState } from 'react'
import { collection, query, where, getDocs, updateDoc, doc, addDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import {
  Calendar, Check, X, Clock, MessageSquare,
  ChevronDown, Loader2, Video, PlusCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'
import type { BookingRequest } from '@/types'

const STATUS_COLORS: Record<string,string> = {
  pending:   'bg-amber-100 text-amber-800',
  accepted:  'bg-green-100 text-green-800',
  rejected:  'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-600',
}

export default function TeacherBookingsPage() {
  const { user } = useAuth()
  const [bookings,    setBookings]    = useState<BookingRequest[]>([])
  const [filter,      setFilter]      = useState<string>('pending')
  const [loading,     setLoading]     = useState(true)
  const [responding,  setResponding]  = useState<string|null>(null)
  const [showSchedule,setShowSchedule]= useState<BookingRequest|null>(null)
  const [scheduleForm,setScheduleForm]= useState({ title:'', scheduledAt:'', duration:60, price:0 })
  const [scheduling,  setScheduling]  = useState(false)

  const load = async () => {
    if(!user) return
    const snap = await getDocs(query(collection(db,'bookings'),where('teacherId','==',user.uid)))
    const all  = snap.docs.map(d=>({id:d.id,...d.data()} as BookingRequest))
    all.sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime())
    setBookings(all)
    setLoading(false)
  }

  useEffect(()=>{ load() },[user])

  const respond = async (booking: BookingRequest, status: 'accepted'|'rejected', note?: string) => {
    setResponding(booking.id)
    try {
      await updateDoc(doc(db,'bookings',booking.id),{
        status, teacherNote: note ?? '',
        updatedAt: new Date().toISOString(),
      })
      // Send notification (fire-and-forget)
      fetch('/api/notify',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ userId:booking.studentId, type:'booking_'+status,
          title:`Booking ${status}`, message:`Your booking request for ${booking.subject} has been ${status}.`,
          actionUrl:'/dashboard/student/my-bookings' })
      }).catch(()=>{})
      toast.success(`Booking ${status}!`)
      if(status==='accepted') setShowSchedule(booking)
      load()
    } catch(e:any){ toast.error(e.message)
    } finally { setResponding(null) }
  }

  const createSession = async () => {
    if(!user || !showSchedule) return
    if(!scheduleForm.title || !scheduleForm.scheduledAt){ toast.error('Title and date/time required'); return }
    setScheduling(true)
    try {
      const sessionRef = await addDoc(collection(db,'sessions'),{
        teacherId:       user.uid,
        teacherName:     user.displayName,
        title:           scheduleForm.title,
        subject:         showSchedule.subject,
        curriculum:      showSchedule.curriculum,
        level:           showSchedule.level,
        scheduledAt:     new Date(scheduleForm.scheduledAt).toISOString(),
        duration:        scheduleForm.duration,
        maxParticipants: 30,
        participants:    [showSchedule.studentId],
        status:          'scheduled',
        price:           scheduleForm.price,
        recordingEnabled:false,
        createdAt:       new Date().toISOString(),
      })
      await updateDoc(doc(db,'bookings',showSchedule.id),{ sessionId: sessionRef.id })
      toast.success('Session scheduled! Student will see it in their dashboard.')
      setShowSchedule(null)
      load()
    } catch(e:any){ toast.error(e.message)
    } finally { setScheduling(false) }
  }

  const filtered = bookings.filter(b=> filter==='all' || b.status===filter)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Booking Requests</h1>
        <p className="text-gray-500 mt-1">Manage incoming session requests from students</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {['pending','accepted','rejected','all'].map(f=>(
          <button key={f} onClick={()=>setFilter(f)}
            className={cn('px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-colors',
              filter===f ? 'bg-elimu-700 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50')}>
            {f}
            <span className="ml-1.5 text-xs opacity-75">({bookings.filter(b=>f==='all'||b.status===f).length})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><div className="spinner"/></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-3"/>
          <p className="text-gray-400 text-sm">No {filter !== 'all' ? filter : ''} booking requests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(b=>(
            <div key={b.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
                    {b.studentName.split(' ').map(n=>n[0]).join('').slice(0,2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900">{b.studentName}</p>
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', STATUS_COLORS[b.status])}>
                        {b.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{b.subject} · {b.curriculum} · {b.level}</p>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3"/>
                      {new Date(b.createdAt).toLocaleString('en-KE',{dateStyle:'medium',timeStyle:'short'})}
                    </p>
                  </div>
                </div>
                {b.status==='pending' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={()=>respond(b,'rejected')} disabled={responding===b.id}
                      className="w-9 h-9 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors">
                      <X className="w-4 h-4"/>
                    </button>
                    <button onClick={()=>respond(b,'accepted')} disabled={responding===b.id}
                      className="flex items-center gap-1.5 bg-elimu-700 hover:bg-elimu-800 text-white text-sm font-semibold px-3 py-2 rounded-xl transition-colors">
                      {responding===b.id ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Check className="w-3.5 h-3.5"/>}
                      Accept
                    </button>
                  </div>
                )}
                {b.status==='accepted' && !b.sessionId && (
                  <button onClick={()=>{ setShowSchedule(b); setScheduleForm({title:`${b.subject} Session`,scheduledAt:'',duration:60,price:0}) }}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-3 py-2 rounded-xl transition-colors shrink-0">
                    <Video className="w-3.5 h-3.5"/> Schedule
                  </button>
                )}
                {b.sessionId && (
                  <a href={`/classroom/${b.sessionId}`}
                    className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-3 py-2 rounded-xl transition-colors shrink-0">
                    <Video className="w-3.5 h-3.5"/> Open
                  </a>
                )}
              </div>
              {b.message && (
                <div className="mt-3 p-3 bg-gray-50 rounded-xl text-sm text-gray-600 flex items-start gap-2 border-l-2 border-elimu-300">
                  <MessageSquare className="w-4 h-4 text-elimu-500 shrink-0 mt-0.5"/>
                  <p>{b.message}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Schedule session modal */}
      {showSchedule && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-bold text-gray-900">Schedule Session</h2>
              <button onClick={()=>setShowSchedule(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 mb-4 text-sm text-blue-800">
              <strong>{showSchedule.studentName}</strong> · {showSchedule.subject} · {showSchedule.level}
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Session Title</label>
                <input value={scheduleForm.title} onChange={e=>setScheduleForm(f=>({...f,title:e.target.value}))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-elimu-400 outline-none text-sm"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date & Time</label>
                  <input type="datetime-local" value={scheduleForm.scheduledAt} onChange={e=>setScheduleForm(f=>({...f,scheduledAt:e.target.value}))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-elimu-400 outline-none text-sm"/>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Duration (min)</label>
                  <select value={scheduleForm.duration} onChange={e=>setScheduleForm(f=>({...f,duration:+e.target.value}))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-elimu-400 outline-none text-sm bg-white">
                    {[30,45,60,90,120].map(d=><option key={d} value={d}>{d} min</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Session Fee (KES) — 0 if included in booking</label>
                <input type="number" value={scheduleForm.price} onChange={e=>setScheduleForm(f=>({...f,price:+e.target.value}))} min={0}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-elimu-400 outline-none text-sm"/>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={()=>setShowSchedule(null)} className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50">Cancel</button>
              <button onClick={createSession} disabled={scheduling}
                className="flex-1 flex items-center justify-center gap-2 bg-elimu-700 hover:bg-elimu-800 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                {scheduling && <Loader2 className="w-4 h-4 animate-spin"/>}
                {scheduling ? 'Scheduling…' : 'Create Session'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
