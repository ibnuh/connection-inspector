// IP and Network types
export type IpProvider = 'ipquery' | 'ipapi'
export interface AbuseContact {
  name?: string
  address?: string
  email?: string
  phone?: string
}

export interface DatacenterInfo {
  datacenter?: string
  network?: string
  country?: string
  region?: string
  city?: string
}

export interface CompanyInfo {
  name?: string
  abuser_score?: unknown
  domain?: string
  type?: string
  network?: string
  whois?: string
}

export interface AsnInfo {
  asn?: number
  abuser_score?: unknown
  route?: string
  descr?: string
  country?: string
  active?: boolean
  org?: string
  domain?: string
  abuse?: string
  type?: string
  created?: string
  updated?: string
  rir?: string
  whois?: string
}

export interface LocationInfo {
  is_eu_member?: boolean
  calling_code?: string
  currency_code?: string
  continent?: string
  country?: string
  country_code?: string
  state?: string
  city?: string
  latitude?: number
  longitude?: number
  zip?: string
  timezone?: string
  local_time?: string
  local_time_unix?: number
  is_dst?: boolean
}

export interface IpApiResponse {
  ip?: string
  /** Which provider answered this payload. Absent on pre-migration snapshots. */
  provider?: IpProvider
  /** Provider risk score 0-100 (ipquery.io). Adds weight in scoreIpRisk. */
  risk_score?: number
  rir?: string
  is_bogon?: boolean
  is_mobile?: boolean
  is_satellite?: boolean
  is_crawler?: boolean
  is_datacenter?: boolean
  is_tor?: boolean
  is_proxy?: boolean
  is_vpn?: boolean
  is_abuser?: boolean
  datacenter?: DatacenterInfo
  company?: CompanyInfo
  abuse?: AbuseContact
  asn?: AsnInfo
  location?: LocationInfo
  elapsed_ms?: number
  client_rtt_ms?: number
}

// Browser and Device types
export interface BrowserInfo {
  userAgent: string | null
  platform: string | null
  languages: string[]
  online: boolean | null
  doNotTrack: string | null
  cookiesEnabled: boolean | null
  timezone: string | null
  browserName: string | null
  browserVersion: string | null
  browserEngine: string | null
  trueBrowserCore: string | null
}

export interface DeviceInfo {
  type: string | null
  model: string | null
  osName: string | null
  osVersion: string | null
  trueOsCore: string | null
}

export interface ScreenInfo {
  width: number | null
  height: number | null
  devicePixelRatio: number | null
  colorDepth: number | null
  hardwareConcurrency: number | null
  maxTouchPoints: number | null
  orientation: string | null
  aspectRatio: string | null
}

export interface WindowInfo {
  outerWidth: number | null
  outerHeight: number | null
  innerWidth: number | null
  innerHeight: number | null
  isFullscreen: boolean | null
}

// Connection types (Network Information API)
export interface ConnectionInfo {
  /**
   * Physical/logical transport: wifi, ethernet, cellular, etc.
   * From navigator.connection.type when available.
   */
  type: string | null
  /**
   * Performance class: slow-2g | 2g | 3g | 4g.
   * This is NOT the radio technology; browsers often report "4g" on fast Wi‑Fi.
   */
  effectiveType: string | null
  downlink: number | null
  rtt: number | null
  saveData: boolean | null
}

// Storage types
export interface StorageInfo {
  localStorageEnabled: boolean | null
  sessionStorageEnabled: boolean | null
  quota: number | null
  usage: number | null
}

// Feature support types
export interface FeatureSupport {
  serviceWorker: boolean | null
  notifications: boolean | null
  clipboard: boolean | null
  geolocation: boolean | null
  webRTC: boolean | null
  webGL: boolean | null
  webGLVersion: string | null
  webGL2Version: string | null
  webGPU: boolean | null
  indexedDB: boolean | null
  websocket: boolean | null
  speechSynthesis: boolean | null
}

// Permissions types
export type PermissionState = 'granted' | 'denied' | 'prompt' | 'unavailable' | null

