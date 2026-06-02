'use client'

import { useEffect, useState } from 'react'
import { collection, getDocs, query, where, addDoc, orderBy } from 'firebase/firestore'
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import {
  Library, Upload, Search, Filter, FileText, Video,
  Music, Image, Download, Lock, Unlock, X, Loader2,
  ChevronDown, ExternalLink,
} from 'lucide-react'
import { cn, formatKES, curriculumColor } from '@/lib/utils'
import type { LibraryResource, Curriculum, SubjectArea } from '@/types'
import toast from 'react-hot-toast'

const TYPE_ICONS: Record<string,any> = {
  video:'🎬', pdf:'📄', document:'📝', presentation:'📊', audio:'🎵', image:'🖼️',
}
const CURRICULA: Curriculum[] = ['CBC','8-4-4','Cambridge','IB','Montessori','American','French','GCSE','BTEC']
const SUBJECTS: SubjectArea[]  = ['Mathematics','English','Kiswahili','Science','Biology','Chemistry','Physics','Geography','History','Business Studies','Economics','Computer Science','ICT','Other']

export default function LibraryPage() {
  const { user } = useAuth()
  const isTeacher = user?.role === 'teacher'

  const [resources,   setResources]   = useState<LibraryResource[]>([])
  const [filtered,    setFiltered]    = useState<LibraryResource[]>([])
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [curriculum,  setCurriculum]  = useState('')
  const [subject,     setSubject]     = useState('')
  const [typeFilter,  setTypeFilter]  = useState('')
  const [showUpload,  setShowUpload]  = useState(false)
  const [uploading,   setUploading]   = useState(false)
  const [progress,    setProgress]    = useState(0)
  const [form, setForm] = useState({
    title:'', description:'', curriculum:'CBC' as Curriculum,
    level:'Grade 7', subject:'Mathematics' as SubjectArea,
    type:'pdf' as LibraryResource['type'], price:0, tags:'',
  })
  const [file, setFile] = useState<File|null>(null)

  const load = async () => {
    const snap = await getDocs(query(collection(db,'library'), orderBy('createdAt','desc')))
    const res  = snap.docs.map(d=>({id:d.id,...d.data()} as LibraryResource))
    setResources(res)
    setFiltered(res)
    setLoading(false)
  }

  useEffect(()=>{ load() },[])

  useEffect(()=>{
    let res = resources
    if(search)     res = res.filter(r=>r.title.toLowerCase().includes(search.toLowerCase()) || r.description?.toLowerCase().includes(search.toLowerCase()))
    if(curriculum) res = res.filter(r=>r.curriculum===curriculum)
    if(subject)    res = res.filter(r=>r.subject===subject)
    if(typeFilter) res = res.filter(r=>r.type===typeFilter)
    setFiltered(res)
  },[search,curriculum,subject,typeFilter,resources])

  const handleUpload = async () => {
    if(!user||!file){ toast.error('Please select a file'); return }
    if(!form.title){ toast.error('Title required'); return }
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const sRef = storageRef(storage,`library/${user.uid}/${Date.now()}_${file.name}`)
      const task = uploadBytesResumable(sRef, file)
      let fileUrl = ''
      await new Promise<void>((res,rej)=>{
        task.on('state_changed',
          s=>setProgress(Math.round(s.bytesTransferred/s.totalBytes*100)),
          rej,
          async()=>{ fileUrl=await getDownloadURL(task.snapshot.ref); res() }
        )
      })
      await addDoc(collection(db,'library'),{
        uploaderId:   user.uid,
        uploaderName: user.displayName,
        title:        form.title,
        description:  form.description,
        curriculum:   form.curriculum,
        level:        form.level,
        subject:      form.subject,
        type:         form.type,
        fileUrl,
        thumbnailUrl: '',
        fileSize:     file.size,
        price:        form.price,
        downloadCount:0,
        viewCount:    0,
        tags:         form.tags.split(',').map(t=>t.trim()).filter(Boolean),
        isApproved:   isTeacher, // auto-approve teacher uploads; admin review for others
        createdAt:    new Date().toISOString(),
      })
      toast.success('Resource uploaded!')
      setShowUpload(false)
      setFile(null)
      setForm({title:'',description:'',curriculum:'CBC',level:'Grade 7',subject:'Mathematics',type:'pdf',price:0,tags:''})
      load()
    } catch(e:any){ toast.error(e.message)
    } finally { setUploading(false); setProgress(0) }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Resource Library</h1>
          <p className="text-gray-500 mt-1">Browse and download learning materials across all curricula</p>
        </div>
        {isTeacher && (
          <button onClick={()=>setShowUpload(true)}
            className="inline-flex items-center gap-2 bg-elimu-700 hover:bg-elimu-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
            <Upload className="w-4 h-4"/> Upload Resource
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search resources…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-elimu-400 focus:ring-2 focus:ring-elimu-100 outline-none text-sm"/>
        </div>
        {[
          { value:curriculum, set:setCurriculum, placeholder:'All Curricula', opts:CURRICULA },
          { value:subject,    set:setSubject,    placeholder:'All Subjects',  opts:SUBJECTS  },
        ].map(({value,set,placeholder,opts},i)=>(
          <div key={i} className="relative">
            <select value={value} onChange={e=>set(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2.5 rounded-xl border border-gray-200 focus:border-elimu-400 outline-none text-sm bg-white">
              <option value="">{placeholder}</option>
              {opts.map(o=><option key={o} value={o}>{o}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"/>
          </div>
        ))}
        <div className="relative">
          <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2.5 rounded-xl border border-gray-200 focus:border-elimu-400 outline-none text-sm bg-white">
            <option value="">All Types</option>
            {['video','pdf','document','presentation','audio','image'].map(t=><option key={t} value={t}>{t}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"/>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16"><div className="spinner"/></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <Library className="w-12 h-12 text-gray-200 mx-auto mb-3"/>
          <p className="text-gray-400 text-sm">No resources found</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(r=>(
            <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group flex flex-col overflow-hidden">
              <div className="aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center text-4xl">
                {TYPE_ICONS[r.type]??'📁'}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', curriculumColor(r.curriculum))}>{r.curriculum}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{r.type}</span>
                </div>
                <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1 flex-1">{r.title}</h3>
                <p className="text-xs text-gray-500 mb-3">{r.subject} · {r.level}</p>
                <div className="flex items-center justify-between">
                  {r.price > 0 ? (
                    <span className="font-bold text-elimu-700 text-sm">{formatKES(r.price)}</span>
                  ) : (
                    <span className="text-xs text-green-600 font-semibold flex items-center gap-1"><Unlock className="w-3 h-3"/> Free</span>
                  )}
                  <a href={r.price>0 ? '#' : r.fileUrl} target="_blank" rel="noopener noreferrer"
                    className={cn('flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors',
                      r.price>0 ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-elimu-50 text-elimu-700 hover:bg-elimu-100')}>
                    {r.price>0 ? <><Lock className="w-3 h-3"/> Unlock</> : <><Download className="w-3 h-3"/> Get</>}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-bold text-gray-900">Upload Resource</h2>
              <button onClick={()=>setShowUpload(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Title</label>
                <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-elimu-400 outline-none text-sm"/>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-elimu-400 outline-none text-sm resize-none"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Curriculum</label>
                  <select value={form.curriculum} onChange={e=>setForm(f=>({...f,curriculum:e.target.value as Curriculum}))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-elimu-400 outline-none text-sm bg-white">
                    {CURRICULA.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Type</label>
                  <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value as LibraryResource['type']}))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-elimu-400 outline-none text-sm bg-white">
                    {['video','pdf','document','presentation','audio','image'].map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Price (KES) — 0 for free</label>
                <input type="number" value={form.price} onChange={e=>setForm(f=>({...f,price:+e.target.value}))} min={0}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-elimu-400 outline-none text-sm"/>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">File</label>
                <label className="block border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-elimu-300 transition-colors">
                  <Upload className="w-5 h-5 text-gray-400 mx-auto mb-1"/>
                  <span className="text-sm text-gray-500">{file ? file.name : 'Click to select file'}</span>
                  <input type="file" className="hidden" onChange={e=>setFile(e.target.files?.[0]??null)}/>
                </label>
              </div>
              {progress>0 && (
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-elimu-600 h-2 rounded-full transition-all" style={{width:`${progress}%`}}/>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={()=>setShowUpload(false)} className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50">Cancel</button>
              <button onClick={handleUpload} disabled={uploading}
                className="flex-1 flex items-center justify-center gap-2 bg-elimu-700 hover:bg-elimu-800 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                {uploading && <Loader2 className="w-4 h-4 animate-spin"/>}
                {uploading ? `Uploading… ${progress}%` : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
