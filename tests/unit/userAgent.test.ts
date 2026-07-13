import { describe, expect, it } from 'vitest'
import {
  parseBrowserFromUa,
  parseOsFromUa,
  parseDeviceFromUa,
  parseUserAgent,
  mapWindowsNtVersion,
  mapWindowsPlatformVersion,
  mergeWithClientHints
} from '@/utils/userAgent'

describe('parseBrowserFromUa', () => {
  it('detects Edge before Chrome', () => {
    const ua =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'
    const b = parseBrowserFromUa(ua)
    expect(b.name).toBe('Edge')
    expect(b.engineFamily).toBe('Chromium')
    expect(b.version).toMatch(/^120/)
  })

  it('detects Firefox', () => {
    const b = parseBrowserFromUa(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0'
    )
    expect(b.name).toBe('Firefox')
    expect(b.engineFamily).toBe('Gecko')
  })

  it('detects Safari without matching Chrome', () => {
    const b = parseBrowserFromUa(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15'
    )
    expect(b.name).toBe('Safari')
    expect(b.engineFamily).toBe('WebKit')
    expect(b.version).toMatch(/^17/)
  })

  it('detects Opera', () => {
    const b = parseBrowserFromUa(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0'
    )
    expect(b.name).toBe('Opera')
  })
})

describe('parseOsFromUa', () => {
  it('maps Windows NT versions', () => {
    expect(mapWindowsNtVersion('10.0')).toBe('10 / 11')
    expect(mapWindowsNtVersion('6.1')).toBe('7')
  })

  it('maps Client Hints Windows platformVersion', () => {
    expect(mapWindowsPlatformVersion('15.0.0')).toBe('11')
    expect(mapWindowsPlatformVersion('10.0.0')).toBe('10')
  })

  it('detects Android', () => {
    const os = parseOsFromUa(
      'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36'
    )
    expect(os.name).toBe('Android')
    expect(os.version).toBe('14')
  })

  it('detects iOS', () => {
    const os = parseOsFromUa(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 Version/17.2 Mobile/15E148 Safari/604.1'
    )
    expect(os.name).toBe('iOS')
    expect(os.version).toBe('17.2')
  })
})

describe('parseDeviceFromUa', () => {
  it('classifies iPhone as mobile', () => {
    const d = parseDeviceFromUa(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148'
    )
    expect(d.type).toBe('Mobile')
    expect(d.model).toBe('iPhone')
  })

  it('classifies iPad via touch Macintosh as tablet', () => {
    const d = parseDeviceFromUa(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.2 Safari/605.1.15',
      { maxTouchPoints: 5, platform: 'MacIntel' }
    )
    expect(d.type).toBe('Tablet')
  })

  it('does not call every mid-width screen a tablet', () => {
    const d = parseDeviceFromUa(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
      { maxTouchPoints: 0, screenWidth: 800 }
    )
    expect(d.type).toBe('Desktop')
  })
})

describe('mergeWithClientHints', () => {
  it('prefers Client Hints brand and Windows 11 platformVersion', () => {
    const base = parseUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
    )
    const merged = mergeWithClientHints(base, {
      fullVersionList: [
        { brand: 'Not_A Brand', version: '8' },
        { brand: 'Chromium', version: '120' },
        { brand: 'Google Chrome', version: '120.0.6099.109' }
      ],
      platform: 'Windows',
      platformVersion: '15.0.0',
      mobile: false
    })
    expect(merged.browser.name).toBe('Chrome')
    expect(merged.browser.version).toBe('120.0.6099.109')
    expect(merged.os.name).toBe('Windows')
    expect(merged.os.version).toBe('11')
  })
})
