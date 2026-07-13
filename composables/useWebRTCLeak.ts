import { ref, computed } from 'vue'
import type { WebRTCLeakInfo, WebRTCIceCandidate } from '@/types'
import { isPrivateIP, evaluateWebRTCExposure, isValidIP, normalizeIp } from '@/utils/ip'

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
      if (!candidate.address || !isValidIP(candidate.address.split('%')[0])) {
        continue
      }
      const addr = candidate.address
      if (isPrivateIP(addr)) {
        if (!localIps.includes(addr)) {
          localIps.push(addr)
        }
      } else {
        const n = normalizeIp(addr)
        if (n && !publicIps.some(p => normalizeIp(p) === n)) {
          publicIps.push(addr)
        }
      }
    }

    const evaluation = evaluateWebRTCExposure(localIps, publicIps, egressIp.value)
    const tested = candidates.value.length > 0 || error.value != null

    return {
      localIps,
      publicIps,
      hasLeak: tested ? evaluation.hasLeak : null,
      hasLocalExposure: tested ? evaluation.hasLocalExposure : null,
      hasPublicMismatch: tested ? evaluation.hasPublicMismatch : null,
      candidateCount: candidates.value.length,
      egressIp: egressIp.value
    }
  })

  function setEgressIp(ip: string | null | undefined) {
    egressIp.value = ip ?? null
  }

  function extractIPFromCandidate(candidateStr: string): WebRTCIceCandidate | null {
    // candidate:foundation component protocol priority address port typ type ...
    const candidateRegex =
      /candidate:\S+\s+\d+\s+(udp|tcp)\s+\d+\s+(\S+)\s+(\d+)\s+typ\s+(host|srflx|prflx|relay)/i
    const match = candidateStr.match(candidateRegex)

    if (!match) {
      return null
    }

    let address = match[2]
    // Strip surrounding brackets for IPv6
    if (address.startsWith('[') && address.endsWith(']')) {
      address = address.slice(1, -1)
    }

    // Skip .local mDNS hostnames; they are not IPs
    if (!isValidIP(address.split('%')[0]) && address.includes('.local')) {
      return null
    }
    if (!isValidIP(address.split('%')[0])) {
      return null
    }

    return {
      address,
      port: parseInt(match[3], 10),
      protocol: match[1].toLowerCase() as 'udp' | 'tcp',
      type: match[4].toLowerCase() as 'host' | 'srflx' | 'prflx' | 'relay'
    }
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
      const seen = new Set<string>()

      const candidatePromise = new Promise<void>(resolve => {
        const timeout = setTimeout(() => {
          resolve()
        }, 5000)

        pc.onicecandidate = event => {
          if (event.candidate?.candidate) {
            const extracted = extractIPFromCandidate(event.candidate.candidate)
            if (extracted) {
              const key = `${extracted.address}|${extracted.port}|${extracted.type}`
              if (!seen.has(key)) {
                seen.add(key)
                candidates.value.push(extracted)
              }
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
