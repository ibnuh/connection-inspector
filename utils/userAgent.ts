/**
 * Pure browser / OS / device parsing from User-Agent and optional Client Hints.
 * Prefer Client Hints when available; UA string is a best-effort fallback.
 */

export interface ParsedBrowser {
  name: string | null
  version: string | null
  engine: string | null
  engineFamily: string | null
}

export interface ParsedOS {
  name: string | null
  version: string | null
  family: string | null
}

export interface ParsedDevice {
  type: 'Mobile' | 'Tablet' | 'Desktop' | 'Unknown'
  model: string | null
  vendor: string | null
}

export interface ClientHintsInput {
  brands?: { brand: string; version: string }[]
  fullVersionList?: { brand: string; version: string }[]
  mobile?: boolean
  platform?: string
  platformVersion?: string
  model?: string
  architecture?: string
  bitness?: string
  uaFullVersion?: string
}

const IGNORED_BRANDS = new Set(['Not A;Brand', 'Not;A=Brand', 'Not_A Brand', 'Chromium'])

function pickBrand(
  list: { brand: string; version: string }[] | undefined
): { brand: string; version: string } | null {
  if (!list?.length) {
    return null
  }
  const meaningful = list.filter(
    b => !IGNORED_BRANDS.has(b.brand) && !/not.?a.?brand/i.test(b.brand)
  )
  if (meaningful.length) {
    // Prefer well-known product brands
    const preferred = [
      'Google Chrome',
      'Microsoft Edge',
      'Opera',
      'Brave',
      'Samsung Internet',
      'Firefox'
    ]
    for (const name of preferred) {
      const hit = meaningful.find(b => b.brand === name || b.brand.includes(name))
      if (hit) {
        return hit
      }
    }
    return meaningful[0]
  }
  // Fall back to Chromium version if that is all we have
  return list.find(b => b.brand === 'Chromium') ?? list[0] ?? null
}

/** Map Windows NT version to a user-facing label when platformVersion is absent. */
export function mapWindowsNtVersion(nt: string | null): string | null {
  if (!nt) {
    return null
  }
  const map: Record<string, string> = {
    '10.0': '10 / 11',
    '6.3': '8.1',
    '6.2': '8',
    '6.1': '7',
    '6.0': 'Vista',
    '5.1': 'XP',
    '5.0': '2000'
  }
  return map[nt] ?? nt
}

/**
 * Convert Client Hints platformVersion (e.g. "15.0.0") to Windows major when possible.
 * Windows 11 reports platformVersion starting at 13+ in many Chromium builds.
 */
export function mapWindowsPlatformVersion(
  platformVersion: string | null | undefined
): string | null {
  if (!platformVersion) {
    return null
  }
  const major = Number.parseInt(platformVersion.split('.')[0] ?? '', 10)
  if (!Number.isFinite(major)) {
    return platformVersion
  }
  if (major >= 13) {
    return '11'
  }
  if (major > 0) {
    return '10'
  }
  return platformVersion
}

export function parseBrowserFromUa(ua: string): ParsedBrowser {
  if (!ua) {
    return { name: null, version: null, engine: null, engineFamily: null }
  }

  // Order matters: more specific products first
  const checks: Array<{
    test: RegExp
    name: string
    version: RegExp
    engine: string
    engineFamily: string
  }> = [
    {
      test: /Edg(?:e|A|iOS)?\//i,
      name: 'Edge',
      version: /Edg(?:e|A|iOS)?\/([\d.]+)/i,
      engine: 'Blink',
      engineFamily: 'Chromium'
    },
    {
      test: /OPR\/|Opera\//i,
      name: 'Opera',
      version: /(?:OPR|Opera)\/([\d.]+)/i,
      engine: 'Blink',
      engineFamily: 'Chromium'
    },
    {
      test: /SamsungBrowser\//i,
      name: 'Samsung Internet',
      version: /SamsungBrowser\/([\d.]+)/i,
      engine: 'Blink',
      engineFamily: 'Chromium'
    },
    {
      test: /Brave\//i,
      name: 'Brave',
      version: /Brave\/([\d.]+)/i,
      engine: 'Blink',
      engineFamily: 'Chromium'
    },
    {
      test: /Vivaldi\//i,
      name: 'Vivaldi',
      version: /Vivaldi\/([\d.]+)/i,
      engine: 'Blink',
      engineFamily: 'Chromium'
    },
    {
      test: /Firefox\/|FxiOS\//i,
      name: 'Firefox',
      version: /(?:Firefox|FxiOS)\/([\d.]+)/i,
      engine: 'Gecko',
      engineFamily: 'Gecko'
    },
    {
      test: /Chrome\/|CriOS\//i,
      name: 'Chrome',
      version: /(?:Chrome|CriOS)\/([\d.]+)/i,
      engine: 'Blink',
      engineFamily: 'Chromium'
    },
    {
      test: /Safari\//i,
      name: 'Safari',
      version: /Version\/([\d.]+)/i,
      engine: 'WebKit',
      engineFamily: 'WebKit'
    }
  ]

  for (const c of checks) {
    if (c.test.test(ua)) {
      // Safari check must not match Chrome/Chromium UAs (they include Safari token)
      if (c.name === 'Safari' && /Chrome|Chromium|CriOS|Edg|OPR|Android/i.test(ua)) {
        continue
      }
      const m = ua.match(c.version)
      return {
        name: c.name,
        version: m?.[1] ?? null,
        engine: c.engine,
        engineFamily: c.engineFamily
      }
    }
  }

  return { name: null, version: null, engine: null, engineFamily: null }
}

