/**
 * Privacy / fingerprint resistance scoring.
 * Higher score = more resistance / harder to fingerprint (not "more tracked").
 */

import type {
  AudioContextFingerprintingStatus,
  CanvasFingerprintingStatus,
  PrivacyProfile
} from '@/types'

export function scorePrivacyResistance(input: {
  canvas: CanvasFingerprintingStatus
  audio: AudioContextFingerprintingStatus
  adBlocker: boolean | null
  fontCount: number | null
  dnt: string | null
  cookiesEnabled: boolean | null
}): { score: number | null; profile: PrivacyProfile } {
  const { canvas, audio, adBlocker, fontCount, dnt, cookiesEnabled } = input

  // Not enough signals yet
  if (canvas == null && audio == null && adBlocker == null && fontCount == null) {
    return { score: null, profile: 'Unknown' }
  }

  let score = 40 // baseline mid-low for a normal browser with APIs present

  if (canvas === 'Spoofed') {
    score += 30
  } else if (canvas === 'Supported') {
    score -= 15
  } else if (canvas === 'Not Supported') {
    score += 10
  }

  if (audio === 'Blocked') {
    score += 20
  } else if (audio === 'Allowed') {
    score -= 10
  } else if (audio === 'Not Supported') {
    score += 5
  }

  if (adBlocker === true) {
    score += 10
  } else if (adBlocker === false) {
    score -= 5
  }

  // Very few fonts often means privacy browser or minimal install; huge sets increase entropy
  if (fontCount != null) {
    if (fontCount <= 5) {
      score += 10
    } else if (fontCount <= 15) {
      score += 0
    } else if (fontCount <= 30) {
      score -= 5
    } else {
      score -= 10
    }
  }

  if (dnt === '1') {
    score += 5
  }

  if (cookiesEnabled === false) {
    score += 10
  }

  const clamped = Math.max(0, Math.min(100, Math.round(score)))
  let profile: PrivacyProfile = 'High'
  if (clamped < 35) {
    profile = 'Low'
  } else if (clamped < 65) {
    profile = 'Medium'
  }

  return { score: clamped, profile }
}
