'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { ref, onValue, set, push, remove, off, onDisconnect } from 'firebase/database'
import { rtdb } from '@/lib/firebase'
import type { ClassroomParticipant, ChatMessage } from '@/types'

interface UseWebRTCOptions {
  sessionId: string
  userId: string
  displayName: string
  isHost: boolean
}

interface PeerEntry {
  connection: RTCPeerConnection
  stream?: MediaStream
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
  ],
}

export function useWebRTC({ sessionId, userId, displayName, isHost }: UseWebRTCOptions) {
  const [localStream, setLocalStream]         = useState<MediaStream | null>(null)
  const [participants, setParticipants]       = useState<Map<string, ClassroomParticipant & { stream?: MediaStream }>>(new Map())
  const [chatMessages, setChatMessages]       = useState<ChatMessage[]>([])
  const [isAudioEnabled, setIsAudioEnabled]   = useState(true)
  const [isVideoEnabled, setIsVideoEnabled]   = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [isHandRaised, setIsHandRaised]       = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  const localStreamRef  = useRef<MediaStream | null>(null)
  const screenStreamRef = useRef<MediaStream | null>(null)
  const peersRef        = useRef<Map<string, PeerEntry>>(new Map())

  const roomPath  = `rooms/${sessionId}`
  const myPresRef = ref(rtdb, `${roomPath}/participants/${userId}`)

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const createPeer = useCallback((remoteUid: string, initiator: boolean, stream: MediaStream) => {
    const pc = new RTCPeerConnection(ICE_SERVERS)

    // Add local tracks
    stream.getTracks().forEach(track => pc.addTrack(track, stream))

    // ICE candidates → Firebase
    pc.onicecandidate = async ({ candidate }) => {
      if (candidate) {
        await push(ref(rtdb, `${roomPath}/signals/${remoteUid}/ice_from_${userId}`), candidate.toJSON())
      }
    }

    // Remote stream
    pc.ontrack = ({ streams }) => {
      const [remoteStream] = streams
      setParticipants(prev => {
        const next = new Map(prev)
        const p = next.get(remoteUid)
        if (p) next.set(remoteUid, { ...p, stream: remoteStream })
        return next
      })
    }

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') {
        setConnectionError(`Connection to ${remoteUid} failed`)
      }
    }

    peersRef.current.set(remoteUid, { connection: pc })

    if (initiator) {
      pc.createOffer().then(offer => {
        pc.setLocalDescription(offer)
        set(ref(rtdb, `${roomPath}/signals/${remoteUid}/offer_from_${userId}`), {
          type: offer.type, sdp: offer.sdp,
        })
      })
    }

    return pc
  }, [sessionId, userId, roomPath])

  // ─── Init local media ──────────────────────────────────────────────────────
  const initMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      localStreamRef.current = stream
      setLocalStream(stream)
      return stream
    } catch {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        localStreamRef.current = stream
        setLocalStream(stream)
        setIsVideoEnabled(false)
        return stream
      } catch (err) {
        setConnectionError('Camera/microphone access denied. Please allow access and reload.')
        return null
      }
    }
  }, [])

  // ─── Join room ─────────────────────────────────────────────────────────────
  const joinRoom = useCallback(async () => {
    const stream = await initMedia()
    if (!stream) return

    // Write presence
    await set(myPresRef, {
      uid: userId, displayName, role: isHost ? 'host' : 'participant',
      audioEnabled: true, videoEnabled: true,
      handRaised: false, isScreenSharing: false,
      joinedAt: Date.now(),
    })
    onDisconnect(myPresRef).remove()

    // ─── Listen to all participants ─────────────────────────────────────────
    const participantsRef = ref(rtdb, `${roomPath}/participants`)
    onValue(participantsRef, snapshot => {
      const data = snapshot.val() ?? {}
      const updated = new Map<string, ClassroomParticipant & { stream?: MediaStream }>()
      Object.entries(data).forEach(([uid, info]: [string, any]) => {
        if (uid === userId) return
        const existing = participants.get(uid)
        updated.set(uid, { ...info, stream: existing?.stream })

        // Initiate peer connection if not already connected
        if (!peersRef.current.has(uid)) {
          createPeer(uid, uid < userId, stream) // lower uid initiates
        }
      })
      setParticipants(updated)
    })

    // ─── Listen to signals for ME ───────────────────────────────────────────
    const mySignalsRef = ref(rtdb, `${roomPath}/signals/${userId}`)
    onValue(mySignalsRef, async snapshot => {
      const data = snapshot.val() ?? {}

      for (const [key, value] of Object.entries(data)) {
        // Offer
        if (key.startsWith('offer_from_')) {
          const fromUid = key.replace('offer_from_', '')
          let pc = peersRef.current.get(fromUid)?.connection
          if (!pc) pc = createPeer(fromUid, false, stream)
          const offer = value as RTCSessionDescriptionInit
          if (pc.signalingState === 'stable') {
            await pc.setRemoteDescription(new RTCSessionDescription(offer))
            const answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)
            await set(ref(rtdb, `${roomPath}/signals/${fromUid}/answer_from_${userId}`), {
              type: answer.type, sdp: answer.sdp,
            })
          }
        }

        // Answer
        if (key.startsWith('answer_from_')) {
          const fromUid = key.replace('answer_from_', '')
          const pc = peersRef.current.get(fromUid)?.connection
          if (pc && pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(value as RTCSessionDescriptionInit))
          }
        }

        // ICE candidates
        if (key.startsWith('ice_from_')) {
          const fromUid = key.replace('ice_from_', '')
          const pc = peersRef.current.get(fromUid)?.connection
          if (pc) {
            const candidates = value as Record<string, RTCIceCandidateInit>
            for (const cand of Object.values(candidates)) {
              try { await pc.addIceCandidate(new RTCIceCandidate(cand)) } catch {}
            }
          }
        }
      }
    })

    // ─── Chat ───────────────────────────────────────────────────────────────
    const chatRef = ref(rtdb, `${roomPath}/chat`)
    onValue(chatRef, snapshot => {
      const data = snapshot.val() ?? {}
      const msgs = Object.values(data) as ChatMessage[]
      msgs.sort((a, b) => a.timestamp - b.timestamp)
      setChatMessages(msgs)
    })
  }, [sessionId, userId, displayName, isHost, initMedia, createPeer, roomPath])

  // ─── Controls ──────────────────────────────────────────────────────────────
  const toggleAudio = useCallback(() => {
    const stream = localStreamRef.current
    if (!stream) return
    stream.getAudioTracks().forEach(t => { t.enabled = !t.enabled })
    const enabled = stream.getAudioTracks()[0]?.enabled ?? false
    setIsAudioEnabled(enabled)
    set(ref(rtdb, `${roomPath}/participants/${userId}/audioEnabled`), enabled)
  }, [roomPath, userId])

  const toggleVideo = useCallback(() => {
    const stream = localStreamRef.current
    if (!stream) return
    stream.getVideoTracks().forEach(t => { t.enabled = !t.enabled })
    const enabled = stream.getVideoTracks()[0]?.enabled ?? false
    setIsVideoEnabled(enabled)
    set(ref(rtdb, `${roomPath}/participants/${userId}/videoEnabled`), enabled)
  }, [roomPath, userId])

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      // Stop screen share, restore camera
      screenStreamRef.current?.getTracks().forEach(t => t.stop())
      const camStream = localStreamRef.current
      if (camStream) {
        peersRef.current.forEach(({ connection }) => {
          const sender = connection.getSenders().find(s => s.track?.kind === 'video')
          const camTrack = camStream.getVideoTracks()[0]
          if (sender && camTrack) sender.replaceTrack(camTrack)
        })
      }
      setIsScreenSharing(false)
      set(ref(rtdb, `${roomPath}/participants/${userId}/isScreenSharing`), false)
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
        screenStreamRef.current = screenStream
        const screenTrack = screenStream.getVideoTracks()[0]
        peersRef.current.forEach(({ connection }) => {
          const sender = connection.getSenders().find(s => s.track?.kind === 'video')
          if (sender && screenTrack) sender.replaceTrack(screenTrack)
        })
        screenTrack.onended = () => toggleScreenShare()
        setIsScreenSharing(true)
        set(ref(rtdb, `${roomPath}/participants/${userId}/isScreenSharing`), true)
      } catch {}
    }
  }, [isScreenSharing, roomPath, userId])

  const raiseHand = useCallback(() => {
    const next = !isHandRaised
    setIsHandRaised(next)
    set(ref(rtdb, `${roomPath}/participants/${userId}/handRaised`), next)
  }, [isHandRaised, roomPath, userId])

  const sendMessage = useCallback(async (content: string) => {
    const msg: ChatMessage = {
      id:         Date.now().toString(),
      roomId:     sessionId,
      senderId:   userId,
      senderName: displayName,
      content,
      type:       'text',
      timestamp:  Date.now(),
    }
    await push(ref(rtdb, `${roomPath}/chat`), msg)
  }, [sessionId, userId, displayName, roomPath])

  const leaveRoom = useCallback(async () => {
    // Stop all media
    localStreamRef.current?.getTracks().forEach(t => t.stop())
    screenStreamRef.current?.getTracks().forEach(t => t.stop())
    // Close all peer connections
    peersRef.current.forEach(({ connection }) => connection.close())
    peersRef.current.clear()
    // Remove presence
    await remove(myPresRef)
    // Detach Firebase listeners
    off(ref(rtdb, `${roomPath}/participants`))
    off(ref(rtdb, `${roomPath}/signals/${userId}`))
    off(ref(rtdb, `${roomPath}/chat`))
  }, [roomPath, userId, myPresRef])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      localStreamRef.current?.getTracks().forEach(t => t.stop())
      peersRef.current.forEach(({ connection }) => connection.close())
    }
  }, [])

  return {
    localStream, participants, chatMessages,
    isAudioEnabled, isVideoEnabled, isScreenSharing, isHandRaised,
    connectionError,
    joinRoom, leaveRoom,
    toggleAudio, toggleVideo, toggleScreenShare, raiseHand, sendMessage,
  }
}
