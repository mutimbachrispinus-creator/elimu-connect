'use client'

import { useEffect, useState } from 'react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import {
  Search, Star, BookOpen, Clock, Filter,
  X, Send, Loader2, GraduationCap, ChevronDown,
} from 'lucide-react'
import { cn, formatKES, curriculumColor } from '@/lib/utils'
import type { TeacherProfile, User, Curriculum, SubjectArea } from '@/types'
import toast from 'react-hot-toast'

const CURRICULA: Curriculum[] = ['CBC','8-4-4','Cambridge','IB','Montessori','American','French','GCSE','BTEC']
const SUBJECTS: SubjectArea[] = ['Mathematics','English','Kiswahili','Science','Biology','Chemistry','Physics','Geography','History','Business Studies','Economics','Computer Science','ICT','Art & Design','Music','French','Other']

interface TeacherCard extends TeacherProfile { displayName: string; email: string }

export default function FindTeachersPage() {
  const { user } = useAuth()
  const [teachers,   setTeachers]   = useState<TeacherCard[]>([])
  const [filtered,   setFiltered]   = useState<TeacherCard[]>([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [curriculum, setCurriculum] = useState<string>('')
  const [subject,    setSubject]    = useState<string>('')
  const [showModal,  setShowModal]  = useState(false)
  const [selected,   setSelected]   = useState<TeacherCard|null>(null)
  const [message,    setMessage]    = useState('')
  const [sending,    setSending]    = useState(false)

  useEffect(()=>{
    const load = async()=>{
      const [tchrSnap, usrSnap] = await Promise.all([
        getDocs(query(collection(db,'teachers'))),
        getDocs(query(collection(db,'users'))),
      ])
      const usersMap = new Map<string,User>()
      usrSnap.docs.forEach(d=>usersMap.set(d.id, d.data() as User))
      const cards: TeacherCard[] = tchrSnap.docs.map(d=>{
        const tp = d.data() as TeacherProfile
        const u  = usersMap.get(tp.uid)
        return { ...tp, displayName: u?.displayName??'', email: u?.email??'' }
      }).filter(t=>t.isVerified || true) // show all for demo
      setTeachers(cards)
      setFiltered(cards)
      setLoading(false)
    }
    load()
  },[])

  useEffect(()=>{
    let res = teachers
    if(search)     res = res.filter(t=>t.displayName.toLowerCase().includes(search.toLowerCase()) || t.bio?.toLowerCase().includes(search.toLowerCase()))
    if(curriculum) res = res.filter(t=>t.curricula?.includes(curriculum as Curriculum))
    if(subject)    res = res.filter(t=>t.subjects?.includes(subject as SubjectArea))
    setFiltered(res)
  },[search,curriculum,subject,teachers])

  const openBooking = (t: TeacherCard) => { setSelected(t); setShowModal(true); setMessage('') }

  const sendRequest = async () => {
    if(!selected || !user) return
    if(message.trim().length < 10){ toast.error('Please write a message (at least 10 characters)'); return }
    setSending(true)
    try {
      const { addDoc, serverTimestamp } = await import('firebase/firestore')
      await addDoc(collection(db,'bookings'),{
        studentId:   user.uid,
        studentName: user.displayName,
        teacherId:   selected.uid,
        subject:     selected.subjects[0] ?? 'General',
        curriculum:  selected.curricula[0] ?? 'CBC',
        level:       selected.levels[0] ?? 'Grade 7',
        message,
        preferredDates: [],
        status: 'pending',
        createdAt: new Date().toISOString(),
      })
      toast.success('Booking request sent! The teacher will respond shortly.')
      setShowModal(false)
    } catch(e:any) {
      toast.error('Failed to send request: ' + e.message)
    } finally { setSending(false) }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Find a Tutor</h1>
        <p className="text-gray-500 mt-1">Browse verified teachers across all curricula and subjects</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search by name or keyword…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-elimu-400 focus:ring-2 focus:ring-elimu-100 outline-none text-sm"/>
        </div>
        <div className="relative">
          <select value={curriculum} onChange={e=>setCurriculum(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2.5 rounded-xl border border-gray-200 focus:border-elimu-400 outline-none text-sm bg-white">
            <option value="">All Curricula</option>
            {CURRICULA.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"/>
        </div>
        <div className="relative">
          <select value={subject} onChange={e=>setSubject(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2.5 rounded-xl border border-gray-200 focus:border-elimu-400 outline-none text-sm bg-white">
            <option value="">All Subjects</option>
            {SUBJECTS.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"/>
        </div>
        {(search||curriculum||subject) && (
          <button onClick={()=>{setSearch('');setCurriculum('');setSubject('')}}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 px-3 py-2.5 rounded-xl border border-gray-200 hover:border-red-200">
            <X className="w-4 h-4"/> Clear
          </button>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-16"><div className="spinner"/></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <GraduationCap className="w-12 h-12 text-gray-200 mx-auto mb-4"/>
          <p className="text-gray-500">No teachers match your search. Try adjusting filters.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(t=>(
            <div key={t.uid} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-elimu-200 transition-all flex flex-col">
              <div className="p-5 flex-1">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 bg-elimu-700 rounded-xl flex items-center justify-center text-white font-bold shrink-0">
                    {t.displayName.split(' ').map(n=>n[0]).join('').slice(0,2)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 truncate">{t.displayName}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400"/>
                      <span>{(t.rating??0).toFixed(1)}</span>
                      <span className="text-gray-300">·</span>
                      <span>{t.reviewCount??0} reviews</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">{t.bio ?? 'Experienced educator ready to help you excel.'}</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {(t.curricula??[]).slice(0,3).map(c=>(
                    <span key={c} className={cn('text-xs px-2 py-0.5 rounded-full font-medium', curriculumColor(c))}>{c}</span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1">
                  {(t.subjects??[]).slice(0,4).map(s=>(
                    <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                  {(t.subjects?.length??0)>4 && <span className="text-xs text-gray-400">+{(t.subjects?.length??0)-4}</span>}
                </div>
              </div>
              <div className="px-5 pb-5 pt-3 border-t border-gray-50 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">From</p>
                  <p className="font-bold text-elimu-700">{formatKES(t.hourlyRate??0)}<span className="text-gray-400 font-normal text-xs">/hr</span></p>
                </div>
                <button onClick={()=>openBooking(t)}
                  className="bg-elimu-700 hover:bg-elimu-800 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5"/> Book
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking modal */}
      {showModal && selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-bold text-gray-900">Book {selected.displayName}</h2>
              <button onClick={()=>setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5"/>
              </button>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 mb-4 text-sm">
              <p className="text-gray-600"><strong>Subjects:</strong> {(selected.subjects??[]).slice(0,3).join(', ')}</p>
              <p className="text-gray-600 mt-1"><strong>Curricula:</strong> {(selected.curricula??[]).join(', ')}</p>
              <p className="text-gray-600 mt-1"><strong>Rate:</strong> {formatKES(selected.hourlyRate??0)}/hr</p>
            </div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Your message to the teacher</label>
            <textarea value={message} onChange={e=>setMessage(e.target.value)} rows={4}
              placeholder="Describe what you need help with, your curriculum level, preferred schedule…"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-elimu-400 focus:ring-2 focus:ring-elimu-100 outline-none text-sm resize-none mb-4"/>
            <div className="flex gap-3">
              <button onClick={()=>setShowModal(false)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={sendRequest} disabled={sending}
                className="flex-1 flex items-center justify-center gap-2 bg-elimu-700 hover:bg-elimu-800 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm">
                {sending && <Loader2 className="w-4 h-4 animate-spin"/>}
                {sending ? 'Sending…' : 'Send Booking Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