export interface PermissionsInfo {
  geolocation: PermissionState
  notifications: PermissionState
  camera: PermissionState
  microphone: PermissionState
  clipboardRead: PermissionState
}

// Media types
export interface MediaDevice {
  label: string
  deviceId: string
}

export interface MediaInfo {
  speakers: MediaDevice[]
  microphones: MediaDevice[]
  cameras: MediaDevice[]
}

// Battery types
export interface BatteryInfo {
  level: number | null
  charging: boolean | null
  chargingTime: number | null
  dischargingTime: number | null
}

// Bluetooth types
export interface BluetoothInfo {
  supported: boolean | null
  available: boolean | null
}

// Device orientation types
export interface DeviceOrientationData {
  alpha: number | null
  beta: number | null
  gamma: number | null
}

export interface DeviceMotionData {
  acceleration: { x: number | null; y: number | null; z: number | null }
  accelerationIncludingGravity: { x: number | null; y: number | null; z: number | null }
  rotationRate: { alpha: number | null; beta: number | null; gamma: number | null }
}

// Fingerprinting types
export type CanvasFingerprintingStatus = 'Supported' | 'Spoofed' | 'Not Supported' | null
export type AudioContextFingerprintingStatus = 'Allowed' | 'Blocked' | 'Not Supported' | null
export type FingerprintingStatus = CanvasFingerprintingStatus | AudioContextFingerprintingStatus

export interface FingerprintingInfo {
  canvas: CanvasFingerprintingStatus
  audioContext: AudioContextFingerprintingStatus
  resistance: boolean | null
}

// GPU types
export interface GpuInfo {
  renderer: string | null
  vendor: string | null
}

// HTTP Headers types
export type HttpHeaders = Record<string, string>

// Plugin types
export interface PluginInfo {
  name: string
  description: string
  filename: string
}

export interface MimeTypeInfo {
  type: string
  description: string
  suffixes: string
}

// Speech synthesis types
export interface SpeechVoice {
  name: string
  lang: string
  default: boolean
}

// Performance types
export interface PerformanceTiming {
  pageLoadTime: number | null
  networkTime: number | null
  dnsLookupTime: number | null
  tcpConnectionTime: number | null
  serverResponseTime: number | null
  pageDownloadTime: number | null
  browserTime: number | null
}

// TLS types
export interface TlsInfo {
  version: string | null
  cipher: string | null
}

// Page visibility types
export interface PageVisibilityInfo {
  initiallyVisible: boolean | null
  lastVisible: Date | null
  lastHidden: Date | null
}

// Input types
export interface InputInfo {
  hasMouse: boolean | null
  hasTouchscreen: boolean | null
  lastKeyPressed: string | null
  capsLockState: boolean | null
  scrollPosition: { x: number; y: number } | null
  mousePosition: { x: number; y: number } | null
  lastClickPosition: { x: number; y: number } | null
}

// Risk types
export type RiskBand = 'Low' | 'Medium' | 'High' | 'Unknown'

export interface RiskInfo {
  score: number | null
  band: RiskBand
}

// Server view types
export interface ServerViewData {
  ip: string | null
  httpVersion?: string
  headers?: {
    'user-agent'?: string
    'accept-language'?: string
    'x-forwarded-for'?: string | string[]
  }
}

// Privacy types
export type PrivacyProfile = 'Low' | 'Medium' | 'High' | 'Unknown'

// DNS resolver info (assisted leak / resolver listing)
export interface DnsServerInfo {
  ip_address: string
  hostname: string | null
  isp: string
  organization: string
  country: string
  country_code: string
  city: string
  dnssec: boolean
}

// WebRTC leak test types
export interface WebRTCIceCandidate {
  address: string
  port: number
  protocol: 'udp' | 'tcp' | null
  type: 'host' | 'srflx' | 'prflx' | 'relay' | null
}

export interface WebRTCLeakInfo {
  localIps: string[]
  publicIps: string[]
  hasLeak: boolean | null
  hasLocalExposure: boolean | null
  hasPublicMismatch: boolean | null
  candidateCount: number
  egressIp: string | null
}

