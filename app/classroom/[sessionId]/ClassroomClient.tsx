'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import { useWebRTC } from '@/hooks/useWebRTC'
import {
  Mic, MicOff, Video, VideoOff, MonitorUp, MonitorOff,
  Hand, MessageSquare, Users, PhoneOff, Settings,
  MoreVertical, Pin, Maximize2, PenTool, X,
  Send, ChevronRight, Shield,
} from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import type { ClassSession } from '@/types'

export default function ClassroomPage() {
  const params   = useParams<{ sessionId: string }>()
  const router   = useRouter()
  const { user } = useAuth()

  const [session,     setSession]     = useState<ClassSession | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [showChat,    setShowChat]    = useState(false)
  const [showPeople,  setShowPeople]  = useState(false)
  const [showBoard,   setShowBoard]   = useState(false)
  const [chatInput,   setChatInput]   = useState('')
  const [joined,      setJoined]      = useState(false)

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const chatEndRef    = useRef<HTMLDivElement>(null)
  const canvasRef     = useRef<HTMLCanvasElement>(null)
  const drawingRef    = useRef(false)
  const lastPosRef    = useRef<{ x: number; y: number } | null>(null)

  const isHost = session?.teacherId === user?.uid

  const {
    localStream, participants, chatMessages,
    isAudioEnabled, isVideoEnabled, isScreenSharing, isHandRaised,
    connectionError,
    joinRoom, leaveRoom,
    toggleAudio, toggleVideo, toggleScreenShare, raiseHand, sendMessage,
  } = useWebRTC({
    sessionId:   params.sessionId,
    userId:      user?.uid ?? '',
    displayName: user?.displayName ?? 'Guest',
    isHost,
  })

  // Load session
  useEffect(() => {
    const load = async () => {
      const snap = await getDoc(doc(db, 'sessions', params.sessionId))
      if (snap.exists()) setSession(snap.data() as ClassSession)
      setLoading(false)
    }
    load()
  }, [params.sessionId])

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  // Auto-scroll chat
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMessages])

  const handleJoin = async () => {
    await joinRoom()
    setJoined(true)
    if (session && user && !session.participants.includes(user.uid)) {
      await updateDoc(doc(db, 'sessions', params.sessionId), {
        participants: [...session.participants, user.uid],
        status: 'live',
      })
    }
  }

  const handleLeave = async () => {
    await leaveRoom()
    router.push('/dashboard')
  }

  const handleEndSession = async () => {
    await leaveRoom()
    await updateDoc(doc(db, 'sessions', params.sessionId), { status: 'ended' })
    router.push('/dashboard')
  }

  const handleSendChat = async () => {
    if (!chatInput.trim()) return
    await sendMessage(chatInput.trim())
    setChatInput('')
  }

  // ─── Whiteboard drawing ────────────────────────────────────────────────────
  const startDraw  = (e: React.MouseEvent) => { drawingRef.current = true; lastPosRef.current = { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY } }
  const stopDraw   = () => { drawingRef.current = false; lastPosRef.current = null }
  const draw = (e: React.MouseEvent) => {
    if (!drawingRef.current || !canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx || !lastPosRef.current) return
    ctx.beginPath()
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y)
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY)
    ctx.strokeStyle = '#166534'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.stroke()
    lastPosRef.current = { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY }
  }

  if (loading) return (
    <div className="fixed inset-0 bg-gray-950 flex items-center justify-center">
      <div className="text-center text-white">
        <div className="spinner mx-auto mb-4 border-white/20 border-t-white"/>
        <p>Loading classroom…</p>
      </div>
    </div>
  )

  // ─── Pre-join screen ───────────────────────────────────────────────────────
  if (!joined) return (
    <div className="fixed inset-0 bg-gray-950 flex items-center justify-center">
      <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-md text-center border border-gray-800">
        <div className="w-14 h-14 bg-elimu-700 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Video className="w-7 h-7 text-white"/>
        </div>
        <h2 className="font-display text-xl font-bold text-white mb-2">{session?.title ?? 'Live Session'}</h2>
        <p className="text-gray-400 text-sm mb-1">{session?.subject} · {session?.level}</p>
        <p className="text-gray-500 text-xs mb-8">{session?.participants?.length ?? 0} participants already joined</p>
        {connectionError && (
          <div className="bg-red-900/30 border border-red-800 rounded-xl p-3 mb-4 text-red-300 text-sm">{connectionError}</div>
        )}
        <button onClick={handleJoin}
          className="w-full bg-elimu-600 hover:bg-elimu-700 text-white font-bold py-3 rounded-xl transition-colors">
          Join Session
        </button>
        <button onClick={() => router.back()} className="mt-3 w-full text-gray-500 hover:text-gray-300 text-sm py-2">
          Go Back
        </button>
      </div>
    </div>
  )

  const allParticipants = Array.from(participants.values())
  const totalCount = allParticipants.length + 1 // +1 for local

  return (
    <div className="fixed inset-0 bg-gray-950 flex overflow-hidden">

      {/* ─── Main area ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header bar */}
        <div className="h-12 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"/>
              <span className="text-white text-sm font-semibold">LIVE</span>
            </div>
            <span className="text-gray-400 text-sm">{session?.title}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400 text-xs">
            <Users className="w-3.5 h-3.5"/>
            <span>{totalCount}</span>
            <span className="mx-2 text-gray-700">|</span>
            <span>{new Date().toLocaleTimeString('en-KE',{hour:'2-digit',minute:'2-digit'})}</span>
          </div>
        </div>

        {/* Video grid / whiteboard */}
        <div className="flex-1 p-3 overflow-hidden">
          {showBoard ? (
            <div className="h-full bg-white rounded-2xl overflow-hidden relative">
              <div className="absolute top-3 right-3 z-10">
                <button onClick={()=>setShowBoard(false)} className="bg-gray-800 text-white p-2 rounded-lg text-xs">Close Board</button>
              </div>
              <canvas
                ref={canvasRef}
                width={1200} height={700}
                className="whiteboard-canvas w-full h-full"
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={stopDraw}
                onMouseLeave={stopDraw}
              />
            </div>
          ) : (
            <div className={cn('classroom-grid h-full')} data-count={String(Math.min(totalCount,9))}>
              {/* Local video */}
              <div className="relative bg-gray-800 rounded-2xl overflow-hidden group">
                <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover"/>
                {!isVideoEnabled && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    <div className="w-16 h-16 bg-elimu-700 rounded-full flex items-center justify-center text-white text-xl font-bold">
                      {getInitials(user?.displayName ?? 'U')}
                    </div>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 bg-black/50 rounded-lg px-2 py-1 text-white text-xs font-medium flex items-center gap-1.5">
                  {!isAudioEnabled && <MicOff className="w-3 h-3 text-red-400"/>}
                  {user?.displayName} (You) {isHost && <Shield className="w-3 h-3 text-gold-400"/>}
                </div>
              </div>

              {/* Remote participants */}
              {allParticipants.slice(0, 8).map(p => (
                <div key={p.uid} className="relative bg-gray-800 rounded-2xl overflow-hidden">
                  {p.stream ? (
                    <video
                      autoPlay playsInline
                      ref={el => { if (el && p.stream) el.srcObject = p.stream }}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                        {getInitials(p.displayName)}
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 bg-black/50 rounded-lg px-2 py-1 text-white text-xs font-medium flex items-center gap-1.5">
                    {!p.audioEnabled && <MicOff className="w-3 h-3 text-red-400"/>}
                    {p.handRaised && <Hand className="w-3 h-3 text-amber-400"/>}
                    {p.displayName}
                    {p.role==='host' && <Shield className="w-3 h-3 text-gold-400"/>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── Control bar ────────────────────────────────────────────── */}
        <div className="h-20 bg-gray-900 border-t border-gray-800 flex items-center justify-center gap-3 px-4 shrink-0">
          {/* Audio */}
          <button onClick={toggleAudio}
            className={cn('w-12 h-12 rounded-2xl flex items-center justify-center transition-colors',
              isAudioEnabled ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white')}>
            {isAudioEnabled ? <Mic className="w-5 h-5"/> : <MicOff className="w-5 h-5"/>}
          </button>

          {/* Video */}
          <button onClick={toggleVideo}
            className={cn('w-12 h-12 rounded-2xl flex items-center justify-center transition-colors',
              isVideoEnabled ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white')}>
            {isVideoEnabled ? <Video className="w-5 h-5"/> : <VideoOff className="w-5 h-5"/>}
          </button>

          {/* Screen share */}
          <button onClick={toggleScreenShare}
            className={cn('w-12 h-12 rounded-2xl flex items-center justify-center transition-colors',
              isScreenSharing ? 'bg-elimu-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white')}>
            {isScreenSharing ? <MonitorOff className="w-5 h-5"/> : <MonitorUp className="w-5 h-5"/>}
          </button>

          {/* Whiteboard */}
          <button onClick={()=>setShowBoard(!showBoard)}
            className={cn('w-12 h-12 rounded-2xl flex items-center justify-center transition-colors',
              showBoard ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white')}>
            <PenTool className="w-5 h-5"/>
          </button>

          {/* Hand raise */}
          <button onClick={raiseHand}
            className={cn('w-12 h-12 rounded-2xl flex items-center justify-center transition-colors',
              isHandRaised ? 'bg-amber-500 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white')}>
            <Hand className="w-5 h-5"/>
          </button>

          {/* Chat */}
          <button onClick={()=>{ setShowChat(!showChat); setShowPeople(false) }}
            className={cn('w-12 h-12 rounded-2xl flex items-center justify-center transition-colors relative',
              showChat ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white')}>
            <MessageSquare className="w-5 h-5"/>
            {chatMessages.length > 0 && !showChat && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"/>
            )}
          </button>

          {/* Participants */}
          <button onClick={()=>{ setShowPeople(!showPeople); setShowChat(false) }}
            className={cn('w-12 h-12 rounded-2xl flex items-center justify-center transition-colors',
              showPeople ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white')}>
            <Users className="w-5 h-5"/>
          </button>

          <div className="w-px h-8 bg-gray-700 mx-1"/>

          {/* Leave / End */}
          {isHost ? (
            <button onClick={handleEndSession}
              className="bg-red-600 hover:bg-red-700 text-white px-5 h-12 rounded-2xl font-semibold text-sm transition-colors flex items-center gap-2">
              <PhoneOff className="w-4 h-4"/> End Session
            </button>
          ) : (
            <button onClick={handleLeave}
              className="bg-red-600 hover:bg-red-700 text-white px-5 h-12 rounded-2xl font-semibold text-sm transition-colors flex items-center gap-2">
              <PhoneOff className="w-4 h-4"/> Leave
            </button>
          )}
        </div>
      </div>

      {/* ─── Chat panel ─────────────────────────────────────────────────── */}
      {showChat && (
        <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col">
          <div className="h-12 flex items-center justify-between px-4 border-b border-gray-800">
            <span className="text-white font-semibold text-sm">Chat</span>
            <button onClick={()=>setShowChat(false)} className="text-gray-500 hover:text-gray-300"><X className="w-4 h-4"/></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.map(msg => (
              <div key={msg.id} className={cn('flex flex-col', msg.senderId===user?.uid && 'items-end')}>
                <span className="text-xs text-gray-500 mb-1">{msg.senderName}</span>
                <div className={cn('max-w-[85%] rounded-2xl px-3 py-2 text-sm',
                  msg.senderId===user?.uid ? 'bg-elimu-700 text-white' : 'bg-gray-800 text-gray-200')}>
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={chatEndRef}/>
          </div>
          <div className="p-3 border-t border-gray-800 flex gap-2">
            <input
              value={chatInput} onChange={e=>setChatInput(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&handleSendChat()}
              placeholder="Send a message…"
              className="flex-1 bg-gray-800 text-white placeholder-gray-500 text-sm rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-elimu-500"/>
            <button onClick={handleSendChat}
              className="w-9 h-9 bg-elimu-700 hover:bg-elimu-600 rounded-xl flex items-center justify-center">
              <Send className="w-4 h-4 text-white"/>
            </button>
          </div>
        </div>
      )}

      {/* ─── Participants panel ──────────────────────────────────────────── */}
      {showPeople && (
        <div className="w-72 bg-gray-900 border-l border-gray-800 flex flex-col">
          <div className="h-12 flex items-center justify-between px-4 border-b border-gray-800">
            <span className="text-white font-semibold text-sm">Participants ({totalCount})</span>
            <button onClick={()=>setShowPeople(false)} className="text-gray-500 hover:text-gray-300"><X className="w-4 h-4"/></button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {/* Self */}
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-800">
              <div className="w-8 h-8 bg-elimu-700 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                {getInitials(user?.displayName??'U')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{user?.displayName} (You)</p>
                <p className="text-xs text-elimu-400">{isHost?'Host':'Participant'}</p>
              </div>
              <div className="flex items-center gap-1.5">
                {!isAudioEnabled && <MicOff className="w-3.5 h-3.5 text-red-400"/>}
                {!isVideoEnabled && <VideoOff className="w-3.5 h-3.5 text-red-400"/>}
              </div>
            </div>
            {allParticipants.map(p=>(
              <div key={p.uid} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-800 transition-colors">
                <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                  {getInitials(p.displayName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{p.displayName}</p>
                  <p className="text-xs text-gray-500 capitalize">{p.role}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {!p.audioEnabled && <MicOff className="w-3.5 h-3.5 text-red-400"/>}
                  {p.handRaised && <Hand className="w-3.5 h-3.5 text-amber-400"/>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
