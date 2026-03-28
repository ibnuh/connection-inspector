import { describe, it, expect, vi } from 'vitest'
import {
  copyTextToClipboard,
  downloadJson,
  downloadCsv,
  generateMarkdown,
  buildDebugSnippet,
  type ExportFormat
} from '@/utils/exports'
import type { ConnectionSnapshot } from '@/types'

describe('exports utilities', () => {
  describe('copyTextToClipboard', () => {
    it('should be defined', () => {
      expect(copyTextToClipboard).toBeDefined()
      expect(typeof copyTextToClipboard).toBe('function')
    })
  })
  
  describe('generateMarkdown', () => {
    it('should generate markdown with all basic sections', () => {
      const mockSnapshot: ConnectionSnapshot = {
        ip: {
          ip: '192.168.1.1',
          location: {
            city: 'New York',
            country: 'United States',
            country_code: 'US',
            state: 'NY',
            latitude: 40.7128,
            longitude: -74.006
          },
          asn: {
            asn: 12345,
            org: 'Test ISP'
          },
          company: {
            name: 'Test Company'
          }
        },
        browser: {
          browserName: 'Chrome',
          browserVersion: '120.0',
          browserEngine: 'Blink',
          userAgent: 'Mozilla/5.0...',
          platform: 'Win32',
          languages: ['en-US'],
          online: true,
          doNotTrack: null,
          cookiesEnabled: true,
          timezone: 'America/New_York',
          trueBrowserCore: 'Chromium'
        },
        device: {
          type: 'Desktop',
          osName: 'Windows',
          osVersion: '10',
          trueOsCore: 'Windows NT',
          model: null
        },
        screen: {
          width: 1920,
          height: 1080,
          devicePixelRatio: 1,
          colorDepth: 24,
          hardwareConcurrency: 8,
          maxTouchPoints: 0,
          orientation: 'Landscape',
          aspectRatio: '16:9'
        },
        window: {
          outerWidth: 1920,
          outerHeight: 1080,
          innerWidth: 1920,
          innerHeight: 969,
          isFullscreen: false
        },
        connection: {
          type: '4g',
          downlink: 10,
          rtt: 50,
          saveData: false
        },
        storage: {
          localStorageEnabled: true,
          sessionStorageEnabled: true,
          quota: null,
          usage: null
        },
        features: {
          serviceWorker: true,
          notifications: true,
          clipboard: true,
          geolocation: true,
          webRTC: true,
          webGL: true,
          webGLVersion: 'Version 1.0',
          webGL2Version: 'Version 2.0',
          webGPU: false,
          indexedDB: true,
          websocket: true,
          speechSynthesis: true
        },
        fingerprinting: {
          canvas: 'Supported',
          audioContext: 'Allowed',
          resistance: false
        },
        permissions: {
          geolocation: 'prompt',
          notifications: 'prompt',
          camera: 'prompt',
          microphone: 'prompt',
          clipboardRead: 'prompt'
        },
        media: {
          speakers: [],
          microphones: [],
          cameras: []
        },
        battery: {
          level: null,
          charging: null,
          chargingTime: null,
          dischargingTime: null
        },
        bluetooth: {
          supported: true,
          available: true
        },
        input: {
          hasMouse: true,
          hasTouchscreen: false,
          lastKeyPressed: null,
          capsLockState: false,
          scrollPosition: { x: 0, y: 0 },
          mousePosition: { x: 0, y: 0 },
          lastClickPosition: null
        },
        risk: {
          score: 5,
          band: 'Low'
        },
        performance: {
          pageLoadTime: 1.5,
          networkTime: 1.2,
          dnsLookupTime: 0.1,
          tcpConnectionTime: 0.2,
          serverResponseTime: 0.3,
          pageDownloadTime: 0.4,
          browserTime: 0.3
        },
        // NEW fields
        webRTCLeak: null,
        webSocketConnectivity: {
          supported: true,
          canConnect: true,
          latency: null,
          error: null
        },
        ipv6Connectivity: {
          supported: true,
          canConnect: true,
          testUrl: 'https://ipv6.google.com'
        },
        deviceMemory: {
          deviceMemory: 8,
          totalJSHeapSize: null,
          usedJSHeapSize: null
        },
        vrInfo: {
          vrSupported: false,
          arSupported: false,
          immersiveVRSupported: false,
          inlineVRSupported: false,
          handTrackingSupported: false
        },
        gamepadInfo: {
          connected: false,
          count: 0,
          gamepads: []
        },
        wakeLock: {
          supported: true,
          isActive: false,
          type: null
        },
        contactPicker: {
          supported: false,
          properties: []
        },
        fileSystemAccess: {
          supported: true,
          showOpenFilePicker: true,
          showSaveFilePicker: true,
          showDirectoryPicker: true
        },
        pictureInPicture: {
          supported: true,
          autoPictureInPicture: false,
          documentPictureInPicture: false,
          videoPictureInPicture: true
        },
        paymentRequest: {
          supported: true,
          canMakePayment: false,
          paymentMethods: []
        },
        credentialManagement: {
          supported: true,
          passwordCredential: false,
          federatedCredential: false,
          publicKeyCredential: true,
          conditionalMediation: false
        },
        extendedScreen: {
          colorGamut: 'srgb',
          colorDepth: 24,
          pixelDepth: 24
        },
        userPreferences: {
          colorScheme: 'light',
          reducedMotion: false,
          prefersContrast: 'no-preference',
          reducedTransparency: false,
          prefersReducedData: false
        },
        shareApi: {
          supported: true,
          canShare: true,
          shareDataTypes: ['text/plain', 'text/url']
        },
        meta: {
          generatedAt: '2024-01-01T00:00:00.000Z'
        }
      }
      
      const markdown = generateMarkdown(mockSnapshot)
      
      expect(markdown).toContain('# Connection Inspector Report')
      expect(markdown).toContain('## Network & IP')
      expect(markdown).toContain('## Browser')
      expect(markdown).toContain('## Device')
      expect(markdown).toContain('**IP Address:** 192.168.1.1')
      expect(markdown).toContain('**Name:** Chrome')
      expect(markdown).toContain('**OS:** Windows 10')
    })
    
    it('should handle null values gracefully', () => {
      const mockSnapshot: ConnectionSnapshot = {
        ip: null,
        browser: {
          browserName: null,
          browserVersion: null,
          browserEngine: null,
          userAgent: null,
          platform: null,
          languages: [],
          online: null,
          doNotTrack: null,
          cookiesEnabled: null,
          timezone: null,
          trueBrowserCore: null
        },
        device: {
          type: null,
          osName: null,
          osVersion: null,
          trueOsCore: null,
          model: null
        },
        screen: {
          width: null,
          height: null,
          devicePixelRatio: null,
          colorDepth: null,
          hardwareConcurrency: null,
          maxTouchPoints: null,
          orientation: null,
          aspectRatio: null
        },
        window: {
          outerWidth: null,
          outerHeight: null,
          innerWidth: null,
          innerHeight: null,
          isFullscreen: null
        },
        connection: {
          type: null,
          downlink: null,
          rtt: null,
          saveData: null
        },
        storage: {
          localStorageEnabled: null,
          sessionStorageEnabled: null,
          quota: null,
          usage: null
        },
        features: {
          serviceWorker: null,
          notifications: null,
          clipboard: null,
          geolocation: null,
          webRTC: null,
          webGL: null,
          webGLVersion: null,
          webGL2Version: null,
          webGPU: null,
          indexedDB: null,
          websocket: null,
          speechSynthesis: null
        },
        fingerprinting: {
          canvas: null,
          audioContext: null,
          resistance: false
        },
        permissions: {
          geolocation: null,
          notifications: null,
          camera: null,
          microphone: null,
          clipboardRead: null
        },
        media: {
          speakers: [],
          microphones: [],
          cameras: []
        },
        battery: {
          level: null,
          charging: null,
          chargingTime: null,
          dischargingTime: null
        },
        bluetooth: {
          supported: null,
          available: null
        },
        input: {
          hasMouse: null,
          hasTouchscreen: null,
          lastKeyPressed: null,
          capsLockState: null,
          scrollPosition: null,
          mousePosition: null,
          lastClickPosition: null
        },
        risk: {
          score: null,
          band: 'Unknown'
        },
        performance: null,
        webRTCLeak: null,
        webSocketConnectivity: {
          supported: null,
          canConnect: null,
          latency: null,
          error: null
        },
        ipv6Connectivity: {
          supported: null,
          canConnect: null,
          testUrl: 'https://ipv6.google.com'
        },
        deviceMemory: {
          deviceMemory: null,
          totalJSHeapSize: null,
          usedJSHeapSize: null
        },
        vrInfo: {
          vrSupported: null,
          arSupported: null,
          immersiveVRSupported: null,
          inlineVRSupported: null,
          handTrackingSupported: null
        },
        gamepadInfo: {
          connected: null,
          count: null,
          gamepads: []
        },
        wakeLock: {
          supported: null,
          isActive: false,
          type: null
        },
        contactPicker: {
          supported: null,
          properties: []
        },
        fileSystemAccess: {
          supported: null,
          showOpenFilePicker: null,
          showSaveFilePicker: null,
          showDirectoryPicker: null
        },
        pictureInPicture: {
          supported: null,
          autoPictureInPicture: false,
          documentPictureInPicture: null,
          videoPictureInPicture: null
        },
        paymentRequest: {
          supported: null,
          canMakePayment: false,
          paymentMethods: []
        },
        credentialManagement: {
          supported: null,
          passwordCredential: null,
          federatedCredential: false,
          publicKeyCredential: null,
          conditionalMediation: false
        },
        extendedScreen: {
          colorGamut: null,
          colorDepth: null,
          pixelDepth: null
        },
        userPreferences: {
          colorScheme: null,
          reducedMotion: null,
          prefersContrast: null,
          reducedTransparency: null,
          prefersReducedData: null
        },
        shareApi: {
          supported: null,
          canShare: null,
          shareDataTypes: []
        },
        meta: {
          generatedAt: '2024-01-01T00:00:00.000Z'
        }
      }
      
      const markdown = generateMarkdown(mockSnapshot)
      
      expect(markdown).toContain('Unknown')
    })
  })
  
  describe('buildDebugSnippet', () => {
    it('should build debug snippet with IP info', () => {
      const mockSnapshot: ConnectionSnapshot = {
        ip: {
          ip: '1.2.3.4',
          location: {
            city: 'Test City',
            country: 'Test Country',
            country_code: 'TC',
            state: 'Test State',
            latitude: 0,
            longitude: 0
          },
          asn: {
            asn: 123,
            org: 'Test ISP'
          },
          company: {
            name: 'Test Org'
          },
          is_tor: false,
          is_vpn: true,
          is_proxy: false,
          is_datacenter: false,
          is_bogon: false
        },
        browser: {
          userAgent: 'Test Browser/1.0',
          platform: 'Test Platform',
          languages: ['en'],
          online: true,
          doNotTrack: null,
          cookiesEnabled: true,
          timezone: 'UTC',
          browserName: 'Test',
          browserVersion: '1.0',
          browserEngine: 'Test',
          trueBrowserCore: 'Test'
        },
        device: {
          type: 'Desktop',
          osName: 'Test OS',
          osVersion: '1.0',
          trueOsCore: 'Test',
          model: null
        },
        screen: {
          width: 1920,
          height: 1080,
          devicePixelRatio: 1,
          colorDepth: 24,
          hardwareConcurrency: 4,
          maxTouchPoints: 0,
          orientation: 'Landscape',
          aspectRatio: '16:9'
        },
        window: {
          outerWidth: 1920,
          outerHeight: 1080,
          innerWidth: 1920,
          innerHeight: 1080,
          isFullscreen: false
        },
        connection: {
          type: null,
          downlink: null,
          rtt: null,
          saveData: null
        },
        storage: {
          localStorageEnabled: true,
          sessionStorageEnabled: true,
          quota: null,
          usage: null
        },
        features: {
          serviceWorker: true,
          notifications: true,
          clipboard: true,
          geolocation: true,
          webRTC: true,
          webGL: true,
          webGLVersion: null,
          webGL2Version: null,
          webGPU: false,
          indexedDB: true,
          websocket: true,
          speechSynthesis: true
        },
        fingerprinting: {
          canvas: 'Supported',
          audioContext: 'Allowed',
          resistance: false
        },
        permissions: {
          geolocation: 'prompt',
          notifications: 'prompt',
          camera: 'prompt',
          microphone: 'prompt',
          clipboardRead: 'prompt'
        },
        media: {
          speakers: [],
          microphones: [],
          cameras: []
        },
        battery: {
          level: null,
          charging: null,
          chargingTime: null,
          dischargingTime: null
        },
        bluetooth: {
          supported: true,
          available: true
        },
        input: {
          hasMouse: true,
          hasTouchscreen: false,
          lastKeyPressed: null,
          capsLockState: false,
          scrollPosition: { x: 0, y: 0 },
          mousePosition: { x: 0, y: 0 },
          lastClickPosition: null
        },
        risk: {
          score: 15,
          band: 'Low'
        },
        performance: null,
        webRTCLeak: null,
        webSocketConnectivity: {
          supported: true,
          canConnect: true,
          latency: null,
          error: null
        },
        ipv6Connectivity: {
          supported: true,
          canConnect: true,
          testUrl: 'https://ipv6.google.com'
        },
        deviceMemory: {
          deviceMemory: 8,
          totalJSHeapSize: null,
          usedJSHeapSize: null
        },
        vrInfo: {
          vrSupported: false,
          arSupported: false,
          immersiveVRSupported: false,
          inlineVRSupported: false,
          handTrackingSupported: false
        },
        gamepadInfo: {
          connected: false,
          count: 0,
          gamepads: []
        },
        wakeLock: {
          supported: true,
          isActive: false,
          type: null
        },
        contactPicker: {
          supported: false,
          properties: []
        },
        fileSystemAccess: {
          supported: true,
          showOpenFilePicker: true,
          showSaveFilePicker: true,
          showDirectoryPicker: true
        },
        pictureInPicture: {
          supported: true,
          autoPictureInPicture: false,
          documentPictureInPicture: false,
          videoPictureInPicture: true
        },
        paymentRequest: {
          supported: true,
          canMakePayment: false,
          paymentMethods: []
        },
        credentialManagement: {
          supported: true,
          passwordCredential: false,
          federatedCredential: false,
          publicKeyCredential: true,
          conditionalMediation: false
        },
        extendedScreen: {
          colorGamut: 'srgb',
          colorDepth: 24,
          pixelDepth: 24
        },
        userPreferences: {
          colorScheme: 'light',
          reducedMotion: false,
          prefersContrast: 'no-preference',
          reducedTransparency: false,
          prefersReducedData: false
        },
        shareApi: {
          supported: true,
          canShare: true,
          shareDataTypes: ['text/plain', 'text/url']
        },
        meta: {
          generatedAt: '2024-01-01T00:00:00.000Z'
        }
      }
      
      const snippet = buildDebugSnippet(mockSnapshot)
      
      expect(snippet).toContain('IP: 1.2.3.4')
      expect(snippet).toContain('AS123')
      expect(snippet).toContain('Test ISP')
      expect(snippet).toContain('VPN')
      expect(snippet).toContain('Low')
      expect(snippet).toContain('15/100')
    })
  })
})
