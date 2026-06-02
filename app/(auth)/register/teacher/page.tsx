'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { Eye, EyeOff, Loader2, CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Curriculum, SubjectArea, SubscriptionTier } from '@/types'
import { formatKES } from '@/lib/utils'

// ─── Constants ────────────────────────────────────────────────────────────────
const CURRICULA: Curriculum[] = ['CBC','8-4-4','Cambridge','IB','Montessori','American','French','GCSE','BTEC']
const SUBJECTS: SubjectArea[] = [
  'Mathematics','English','Kiswahili','Science','Biology','Chemistry','Physics',
  'Geography','History','CRE','IRE','Business Studies','Economics','Accounting',
  'Computer Science','ICT','Art & Design','Music','Drama','Physical Education',
  'French','German','Spanish','Arabic','Mandarin','Social Studies','Agriculture','Home Science','Other',
]

const TIERS = [
  { id: 'trial' as SubscriptionTier,        name: 'Free Trial',    price: 0,    duration:'14 days',  maxStudents: 5,   features:['5 students','Live classroom','Basic library'] },
  { id: 'basic' as SubscriptionTier,        name: 'Basic',         price: 500,  duration:'/month',   maxStudents: 20,  features:['20 students','10 courses','Full library'] },
  { id: 'professional' as SubscriptionTier, name: 'Professional',  price: 1500, duration:'/month',   maxStudents: 100, features:['100 students','Unlimited courses','Verified badge','Analytics'] },
  { id: 'enterprise' as SubscriptionTier,   name: 'Enterprise',    price: 5000, duration:'/month',   maxStudents: 9999,features:['Unlimited students','Custom branding','API access','Account manager'] },
]

const REGISTRATION_FEE = 500 // KES — can be set by admin

// ─── Form schema (multi-step) ─────────────────────────────────────────────────
const step1Schema = z.object({
  displayName: z.string().min(3, 'Full name required'),
  email:       z.string().email('Valid email required'),
  phone:       z.string().regex(/^(\+?254|0)[17]\d{8}$/, 'Enter valid Kenyan phone (07XX/01XX/+254)'),
  password:    z.string().min(8, 'Minimum 8 characters'),
  confirmPwd:  z.string(),
}).refine(d => d.password === d.confirmPwd, { message: "Passwords don't match", path:['confirmPwd'] })

const step2Schema = z.object({
  bio:            z.string().min(50,'Bio must be at least 50 characters'),
  qualifications: z.string().min(5,'Enter at least one qualification'),
  hourlyRate:     z.coerce.number().min(100,'Minimum KES 100').max(50000,'Maximum KES 50,000'),
})

type Step1Data = z.infer<typeof step1Schema>
type Step2Data = z.infer<typeof step2Schema>

