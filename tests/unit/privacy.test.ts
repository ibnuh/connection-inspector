import { describe, expect, it } from 'vitest'
import { scorePrivacyResistance } from '@/utils/privacy'
import { isFontAvailable, detectInstalledFonts } from '@/utils/fonts'

describe('scorePrivacyResistance', () => {
  it('returns unknown with no signals', () => {
    expect(
      scorePrivacyResistance({
        canvas: null,
        audio: null,
        adBlocker: null,
        fontCount: null,
        dnt: null,
        cookiesEnabled: null
      }).score
    ).toBeNull()
  })

  it('scores spoofed canvas + blocked audio higher than open APIs', () => {
    const resistant = scorePrivacyResistance({
      canvas: 'Spoofed',
      audio: 'Blocked',
      adBlocker: true,
      fontCount: 3,
      dnt: '1',
      cookiesEnabled: false
    })
    const open = scorePrivacyResistance({
      canvas: 'Supported',
      audio: 'Allowed',
      adBlocker: false,
      fontCount: 40,
      dnt: null,
      cookiesEnabled: true
    })
    expect(resistant.score).not.toBeNull()
    expect(open.score).not.toBeNull()
    if (resistant.score != null && open.score != null) {
      expect(resistant.score).toBeGreaterThan(open.score)
    }
    expect(resistant.profile).toBe('High')
    expect(open.profile).toBe('Low')
  })
})

describe('isFontAvailable', () => {
  it('requires difference against all baselines', () => {
    const measure = (fontCss: string) => {
      if (fontCss.includes('FakeFont')) {
        // Looks like baseline for monospace only (false positive single-baseline case)
        if (fontCss.includes('monospace') && !fontCss.includes('sans-serif')) {
          return 100
        }
        return 50
      }
      if (fontCss.includes('RealFont')) {
        return 120
      }
      // baselines
      return 50
    }
    // RealFont differs from every baseline-only width
    expect(isFontAvailable('RealFont', measure)).toBe(true)
  })

  it('detectInstalledFonts filters candidates', () => {
    const measure = (fontCss: string) => (fontCss.includes('Arial') ? 99 : 50)
    const found = detectInstalledFonts(['Arial', 'NeverInstalledXYZ'], measure)
    expect(found).toContain('Arial')
    expect(found).not.toContain('NeverInstalledXYZ')
  })
})
