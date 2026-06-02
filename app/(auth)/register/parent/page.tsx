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

const schema = z.object({
  displayName: z.string().min(3,'Full name required'),
  email:       z.string().email('Valid email required'),
  phone:       z.string().regex(/^(\+?254|0)[17]\d{8}$/,'Valid Kenyan phone required'),
  password:    z.string().min(8,'Minimum 8 characters'),
  confirmPwd:  z.string(),
}).refine(d=>d.password===d.confirmPwd,{message:"Passwords don't match",path:['confirmPwd']})

type FormData = z.infer<typeof schema>

export default function ParentRegisterPage() {
  const router = useRouter()
  const [showPwd, setShowPwd] = useState(false)
  const { register, handleSubmit, formState:{ errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, data.email, data.password)
      const uid = cred.user.uid
      const now = new Date().toISOString()

      await setDoc(doc(db,'users',uid),{
        uid, email:data.email, phone:data.phone, displayName:data.displayName,
        role:'parent', emailVerified:false, phoneVerified:false, isActive:true, createdAt:now, updatedAt:now,
      })
      await setDoc(doc(db,'parents',uid),{ uid, children:[], createdAt:now })

      await fetch('/api/send-otp',{
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ type:'email', email:data.email, name:data.displayName, userId:uid }),
      })

      toast.success('Account created! Please verify your email.')
      router.push(`/verify?uid=${uid}&email=${encodeURIComponent(data.email)}&phone=${encodeURIComponent(data.phone)}`)
    } catch(err:any){
      if(err.code==='auth/email-already-in-use') toast.error('Email already in use.')
      else toast.error(err.message ?? 'Registration failed')
    }
  }

  return (
    <div className="w-full max-w-lg">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">Join as Parent</h1>
        <p className="text-gray-500 text-sm mb-8">Manage your children's learning journey in one place. Free to join.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {[
            {name:'displayName',label:'Full Name',    type:'text', placeholder:'Your full name'},
            {name:'email',      label:'Email Address',type:'email',placeholder:'you@example.com'},
            {name:'phone',      label:'Phone Number', type:'tel',  placeholder:'07XXXXXXXX'},
          ].map(f=>(
            <div key={f.name}>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{f.label}</label>
              <input {...register(f.name as any)} type={f.type} placeholder={f.placeholder}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-elimu-400 focus:ring-2 focus:ring-elimu-100 outline-none text-sm"/>
              {errors[f.name as keyof FormData] && <p className="text-red-500 text-xs mt-1">{(errors as any)[f.name]?.message}</p>}
            </div>
          ))}

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
            {isSubmitting ? 'Creating account…' : 'Create Parent Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account? <Link href="/login" className="text-elimu-700 font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