export function parseOsFromUa(ua: string, platformHint?: string | null): ParsedOS {
  if (!ua && !platformHint) {
    return { name: null, version: null, family: null }
  }

  const combined = `${platformHint ?? ''} ${ua}`

  // iPadOS 13+ may report as Macintosh + touch
  if (/iPhone|iPod/i.test(ua)) {
    const m = ua.match(/OS ([\d_]+)/)
    return {
      name: 'iOS',
      version: m ? m[1].replace(/_/g, '.') : null,
      family: 'Darwin'
    }
  }

  if (/iPad/i.test(ua) || (/Macintosh/i.test(ua) && /Mobile\//i.test(ua))) {
    const m = ua.match(/OS ([\d_]+)/) || ua.match(/Version\/([\d.]+)/)
    return {
      name: 'iPadOS',
      version: m ? m[1].replace(/_/g, '.') : null,
      family: 'Darwin'
    }
  }

  if (/Android/i.test(ua)) {
    const m = ua.match(/Android ([\d.]+)/)
    return {
      name: 'Android',
      version: m?.[1] ?? null,
      family: 'Linux'
    }
  }

  if (/Windows|Win32|Win64/i.test(combined)) {
    const m = ua.match(/Windows NT ([\d.]+)/)
    const nt = m?.[1] ?? null
    return {
      name: 'Windows',
      version: mapWindowsNtVersion(nt),
      family: 'Windows NT'
    }
  }

  if (/Mac OS X|Macintosh/i.test(combined)) {
    const m = ua.match(/Mac OS X ([\d_]+)/)
    return {
      name: 'macOS',
      version: m ? m[1].replace(/_/g, '.') : null,
      family: 'Darwin'
    }
  }

  if (/CrOS/i.test(ua)) {
    return { name: 'Chrome OS', version: null, family: 'Linux' }
  }

  if (/Linux/i.test(combined)) {
    return { name: 'Linux', version: null, family: 'Linux' }
  }

  return { name: null, version: null, family: null }
}

export function parseDeviceFromUa(
  ua: string,
  options?: {
    maxTouchPoints?: number
    platform?: string | null
    screenWidth?: number
    clientHintsMobile?: boolean | null
  }
): ParsedDevice {
  const maxTouch = options?.maxTouchPoints ?? 0
  const platform = options?.platform ?? ''
  const width = options?.screenWidth ?? 0
  const chMobile = options?.clientHintsMobile

  let model: string | null = null
  let vendor: string | null = null

  const iphone = ua.match(/iPhone/)
  if (iphone) {
    model = 'iPhone'
    vendor = 'Apple'
  }
  const ipad = ua.match(/iPad/) || (/Macintosh/i.test(ua) && maxTouch > 1)
  if (ipad && !iphone) {
    model = 'iPad'
    vendor = 'Apple'
  }

  const androidModel = ua.match(/Android[^;]*;\s*([^)]+?)(?:Build|\))/i)
  if (androidModel?.[1]) {
    model = androidModel[1].replace(/;/g, '').trim() || null
    vendor = 'Android'
  }

  // Type classification
  if (
    chMobile === true ||
    /Mobile|iPhone|iPod|Android.*Mobile|webOS|BlackBerry|IEMobile/i.test(ua)
  ) {
    return { type: 'Mobile', model, vendor }
  }

  const macLike =
    /Macintosh|Mac OS X|MacIntel|MacPPC|Mac68K/i.test(platform) || /Macintosh|Mac OS X/i.test(ua)

  if (
    /iPad|Tablet|PlayBook|Silk/i.test(ua) ||
    (/Android/i.test(ua) && !/Mobile/i.test(ua)) ||
    (macLike && maxTouch > 1)
  ) {
    return {
      type: 'Tablet',
      model: model ?? (ipad || (macLike && maxTouch > 1) ? 'iPad' : null),
      vendor: vendor ?? (macLike && maxTouch > 1 ? 'Apple' : null)
    }
  }

  // Width-only tablet heuristic is unreliable; only use as last resort with touch
  if (maxTouch > 1 && width >= 600 && width <= 1280 && /Mobile/i.test(ua) === false) {
    return { type: 'Tablet', model, vendor }
  }

  if (ua || platform) {
    return { type: 'Desktop', model, vendor }
  }

  return { type: 'Unknown', model: null, vendor: null }
}

