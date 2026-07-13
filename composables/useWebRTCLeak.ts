import { ref, computed } from 'vue'
import type { WebRTCLeakInfo, WebRTCIceCandidate } from '@/types'
import { isPrivateIP, evaluateWebRTCExposure } from '@/utils/ip'

/**
 * Detect WebRTC IP exposure via ICE candidates (STUN).
 * hasLeak is true when LAN IPs are exposed or public ICE IPs differ from egress IP.
 */
export function useWebRTCLeak() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const candidates = ref<WebRTCIceCandidate[]>([])
  const egressIp = ref<string | null>(null)

  const leakInfo = computed<WebRTCLeakInfo>(() => {
    const localIps: string[] = []
    const publicIps: string[] = []

    for (const candidate of candidates.value) {
      if (!candidate.address) {
        continue
      }
      if (isPrivateIP(candidate.address)) {
        if (!localIps.includes(candidate.address)) {
          localIps.push(candidate.address)
        }
      } else if (!publicIps.includes(candidate.address)) {
        publicIps.push(candidate.address)
      }
    }

    const evaluation = evaluateWebRTCExposure(localIps, publicIps, egressIp.value)

    return {
      localIps,
      publicIps,
      hasLeak: candidates.value.length === 0 ? null : evaluation.hasLeak,
      hasLocalExposure: candidates.value.length === 0 ? null : evaluation.hasLocalExposure,
      hasPublicMismatch: candidates.value.length === 0 ? null : evaluation.hasPublicMismatch,
      candidateCount: candidates.value.length,
      egressIp: egressIp.value
    }
  })

  function setEgressIp(ip: string | null | undefined) {
    egressIp.value = ip ?? null
  }

  function extractIPFromCandidate(candidateStr: string): {
    address: string
    port: number
    protocol: 'udp' | 'tcp' | null
    type: 'host' | 'srflx' | 'prflx' | 'relay' | null
  } | null {
    const candidateRegex =
      /candidate:\S+\s+\d+\s+(udp|tcp)\s+\d+\s+([\d.:a-fA-F]+)\s+(\d+)\s+typ\s+(host|srflx|prflx|relay)/i
    const match = candidateStr.match(candidateRegex)

    if (match) {
      return {
        address: match[2],
        port: parseInt(match[3], 10),
        protocol: match[1].toLowerCase() as 'udp' | 'tcp',
        type: match[4].toLowerCase() as 'host' | 'srflx' | 'prflx' | 'relay'
      }
    }

    return null
  }

  async function testWebRTCLeak(currentEgressIp?: string | null): Promise<void> {
    if (currentEgressIp !== undefined) {
      setEgressIp(currentEgressIp)
    }

    loading.value = true
    error.value = null
    candidates.value = []

    try {
      if (!window.RTCPeerConnection) {
        error.value = 'WebRTC is not supported in this browser'
        return
      }

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      })

      const dataChannel = pc.createDataChannel('test')

      const candidatePromise = new Promise<void>(resolve => {
        const timeout = setTimeout(() => {
          resolve()
        }, 5000)

        pc.onicecandidate = event => {
          if (event.candidate && event.candidate.candidate) {
            const extracted = extractIPFromCandidate(event.candidate.candidate)
            if (extracted) {
              candidates.value.push(extracted)
            }
          } else {
            clearTimeout(timeout)
            resolve()
          }
        }

        pc.onicegatheringstatechange = () => {
          if (pc.iceGatheringState === 'complete') {
            clearTimeout(timeout)
            resolve()
          }
        }
      })

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      await candidatePromise

      pc.close()
      dataChannel.close()
    } catch (err) {
      error.value = (err as Error).message || 'WebRTC leak test failed'
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    candidates,
    egressIp,
    leakInfo,
    setEgressIp,
    testWebRTCLeak,
    isPrivateIP
  }
}
