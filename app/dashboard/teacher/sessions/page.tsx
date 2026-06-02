'use client'

import { useEffect, useState } from 'react'
import { collection, query, where, getDocs, addDoc, updateDoc, doc, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import { Video, PlusCircle, Clock, Users, Play, X, Loader2, Calendar, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { cn, formatKES } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { ClassSession, Curriculum, SubjectArea } from '@/types'

const CURRICULA: Curriculum[] = ['CBC','8-4-4','Cambridge','IB','Montessori','American','French','GCSE','BTEC']
const SUBJECTS: SubjectArea[]  = ['Mathematics','English','Kiswahili','Science','Biology','Chemistry','Physics','Geography','History','Business Studies','Economics','Computer Science','ICT','Other']

const STATUS_COLORS: Record<string,string> = {
  scheduled: 'bg-blue-100 text-blue-800',
  live:      'bg-red-100 text-red-800 animate-pulse',
  ended:     'bg-gray-100 text-gray-600',
  cancelled: 'bg-orange-100 text-orange-800',
}

export default function TeacherSessionsPage() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<ClassSession[]>([])
  const [loading,  setLoading]  = useState(true)
  const [showNew,  setShowNew]  = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    title:'', description:'', subject:'Mathematics' as SubjectArea,
    curriculum:'CBC' as Curriculum, level:'Grade 7',
    scheduledAt:'', duration:60, maxParticipants:30, price:0,
    recordingEnabled:false,
  })

  const load = async () => {
    if(!user) return
    const snap = await getDocs(query(
      collection(db,'sessions'), where('teacherId','==',user.uid), orderBy('scheduledAt','desc')
    ))
    setSessions(snap.docs.map(d=>({id:d.id,...d.data()} as ClassSession)))
    setLoading(false)
  }

  useEffect(()=>{ load() },[user])

  const createSession = async () => {
    if(!user){ return }
    if(!form.title||!form.scheduledAt){ toast.error('Title and scheduled time required'); return }
    setCreating(true)
    try {
      await addDoc(collection(db,'sessions'),{
        teacherId:       user.uid,
        teacherName:     user.displayName,
        title:           form.title,
        description:     form.description,
        subject:         form.subject,
        curriculum:      form.curriculum,
        level:           form.level,
        scheduledAt:     new Date(form.scheduledAt).toISOString(),
        duration:        form.duration,
        maxParticipants: form.maxParticipants,
        participants:    [],
        status:          'scheduled',
        price:           form.price,
        recordingEnabled:form.recordingEnabled,
        createdAt:       new Date().toISOString(),
      })
      toast.success('Session scheduled!')
      setShowNew(false)
      setForm({title:'',description:'',subject:'Mathematics',curriculum:'CBC',level:'Grade 7',scheduledAt:'',duration:60,maxParticipants:30,price:0,recordingEnabled:false})
      load()
    } catch(e:any){ toast.error(e.message)
    } finally { setCreating(false) }
  }

  const cancelSession = async (s: ClassSession) => {
    await updateDoc(doc(db,'sessions',s.id),{ status:'cancelled' })
    toast.success('Session cancelled')
    load()
  }

  const upcoming  = sessions.filter(s=>['scheduled','live'].includes(s.status))
  const past      = sessions.filter(s=>['ended','cancelled'].includes(s.status))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Live Sessions</h1>
          <p className="text-gray-500 mt-1">Schedule and manage your virtual classrooms</p>
        </div>
        <button onClick={()=>setShowNew(true)}
          className="inline-flex items-center gap-2 bg-elimu-700 hover:bg-elimu-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
          <PlusCircle className="w-4 h-4"/> New Session
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><div className="spinner"/></div>
      ) : (
        <>
          {/* Upcoming */}
          <div>
            <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-3">Upcoming & Live</h2>
            {upcoming.length===0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
                <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-3"/>
                <p className="text-gray-400 text-sm mb-3">No upcoming sessions scheduled</p>
                <button onClick={()=>setShowNew(true)} className="text-elimu-700 text-sm font-semibold hover:underline">Schedule one now →</button>
              </div>
            ) : (
              <div className="space-y-3">
                {upcoming.map(s=>(
                  <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
                      <Video className="w-6 h-6 text-purple-600"/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-bold text-gray-900">{s.title}</p>
                        <span className={cn('text-xs px-2 py-0.5 rounded-full font-semibold',STATUS_COLORS[s.status])}>{s.status}</span>
                      </div>
                      <p className="text-sm text-gray-500">{s.subject} · {s.curriculum} · {s.level}</p>
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-3">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3"/>{new Date(s.scheduledAt).toLocaleString('en-KE',{dateStyle:'medium',timeStyle:'short'})}</span>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3"/>{s.participants.length}/{s.maxParticipants}</span>
                        {s.price>0&&<span>{formatKES(s.price)}/student</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link href={`/classroom/${s.id}`}
                        className="flex items-center gap-1.5 bg-elimu-700 hover:bg-elimu-800 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                        <Play className="w-3.5 h-3.5"/> Start
                      </Link>
                      <button onClick={()=>cancelSession(s)}
                        className="w-9 h-9 border border-gray-200 rounded-xl flex items-center justify-center text-gray-500 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors">
                        <X className="w-4 h-4"/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past */}
          {past.length>0 && (
            <div>
              <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-3">Past Sessions</h2>
              <div className="space-y-2">
                {past.map(s=>(
                  <div key={s.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 opacity-75">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-800 text-sm">{s.title}</p>
                        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',STATUS_COLORS[s.status])}>{s.status}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{new Date(s.scheduledAt).toLocaleString('en-KE',{dateStyle:'medium',timeStyle:'short'})} · {s.participants.length} attended</p>
                    </div>
                    {s.recordingUrl && (
                      <a href={s.recordingUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-elimu-600 font-semibold hover:underline flex items-center gap-1">
                        <Play className="w-3 h-3"/> Recording
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* New session modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-bold text-gray-900">Schedule New Session</h2>
              <button onClick={()=>setShowNew(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Session Title</label>
                <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="e.g. Grade 8 Algebra – Simultaneous Equations"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-elimu-400 outline-none text-sm"/>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description (optional)</label>
                <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-elimu-400 outline-none text-sm resize-none"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Subject</label>
                  <select value={form.subject} onChange={e=>setForm(f=>({...f,subject:e.target.value as SubjectArea}))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-elimu-400 outline-none text-sm bg-white">
                    {SUBJECTS.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Curriculum</label>
                  <select value={form.curriculum} onChange={e=>setForm(f=>({...f,curriculum:e.target.value as Curriculum}))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-elimu-400 outline-none text-sm bg-white">
                    {CURRICULA.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date & Time</label>
                  <input type="datetime-local" value={form.scheduledAt} onChange={e=>setForm(f=>({...f,scheduledAt:e.target.value}))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-elimu-400 outline-none text-sm"/>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Duration</label>
                  <select value={form.duration} onChange={e=>setForm(f=>({...f,duration:+e.target.value}))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-elimu-400 outline-none text-sm bg-white">
                    {[30,45,60,90,120,180].map(d=><option key={d} value={d}>{d} min</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Max Participants</label>
                  <input type="number" value={form.maxParticipants} onChange={e=>setForm(f=>({...f,maxParticipants:+e.target.value}))} min={1} max={200}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-elimu-400 outline-none text-sm"/>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Price (KES)</label>
                  <input type="number" value={form.price} onChange={e=>setForm(f=>({...f,price:+e.target.value}))} min={0}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-elimu-400 outline-none text-sm"/>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button type="button" onClick={()=>setForm(f=>({...f,recordingEnabled:!f.recordingEnabled}))}
                  className={`w-11 h-6 rounded-full transition-colors relative ${form.recordingEnabled?'bg-elimu-600':'bg-gray-300'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.recordingEnabled?'translate-x-5':'translate-x-0.5'}`}/>
                </button>
                <span className="text-sm text-gray-700">Enable recording</span>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={()=>setShowNew(false)} className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50">Cancel</button>
              <button onClick={createSession} disabled={creating}
                className="flex-1 flex items-center justify-center gap-2 bg-elimu-700 hover:bg-elimu-800 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                {creating && <Loader2 className="w-4 h-4 animate-spin"/>}
                {creating ? 'Scheduling…' : 'Schedule Session'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
