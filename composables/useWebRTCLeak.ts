import { ref, computed } from 'vue'
import type { WebRTCLeakInfo, WebRTCIceCandidate } from '@/types'

/**
 * Composable for detecting WebRTC IP leaks.
 * Creates a peer connection and gathers ICE candidates to find real IPs.
 */
export function useWebRTCLeak() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const candidates = ref<WebRTCIceCandidate[]>([])
  
  const leakInfo = computed<WebRTCLeakInfo>(() => {
    const localIps: string[] = []
    const publicIps: string[] = []
    
    candidates.value.forEach(candidate => {
      if (candidate.address) {
        // Check if IP is private/local
        const isPrivate = isPrivateIP(candidate.address)
        if (isPrivate) {
          if (!localIps.includes(candidate.address)) {
            localIps.push(candidate.address)
          }
        } else {
          if (!publicIps.includes(candidate.address)) {
            publicIps.push(candidate.address)
          }
        }
      }
    })
    
    // Has leak if we found public IPs different from the main IP
    // or if we found any local network IPs
    const hasLeak = localIps.length > 0 || publicIps.length > 0
    
    return {
      localIps,
      publicIps,
      hasLeak,
      candidateCount: candidates.value.length
    }
  })
  
  /**
   * Check if an IP address is private/local
   */
  function isPrivateIP(ip: string): boolean {
    // IPv4 private ranges
    const privateRanges = [
      /^10\./, // 10.0.0.0/8
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
      /^192\.168\./, // 192.168.0.0/16
      /^127\./, // Loopback
      /^169\.254\./, // Link-local
      /^0\./, // Current network
      /^fc00:/i, // IPv6 unique local
      /^fe80:/i, // IPv6 link-local
    ]
    
    return privateRanges.some(range => range.test(ip))
  }
  
  /**
   * Extract IP address from ICE candidate string
   */
  function extractIPFromCandidate(candidateStr: string): { address: string; port: number; protocol: 'udp' | 'tcp' | null; type: 'host' | 'srflx' | 'prflx' | 'relay' | null } | null {
    // Parse candidate format: candidate:842163049 1 udp 1677729535 192.168.1.100 54321 typ srflx raddr 0.0.0.0 rport 0 generation 0 network-id 1 network-cost 10
    const candidateRegex = /candidate:\S+\s+\d+\s+(udp|tcp)\s+\d+\s+([\d.:a-fA-F]+)\s+(\d+)\s+typ\s+(host|srflx|prflx|relay)/
    const match = candidateStr.match(candidateRegex)
    
    if (match) {
      return {
        address: match[2],
        port: parseInt(match[3], 10),
        protocol: match[1] as 'udp' | 'tcp',
        type: match[4] as 'host' | 'srflx' | 'prflx' | 'relay'
      }
    }
    
    return null
  }
  
  /**
   * Run WebRTC leak test
   */
  async function testWebRTCLeak(): Promise<void> {
    loading.value = true
    error.value = null
    candidates.value = []
    
    try {
      // Check if WebRTC is supported
      if (!window.RTCPeerConnection) {
        error.value = 'WebRTC is not supported in this browser'
        return
      }
      
      // Create peer connection with STUN servers to force public IP discovery
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      })
      
      // Create a data channel to trigger ICE gathering
      const dataChannel = pc.createDataChannel('test')
      
      // Listen for ICE candidates
      const candidatePromise = new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          resolve()
        }, 5000) // 5 second timeout
        
        pc.onicecandidate = (event) => {
          if (event.candidate && event.candidate.candidate) {
            const extracted = extractIPFromCandidate(event.candidate.candidate)
            if (extracted) {
              candidates.value.push(extracted)
            }
          } else {
            // ICE gathering complete
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
      
      // Create offer to start ICE gathering
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      
      // Wait for ICE gathering
      await candidatePromise
      
      // Cleanup
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
    leakInfo,
    testWebRTCLeak,
    isPrivateIP
  }
}
