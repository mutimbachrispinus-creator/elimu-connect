'use client'

import { useEffect, useState } from 'react'
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import {
  Search, CheckCircle, XCircle, ChevronDown,
  Shield, ShieldOff, Star, Users, BadgeCheck,
} from 'lucide-react'
import { cn, curriculumColor } from '@/lib/utils'
import type { TeacherProfile, User } from '@/types'
import toast from 'react-hot-toast'

interface TeacherRow extends TeacherProfile { displayName:string; email:string; phone:string }

export default function AdminTeachersPage() {
  const [teachers,  setTeachers]  = useState<TeacherRow[]>([])
  const [filtered,  setFiltered]  = useState<TeacherRow[]>([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [filter,    setFilter]    = useState('all')
  const [acting,    setActing]    = useState<string|null>(null)

  const load = async () => {
    const [tchrSnap, usrSnap] = await Promise.all([
      getDocs(collection(db,'teachers')),
      getDocs(collection(db,'users')),
    ])
    const usersMap = new Map<string,User>()
    usrSnap.docs.forEach(d=>usersMap.set(d.id,d.data() as User))
    const rows: TeacherRow[] = tchrSnap.docs.map(d=>{
      const tp = { id:d.id,...d.data() } as any
      const u  = usersMap.get(tp.uid)
      return { ...tp, displayName:u?.displayName??'', email:u?.email??'', phone:u?.phone??'' }
    })
    setTeachers(rows)
    setFiltered(rows)
    setLoading(false)
  }

  useEffect(()=>{ load() },[])

  useEffect(()=>{
    let res = teachers
    if(search) res=res.filter(t=>t.displayName.toLowerCase().includes(search.toLowerCase())||t.email.toLowerCase().includes(search.toLowerCase()))
    if(filter==='verified')   res=res.filter(t=>t.isVerified)
    if(filter==='pending')    res=res.filter(t=>!t.isVerified)
    if(filter==='subscribed') res=res.filter(t=>t.subscription?.status==='active')
    setFiltered(res)
  },[search,filter,teachers])

  const toggleVerify = async (t: TeacherRow) => {
    setActing(t.uid)
    try {
      await updateDoc(doc(db,'teachers',t.uid),{ isVerified:!t.isVerified })
      toast.success(t.isVerified?'Teacher unverified':'Teacher verified!')
      load()
    } catch(e:any){ toast.error(e.message)
    } finally { setActing(null) }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Teachers</h1>
        <p className="text-gray-500 mt-1">Manage and verify teacher accounts</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search teachers…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-elimu-400 outline-none text-sm"/>
        </div>
        <div className="flex gap-2">
          {['all','pending','verified','subscribed'].map(f=>(
            <button key={f} onClick={()=>setFilter(f)}
              className={cn('px-3 py-2 rounded-xl text-sm font-semibold capitalize transition-colors',
                filter===f?'bg-elimu-700 text-white':'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50')}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><div className="spinner"/></div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Teacher','Curricula','Subscription','Rating','Status','Actions'].map(h=>(
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(t=>(
                <tr key={t.uid} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-elimu-700 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {t.displayName.split(' ').map(n=>n[0]).join('').slice(0,2)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 flex items-center gap-1">
                          {t.displayName}
                          {t.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-blue-500"/>}
                        </p>
                        <p className="text-xs text-gray-400">{t.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {(t.curricula??[]).slice(0,2).map(c=>(
                        <span key={c} className={cn('text-xs px-1.5 py-0.5 rounded font-medium',curriculumColor(c))}>{c}</span>
                      ))}
                      {(t.curricula?.length??0)>2&&<span className="text-xs text-gray-400">+{(t.curricula?.length??0)-2}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={cn('text-xs px-2 py-1 rounded-full font-semibold capitalize',{
                      active:'bg-green-100 text-green-800',
                      expired:'bg-red-100 text-red-800',
                      pending:'bg-amber-100 text-amber-800',
                      cancelled:'bg-gray-100 text-gray-600',
                    }[t.subscription?.status??'pending'])}>
                      {t.subscription?.tier??'trial'} · {t.subscription?.status??'—'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="flex items-center gap-1 text-xs">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400"/>
                      {(t.rating??0).toFixed(1)} ({t.reviewCount??0})
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={cn('text-xs px-2 py-1 rounded-full font-semibold',
                      t.isVerified?'bg-blue-100 text-blue-800':'bg-amber-100 text-amber-800')}>
                      {t.isVerified?'Verified':'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <button onClick={()=>toggleVerify(t)} disabled={acting===t.uid}
                      className={cn('flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors',
                        t.isVerified?'bg-red-50 hover:bg-red-100 text-red-700':'bg-blue-50 hover:bg-blue-100 text-blue-700')}>
                      {t.isVerified ? <><ShieldOff className="w-3.5 h-3.5"/> Unverify</> : <><Shield className="w-3.5 h-3.5"/> Verify</>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length===0 && (
            <p className="text-center text-gray-400 text-sm py-12">No teachers found</p>
          )}
        </div>
      )}
    </div>
  )
}