export default function TeacherRegisterPage() {
  const router = useRouter()
  const [step,  setStep]  = useState(1)  // 1=account, 2=profile, 3=tier, 4=payment
  const [step1, setStep1] = useState<Step1Data | null>(null)
  const [step2, setStep2] = useState<Step2Data | null>(null)
  const [selectedCurricula, setSelectedCurricula] = useState<Curriculum[]>([])
  const [selectedSubjects,  setSelectedSubjects]  = useState<SubjectArea[]>([])
  const [selectedTier,      setSelectedTier]      = useState<SubscriptionTier>('trial')
  const [showPwd,           setShowPwd]           = useState(false)
  const [paying,            setPaying]            = useState(false)

  // Step 1 form
  const form1 = useForm<Step1Data>({ resolver: zodResolver(step1Schema) })
  // Step 2 form
  const form2 = useForm<Step2Data>({ resolver: zodResolver(step2Schema) })

  const toggleItem = <T,>(arr: T[], item: T, setArr: (a: T[]) => void) => {
    setArr(arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item])
  }

  // ─── Final registration ─────────────────────────────────────────────────
  const handleRegister = async () => {
    if (!step1 || !step2) return
    setPaying(true)
    try {
      // Create Firebase Auth user
      const cred = await createUserWithEmailAndPassword(auth, step1.email, step1.password)
      const uid  = cred.user.uid

      const now    = new Date().toISOString()
      const endDt  = new Date(Date.now() + (selectedTier === 'trial' ? 14 : 30) * 86400000).toISOString()
      const tier   = TIERS.find(t => t.id === selectedTier)!

      // Write user doc
      await setDoc(doc(db, 'users', uid), {
        uid, email: step1.email, phone: step1.phone,
        displayName: step1.displayName, role: 'teacher',
        emailVerified: false, phoneVerified: false,
        isActive: true, createdAt: now, updatedAt: now,
      })

      // Write teacher profile
      await setDoc(doc(db, 'teachers', uid), {
        uid, bio: step2.bio,
        qualifications: step2.qualifications.split('\n').filter(Boolean),
        subjects: selectedSubjects, curricula: selectedCurricula,
        levels: [], languages: ['English'],
        hourlyRate: step2.hourlyRate, rating: 0, reviewCount: 0,
        totalStudents: 0, totalSessions: 0, availability: [],
        subscription: {
          tier: selectedTier, startDate: now, endDate: endDt, status: 'active',
          maxStudents: tier.maxStudents,
          canUploadVideos: selectedTier !== 'trial',
          canCreateCourses: selectedTier !== 'trial',
          canAccessLibrary: true,
        },
        isVerified: false, profileCompleted: true,
        registrationFeePaid: selectedTier === 'trial', // trial = skip fee
        createdAt: now,
      })

      // If paid tier, trigger M-Pesa
      if (selectedTier !== 'trial') {
        const totalAmount = REGISTRATION_FEE + tier.price
        const stkRes = await fetch('/api/payments/mpesa/initiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: step1.phone, amount: totalAmount,
            accountRef: `TEA-${uid.slice(0,6)}`,
            description: `ElimuConnect ${tier.name} Subscription + Registration`,
            userId: uid, type: 'subscription', tier: selectedTier,
          }),
        })
        const stkData = await stkRes.json()
        if (stkData.error) throw new Error(stkData.error)
        toast.success('STK Push sent! Enter your M-Pesa PIN to complete payment.', { duration: 8000 })
      }

      // Send verification email
      await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'email', email: step1.email, name: step1.displayName, userId: uid }),
      })

      toast.success('Account created! Please verify your email.')
      router.push(`/verify?uid=${uid}&email=${encodeURIComponent(step1.email)}&phone=${encodeURIComponent(step1.phone)}`)
    } catch (err: any) {
      toast.error(err.message ?? 'Registration failed. Please try again.')
    } finally {
      setPaying(false)
    }
  }

  return (
    <div className="w-full max-w-2xl">
      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-8">
        {['Account','Profile','Subscription','Review'].map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step > i+1 ? 'bg-elimu-600 text-white' : step === i+1 ? 'bg-elimu-700 text-white' : 'bg-gray-200 text-gray-400'}`}>
              {step > i+1 ? <CheckCircle className="w-4 h-4" /> : i+1}
            </div>
            <span className={`text-xs hidden sm:block font-medium ${step === i+1 ? 'text-elimu-700' : 'text-gray-400'}`}>{label}</span>
            {i < 3 && <div className={`flex-1 h-0.5 ${step > i+1 ? 'bg-elimu-500' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

        {/* ── Step 1: Account ────────────────────────────────────────────── */}
        {step === 1 && (
          <form onSubmit={form1.handleSubmit(d => { setStep1(d); setStep(2) })}>
            <h2 className="font-display text-2xl font-bold text-gray-900 mb-6">Create Your Account</h2>
            <div className="space-y-4">
              {[
                { name:'displayName', label:'Full Name',     type:'text',     placeholder:'John Doe' },
                { name:'email',       label:'Email Address', type:'email',    placeholder:'john@example.com' },
                { name:'phone',       label:'Phone Number',  type:'tel',      placeholder:'07XXXXXXXX or +254XXXXXXXXX' },
              ].map(f => (
                <div key={f.name}>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">{f.label}</label>
                  <input {...form1.register(f.name as any)} type={f.type} placeholder={f.placeholder}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-elimu-400 focus:ring-2 focus:ring-elimu-100 outline-none text-sm" />
                  {form1.formState.errors[f.name as keyof Step1Data] && (
                    <p className="text-red-500 text-xs mt-1">{(form1.formState.errors as any)[f.name]?.message}</p>
                  )}
                </div>
              ))}
              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <input {...form1.register('password')} type={showPwd ? 'text' : 'password'} placeholder="Min. 8 characters"
                    className="w-full px-4 pr-10 py-3 rounded-xl border border-gray-200 focus:border-elimu-400 focus:ring-2 focus:ring-elimu-100 outline-none text-sm" />
                  <button type="button" onClick={()=>setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPwd ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                  </button>
                </div>
                {form1.formState.errors.password && <p className="text-red-500 text-xs mt-1">{form1.formState.errors.password.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm Password</label>
                <input {...form1.register('confirmPwd')} type="password" placeholder="Repeat password"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-elimu-400 focus:ring-2 focus:ring-elimu-100 outline-none text-sm" />
                {form1.formState.errors.confirmPwd && <p className="text-red-500 text-xs mt-1">{form1.formState.errors.confirmPwd.message}</p>}
              </div>
            </div>
            <button type="submit" className="mt-6 w-full flex items-center justify-center gap-2 bg-elimu-700 hover:bg-elimu-800 text-white font-semibold py-3 rounded-xl transition-colors">
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* ── Step 2: Profile ────────────────────────────────────────────── */}
        {step === 2 && (
          <form onSubmit={form2.handleSubmit(d => { setStep2(d); setStep(3) })}>
            <h2 className="font-display text-2xl font-bold text-gray-900 mb-6">Your Teaching Profile</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Professional Bio <span className="text-gray-400 font-normal">(min 50 chars)</span></label>
                <textarea {...form2.register('bio')} rows={4} placeholder="Describe your teaching experience, style, and specialisms…"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-elimu-400 focus:ring-2 focus:ring-elimu-100 outline-none text-sm resize-none" />
                {form2.formState.errors.bio && <p className="text-red-500 text-xs mt-1">{form2.formState.errors.bio.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Qualifications <span className="text-gray-400 font-normal">(one per line)</span></label>
                <textarea {...form2.register('qualifications')} rows={3} placeholder="Bachelor of Education – Kenyatta University&#10;TSC Registered Teacher"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-elimu-400 focus:ring-2 focus:ring-elimu-100 outline-none text-sm resize-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Hourly Rate (KES)</label>
                <input {...form2.register('hourlyRate')} type="number" min={100} placeholder="e.g. 800"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-elimu-400 focus:ring-2 focus:ring-elimu-100 outline-none text-sm" />
                {form2.formState.errors.hourlyRate && <p className="text-red-500 text-xs mt-1">{form2.formState.errors.hourlyRate.message}</p>}
              </div>
              {/* Curricula */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Curricula You Teach</label>
                <div className="flex flex-wrap gap-2">
                  {CURRICULA.map(c => (
                    <button key={c} type="button" onClick={() => toggleItem(selectedCurricula, c, setSelectedCurricula)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${selectedCurricula.includes(c) ? 'bg-elimu-700 text-white border-elimu-700' : 'bg-white text-gray-600 border-gray-200 hover:border-elimu-300'}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              {/* Subjects */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Subjects <span className="text-gray-400 font-normal">(select all that apply)</span></label>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 rounded-xl border border-gray-100">
                  {SUBJECTS.map(s => (
                    <button key={s} type="button" onClick={() => toggleItem(selectedSubjects, s, setSelectedSubjects)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${selectedSubjects.includes(s) ? 'bg-elimu-700 text-white border-elimu-700' : 'bg-white text-gray-600 border-gray-200 hover:border-elimu-300'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button type="button" onClick={() => setStep(1)} className="flex items-center gap-1 px-5 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button type="submit" className="flex-1 flex items-center justify-center gap-2 bg-elimu-700 hover:bg-elimu-800 text-white font-semibold py-3 rounded-xl transition-colors">
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* ── Step 3: Subscription ───────────────────────────────────────── */}
        {step === 3 && (
          <div>
            <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">Choose a Plan</h2>
            <p className="text-gray-500 text-sm mb-6">A one-time registration fee of <strong>{formatKES(REGISTRATION_FEE)}</strong> applies for paid plans.</p>
            <div className="space-y-3 mb-6">
              {TIERS.map(t => (
                <button key={t.id} type="button" onClick={() => setSelectedTier(t.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${selectedTier === t.id ? 'border-elimu-500 bg-elimu-50' : 'border-gray-200 hover:border-elimu-200'}`}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedTier === t.id ? 'border-elimu-600 bg-elimu-600' : 'border-gray-300'}`}>
                    {selectedTier === t.id && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-gray-900">{t.name}</span>
                      <span className="text-elimu-700 font-bold text-sm">
                        {t.price === 0 ? 'Free' : `${formatKES(t.price)}${t.duration}`}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{t.features.join(' · ')}</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex items-center gap-1 px-5 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button onClick={() => setStep(4)} className="flex-1 flex items-center justify-center gap-2 bg-elimu-700 hover:bg-elimu-800 text-white font-semibold py-3 rounded-xl transition-colors">
                Review & Register <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 4: Review & Pay ───────────────────────────────────────── */}
        {step === 4 && step1 && step2 && (
          <div>
            <h2 className="font-display text-2xl font-bold text-gray-900 mb-6">Review & Complete</h2>
            <div className="bg-gray-50 rounded-xl p-5 space-y-3 text-sm mb-6 border border-gray-100">
              <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-semibold">{step1.displayName}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Email</span><span>{step1.email}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Phone</span><span>{step1.phone}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Subjects</span><span>{selectedSubjects.slice(0,3).join(', ')}{selectedSubjects.length > 3 ? `+${selectedSubjects.length-3}` : ''}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Plan</span><span className="font-bold text-elimu-700">{TIERS.find(t=>t.id===selectedTier)?.name}</span></div>
              {selectedTier !== 'trial' && (
                <>
                  <hr className="border-gray-200"/>
                  <div className="flex justify-between"><span className="text-gray-500">Registration fee</span><span>{formatKES(REGISTRATION_FEE)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Monthly subscription</span><span>{formatKES(TIERS.find(t=>t.id===selectedTier)!.price)}</span></div>
                  <div className="flex justify-between font-bold text-gray-900"><span>Total due today</span><span>{formatKES(REGISTRATION_FEE + TIERS.find(t=>t.id===selectedTier)!.price)}</span></div>
                </>
              )}
            </div>
            {selectedTier !== 'trial' && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800 mb-6">
                <strong>M-Pesa payment:</strong> After clicking Register, an STK Push will be sent to <strong>{step1.phone}</strong>. Enter your M-Pesa PIN to complete payment.
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className="flex items-center gap-1 px-5 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button onClick={handleRegister} disabled={paying}
                className="flex-1 flex items-center justify-center gap-2 bg-elimu-700 hover:bg-elimu-800 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors">
                {paying && <Loader2 className="w-4 h-4 animate-spin" />}
                {paying ? 'Creating account…' : selectedTier === 'trial' ? 'Start Free Trial' : 'Register & Pay via M-Pesa'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
