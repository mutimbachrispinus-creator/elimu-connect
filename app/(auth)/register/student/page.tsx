'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import type { Curriculum, EducationLevel } from '@/types'

const CURRICULA: Curriculum[] = ['CBC','8-4-4','Cambridge','IB','Montessori','American','French','GCSE','BTEC']

const CBC_LEVELS: EducationLevel[] = ['Playgroup','PP1','PP2','Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12']
const LEVELS_BY_CURRICULUM: Record<string, EducationLevel[]> = {
  CBC:       CBC_LEVELS,
  '8-4-4':   ['PP1','PP2','Std 1','Std 2','Std 3','Std 4','Std 5','Std 6','Std 7','Std 8','Form 1','Form 2','Form 3','Form 4'],
  Cambridge: ['Year 7','Year 8','Year 9','Year 10','Year 11','IGCSE','AS Level','A Level'],
  IB:        ['IB PYP','IB MYP','IB DP','IB CP'],
  Montessori:['Nido','Primary Montessori','Lower Elementary','Upper Elementary','Adolescent'],
  American:  ['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12'],
  French:    ['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12'],
  GCSE:      ['Year 7','Year 8','Year 9','Year 10','Year 11'],
  BTEC:      ['Year 10','Year 11','Year 12','Year 13'],
}

const schema = z.object({
  displayName: z.string().min(3,'Full name required'),
  email:       z.string().email('Valid email required'),
  phone:       z.string().regex(/^(\+?254|0)[17]\d{8}$/,'Valid Kenyan phone required'),
  curriculum:  z.string().min(1,'Select your curriculum'),
  level:       z.string().min(1,'Select your level'),
  school:      z.string().optional(),
  password:    z.string().min(8,'Minimum 8 characters'),
  confirmPwd:  z.string(),
}).refine(d => d.password === d.confirmPwd, { message:"Passwords don't match", path:['confirmPwd'] })

type FormData = z.infer<typeof schema>

export default function StudentRegisterPage() {
  const router = useRouter()
  const [showPwd, setShowPwd] = useState(false)
  const { register, handleSubmit, watch, formState:{ errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const curriculum = watch('curriculum')
  const levels = LEVELS_BY_CURRICULUM[curriculum] ?? CBC_LEVELS

  const onSubmit = async (data: FormData) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, data.email, data.password)
      const uid = cred.user.uid
      const now = new Date().toISOString()

      await setDoc(doc(db,'users',uid),{
        uid, email: data.email, phone: data.phone,
        displayName: data.displayName, role: 'student',
        emailVerified: false, phoneVerified: false,
        isActive: true, createdAt: now, updatedAt: now,
      })

      await setDoc(doc(db,'students',uid),{
        uid, curriculum: data.curriculum, level: data.level,
        school: data.school ?? '', enrolledCourses: [], completedCourses: [], createdAt: now,
      })

      await fetch('/api/send-otp',{
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ type:'email', email: data.email, name: data.displayName, userId: uid }),
      })

      toast.success('Account created! Please verify your email.')
      router.push(`/verify?uid=${uid}&email=${encodeURIComponent(data.email)}&phone=${encodeURIComponent(data.phone)}`)
    } catch(err:any){
      if (err.code==='auth/email-already-in-use') toast.error('An account with this email already exists.')
      else toast.error(err.message ?? 'Registration failed')
    }
  }

  return (
    <div className="w-full max-w-lg">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">Join as Student</h1>
        <p className="text-gray-500 text-sm mb-8">Free to join. Start learning today.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {[
            {name:'displayName',label:'Full Name',    type:'text', placeholder:'Your full name'},
            {name:'email',      label:'Email Address',type:'email',placeholder:'you@example.com'},
            {name:'phone',      label:'Phone Number', type:'tel',  placeholder:'07XXXXXXXX'},
            {name:'school',     label:'School (optional)',type:'text',placeholder:'Your school or institution'},
          ].map(f=>(
            <div key={f.name}>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{f.label}</label>
              <input {...register(f.name as any)} type={f.type} placeholder={f.placeholder}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-elimu-400 focus:ring-2 focus:ring-elimu-100 outline-none text-sm"/>
              {errors[f.name as keyof FormData] && <p className="text-red-500 text-xs mt-1">{(errors as any)[f.name]?.message}</p>}
            </div>
          ))}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Curriculum</label>
              <select {...register('curriculum')} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-elimu-400 outline-none text-sm bg-white">
                <option value="">Select…</option>
                {CURRICULA.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
              {errors.curriculum && <p className="text-red-500 text-xs mt-1">{errors.curriculum.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Level / Grade</label>
              <select {...register('level')} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-elimu-400 outline-none text-sm bg-white">
                <option value="">Select…</option>
                {levels.map(l=><option key={l} value={l}>{l}</option>)}
              </select>
              {errors.level && <p className="text-red-500 text-xs mt-1">{errors.level.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
            <div className="relative">
              <input {...register('password')} type={showPwd?'text':'password'} placeholder="Min. 8 characters"
                className="w-full px-4 pr-10 py-3 rounded-xl border border-gray-200 focus:border-elimu-400 focus:ring-2 focus:ring-elimu-100 outline-none text-sm"/>
              <button type="button" onClick={()=>setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPwd?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm Password</label>
            <input {...register('confirmPwd')} type="password" placeholder="Repeat password"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-elimu-400 focus:ring-2 focus:ring-elimu-100 outline-none text-sm"/>
            {errors.confirmPwd && <p className="text-red-500 text-xs mt-1">{errors.confirmPwd.message}</p>}
          </div>

          <button type="submit" disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 bg-elimu-700 hover:bg-elimu-800 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors mt-2">
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin"/>}
            {isSubmitting ? 'Creating account…' : 'Create Student Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account? <Link href="/login" className="text-elimu-700 font-semibold hover:underline">Sign in</Link>
        </p>
        <p className="text-center text-sm text-gray-500 mt-2">
          Are you a parent? <Link href="/register/parent" className="text-elimu-700 font-semibold hover:underline">Register here</Link>
        </p>
      </div>
    </div>
  )
}
