'use client'

import { useEffect, useState } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Save, Loader2, Settings, DollarSign, Clock, Percent } from 'lucide-react'
import toast from 'react-hot-toast'
import type { PlatformSettings } from '@/types'

const DEFAULTS: PlatformSettings = {
  registrationFee: 500,
  platformCommissionPercent: 15,
  trialDurationDays: 14,
  subscriptionTiers: {
    basic:        { priceMonthly:500,  priceAnnual:5000,  maxStudents:20   },
    professional: { priceMonthly:1500, priceAnnual:15000, maxStudents:100  },
    enterprise:   { priceMonthly:5000, priceAnnual:50000, maxStudents:9999 },
  },
  maintenanceMode: false,
  updatedAt: new Date().toISOString(),
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULTS)
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)

  useEffect(()=>{
    const load = async()=>{
      const snap = await getDoc(doc(db,'platform','settings'))
      if(snap.exists()) setSettings(snap.data() as PlatformSettings)
      setLoading(false)
    }
    load()
  },[])

  const save = async()=>{
    setSaving(true)
    try{
      await setDoc(doc(db,'platform','settings'),{ ...settings, updatedAt: new Date().toISOString() })
      toast.success('Settings saved!')
    }catch(e:any){ toast.error('Failed to save: '+e.message)
    }finally{ setSaving(false) }
  }

  const setTier = (tier: keyof PlatformSettings['subscriptionTiers'], field: string, val: number)=>{
    setSettings(s=>({ ...s, subscriptionTiers:{ ...s.subscriptionTiers, [tier]:{ ...s.subscriptionTiers[tier],[field]:val }}}))
  }

  if(loading) return <div className="flex items-center justify-center h-64"><div className="spinner"/></div>

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Platform Settings</h1>
          <p className="text-gray-500 mt-1">Configure global platform parameters</p>
        </div>
        <button onClick={save} disabled={saving}
          className="inline-flex items-center gap-2 bg-elimu-700 hover:bg-elimu-800 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
          {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {/* General */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6" id="subscription">
        <h2 className="font-semibold text-gray-900 mb-5 flex items-center gap-2"><Settings className="w-4 h-4 text-elimu-600"/>General</h2>
        <div className="grid sm:grid-cols-3 gap-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5"/>Teacher Registration Fee (KES)</label>
            <input type="number" value={settings.registrationFee} onChange={e=>setSettings(s=>({...s,registrationFee:+e.target.value}))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-elimu-400 outline-none text-sm"/>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5"><Percent className="w-3.5 h-3.5"/>Platform Commission (%)</label>
            <input type="number" value={settings.platformCommissionPercent} onChange={e=>setSettings(s=>({...s,platformCommissionPercent:+e.target.value}))}
              min={0} max={50}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-elimu-400 outline-none text-sm"/>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/>Trial Duration (days)</label>
            <input type="number" value={settings.trialDurationDays} onChange={e=>setSettings(s=>({...s,trialDurationDays:+e.target.value}))}
              min={1} max={90}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-elimu-400 outline-none text-sm"/>
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div>
            <p className="font-semibold text-gray-900 text-sm">Maintenance Mode</p>
            <p className="text-xs text-gray-500">Disable public access to the platform</p>
          </div>
          <button onClick={()=>setSettings(s=>({...s,maintenanceMode:!s.maintenanceMode}))}
            className={`w-11 h-6 rounded-full transition-colors relative ${settings.maintenanceMode?'bg-red-500':'bg-gray-300'}`}>
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.maintenanceMode?'translate-x-5':'translate-x-0.5'}`}/>
          </button>
        </div>
      </div>

      {/* Subscription tiers */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-5 flex items-center gap-2"><DollarSign className="w-4 h-4 text-elimu-600"/>Subscription Tiers</h2>
        <div className="space-y-5">
          {(Object.keys(settings.subscriptionTiers) as Array<keyof PlatformSettings['subscriptionTiers']>).map(tier=>{
            const t = settings.subscriptionTiers[tier]
            return (
              <div key={tier} className="p-4 bg-gray-50 rounded-xl">
                <p className="font-semibold text-gray-800 capitalize mb-3">{tier}</p>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Monthly Price (KES)</label>
                    <input type="number" value={t.priceMonthly} onChange={e=>setTier(tier,'priceMonthly',+e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-elimu-400 outline-none text-sm"/>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Annual Price (KES)</label>
                    <input type="number" value={t.priceAnnual} onChange={e=>setTier(tier,'priceAnnual',+e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-elimu-400 outline-none text-sm"/>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Max Students</label>
                    <input type="number" value={t.maxStudents===9999?0:t.maxStudents} onChange={e=>setTier(tier,'maxStudents',+e.target.value||9999)}
                      placeholder="0 = unlimited"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-elimu-400 outline-none text-sm"/>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