/**
 * Merge UA-string parse with Client Hints (hints win when present).
 */
export function mergeWithClientHints(
  fromUa: { browser: ParsedBrowser; os: ParsedOS; device: ParsedDevice },
  hints: ClientHintsInput | null | undefined
): { browser: ParsedBrowser; os: ParsedOS; device: ParsedDevice } {
  if (!hints) {
    return fromUa
  }

  const browser = { ...fromUa.browser }
  const os = { ...fromUa.os }
  const device = { ...fromUa.device }

  const brand = pickBrand(hints.fullVersionList ?? hints.brands)
  if (brand) {
    const nameMap: Record<string, { name: string; engine: string; family: string }> = {
      'Google Chrome': { name: 'Chrome', engine: 'Blink', family: 'Chromium' },
      Chrome: { name: 'Chrome', engine: 'Blink', family: 'Chromium' },
      'Microsoft Edge': { name: 'Edge', engine: 'Blink', family: 'Chromium' },
      Edge: { name: 'Edge', engine: 'Blink', family: 'Chromium' },
      Opera: { name: 'Opera', engine: 'Blink', family: 'Chromium' },
      Brave: { name: 'Brave', engine: 'Blink', family: 'Chromium' },
      'Samsung Internet': { name: 'Samsung Internet', engine: 'Blink', family: 'Chromium' },
      Firefox: { name: 'Firefox', engine: 'Gecko', family: 'Gecko' }
    }
    const mapped = nameMap[brand.brand]
    if (mapped) {
      browser.name = mapped.name
      browser.engine = mapped.engine
      browser.engineFamily = mapped.family
    } else if (brand.brand !== 'Chromium') {
      browser.name = brand.brand
      browser.engine = browser.engine ?? 'Blink'
      browser.engineFamily = browser.engineFamily ?? 'Chromium'
    }
    browser.version = hints.uaFullVersion ?? brand.version ?? browser.version
  }

  if (hints.platform) {
    const p = hints.platform
    if (/Win/i.test(p)) {
      os.name = 'Windows'
      os.family = 'Windows NT'
      os.version = mapWindowsPlatformVersion(hints.platformVersion) ?? os.version
    } else if (/macOS|Mac OS/i.test(p)) {
      os.name = 'macOS'
      os.family = 'Darwin'
      if (hints.platformVersion) {
        os.version = hints.platformVersion
      }
    } else if (/Android/i.test(p)) {
      os.name = 'Android'
      os.family = 'Linux'
      os.version = hints.platformVersion ?? os.version
    } else if (/iOS|iPhone OS/i.test(p)) {
      os.name = 'iOS'
      os.family = 'Darwin'
      os.version = hints.platformVersion ?? os.version
    } else if (/Chrome OS|ChromeOS/i.test(p)) {
      os.name = 'Chrome OS'
      os.family = 'Linux'
    } else if (/Linux/i.test(p)) {
      os.name = 'Linux'
      os.family = 'Linux'
    }
  }

  if (hints.model) {
    device.model = hints.model
  }
  if (hints.mobile === true) {
    device.type = 'Mobile'
  } else if (hints.mobile === false && device.type === 'Unknown') {
    device.type = 'Desktop'
  }

  return { browser, os, device }
}

export function parseUserAgent(
  ua: string,
  options?: {
    platform?: string | null
    maxTouchPoints?: number
    screenWidth?: number
    clientHints?: ClientHintsInput | null
  }
): { browser: ParsedBrowser; os: ParsedOS; device: ParsedDevice } {
  const browser = parseBrowserFromUa(ua)
  const os = parseOsFromUa(ua, options?.platform)
  const device = parseDeviceFromUa(ua, {
    maxTouchPoints: options?.maxTouchPoints,
    platform: options?.platform,
    screenWidth: options?.screenWidth,
    clientHintsMobile: options?.clientHints?.mobile ?? null
  })

  return mergeWithClientHints({ browser, os, device }, options?.clientHints)
}
