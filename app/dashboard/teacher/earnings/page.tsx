'use client'

import { useEffect, useState } from 'react'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import { DollarSign, TrendingUp, Clock, CheckCircle, XCircle, ChevronRight } from 'lucide-react'
import { formatKES } from '@/lib/utils'
import type { Payment } from '@/types'

export default function TeacherEarningsPage() {
  const { user } = useAuth()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(()=>{
    if(!user) return
    const load = async()=>{
      const snap = await getDocs(query(
        collection(db,'payments'),
        where('userId','==',user.uid),
        orderBy('createdAt','desc')
      ))
      setPayments(snap.docs.map(d=>({id:d.id,...d.data()} as Payment)))
      setLoading(false)
    }
    load()
  },[user])

  const COMMISSION = 0.15
  const completed  = payments.filter(p=>p.status==='completed')
  const totalGross = completed.reduce((s,p)=>s+p.amount,0)
  const totalNet   = totalGross * (1 - COMMISSION)
  const pending    = payments.filter(p=>p.status==='pending').reduce((s,p)=>s+p.amount,0)

  const stats = [
    { label:'Gross Earnings',     value: formatKES(totalGross), icon: DollarSign, color:'text-blue-600 bg-blue-50' },
    { label:'Net Earnings (85%)', value: formatKES(totalNet),   icon: TrendingUp, color:'text-green-600 bg-green-50' },
    { label:'Platform Fee (15%)', value: formatKES(totalGross*COMMISSION), icon: ChevronRight, color:'text-orange-600 bg-orange-50' },
    { label:'Pending',            value: formatKES(pending),    icon: Clock, color:'text-amber-600 bg-amber-50' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Earnings</h1>
        <p className="text-gray-500 mt-1">Track your income from sessions and courses</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({label,value,icon:Icon,color})=>(
          <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
              </div>
              <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
                <Icon className="w-5 h-5"/>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="font-semibold text-gray-900">Transaction History</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12"><div className="spinner"/></div>
        ) : payments.length === 0 ? (
          <p className="text-center text-gray-400 py-12 text-sm">No transactions yet</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {payments.map(p=>(
              <div key={p.id} className="flex items-center gap-4 px-5 py-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${p.status==='completed'?'bg-green-100':p.status==='pending'?'bg-amber-100':'bg-red-100'}`}>
                  {p.status==='completed' ? <CheckCircle className="w-4 h-4 text-green-600"/>
                   : p.status==='pending' ? <Clock className="w-4 h-4 text-amber-600"/>
                   : <XCircle className="w-4 h-4 text-red-600"/>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 capitalize">{p.type.replace(/_/g,' ')}</p>
                  <p className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleString('en-KE',{dateStyle:'medium',timeStyle:'short'})} · {p.method.toUpperCase()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{formatKES(p.amount)}</p>
                  <p className="text-xs text-green-600">+{formatKES(p.amount*(1-COMMISSION))} net</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
