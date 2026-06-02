'use client'

import { useEffect, useState } from 'react'
import { collection, query, where, getDocs, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import { Users, PlusCircle, BookOpen, Calendar, X, Loader2, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import type { User, StudentProfile } from '@/types'

interface Child extends User { profile?: StudentProfile }

export default function ParentDashboard() {
  const { user } = useAuth()
  const [children,    setChildren]    = useState<Child[]>([])
  const [loading,     setLoading]     = useState(true)
  const [showAdd,     setShowAdd]     = useState(false)
  const [searchEmail, setSearchEmail] = useState('')
  const [found,       setFound]       = useState<User|null>(null)
  const [searching,   setSearching]   = useState(false)
  const [linking,     setLinking]     = useState(false)

  const loadChildren = async () => {
    if(!user) return
    const parentSnap = await getDoc(doc(db,'parents',user.uid))
    const childIds   = parentSnap.exists() ? (parentSnap.data().children??[]) : []
    if(!childIds.length){ setLoading(false); return }
    const kids: Child[] = []
    for(const uid of childIds){
      const [uSnap,pSnap] = await Promise.all([getDoc(doc(db,'users',uid)),getDoc(doc(db,'students',uid))])
      if(uSnap.exists()){
        kids.push({ ...(uSnap.data() as User), profile: pSnap.exists()?pSnap.data() as StudentProfile:undefined })
      }
    }
    setChildren(kids)
    setLoading(false)
  }

  useEffect(()=>{ loadChildren() },[user])

  const searchStudent = async () => {
    if(!searchEmail){ toast.error('Enter student email'); return }
    setSearching(true)
    setFound(null)
    try {
      const snap = await getDocs(query(collection(db,'users'),where('email','==',searchEmail),where('role','==','student')))
      if(snap.empty){ toast.error('No student found with that email'); return }
      setFound(snap.docs[0].data() as User)
    } catch(e:any){ toast.error(e.message)
    } finally { setSearching(false) }
  }

  const linkChild = async () => {
    if(!user||!found) return
    setLinking(true)
    try {
      await updateDoc(doc(db,'parents',user.uid),{ children: arrayUnion(found.uid) })
      await updateDoc(doc(db,'students',found.uid),{ parentId: user.uid })
      toast.success(`${found.displayName} linked to your account!`)
      setShowAdd(false)
      setSearchEmail(''); setFound(null)
      loadChildren()
    } catch(e:any){ toast.error(e.message)
    } finally { setLinking(false) }
  }

  if(loading) return <div className="flex items-center justify-center h-64"><div className="spinner"/></div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Parent Dashboard</h1>
          <p className="text-gray-500 mt-1">Monitor your children's learning journey</p>
        </div>
        <button onClick={()=>setShowAdd(true)}
          className="inline-flex items-center gap-2 bg-elimu-700 hover:bg-elimu-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
          <PlusCircle className="w-4 h-4"/> Link Child
        </button>
      </div>

      {children.length===0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <Users className="w-12 h-12 text-gray-200 mx-auto mb-4"/>
          <p className="text-gray-500 mb-2">No children linked yet</p>
          <p className="text-gray-400 text-sm mb-5">Link your child's student account to monitor their progress</p>
          <button onClick={()=>setShowAdd(true)}
            className="inline-flex items-center gap-2 bg-elimu-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl">
            <PlusCircle className="w-4 h-4"/> Link a Child Account
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {children.map(c=>(
            <div key={c.uid} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700 font-bold">
                  {c.displayName.split(' ').map(n=>n[0]).join('').slice(0,2)}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{c.displayName}</p>
                  <p className="text-xs text-gray-500">{c.profile?.curriculum} · {c.profile?.level}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5"/>Enrolled Courses</span>
                  <span className="font-semibold">{c.profile?.enrolledCourses?.length??0}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5"/>Sessions</span>
                  <span className="font-semibold">—</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-50 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${c.emailVerified&&c.phoneVerified?'bg-green-400':'bg-amber-400'}`}/>
                <span className="text-xs text-gray-500">{c.emailVerified&&c.phoneVerified?'Verified':'Verification pending'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Link child modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-bold text-gray-900">Link Child Account</h2>
              <button onClick={()=>{setShowAdd(false);setFound(null);setSearchEmail('')}} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Enter your child's registered email address to link their account to yours.</p>
            <div className="flex gap-2 mb-4">
              <input value={searchEmail} onChange={e=>setSearchEmail(e.target.value)}
                placeholder="child@example.com" type="email"
                onKeyDown={e=>e.key==='Enter'&&searchStudent()}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-elimu-400 outline-none text-sm"/>
              <button onClick={searchStudent} disabled={searching}
                className="px-4 py-3 bg-elimu-700 hover:bg-elimu-800 text-white rounded-xl transition-colors">
                {searching ? <Loader2 className="w-4 h-4 animate-spin"/> : <Search className="w-4 h-4"/>}
              </button>
            </div>
            {found && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                <p className="text-sm font-semibold text-green-800">Student found: {found.displayName}</p>
                <p className="text-xs text-green-600">{found.email}</p>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={()=>{setShowAdd(false);setFound(null)}} className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50">Cancel</button>
              <button onClick={linkChild} disabled={!found||linking}
                className="flex-1 flex items-center justify-center gap-2 bg-elimu-700 hover:bg-elimu-800 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                {linking && <Loader2 className="w-4 h-4 animate-spin"/>}
                {linking ? 'Linking…' : 'Link Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