// WebSocket connectivity types
export interface WebSocketConnectivity {
  supported: boolean | null
  canConnect: boolean | null
  latency: number | null
  error: string | null
}

// IPv6 connectivity types
export interface IPv6Connectivity {
  supported: boolean | null
  canConnect: boolean | null
  testUrl: string
}

// Device memory types
export interface DeviceMemoryInfo {
  deviceMemory: number | null // in GB
  totalJSHeapSize: number | null
  usedJSHeapSize: number | null
}

// VR/WebXR types
export interface VRInfo {
  vrSupported: boolean | null
  arSupported: boolean | null
  immersiveVRSupported: boolean | null
  inlineVRSupported: boolean | null
  handTrackingSupported: boolean | null
}

// Gamepad types
export interface GamepadInfo {
  connected: boolean | null
  count: number | null
  gamepads: Array<{
    id: string
    index: number
    connected: boolean
    mapping: string
    buttons: number
    axes: number
  }> | null
}

// Wake Lock types
export interface WakeLockInfo {
  supported: boolean | null
  isActive: boolean | null
  type: 'screen' | null
}

// Contact Picker types
export interface ContactPickerInfo {
  supported: boolean | null
  properties: string[] | null
}

// File System Access types
export interface FileSystemAccessInfo {
  supported: boolean | null
  showOpenFilePicker: boolean | null
  showSaveFilePicker: boolean | null
  showDirectoryPicker: boolean | null
}

// Picture-in-Picture types
export interface PictureInPictureInfo {
  supported: boolean | null
  autoPictureInPicture: boolean | null
  documentPictureInPicture: boolean | null
  videoPictureInPicture: boolean | null
}

// Payment Request types
export interface PaymentRequestInfo {
  supported: boolean | null
  canMakePayment: boolean | null
  paymentMethods: string[]
}

// Credential Management types
export interface CredentialManagementInfo {
  supported: boolean | null
  passwordCredential: boolean | null
  federatedCredential: boolean | null
  publicKeyCredential: boolean | null // WebAuthn
  conditionalMediation: boolean | null
}

// Extended screen types
export interface ExtendedScreenInfo {
  colorGamut: 'srgb' | 'p3' | 'rec2020' | null
  colorDepth: number | null
  pixelDepth: number | null
}

// User preference types
export interface UserPreferences {
  colorScheme: 'light' | 'dark' | 'no-preference' | null
  reducedMotion: boolean | null
  prefersContrast: 'more' | 'less' | 'no-preference' | 'custom' | null
  reducedTransparency: boolean | null
  prefersReducedData: boolean | null
}

// Share API types
export interface ShareApiInfo {
  supported: boolean | null
  canShare: boolean | null
  shareDataTypes: string[]
}

// Complete snapshot type
export interface ConnectionSnapshot {
  ip: IpApiResponse | null
  browser: BrowserInfo
  device: DeviceInfo
  screen: ScreenInfo
  window: WindowInfo
  connection: ConnectionInfo
  storage: StorageInfo
  features: FeatureSupport
  fingerprinting: FingerprintingInfo
  permissions: PermissionsInfo
  media: MediaInfo
  battery: BatteryInfo
  bluetooth: BluetoothInfo
  input: InputInfo
  risk: RiskInfo
  performance: PerformanceTiming | null
  // New extended types
  webRTCLeak: WebRTCLeakInfo | null
  webSocketConnectivity: WebSocketConnectivity
  ipv6Connectivity: IPv6Connectivity
  deviceMemory: DeviceMemoryInfo
  vrInfo: VRInfo
  gamepadInfo: GamepadInfo
  wakeLock: WakeLockInfo
  contactPicker: ContactPickerInfo
  fileSystemAccess: FileSystemAccessInfo
  pictureInPicture: PictureInPictureInfo
  paymentRequest: PaymentRequestInfo
  credentialManagement: CredentialManagementInfo
  extendedScreen: ExtendedScreenInfo
  userPreferences: UserPreferences
  shareApi: ShareApiInfo
  tls: TlsInfo
  pageVisibility: PageVisibilityInfo
  meta: {
    generatedAt: string
  }
}
