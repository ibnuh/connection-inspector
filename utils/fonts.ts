/**
 * Font presence detection using dual baseline measurement.
 * Single-baseline monospace checks produce many false positives.
 */

const BASELINE_FONTS = ['monospace', 'sans-serif', 'serif'] as const

/**
 * Returns true when `fontFamily` measurably differs from both generic baselines
 * for the given test string (indicating the named font is likely installed).
 */
export function isFontAvailable(fontFamily: string, measure: (fontCss: string) => number): boolean {
  const sample = `72px "${fontFamily}"`
  const widths = BASELINE_FONTS.map(base => {
    const withBase = measure(`${sample}, ${base}`)
    const baseOnly = measure(`72px ${base}`)
    return { withBase, baseOnly }
  })

  // Font is available if for every baseline the combined width differs from baseline-only
  return widths.every(({ withBase, baseOnly }) => withBase !== baseOnly)
}

export function detectInstalledFonts(
  candidates: string[],
  measure: (fontCss: string) => number
): string[] {
  return candidates.filter(font => {
    try {
      return isFontAvailable(font, measure)
    } catch {
      return false
    }
  })
}

/** Common desktop fonts that are useful for fingerprint entropy estimates. */
export const FONT_CANDIDATES = [
  'Arial',
  'Arial Black',
  'Calibri',
  'Cambria',
  'Candara',
  'Comic Sans MS',
  'Consolas',
  'Constantia',
  'Corbel',
  'Courier New',
  'Georgia',
  'Helvetica',
  'Impact',
  'Lucida Console',
  'Lucida Sans Unicode',
  'Menlo',
  'Monaco',
  'Palatino Linotype',
  'Segoe UI',
  'Tahoma',
  'Times New Roman',
  'Trebuchet MS',
  'Verdana',
  'Wingdings',
  'Roboto',
  'Ubuntu',
  'Cantarell',
  'Fira Sans',
  'Noto Sans',
  'Helvetica Neue',
  'Futura',
  'Gill Sans',
  'Optima',
  'American Typewriter',
  'Andale Mono',
  'Brush Script MT',
  'Didot',
  'Geneva',
  'Hoefler Text',
  'Marker Felt',
  'Papyrus',
  'Apple Color Emoji',
  'Segoe UI Emoji',
  'Segoe UI Symbol'
] as const
