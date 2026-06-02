'use client'

import { Suspense, useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { CheckCircle, Loader2, Mail, Smartphone, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

type Stage = 'email' | 'phone' | 'done'

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-elimu-700"/></div>}>
      <VerifyContent />
    </Suspense>
  )
}

function VerifyContent() {
  const params   = useSearchParams()
  const router   = useRouter()
  const uid      = params.get('uid') ?? ''
  const email    = params.get('email') ?? ''
  const phone    = params.get('phone') ?? ''

  const [stage,        setStage]        = useState<Stage>('email')
  const [emailCode,    setEmailCode]    = useState(['','','','','',''])
  const [phoneCode,    setPhoneCode]    = useState(['','','','','',''])
  const [loading,      setLoading]      = useState(false)
  const [resending,    setResending]    = useState(false)
  const [countdown,    setCountdown]    = useState(60)
  const [canResend,    setCanResend]    = useState(false)
  const inputsRef = useRef<(HTMLInputElement|null)[]>([])

  useEffect(()=>{
    const t = setInterval(()=>{
      setCountdown(c=>{
        if(c<=1){ setCanResend(true); clearInterval(t); return 0 }
        return c-1
      })
    },1000)
    return ()=>clearInterval(t)
  },[stage])

  const handleDigit = (
    val: string, idx: number,
    code: string[], setCode: (c:string[])=>void
  ) => {
    const v = val.replace(/\D/g,'').slice(-1)
    const next = [...code]
    next[idx] = v
    setCode(next)
    if(v && idx < 5) inputsRef.current[idx+1]?.focus()
    if(idx === 5 && next.every(d=>d)) {
      // auto-submit
      setTimeout(()=>handleVerify(next.join(''), stage==='email'?'email':'phone'), 100)
    }
  }

  const handleKeyDown = (e:React.KeyboardEvent, idx:number, code:string[], setCode:(c:string[])=>void) => {
    if(e.key==='Backspace' && !code[idx] && idx > 0){
      inputsRef.current[idx-1]?.focus()
      const next=[...code]; next[idx-1]=''; setCode(next)
    }
  }

  const handleVerify = async (codeStr: string, type: 'email'|'phone') => {
    if(codeStr.length < 6){ toast.error('Enter the full 6-digit code'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ userId: uid, type, otp: codeStr }),
      })
      const data = await res.json()
      if(!res.ok || data.error) throw new Error(data.error ?? 'Invalid code')

      if(type==='email'){
        await updateDoc(doc(db,'users',uid),{ emailVerified: true })
        toast.success('Email verified!')
        // Send phone OTP
        await fetch('/api/send-otp',{
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ type:'sms', phone, name:'', userId:uid }),
        })
        setStage('phone')
        setCountdown(60); setCanResend(false)
      } else {
        await updateDoc(doc(db,'users',uid),{ phoneVerified: true })
        toast.success('Phone verified!')
        setStage('done')
        setTimeout(()=>router.push('/dashboard'),2000)
      }
    } catch(err:any){
      toast.error(err.message ?? 'Verification failed')
      const reset = type==='email' ? ()=>setEmailCode(['','','','','','']) : ()=>setPhoneCode(['','','','','',''])
      reset()
      inputsRef.current[0]?.focus()
    } finally { setLoading(false) }
  }

  const handleResend = async () => {
    setResending(true)
    try {
      await fetch('/api/send-otp',{
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          type: stage==='email' ? 'email' : 'sms',
          email, phone, name:'', userId:uid,
        }),
      })
      toast.success('Code resent!')
      setCountdown(60); setCanResend(false)
    } finally { setResending(false) }
  }

  if(stage==='done') return (
    <div className="text-center p-8">
      <CheckCircle className="w-16 h-16 text-elimu-500 mx-auto mb-4"/>
      <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">All Verified!</h2>
      <p className="text-gray-500">Redirecting you to your dashboard…</p>
    </div>
  )

  const isEmail = stage==='email'
  const code    = isEmail ? emailCode : phoneCode
  const setCode = isEmail ? setEmailCode : setPhoneCode
  const icon    = isEmail ? Mail : Smartphone
  const IconEl  = icon
  const hint    = isEmail ? `We sent a 6-digit code to ${email}` : `We sent a 6-digit code via SMS to ${phone}`

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="w-16 h-16 bg-elimu-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <IconEl className="w-8 h-8 text-elimu-700"/>
        </div>
        <h1 className="font-display text-2xl font-bold text-gray-900 mb-2">
          {isEmail ? 'Verify your email' : 'Verify your phone'}
        </h1>
        <p className="text-gray-500 text-sm mb-8">{hint}</p>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {['Email','Phone'].map((label,i)=>(
            <div key={label} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center transition-colors
                ${(isEmail&&i===0)||(!isEmail&&i<=1) ? 'bg-elimu-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                {!isEmail&&i===0 ? <CheckCircle className="w-3 h-3"/> : i+1}
              </div>
              <span className={`text-xs font-medium ${isEmail&&i===0||!isEmail&&i===1?'text-elimu-700':'text-gray-400'}`}>{label}</span>
              {i<1 && <div className={`w-8 h-0.5 ${!isEmail?'bg-elimu-500':'bg-gray-200'}`}/>}
            </div>
          ))}
        </div>

        {/* OTP inputs */}
        <div className="flex justify-center gap-2 mb-8">
          {code.map((digit,i)=>(
            <input
              key={i}
              ref={el=>{ inputsRef.current[i]=el }}
              type="text" inputMode="numeric" maxLength={1}
              value={digit}
              onChange={e=>handleDigit(e.target.value,i,code,setCode)}
              onKeyDown={e=>handleKeyDown(e,i,code,setCode)}
              className="w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl outline-none transition-colors focus:border-elimu-500 border-gray-200"
            />
          ))}
        </div>

        <button
          onClick={()=>handleVerify(code.join(''),isEmail?'email':'phone')}
          disabled={loading || code.some(d=>!d)}
          className="w-full flex items-center justify-center gap-2 bg-elimu-700 hover:bg-elimu-800 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors mb-4">
          {loading && <Loader2 className="w-4 h-4 animate-spin"/>}
          {loading ? 'Verifying…' : `Verify ${isEmail?'Email':'Phone'}`}
        </button>

        <div className="text-sm text-gray-500">
          Didn't receive it?{' '}
          {canResend ? (
            <button onClick={handleResend} disabled={resending}
              className="text-elimu-700 font-semibold hover:underline inline-flex items-center gap-1">
              {resending && <RefreshCw className="w-3 h-3 animate-spin"/>}
              Resend code
            </button>
          ) : (
            <span className="text-gray-400">Resend in {countdown}s</span>
          )}
        </div>
      </div>
    </div>
  )
}
