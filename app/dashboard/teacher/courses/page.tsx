'use client'

import { useEffect, useState } from 'react'
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore'
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import {
  PlusCircle, BookOpen, Play, Eye, EyeOff,
  Upload, Loader2, X, DollarSign, Users,
  ChevronDown, Star, Edit2, Trash2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { formatKES, formatDuration, curriculumColor, cn } from '@/lib/utils'
import type { Course, Curriculum, SubjectArea, EducationLevel } from '@/types'

const CURRICULA: Curriculum[] = ['CBC','8-4-4','Cambridge','IB','Montessori','American','French','GCSE','BTEC']
const SUBJECTS: SubjectArea[] = ['Mathematics','English','Kiswahili','Science','Biology','Chemistry','Physics','Geography','History','Business Studies','Economics','Computer Science','ICT','Other']

export default function TeacherCoursesPage() {
  const { user } = useAuth()
  const [courses,    setCourses]    = useState<Course[]>([])
  const [loading,    setLoading]    = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [uploading,  setUploading]  = useState(false)
  const [progress,   setProgress]   = useState(0)
  const [form, setForm] = useState({
    title:'', description:'', curriculum:'CBC' as Curriculum,
    level:'Grade 7' as EducationLevel, subject:'Mathematics' as SubjectArea,
    price: 500, tags:'',
  })
  const [thumbnailFile, setThumbnailFile] = useState<File|null>(null)

  const load = async () => {
    if(!user) return
    const snap = await getDocs(query(collection(db,'courses'),where('teacherId','==',user.uid)))
    setCourses(snap.docs.map(d=>({id:d.id,...d.data()} as Course)))
    setLoading(false)
  }

  useEffect(()=>{ load() },[user])

  const handleCreate = async () => {
    if(!user) return
    if(!form.title || !form.description){ toast.error('Title and description required'); return }
    setUploading(true)
    try {
      let thumbnailUrl = ''
      if(thumbnailFile){
        const sRef = storageRef(storage,`courses/thumbnails/${user.uid}/${Date.now()}_${thumbnailFile.name}`)
        const task = uploadBytesResumable(sRef, thumbnailFile)
        await new Promise<void>((res,rej)=>{
          task.on('state_changed',
            snap=>setProgress(Math.round(snap.bytesTransferred/snap.totalBytes*100)),
            rej,
            async()=>{ thumbnailUrl=await getDownloadURL(task.snapshot.ref); res() }
          )
        })
      }
      await addDoc(collection(db,'courses'),{
        teacherId: user.uid, teacherName: user.displayName,
        title: form.title, description: form.description,
        thumbnailUrl, curriculum: form.curriculum,
        level: form.level, subject: form.subject,
        price: form.price, currency:'KES',
        lessons: [], enrolledCount:0, rating:0, reviewCount:0,
        tags: form.tags.split(',').map(t=>t.trim()).filter(Boolean),
        isPublished: false, totalDuration:0, language:'English',
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      })
      toast.success('Course created! Add lessons from the course editor.')
      setShowCreate(false)
      setForm({title:'',description:'',curriculum:'CBC',level:'Grade 7',subject:'Mathematics',price:500,tags:''})
      load()
    } catch(e:any){ toast.error(e.message)
    } finally { setUploading(false); setProgress(0) }
  }

  const togglePublish = async (c: Course) => {
    await updateDoc(doc(db,'courses',c.id),{ isPublished:!c.isPublished })
    toast.success(c.isPublished ? 'Course unpublished' : 'Course published!')
    load()
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">My Courses</h1>
          <p className="text-gray-500 mt-1">Create and manage your paid video lessons</p>
        </div>
        <button onClick={()=>setShowCreate(true)}
          className="inline-flex items-center gap-2 bg-elimu-700 hover:bg-elimu-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
          <PlusCircle className="w-4 h-4"/> New Course
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><div className="spinner"/></div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
          <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-4"/>
          <p className="text-gray-500 mb-4">You haven't created any courses yet</p>
          <button onClick={()=>setShowCreate(true)}
            className="inline-flex items-center gap-2 bg-elimu-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl">
            <PlusCircle className="w-4 h-4"/> Create Your First Course
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map(c=>(
            <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
              <div className="aspect-video bg-gray-100 relative">
                {c.thumbnailUrl
                  ? <img src={c.thumbnailUrl} alt={c.title} className="w-full h-full object-cover"/>
                  : <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-8 h-8 text-gray-300"/></div>
                }
                <div className="absolute top-2 right-2">
                  <span className={cn('text-xs font-semibold px-2 py-1 rounded-full', c.isPublished ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600')}>
                    {c.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium mb-2 inline-block', curriculumColor(c.curriculum))}>{c.curriculum}</span>
                <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-2">{c.title}</h3>
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">{c.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3"/>{c.enrolledCount} enrolled</span>
                  <span className="flex items-center gap-1"><Play className="w-3 h-3"/>{c.lessons?.length??0} lessons</span>
                  <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400"/>{(c.rating??0).toFixed(1)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-elimu-700">{formatKES(c.price)}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={()=>togglePublish(c)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors" title={c.isPublished?'Unpublish':'Publish'}>
                      {c.isPublished ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                    </button>
                    <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                      <Edit2 className="w-4 h-4"/>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Course Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-bold text-gray-900">Create New Course</h2>
              <button onClick={()=>setShowCreate(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Course Title</label>
                <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="e.g. CBC Grade 7 Mathematics Mastery"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-elimu-400 focus:ring-2 focus:ring-elimu-100 outline-none text-sm"/>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} rows={3}
                  placeholder="What will students learn in this course?"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-elimu-400 focus:ring-2 focus:ring-elimu-100 outline-none text-sm resize-none"/>
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
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Subject</label>
                  <select value={form.subject} onChange={e=>setForm(f=>({...f,subject:e.target.value as SubjectArea}))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-elimu-400 outline-none text-sm bg-white">
                    {SUBJECTS.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Price (KES)</label>
                <input type="number" value={form.price} onChange={e=>setForm(f=>({...f,price:+e.target.value}))} min={0}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-elimu-400 focus:ring-2 focus:ring-elimu-100 outline-none text-sm"/>
                <p className="text-xs text-gray-400 mt-1">Set to 0 for a free course. Platform takes 15% of earnings.</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Thumbnail Image</label>
                <label className="block border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-elimu-300 transition-colors">
                  <Upload className="w-5 h-5 text-gray-400 mx-auto mb-1"/>
                  <span className="text-sm text-gray-500">{thumbnailFile ? thumbnailFile.name : 'Click to upload thumbnail'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e=>setThumbnailFile(e.target.files?.[0]??null)}/>
                </label>
              </div>
              {progress > 0 && (
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-elimu-600 h-2 rounded-full transition-all" style={{width:`${progress}%`}}/>
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tags (comma-separated)</label>
                <input value={form.tags} onChange={e=>setForm(f=>({...f,tags:e.target.value}))} placeholder="algebra, fractions, CBC grade 7"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-elimu-400 outline-none text-sm"/>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={()=>setShowCreate(false)} className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50">Cancel</button>
              <button onClick={handleCreate} disabled={uploading}
                className="flex-1 flex items-center justify-center gap-2 bg-elimu-700 hover:bg-elimu-800 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm">
                {uploading && <Loader2 className="w-4 h-4 animate-spin"/>}
                {uploading ? `Creating… ${progress}%` : 'Create Course'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
